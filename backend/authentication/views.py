from rest_framework.views import APIView
from rest_framework.response import Response
from .permissions import IsAuthenticatedAndTokenValid

class MeView(APIView):
    """
    Returns data about the currently authenticated user.
    Requires a valid Keycloak JWT.
    """
    permission_classes = [IsAuthenticatedAndTokenValid]

    def get(self, request):
        # We pull the details directly from the custom KeycloakUser
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
            "roles": user.roles,
            "message": "Authentication successful. Your Keycloak token was validated by Django."
        }, status=200)
