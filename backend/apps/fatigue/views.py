import os
import uuid

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IndividualFatigueAnalysis
from .serializers import IndividualFatigueAnalysisSerializer
from .tasks import start_individual_fatigue_processing

ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv'}
MAX_UPLOAD_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 500 * 1024 * 1024)


class IndividualFatigueListView(generics.ListAPIView):
    """
    Vista para listar y solicitar análisis de fatiga individuales.

    Permite consultar el histórico de análisis filtrado por alumno o grupo,
    y centraliza la recepción de videos para nuevos procesamientos.
    """
    serializer_class = IndividualFatigueAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Obtiene los análisis filtrados por permisos y parámetros de consulta.

        Returns:
            QuerySet: Análisis del maestro (o todos si es admin) filtrados opcionalmente 
                por 'student_id' o 'classroom_id'.
        """
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
        """
        Crea un nuevo análisis de fatiga e inicia el procesamiento asíncrono.

        Valida que el alumno pertenezca al maestro, que el formato de video sea 
        soportado y que el tamaño no exceda el límite configurado.

        Args:
            request (Request): Objeto con 'student_id', 'date' y 'video' (FILE).

        Returns:
            Response: 202 (Accepted) con los datos iniciales del análisis.
            Response: 400 (Bad Request) si faltan datos o el video no es válido.
        """
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
    """
    Consulta el detalle completo de un análisis de fatiga específico.
    """
    serializer_class = IndividualFatigueAnalysisSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = IndividualFatigueAnalysis.objects.select_related('student__classroom', 'maestro')
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs


class IndividualFatigueStatusView(APIView):
    """
    Endpoint para monitoreo de estado (Polling).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """
        Retorna exclusivamente el estado del proceso y mensajes de error.

        Útil para que el frontend actualice barras de progreso o notificaciones 
        sin cargar toda la relación de datos del análisis.

        Args:
            pk (int): Clave primaria del análisis.

        Returns:
            Response: JSON con 'id', 'status' y 'error_message'.
        """
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
    """
    Gestiona la eliminación de registros de análisis.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        """
        Elimina un registro de análisis si no está siendo procesado actualmente.

        Args:
            pk (int): Clave primaria del análisis a eliminar.

        Returns:
            Response: 204 si la eliminación fue exitosa.
            Response: 400 si el estado es 'PROCESSING'.

        Raises:
            Http404: Si el análisis no existe o no pertenece al usuario.
        """
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