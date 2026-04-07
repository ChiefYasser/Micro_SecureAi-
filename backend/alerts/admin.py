from django.contrib import admin
from .models import Alert

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    # 'created_at' and 'is_resolved' match your model exactly
    list_display = ('created_at', 'anomaly_ref', 'message', 'is_resolved')
    list_filter = ('is_resolved', 'created_at')
    search_fields = ('message',)