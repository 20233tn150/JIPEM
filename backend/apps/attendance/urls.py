#backend > apps > attendance > urls.py
from django.urls import path
from .views import (
    SessionListCreateView, SessionDetailView,
    UploadVideoView, SessionStatusView, SessionDeleteView,
    AttendanceRecordToggleView,AttendanceExcelReportView,
)

urlpatterns = [
    path('sessions/', SessionListCreateView.as_view(), name='session-list'),
    path('sessions/<int:pk>/', SessionDetailView.as_view(), name='session-detail'),
    path('sessions/<int:session_id>/upload-video/', UploadVideoView.as_view(), name='upload-video'),
    path('sessions/<int:session_id>/status/', SessionStatusView.as_view(), name='session-status'),
    path('sessions/<int:session_id>/delete/', SessionDeleteView.as_view(), name='session-delete'),
    path('records/<int:record_id>/toggle/', AttendanceRecordToggleView.as_view(), name='record-toggle'),
    path('attendance/excel/', AttendanceExcelReportView.as_view(), name='attendance-excel'),
]
