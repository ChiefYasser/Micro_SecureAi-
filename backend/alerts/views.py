from rest_framework import generics
from authentication.permissions import IsAdminOrAnalyst
from .models import Alert
from .serializers import AlertSerializer

class AlertListView(generics.ListAPIView):
    """
    Returns a list of all triggered alerts.
    Protected strictly by Keycloak RBAC (Admin/Analyst only).
    """
    permission_classes = [IsAdminOrAnalyst]
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
