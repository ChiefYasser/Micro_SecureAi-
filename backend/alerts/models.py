import uuid
from django.db import models
from anomalies.models import AnomalyResult

class Alert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    anomaly_ref = models.ForeignKey(AnomalyResult, on_delete=models.CASCADE, related_name='alerts')
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ALERT: {self.message[:50]} (Resolved: {self.is_resolved})"

    def trigger(self):
        """
        Business Logic: Executes an external or internal notification based on High Risk.
        For now it prints synchronously.
        """
        log_message = f"""
        ==================================================
        TRIGGERED CRITICAL ALERT
        Time: {self.created_at}
        Anomaly Score: {self.anomaly_ref.anomaly_score}
        Details: {self.message}
        ==================================================
        """
        print(log_message)
