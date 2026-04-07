from rest_framework import generics
from authentication.permissions import IsAdminOrAnalyst
from .models import AnomalyResult
from .serializers import AnomalyResultSerializer

class AnomalyResultListView(generics.ListAPIView):
    """
    Returns a list of all detected anomalies.
    Protected strictly by Keycloak RBAC (Admin/Analyst only).
    """
    permission_classes = [IsAdminOrAnalyst]
    queryset = AnomalyResult.objects.all().order_by('-detected_at')
    serializer_class = AnomalyResultSerializer
