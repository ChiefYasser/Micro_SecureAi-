from django.conf import settings
from rest_framework import generics
from rest_framework.permissions import AllowAny
from authentication.permissions import IsAdminOrAnalyst
from .models import AnomalyResult
from .serializers import AnomalyResultSerializer


class AnomalyResultListView(generics.ListAPIView):
    """
    Returns a list of all detected anomalies.
    Protected by Keycloak RBAC in production; open in DEBUG for demo.
    """
    serializer_class = AnomalyResultSerializer

    def get_permissions(self):
        if settings.DEBUG:
            return [AllowAny()]
        return [IsAdminOrAnalyst()]

    def get_queryset(self):
        return AnomalyResult.objects.all().order_by('-detected_at')
