# backend > apps > attendance > views.py
import openpyxl 
from openpyxl.styles import Font, Alignment, PatternFill 
from django.http import HttpResponse
from apps.users.permissions import IsAdmin
import os
import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AttendanceSession, AttendanceRecord
from .serializers import (
    AttendanceSessionSerializer,
    AttendanceSessionListSerializer,
)
from .tasks import start_attendance_processing

from .models import AttendanceSession, AttendanceRecord
from apps.classrooms.models import Classroom


ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv'}
MAX_UPLOAD_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 500 * 1024 * 1024)


class SessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AttendanceSessionListSerializer
        return AttendanceSessionSerializer

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related(
            'classroom', 'maestro'
        ).prefetch_related('records').filter(classroom__is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        # Validate classroom belongs to maestro
        classroom = serializer.validated_data['classroom']
        if not self.request.user.is_admin and classroom.maestro != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes acceso a este grupo.")
        serializer.save(maestro=self.request.user)


class SessionDetailView(generics.RetrieveAPIView):
    serializer_class = AttendanceSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceSession.objects.select_related(
            'classroom', 'maestro'
        ).prefetch_related('records__student').filter(classroom__is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs


class UploadVideoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        session = self._get_session(request, session_id)

        if session.status == AttendanceSession.STATUS_PROCESSING:
            return Response(
                {'error': 'La sesión está siendo procesada. Espera a que termine.'},
                status=400,
            )
        if session.status == AttendanceSession.STATUS_COMPLETED:
            return Response(
                {'error': 'La sesión ya fue completada. Usa las correcciones manuales si necesitas cambios.'},
                status=400,
            )

        # Si hubo un error previo, limpiar para reintentar
        if session.status == AttendanceSession.STATUS_ERROR:
            AttendanceRecord.objects.filter(session=session).delete()
            session.status = AttendanceSession.STATUS_PENDING
            session.error_message = ''
            session.save(update_fields=['status', 'error_message'])

        video_file = request.FILES.get('video')
        if not video_file:
            return Response({'error': 'Se requiere el archivo de video.'}, status=400)

        # Validate extension
        ext = os.path.splitext(video_file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {'error': f'Formato no permitido. Use: {", ".join(ALLOWED_EXTENSIONS)}'},
                status=400,
            )

        # Validate size
        if video_file.size > MAX_UPLOAD_SIZE:
            return Response({'error': 'El video supera el limite de 500MB.'}, status=400)

        # Save to tmp
        tmp_dir = settings.MEDIA_ROOT / 'tmp'
        tmp_dir.mkdir(parents=True, exist_ok=True)
        filename = f"session_{session.id}_{uuid.uuid4().hex}{ext}"
        video_path = tmp_dir / filename

        with open(video_path, 'wb') as f:
            for chunk in video_file.chunks():
                f.write(chunk)

        # Start background processing
        start_attendance_processing(session.id, str(video_path))

        return Response({
            'message': 'Video recibido. Procesando asistencia en segundo plano.',
            'session_id': session.id,
            'status': AttendanceSession.STATUS_PROCESSING,
        }, status=202)

    def _get_session(self, request, session_id):
        qs = AttendanceSession.objects.all()
        if not request.user.is_admin:
            qs = qs.filter(maestro=request.user)
        return get_object_or_404(qs, pk=session_id)


class SessionStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        qs = AttendanceSession.objects.all()
        if not request.user.is_admin:
            qs = qs.filter(maestro=request.user)
        session = get_object_or_404(qs, pk=session_id)
        return Response({
            'session_id': session.id,
            'status': session.status,
            'error_message': session.error_message,
        })


class SessionDeleteView(APIView):
    """Elimina una sesión (cualquier estado excepto procesando)."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, session_id):
        qs = AttendanceSession.objects.all()
        if not request.user.is_admin:
            qs = qs.filter(maestro=request.user)
        session = get_object_or_404(qs, pk=session_id)

        if session.status == AttendanceSession.STATUS_PROCESSING:
            return Response(
                {'error': 'No se puede eliminar una sesión en procesamiento.'},
                status=400,
            )

        session.delete()
        return Response(status=204)


class AttendanceRecordToggleView(APIView):
    """Toggle is_present for a single attendance record (manual correction)."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, record_id):
        qs = AttendanceRecord.objects.select_related('session__classroom')
        if not request.user.is_admin:
            qs = qs.filter(session__maestro=request.user)
        record = get_object_or_404(qs, pk=record_id)

        record.is_present = not record.is_present
        record.save(update_fields=['is_present'])

        return Response({
            'id': record.id,
            'is_present': record.is_present,
        })

class AttendanceExcelReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):

        from openpyxl.utils import get_column_letter 
        classroom_id = request.query_params.get('classroom_id')
        
        classroom = get_object_or_404(Classroom, pk=classroom_id)
        
        sessions = AttendanceSession.objects.filter(
            classroom=classroom, 
            status='completed'
        ).order_by('date')
        
        students = classroom.students.all().order_by('name')

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Control de Asistencia"
        ws.merge_cells('A1:B1')
        ws['A1'] = f"GRUPO: {classroom.name}"
        ws['A1'].font = Font(bold=True, size=12)
        ws.append([]) 

        headers = ['Matrícula', 'Nombre del Alumno']
        for session in sessions:
            headers.append(session.date.strftime('%d/%m/%Y') if session.date else "S/F")
        ws.append(headers)
        
        header_row_idx = ws.max_row
        for cell in ws[header_row_idx]:
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
            cell.alignment = Alignment(horizontal="center")

        for student in students:
            row = [student.matricula, student.name]
            for session in sessions:
                record = AttendanceRecord.objects.filter(session=session, student=student).first()
                row.append("P" if (record and record.is_present) else "A")
            ws.append(row)

        for i, col in enumerate(ws.columns, 1):
            column_letter = get_column_letter(i)
            max_length = 0
            for cell in col:
                try:
                    if cell.value:
                        val_str = str(cell.value)
                        if len(val_str) > max_length:
                            max_length = len(val_str)
                except AttributeError:
                    continue
            
            ws.column_dimensions[column_letter].width = max_length + 3

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        clean_name = str(classroom.name).replace(" ", "_")
        response['Content-Disposition'] = f'attachment; filename="Asistencia_{clean_name}.xlsx"'
        
        wb.save(response)
        return response