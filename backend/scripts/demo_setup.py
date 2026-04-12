#!/usr/bin/env python
"""
Demo Seeder: Takes the last 100 API request logs and feeds them through the
AI anomaly detection pipeline to populate the anomalies_anomalyresult table.

Usage (from inside the backend container):
    python /app/scripts/demo_setup.py
"""
import os
import sys
import django

# Bootstrap Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pfa.settings")
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
django.setup()

from monitoring.models import APIRequestLog
from anomalies.models import AnomalyResult
from anomalies.services import evaluate_request_for_anomalies


def main():
    print("=" * 60)
    print("  SecureAI MicroShield — Demo Seeder")
    print("=" * 60)

    total_logs = APIRequestLog.objects.count()
    existing_anomalies = AnomalyResult.objects.count()
    print(f"\n  DB State Before:")
    print(f"    APIRequestLog:  {total_logs}")
    print(f"    AnomalyResult:  {existing_anomalies}")

    # Grab the last 100 logs (most recent first)
    logs = list(APIRequestLog.objects.order_by("-timestamp")[:100])
    print(f"\n  Processing {len(logs)} logs through AI pipeline...\n")

    success = 0
    errors = 0

    for i, log in enumerate(logs, 1):
        try:
            result = evaluate_request_for_anomalies(log)
            risk = result.calculateRiskLevel()
            tag = "!!" if risk == "High" else ">>" if risk == "Medium" else "  "
            print(f"  {tag} [{i:3d}/100] {log.method:6s} {log.endpoint[:40]:40s}  "
                  f"score={result.anomaly_score:.3f}  risk={risk}")
            success += 1
        except Exception as exc:
            print(f"  XX [{i:3d}/100] ERROR: {exc}")
            errors += 1

    final_anomalies = AnomalyResult.objects.count()
    high_risk = AnomalyResult.objects.filter(anomaly_score__gt=0.8).count()
    medium_risk = AnomalyResult.objects.filter(anomaly_score__gt=0.5, anomaly_score__lte=0.8).count()

    print(f"\n{'=' * 60}")
    print(f"  Results:")
    print(f"    Processed:     {success} OK / {errors} failed")
    print(f"    AnomalyResult: {existing_anomalies} -> {final_anomalies}")
    print(f"    High Risk:     {high_risk}")
    print(f"    Medium Risk:   {medium_risk}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
