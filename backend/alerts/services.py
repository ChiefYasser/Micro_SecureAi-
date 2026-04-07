from alerts.models import Alert
from anomalies.models import AnomalyResult

def create_and_trigger_alert(anomaly: AnomalyResult):
    """
    Clean Architecture Service: Automatically routes, creates, and dispatches Alerts based on anomalies.
    """
    alert = Alert.objects.create(
        anomaly_ref=anomaly,
        message=f"Critical AI Anomaly Detected! Risk Level: {anomaly.calculateRiskLevel()}"
    )
    
    # Executes the internal Trigger mechanism mapping to loggers/sockets/webhooks.
    alert.trigger()
    
    return alert
