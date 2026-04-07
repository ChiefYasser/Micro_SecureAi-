from django.core.cache import cache
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from authentication.permissions import IsAdminOrAnalyst
from .models import APIRequestLog, SecurityEvent
from .serializers import APIRequestLogSerializer, SecurityEventSerializer

class SecurityDashboardSummaryView(APIView):
    """
    Security Dashboard: Aggregates critical audit data utilizing Redis cache.
    Protected strictly by Keycloak RBAC.
    """
    permission_classes = [IsAdminOrAnalyst]

    def get(self, request):
        cache_key = "security_dashboard_stats"
        stats = cache.get(cache_key)

        if not stats:
            total_requests = APIRequestLog.objects.count()
            high_sev_events = SecurityEvent.objects.filter(severity__in=['High', 'Critical']).count()
            blocked_attempts = APIRequestLog.objects.filter(status_code__in=[401, 403]).count()
            
            stats = {
                "total_requests": total_requests,
                "high_severity_events": high_sev_events,
                "blocked_attempts": blocked_attempts,
                "system_status": "Optimal" if high_sev_events == 0 else "Warning"
            }
            # Cache the aggregate DB calculation in Redis to prevent heavy read contention
            cache.set(cache_key, stats, timeout=10)

        # Merge dynamic payload properties that rely purely on the live token
        stats["message"] = f"Keycloak Real-time Token valid. Welcome, {request.user.username}."
        
        return Response(stats, status=200)

class SecurityEventListView(generics.ListAPIView):
    permission_classes = [IsAdminOrAnalyst]
    queryset = SecurityEvent.objects.all().order_by('-timestamp')
    serializer_class = SecurityEventSerializer

class APIRequestLogListView(generics.ListAPIView):
    permission_classes = [IsAdminOrAnalyst]
    queryset = APIRequestLog.objects.all().order_by('-timestamp')
    serializer_class = APIRequestLogSerializer
