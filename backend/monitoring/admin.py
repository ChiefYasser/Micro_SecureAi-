from django.contrib import admin
from .models import APIRequestLog, SecurityEvent

@admin.register(APIRequestLog)
class APIRequestLogAdmin(admin.ModelAdmin):
    # We use response_time_ms (not response_time) to match your model
    list_display = ('timestamp', 'method', 'endpoint', 'status_code', 'response_time_ms', 'user')
    list_filter = ('method', 'status_code', 'timestamp')
    search_fields = ('endpoint', 'ip_address')
    ordering = ('-timestamp',)

@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    # We only use fields that exist: id, description, severity, timestamp
    list_display = ('timestamp', 'severity', 'description')
    list_filter = ('severity',)
    search_fields = ('description',)