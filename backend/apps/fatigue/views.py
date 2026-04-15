import os
import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.classrooms.crypto import EncryptedJSONRenderer
from .models import IndividualFatigueAnalysis
from .serializers import IndividualFatigueAnalysisSerializer
from .tasks import start_individual_fatigue_processing

ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv'}
MAX_UPLOAD_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 500 * 1024 * 1024)


class IndividualFatigueListView(generics.ListAPIView):
    """
    GET  individual/  — lista los análisis del maestro autenticado.
    POST individual/  — recibe student_id, date y video (multipart), crea el
                        análisis y lanza el procesamiento en un hilo daemon.
    """
    serializer_class = IndividualFatigueAnalysisSerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        qs = IndividualFatigueAnalysis.objects.select_related(
            'student__classroom', 'maestro'
        )
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        student_id = self.request.query_params.get('student_id')
        classroom_id = self.request.query_params.get('classroom_id')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if classroom_id:
            qs = qs.filter(student__classroom_id=classroom_id)
        return qs.order_by('-date', '-created_at')

    def post(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        date = request.data.get('date')
        video_file = request.FILES.get('video')

        if not student_id:
            return Response({'error': 'Se requiere el identificador del alumno.'}, status=400)
        if not date:
            return Response({'error': 'Se requiere la fecha del análisis (YYYY-MM-DD).'}, status=400)
        if not video_file:
            return Response({'error': 'Se requiere el archivo de video.'}, status=400)

        from apps.classrooms.models import Student
        qs = Student.objects.select_related('classroom').filter(is_active=True)
        if not request.user.is_admin:
            qs = qs.filter(classroom__maestro=request.user)
        student = get_object_or_404(qs, pk=student_id)

        ext = os.path.splitext(video_file.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {'error': f'Formato de video no permitido. Formatos aceptados: {", ".join(ALLOWED_EXTENSIONS)}.'},
                status=400,
            )
        if video_file.size > MAX_UPLOAD_SIZE:
            return Response({'error': 'El video supera el límite permitido de 500 MB.'}, status=400)

        tmp_dir = settings.MEDIA_ROOT / 'tmp'
        tmp_dir.mkdir(parents=True, exist_ok=True)
        filename = f"fatigue_individual_{student.id}_{uuid.uuid4().hex}{ext}"
        video_path = tmp_dir / filename

        with open(video_path, 'wb') as f:
            for chunk in video_file.chunks():
                f.write(chunk)

        analysis = IndividualFatigueAnalysis.objects.create(
            student=student,
            maestro=request.user,
            date=date,
        )

        start_individual_fatigue_processing(analysis.id, str(video_path))

        return Response(IndividualFatigueAnalysisSerializer(analysis).data, status=202)


class IndividualFatigueDetailView(generics.RetrieveAPIView):
    """Detalle de un análisis individual por id."""
    serializer_class = IndividualFatigueAnalysisSerializer
    permission_classes = [IsAuthenticated]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        qs = IndividualFatigueAnalysis.objects.select_related('student__classroom', 'maestro')
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs


class IndividualFatigueStatusView(APIView):
    """Endpoint de polling — devuelve solo el estado actual del análisis."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [EncryptedJSONRenderer]

    def get(self, request, pk):
        qs = IndividualFatigueAnalysis.objects.all()
        if not request.user.is_admin:
            qs = qs.filter(maestro=request.user)
        analysis = get_object_or_404(qs, pk=pk)
        return Response({
            'id': analysis.id,
            'status': analysis.status,
            'error_message': analysis.error_message,
        })


class IndividualFatigueDeleteView(APIView):
    """Elimina un análisis individual (cualquier estado excepto procesando)."""
    permission_classes = [IsAuthenticated]
    renderer_classes = [EncryptedJSONRenderer]

    def delete(self, request, pk):
        qs = IndividualFatigueAnalysis.objects.all()
        if not request.user.is_admin:
            qs = qs.filter(maestro=request.user)
        analysis = get_object_or_404(qs, pk=pk)

        if analysis.status == IndividualFatigueAnalysis.STATUS_PROCESSING:
            return Response(
                {'error': 'No se puede eliminar un análisis en procesamiento.'},
                status=400,
            )

        analysis.delete()
        return Response(status=204)
