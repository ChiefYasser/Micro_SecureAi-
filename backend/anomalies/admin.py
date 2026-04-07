from django.contrib import admin
from .models import AnomalyResult

@admin.register(AnomalyResult)
class AnomalyResultAdmin(admin.ModelAdmin):
    # 'detected_at' matches your model field name
    # 'risk_level_display' calls a custom function to show your logic in the UI
    list_display = ('detected_at', 'log_ref', 'anomaly_score', 'risk_level_display')
    
    # We can only filter by real database fields
    list_filter = ('detected_at',)

    # This function allows the Admin to show the result of your calculateRiskLevel() method
    def risk_level_display(self, obj):
        return obj.calculateRiskLevel()
    
    # This gives the column a nice name in the dashboard
    risk_level_display.short_description = 'Risk Level'