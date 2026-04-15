from django.db.models import Avg, Count, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from apps.attendance.models import AttendanceSession, AttendanceRecord

from apps.fatigue.models import IndividualFatigueAnalysis, FatigueSession, FatigueRecord

class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        last_month = today - timedelta(days=30)
        
        att_stats = AttendanceRecord.objects.filter(
            session__date__gte=last_month
        ).aggregate(
            total=Count('id'),
            presentes=Count('id', filter=Q(is_present=True))
        )
        total_rec = att_stats['total'] or 1
        attendance_avg = (att_stats['presentes'] / total_rec) * 100

        fatigue_stats = IndividualFatigueAnalysis.objects.filter(
            date__gte=last_month,
            status='completed'
        ).aggregate(
            avg_attention=Avg('attention_score'),
            alerts=Count('id', filter=Q(result_label='fatigado'))
        )

        proc_tasks = (
            AttendanceSession.objects.filter(status='processing').count() + 
            FatigueSession.objects.filter(status='processing').count() +
            IndividualFatigueAnalysis.objects.filter(status='processing').count()
        )

        chart_data = []
        for i in range(13, -1, -1):
            day = today - timedelta(days=i)
            
            day_att = AttendanceRecord.objects.filter(session__date=day).aggregate(
                total=Count('id'),
                presentes=Count('id', filter=Q(is_present=True))
            )
            day_total = day_att['total'] or 0
            day_att_pct = (day_att['presentes'] / day_total * 100) if day_total > 0 else 0
            
            day_attn = IndividualFatigueAnalysis.objects.filter(
                date=day, status='completed'
            ).aggregate(avg=Avg('attention_score'))['avg']

            chart_data.append({
                "date": day.strftime('%d/%m'),
                "asistencia": round(day_att_pct, 1),
                "atencion": round(day_attn, 1) if day_attn else 0
            })

        return Response({
            "kpis": {
                "attendance_avg": round(attendance_avg, 1),
                "attention_avg": round(fatigue_stats['avg_attention'] or 0, 1),
                "fatigue_alerts": fatigue_stats['alerts'],
                "processing_tasks": proc_tasks
            },
            "chart_data": chart_data
        })