from django.urls import path
from .views import AttendanceReportView, FatigueReportView, IndividualFatigueReportView, IndividualFatiguePDFView, AttendancePDFView

urlpatterns = [
    path('attendance/', AttendanceReportView.as_view(), name='report-attendance'),
    path('attendance/pdf/', AttendancePDFView.as_view(), name='report-attendance-pdf'),
    path('fatigue/', FatigueReportView.as_view(), name='report-fatigue'),
    path('fatigue/individual/', IndividualFatigueReportView.as_view(), name='report-individual-fatigue'),
    path('fatigue/individual/pdf/', IndividualFatiguePDFView.as_view()),
]
