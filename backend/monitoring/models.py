import uuid
import json
from django.db import models
from users.models import UserProfile

class APIRequestLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, null=True, blank=True, on_delete=models.SET_NULL)
    endpoint = models.CharField(max_length=255)
    method = models.CharField(max_length=10)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    status_code = models.IntegerField()
    response_time_ms = models.FloatField(default=0.0)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.status_code}] {self.method} {self.endpoint} ({self.response_time_ms:.1f}ms)"

    def extractFeatures(self):
        """
        AI Business Logic: Prepares data vector for Anomaly Detection layer.
        """
        is_error = 1 if self.status_code >= 400 else 0
        method_map = {'GET': 1, 'POST': 2, 'PUT': 3, 'DELETE': 4}
        method_feat = method_map.get(self.method.upper(), 0)
        has_auth = 1 if self.user else 0
        
        feature_vector = [
            method_feat,
            is_error,
            self.response_time_ms,
            has_auth
        ]
        return json.dumps(feature_vector)


class SecurityEvent(models.Model):
    SEVERITY_CHOICES = (
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Critical', 'Critical'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='Low')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.severity} Event: {self.description[:50]}"
