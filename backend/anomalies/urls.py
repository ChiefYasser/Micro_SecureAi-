from django.urls import path
from .views import AnomalyResultListView

urlpatterns = [
    path('results/', AnomalyResultListView.as_view(), name='anomaly-list'),
]
