from django.contrib import admin
from .models import UserProfile, RoleAssignment, UserSession

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    # Only use fields that exist in YOUR UserProfile model
    list_display = ('username', 'email', 'created_at') 
    search_fields = ('username', 'email')

@admin.register(RoleAssignment)
class RoleAssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'role_name', 'assigned_at')
    list_filter = ('role_name',)

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_start', 'is_active')
    list_filter = ('is_active',)