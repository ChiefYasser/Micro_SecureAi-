import json
import logging
import requests
from anomalies.models import AnomalyResult
from monitoring.models import APIRequestLog
from alerts.services import create_and_trigger_alert

logger = logging.getLogger(__name__)

AI_SERVICE_URL = "http://ai-service:5000/analyze"


def evaluate_request_for_anomalies(log: APIRequestLog):
    """
    Evaluates an APIRequestLog against the AI Anomaly Detection microservice.
    Stores the result and triggers an alert if the risk is High or Critical.
    """
    features = json.loads(log.extractFeatures())

    try:
        response = requests.post(
            AI_SERVICE_URL,
            json={"features": features},
            timeout=5,
        )
        response.raise_for_status()
        ai_result = response.json()
        anomaly_score = ai_result["anomaly_score"]
    except requests.RequestException as exc:
        logger.error("AI service unreachable: %s — falling back to score 0.0", exc)
        anomaly_score = 0.0

    result = AnomalyResult.objects.create(
        log_ref=log,
        anomaly_score=anomaly_score,
    )

    risk_level = result.calculateRiskLevel()
    if risk_level in ["High", "Critical"]:
        create_and_trigger_alert(result)

    return result
