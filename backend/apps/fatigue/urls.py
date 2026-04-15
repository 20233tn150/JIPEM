from django.urls import path
from .views import (
    IndividualFatigueListView,
    IndividualFatigueDetailView,
    IndividualFatigueStatusView,
    IndividualFatigueDeleteView,
)

urlpatterns = [
    # GET  → lista análisis   |  POST → crea análisis (multipart video)
    path('individual/', IndividualFatigueListView.as_view(), name='individual-fatigue-list'),
    path('individual/<int:pk>/', IndividualFatigueDetailView.as_view(), name='individual-fatigue-detail'),
    path('individual/<int:pk>/status/', IndividualFatigueStatusView.as_view(), name='individual-fatigue-status'),
    path('individual/<int:pk>/delete/', IndividualFatigueDeleteView.as_view(), name='individual-fatigue-delete'),
]
