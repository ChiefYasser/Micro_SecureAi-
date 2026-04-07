from rest_framework.permissions import BasePermission

class IsAuthenticatedAndTokenValid(BasePermission):
    """
    Confirms the request comes from an authenticated user.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class HasRole(BasePermission):
    """
    Base class to extract Keycloak roles from the request user
    and check if they match the required roles.
    """
    required_roles = []

    def has_permission(self, request, view):
        # request.user is set by authentication.py (KeycloakUser)
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_roles = getattr(request.user, 'roles', [])
        
        # Check if the user has ANY of the roles required by the view
        for role in self.required_roles:
            if role in user_roles:
                return True
                
        return False

# --- Specific Role Permissions for Views ---

class IsAdminRole(HasRole):
    required_roles = ['admin']

class IsAnalystRole(HasRole):
    required_roles = ['analyst']

class IsAdminOrAnalyst(HasRole):
    required_roles = ['admin', 'analyst']
    
class IsOwnerOrAdmin(BasePermission):
    """
    Example Object-Level Permission:
    Allows access if the user is an 'admin' OR if the object belongs to them.
    """
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
            
        user_roles = getattr(request.user, 'roles', [])
        if 'admin' in user_roles:
            return True
            
        return getattr(obj, 'owner_username', None) == request.user.username
