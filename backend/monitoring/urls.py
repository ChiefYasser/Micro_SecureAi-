from django.urls import path
from .views import SecurityDashboardSummaryView, SecurityEventListView, APIRequestLogListView

urlpatterns = [
    path('summary/', SecurityDashboardSummaryView.as_view(), name='monitoring-summary'),
    path('events/', SecurityEventListView.as_view(), name='monitoring-events'),
    path('logs/', APIRequestLogListView.as_view(), name='monitoring-logs'),
]
