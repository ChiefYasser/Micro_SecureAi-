from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

class HealthCheckView(APIView):
    """
    Public endpoint to verify the backend is running.
    Allows unauthenticated access.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "UP",
            "environment": "Docker",
            "message": "SecureAI Backend is online and accepting connections."
        }, status=200)
