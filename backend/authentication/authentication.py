import jwt
import requests
from django.conf import settings
from django.core.cache import cache
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

class KeycloakUser:
    """A light wrapper object to represent the authenticated User in DRF."""
    def __init__(self, payload):
        self.payload = payload
        self.username = payload.get('preferred_username', 'unknown')
        self.email = payload.get('email', '')
        self.is_authenticated = True
        self.is_active = True
        
        # Extract realm-level roles from the Keycloak JWT
        realm_access = payload.get('realm_access', {})
        self.roles = realm_access.get('roles', [])

class KeycloakJWTAuthentication(BaseAuthentication):
    """
    Custom DRF Authentication class that validates Keycloak JWTs.
    It does NOT create tokens; it only verifies tokens issued by Keycloak.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None # Move on to next authentication class or deny

        token = auth_header.split(' ')[1]

        try:
            # 1. Fetch Keycloak Public Key (Securely verifies the signature)
            public_key = self.get_keycloak_public_key()
            
            # 2. Decode and validate the token locally
            # We don't verify 'audience' here automatically unless you properly set it in Keycloak,
            # so we focus on signature and expiration.
            payload = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                options={"verify_exp": True, "verify_aud": False} 
            )
            
            # 3. Attach standard roles and pseudo-user
            user = KeycloakUser(payload)
            
            # CRITICAL FIX OVERRIDE:
            # We explicitly bind the user back down to the bare metal Django WSGI request!
            # DRF hides request.user in a wrapper, but our core/middleware.py processes the bare WSGI request 
            # post-response, so we ensure it's glued exactly where the middleware will look for it:
            if hasattr(request, '_request'):
                request._request.user = user
            else:
                request.user = user
                
            return (user, token)
            
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f'Invalid token: {str(e)}')

    def get_keycloak_public_key(self):
        """Fetches and caches the Realm's public RSA key from Keycloak."""
        cache_key = 'keycloak_public_key_pem'
        public_key = cache.get(cache_key)
        
        if not public_key:
            # Note: We use the Docker internal URL from settings.KEYCLOAK_SERVER_URL
            url = f"{settings.KEYCLOAK_SERVER_URL}/realms/{settings.KEYCLOAK_REALM}"
            try:
                response = requests.get(url, timeout=5)
                response.raise_for_status()
                data = response.json()
                key_der_base64 = data.get('public_key')
                
                # Format into a valid PEM for cryptography/PyJWT
                public_key = f"-----BEGIN PUBLIC KEY-----\n{key_der_base64}\n-----END PUBLIC KEY-----"
                
                # Cache deeply to avoid hammering IAM on every request
                cache.set(cache_key, public_key, timeout=86400)
            except Exception as e:
                raise AuthenticationFailed(f'Could not fetch Keycloak public key. IAM might be down: {str(e)}')
                
        return public_key
