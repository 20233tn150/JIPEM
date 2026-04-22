from io import BytesIO

from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.http import HttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.renderers import StaticHTMLRenderer

from apps.attendance.models import AttendanceSession
from apps.fatigue.models import FatigueSession, IndividualFatigueAnalysis

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    openpyxl = None

try:
    from xhtml2pdf import pisa as _pisa
except ImportError:
    _pisa = None

_HTML_CONTENT_TYPE = 'text/html; charset=utf-8'


class AttendanceReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        classroom_id = request.query_params.get('classroom_id')
        date = request.query_params.get('date')

        if session_id:
            session = get_object_or_404(
                AttendanceSession.objects.select_related('classroom', 'maestro')
                .prefetch_related('records__student'),
                pk=session_id,
            )
        elif classroom_id and date:
            session = get_object_or_404(
                AttendanceSession.objects.select_related('classroom', 'maestro')
                .prefetch_related('records__student'),
                classroom_id=classroom_id, date=date,
            )
        else:
            return HttpResponse('Se requiere session_id o classroom_id + date', status=400)

        records = session.records.select_related('student').order_by('student__name')
        present_count = records.filter(is_present=True).count()

        html = render_to_string('reports/attendance_report.html', {
            'session': session,
            'records': records,
            'present_count': present_count,
            'total_count': records.count(),
        })
        return HttpResponse(html, content_type=_HTML_CONTENT_TYPE)


class AttendancePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _pisa is None:
            return HttpResponse(
                'xhtml2pdf no está instalado. Corre: pip install xhtml2pdf',
                status=503, content_type='text/plain',
            )
        try:
            session_id = request.query_params.get('session_id')
            if not session_id:
                return HttpResponse("Falta session_id", status=400)

            session = get_object_or_404(
                AttendanceSession.objects.select_related('classroom', 'maestro')
                .prefetch_related('records__student'),
                pk=session_id
            )

            records = session.records.select_related('student').order_by('student__name')
            present_count = records.filter(is_present=True).count()
            total_count = records.count()

            html_string = render_to_string('reports/attendance_report_pdf.html', {
                'session': session,
                'records': records,
                'present_count': present_count,
                'absent_count': total_count - present_count,
                'total_count': total_count,
            })

            buffer = BytesIO()
            result = _pisa.CreatePDF(html_string.encode('utf-8'), dest=buffer, encoding='utf-8')

            if result.err:
                return HttpResponse("Error al generar PDF", status=500, content_type='text/plain')

            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Asistencia_Sesion_{session_id}.pdf"'
            return response

        except Exception as e:
            print(f"Error en PDF Asistencia: {str(e)}")
            return HttpResponse(f"Error: {str(e)}", status=500, content_type="text/plain")


class FatigueReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        session_id = request.query_params.get('session_id')
        if not session_id:
            return HttpResponse('Se requiere session_id', status=400)

        session = get_object_or_404(
            FatigueSession.objects.select_related('classroom', 'maestro')
            .prefetch_related('records__student'),
            pk=session_id,
            status=FatigueSession.STATUS_COMPLETED,
        )

        records = session.records.select_related('student').order_by('student__name')
        present_count = records.filter(is_present=True).count()

        html = render_to_string('reports/fatigue_report.html', {
            'session': session,
            'records': records,
            'present_count': present_count,
            'total_count': records.count(),
        })
        return HttpResponse(html, content_type=_HTML_CONTENT_TYPE)


class IndividualFatigueReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        analysis_id = request.query_params.get('analysis_id')
        if not analysis_id:
            return HttpResponse('Se requiere analysis_id', status=400)

        analysis = get_object_or_404(
            IndividualFatigueAnalysis.objects.select_related('student__classroom', 'maestro'),
            pk=analysis_id,
            status=IndividualFatigueAnalysis.STATUS_COMPLETED,
        )

        html = render_to_string('reports/individual_fatigue_report.html', {
            'analysis': analysis,
            'student': analysis.student,
        })
        return HttpResponse(html, content_type=_HTML_CONTENT_TYPE)


class IndividualFatiguePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if _pisa is None:
            return HttpResponse(
                'xhtml2pdf no está instalado. Corre: pip install xhtml2pdf',
                status=503, content_type='text/plain',
            )
        try:
            analysis_id = request.query_params.get('analysis_id')
            if not analysis_id:
                return HttpResponse("Falta analysis_id", status=400)

            analysis = get_object_or_404(
                IndividualFatigueAnalysis.objects.select_related('student__classroom'),
                pk=analysis_id
            )

            html_string = render_to_string('reports/individual_fatigue_report.html', {
                'analysis': analysis,
                'student': analysis.student
            })

            buffer = BytesIO()
            result = _pisa.CreatePDF(html_string.encode('utf-8'), dest=buffer, encoding='utf-8')

            if result.err:
                return HttpResponse("Error al generar PDF", status=500, content_type='text/plain')

            buffer.seek(0)
            response = HttpResponse(buffer.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="Fatiga_Individual_{analysis_id}.pdf"'
            return response

        except Exception as e:
            print(f"Error en PDF: {str(e)}")
            return HttpResponse(f"Error: {str(e)}", status=500, content_type="text/plain")
