"""
SecureAI MicroShield — AI Anomaly Detection Microservice

Exposes a /analyze endpoint that scores incoming request feature vectors
using an Isolation Forest trained on synthetic 'normal' API traffic patterns.

Feature vector format (4 features):
  [method_feat, is_error, response_time_ms, has_auth]
  - method_feat: GET=1, POST=2, PUT=3, DELETE=4
  - is_error: 0 or 1 (status_code >= 400)
  - response_time_ms: float
  - has_auth: 0 or 1
"""

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel
from sklearn.ensemble import IsolationForest

app = FastAPI(title="SecureAI Anomaly Detector", version="1.0.0")

# ---------------------------------------------------------------------------
# Train on synthetic 'normal' traffic at startup
# ---------------------------------------------------------------------------
# Normal patterns: mostly GET/POST, no errors, fast responses, authenticated
rng = np.random.default_rng(42)
n_samples = 500

normal_data = np.column_stack([
    rng.choice([1, 2], size=n_samples, p=[0.7, 0.3]),   # method: GET/POST
    np.zeros(n_samples),                                  # is_error: 0
    rng.normal(loc=120, scale=40, size=n_samples).clip(10, 500),  # response_time
    np.ones(n_samples),                                   # has_auth: 1
])

model = IsolationForest(
    n_estimators=150,
    contamination=0.05,
    random_state=42,
)
model.fit(normal_data)

# Calibrate score range from training data for normalization
train_scores = model.score_samples(normal_data)
score_baseline = float(np.median(train_scores))  # typical normal score
score_floor = float(np.percentile(train_scores, 1))  # low-end normal

# ---------------------------------------------------------------------------
# API schemas
# ---------------------------------------------------------------------------
class AnalyzeRequest(BaseModel):
    features: list[float]

class AnalyzeResponse(BaseModel):
    anomaly_score: float
    is_anomaly: bool

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "model": "IsolationForest", "features_trained": 4}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest):
    vector = np.array(payload.features).reshape(1, -1)

    # score_samples returns log-likelihood; more negative = more anomalous
    raw_score = float(model.score_samples(vector)[0])

    # Normalize: baseline (normal median) -> 0.0, scores below floor -> 1.0
    # Anything worse than training normals scales linearly toward 1.0
    anomaly_score = round(
        float(np.clip((score_baseline - raw_score) / (score_baseline - score_floor), 0.0, 1.0)),
        4,
    )

    is_anomaly = anomaly_score > 0.5

    return AnalyzeResponse(anomaly_score=anomaly_score, is_anomaly=is_anomaly)
