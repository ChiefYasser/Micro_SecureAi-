import logging
import threading
from django.db.models.signals import post_save
from django.dispatch import receiver
from monitoring.models import APIRequestLog

logger = logging.getLogger(__name__)


@receiver(post_save, sender=APIRequestLog)
def evaluate_anomaly_on_create(sender, instance, created, **kwargs):
    """
    Fires the AI anomaly evaluation pipeline every time a new
    APIRequestLog is created. Runs in a background thread to avoid
    blocking the request/response cycle.
    """
    if not created:
        return

    def _evaluate():
        try:
            from anomalies.services import evaluate_request_for_anomalies
            evaluate_request_for_anomalies(instance)
        except Exception as exc:
            logger.error("[AnomalySignal] Evaluation failed for log %s: %s", instance.id, exc)

    threading.Thread(target=_evaluate, daemon=True).start()
