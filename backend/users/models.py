import uuid
from django.db import models

class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Using Keycloak sub or username
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.username}"

class RoleAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, related_name='local_roles', on_delete=models.CASCADE)
    role_name = models.CharField(max_length=50)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'role_name')

    def __str__(self):
        return f"{self.user.username} - {self.role_name}"

class UserSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, related_name='sessions', on_delete=models.CASCADE)
    session_start = models.DateTimeField(auto_now_add=True)
    session_end = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
