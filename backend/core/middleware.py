import time
import logging
from django.db import transaction
from monitoring.models import APIRequestLog
from users.models import UserProfile, RoleAssignment

logger = logging.getLogger(__name__)

class AuditLoggingMiddleware:
    """
    Middleware that captures all incoming requests and extracts the DRF-authenticated User
    during the post-response phase. Calculates extremely accurate endpoint latencies.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 1. Incoming Phase -> Start the timer
        request.start_time = time.time()
        
        # 2. View Processing Phase -> DRF magically extracts Keycloak Token and injects request.user
        response = self.get_response(request)
        
        # 3. Post-Response Phase -> Analyze performance, capture Identity, and write Atomic Log
        self.process_audit_log(request, response)
        
        return response

    def process_audit_log(self, request, response):
        try:
            latency_ms = (time.time() - getattr(request, 'start_time', time.time())) * 1000.0
            user_profile = None
            
            # DRF's authentication classes place the KeycloakUser into request.user!
            # Since we are post-response, standard views have resolved the identity.
            api_user = getattr(request, 'user', None)
            
            if api_user and api_user.is_authenticated:
                username = getattr(api_user, 'username', None)
                email = getattr(api_user, 'email', '')
                roles = getattr(api_user, 'roles', [])
                
                if username:
                    # Sync to DB cleanly (creates if this is the user's first time sending an API request)
                    with transaction.atomic():
                        user_profile, created = UserProfile.objects.get_or_create(
                            username=username,
                            defaults={'email': email}
                        )
                        # Sync roles for RBAC integrity in db
                        if roles:
                            for r in roles:
                                RoleAssignment.objects.get_or_create(user=user_profile, role_name=r)

            # Atomic logging of the API hit, regardless of success/fail
            with transaction.atomic():
                APIRequestLog.objects.create(
                    user=user_profile,
                    endpoint=request.path,
                    method=request.method,
                    ip_address=self.get_client_ip(request),
                    status_code=response.status_code,
                    response_time_ms=latency_ms
                )
        except Exception as e:
            logger.error(f"[AuditMiddleware] Fatal error writing API log: {e}")

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')
