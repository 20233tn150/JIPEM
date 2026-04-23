import base64
import io
import threading

import cv2
import numpy as np

from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Classroom, Student, FaceEncoding
from .serializers import ClassroomSerializer, StudentSerializer, FaceStatusSerializer
from .crypto import EncryptedJSONParser, EncryptedJSONRenderer

from loguru import logger

# ── InsightFace singleton ────────────────────────────────────────────────────
_face_app = None
_face_app_lock = threading.Lock()


def _get_face_app():
    """
    Inicializa de forma perezosa la aplicación FaceAnalysis (Thread-safe).

    Carga el modelo 'buffalo_l' para detección y reconocimiento facial. Está 
    configurado para ejecutarse en CPU con un tamaño de detección de 640x640.

    Returns:
        insightface.app.FaceAnalysis: Instancia del motor de análisis facial.
    """
    global _face_app
    if _face_app is None:
        with _face_app_lock:
            if _face_app is None:
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(
                    name='buffalo_l',
                    providers=['CPUExecutionProvider'],
                )
                app.prepare(ctx_id=-1, det_size=(640, 640))
                _face_app = app
                logger.info("InsightFace buffalo_l loaded (registration).")
    return _face_app


# ── Classroom CRUD ───────────────────────────────────────────────────────────

class ClassroomListCreateView(generics.ListCreateAPIView):
    """
    Vista para listar y crear grupos (Classrooms).

    Nota:
        Utiliza 'EncryptedJSON' para asegurar que la información de los grupos 
        viaje cifrada entre el servidor y el cliente.
    """
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [EncryptedJSONParser]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        """
        Filtra los grupos activos pertenecientes al maestro solicitante.
        
        Los administradores pueden ver todos los grupos activos del sistema.
        """
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        """Asigna automáticamente el usuario actual como maestro del grupo."""
        serializer.save(maestro=self.request.user)


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista detallada para obtener, actualizar o eliminar un grupo específico.
    """
    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [EncryptedJSONParser]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        """Retorna el conjunto de grupos activos accesibles por el usuario."""
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs

    def perform_destroy(self, instance):
        """
        Realiza un borrado lógico (soft-delete).
        
        En lugar de eliminar el registro, marca 'is_active' como False para 
        preservar la integridad histórica de las asistencias.
        """
        instance.is_active = False
        instance.save()


# ── Student CRUD ─────────────────────────────────────────────────────────────

class StudentListCreateView(generics.ListCreateAPIView):
    """Lista o crea alumnos dentro de un grupo. La matrícula debe ser única por grupo."""

    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_classroom(self):
        """
        Obtiene el objeto Classroom validando la propiedad del maestro.
        
        Returns:
            Classroom: Instancia del grupo extraída de los kwargs de la URL.
        """
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return get_object_or_404(qs, pk=self.kwargs['classroom_id'])

    def get_queryset(self):
        """Lista alumnos activos de un grupo optimizando la carga de biometría."""
        classroom = self.get_classroom()
        return Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings').order_by('name')

    def perform_create(self, serializer):
        """Vincula al nuevo alumno con el grupo validado anteriormente."""
        classroom = self.get_classroom()
        serializer.save(classroom=classroom)


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Gestión individual de un alumno.
    """
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Lista alumnos activos de un grupo optimizando la carga de biometría."""
        classroom_qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            classroom_qs = classroom_qs.filter(maestro=self.request.user)
        classroom = get_object_or_404(classroom_qs, pk=self.kwargs['classroom_id'])
        return Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings')

    def perform_destroy(self, instance):
        """Realiza el borrado lógico del alumno."""
        instance.is_active = False
        instance.save()


# ── Face capture ─────────────────────────────────────────────────────────────

class CaptureFaceView(APIView):
    """
    Recibe una imagen base64 desde el frontend, extrae el embedding ArcFace 512-d
    con InsightFace buffalo_l y lo guarda en FaceEncoding. Requiere al menos 5 muestras
    para habilitar el análisis de asistencia y fatiga del alumno.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, student_id):
        """
        Procesa una captura facial y genera un embedding de 512-d.

        Recibe una imagen en Base64, detecta el rostro más prominente, genera
        el embedding de ArcFace y lo guarda de forma binaria.

        Args:
            request (Request): Objeto DRF con 'image_base64' en el body.
            student_id (int): ID del alumno a quien se le asocia la muestra.

        Returns:
            Response: 201 si se guarda la muestra, con el conteo acumulado.
            Response: 400 si la imagen es inválida o no se detectan rostros.
        """
        student = self._get_student(request, student_id)

        image_b64 = request.data.get('image_base64', '')
        if not image_b64:
            return Response({'error': 'Se requiere image_base64.'}, status=400)

        # Decode base64 → BGR numpy array
        if ',' in image_b64:
            image_b64 = image_b64.split(',')[1]
        try:
            image_data = base64.b64decode(image_b64)
            nparr = np.frombuffer(image_data, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is None:
                raise ValueError("imdecode returned None")
        except Exception:
            return Response({'error': 'Imagen invalida o corrupta.'}, status=400)

        # Detect faces and extract ArcFace embedding
        face_app = _get_face_app()
        faces = face_app.get(img_bgr)

        if not faces:
            return Response({'error': 'No se detecto rostro en la imagen.'}, status=400)

        # Pick the face with the highest detection confidence
        best_face = max(faces, key=lambda f: f.det_score)

        if best_face.det_score < 0.5:
            return Response(
                {'error': 'Rostro detectado con baja confianza. Intenta con mejor iluminacion.'},
                status=400,
            )

        # Store 512-d L2-normalized ArcFace embedding
        embedding = best_face.embedding.astype(np.float32)
        buf = io.BytesIO()
        np.save(buf, embedding)
        FaceEncoding.objects.create(student=student, encoding_data=buf.getvalue())

        count = student.face_encodings.count()
        logger.info("Face sample saved for student {} (total: {}).", student.id, count)
        return Response({
            'message': 'Muestra facial guardada correctamente.',
            'sample_count': count,
            'has_enough_samples': count >= 5,
        }, status=201)

    def _get_student(self, request, student_id):
        """Valida que el alumno exista y pertenezca al maestro actual."""
        qs = Student.objects.filter(is_active=True)
        if not request.user.is_admin:
            qs = qs.filter(classroom__maestro=request.user)
        return get_object_or_404(qs, pk=student_id)


class FaceStatusView(APIView):
    """
    Consulta el estado del registro facial de un alumno.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        """
        Retorna cuántas muestras faciales tiene el alumno y si son suficientes.

        Args:
            student_id (int): ID del alumno a consultar.

        Returns:
            Response: Datos serializados por FaceStatusSerializer.
        """
        qs = Student.objects.filter(is_active=True).prefetch_related('face_encodings')
        if not request.user.is_admin:
            qs = qs.filter(classroom__maestro=request.user)
        student = get_object_or_404(qs, pk=student_id)
        serializer = FaceStatusSerializer(student)
        return Response(serializer.data)