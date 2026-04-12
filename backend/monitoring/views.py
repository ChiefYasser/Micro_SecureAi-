from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from authentication.permissions import IsAdminOrAnalyst
from .models import APIRequestLog, SecurityEvent
from .serializers import APIRequestLogSerializer, SecurityEventSerializer


def get_permission_classes():
    """Allow unauthenticated access in DEBUG mode for demo purposes."""
    if settings.DEBUG:
        return [AllowAny]
    return [IsAdminOrAnalyst]


class SecurityDashboardSummaryView(APIView):
    """
    Security Dashboard: Aggregates critical audit data utilizing Redis cache.
    Protected by Keycloak RBAC in production; open in DEBUG for demo.
    """

    def get_permissions(self):
        return [p() for p in get_permission_classes()]

    def get(self, request):
        cache_key = "security_dashboard_stats"
        stats = cache.get(cache_key)

        if not stats:
            from anomalies.models import AnomalyResult

            now = timezone.now()
            last_hour = now - timedelta(hours=1)

            # Absolute totals (never zero if data exists)
            total_requests = APIRequestLog.objects.count()
            blocked_attempts = APIRequestLog.objects.filter(
                status_code__in=[401, 403]
            ).count()

            # Anomaly counts from the AI pipeline
            total_anomalies = AnomalyResult.objects.count()
            high_sev_anomalies = AnomalyResult.objects.filter(
                anomaly_score__gt=0.8
            ).count()

            # Security events
            high_sev_events = SecurityEvent.objects.filter(
                severity__in=["High", "Critical"]
            ).count()

            # Recent window for anomaly score computation
            recent_logs = APIRequestLog.objects.filter(timestamp__gte=last_hour)
            recent_total = recent_logs.count()
            recent_errors = recent_logs.filter(status_code__gte=400).count()

            if recent_total > 0:
                error_rate = recent_errors / recent_total
                if error_rate < 0.1:
                    anomaly_score = round(error_rate * 3, 2)
                elif error_rate < 0.3:
                    anomaly_score = round(0.3 + (error_rate - 0.1) * 2, 2)
                else:
                    anomaly_score = round(min(0.7 + (error_rate - 0.3) * 1.0, 1.0), 2)
            else:
                anomaly_score = 0.0

            # Use the latest AI-computed score if available
            latest_anomaly = (
                AnomalyResult.objects.order_by("-detected_at").first()
            )
            if latest_anomaly:
                anomaly_score = latest_anomaly.anomaly_score

            # Active users in last hour
            active_users = (
                recent_logs.exclude(user__isnull=True)
                .values("user")
                .distinct()
                .count()
            )

            # Determine system status
            if high_sev_anomalies > 0 or anomaly_score > 0.8:
                system_status = "Critical"
            elif high_sev_events > 0 or anomaly_score > 0.5:
                system_status = "Warning"
            else:
                system_status = "Optimal"

            stats = {
                "total_requests": total_requests,
                "requests_last_hour": recent_total,
                "high_severity_events": high_sev_events + high_sev_anomalies,
                "blocked_attempts": blocked_attempts,
                "anomaly_score": anomaly_score,
                "anomalies_detected": total_anomalies,
                "active_users": active_users,
                "system_status": system_status,
            }
            cache.set(cache_key, stats, timeout=10)

        # Add dynamic greeting if user is authenticated
        if hasattr(request.user, "username") and request.user.is_authenticated:
            stats["message"] = (
                f"Keycloak Real-time Token valid. Welcome, {request.user.username}."
            )

        return Response(stats, status=200)


class SecurityEventListView(generics.ListAPIView):
    serializer_class = SecurityEventSerializer

    def get_permissions(self):
        return [p() for p in get_permission_classes()]

    def get_queryset(self):
        return SecurityEvent.objects.all().order_by("-timestamp")


class APIRequestLogListView(generics.ListAPIView):
    serializer_class = APIRequestLogSerializer

    def get_permissions(self):
        return [p() for p in get_permission_classes()]

    def get_queryset(self):
        return APIRequestLog.objects.all().order_by("-timestamp")
