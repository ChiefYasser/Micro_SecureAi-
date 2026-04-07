from rest_framework.views import APIView
from rest_framework.response import Response
from authentication.permissions import IsAuthenticatedAndTokenValid

class UserProfileView(APIView):
    """
    Returns the user's secure profile.
    Requires a valid Keycloak token.
    """
    permission_classes = [IsAuthenticatedAndTokenValid]

    def get(self, request):
        return Response({
            "profile": {
                "username": request.user.username,
                "email": request.user.email,
                "account_status": "Active (Identity Managed by Keycloak)"
            }
        }, status=200)
