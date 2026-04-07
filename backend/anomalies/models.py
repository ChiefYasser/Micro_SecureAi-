import uuid
from django.db import models
from monitoring.models import APIRequestLog

class AnomalyResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    log_ref = models.ForeignKey(APIRequestLog, on_delete=models.CASCADE, related_name='anomalies')
    anomaly_score = models.FloatField()
    detected_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Score {self.anomaly_score} -> {self.calculateRiskLevel()}"

    def calculateRiskLevel(self):
        """
        Business Logic: Maps pure numerical anomaly scores into discrete threat buckets.
        """
        if self.anomaly_score > 0.8:
            return 'High'
        elif self.anomaly_score > 0.5:
            return 'Medium'
        return 'Low'
