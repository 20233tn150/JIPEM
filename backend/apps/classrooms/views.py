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
    """Lazy-initialize InsightFace FaceAnalysis (thread-safe singleton)."""
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
    """Lista los grupos activos del maestro autenticado o todos los grupos si es admin."""

    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [EncryptedJSONParser]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(maestro=self.request.user)


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Obtiene, actualiza o elimina (soft-delete) un grupo. Solo el maestro dueño o admin."""

    serializer_class = ClassroomSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [EncryptedJSONParser]
    renderer_classes = [EncryptedJSONRenderer]

    def get_queryset(self):
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return qs

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()


# ── Student CRUD ─────────────────────────────────────────────────────────────

class StudentListCreateView(generics.ListCreateAPIView):
    """Lista o crea alumnos dentro de un grupo. La matrícula debe ser única por grupo."""

    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_classroom(self):
        qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            qs = qs.filter(maestro=self.request.user)
        return get_object_or_404(qs, pk=self.kwargs['classroom_id'])

    def get_queryset(self):
        classroom = self.get_classroom()
        return Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings').order_by('name')

    def perform_create(self, serializer):
        classroom = self.get_classroom()
        serializer.save(classroom=classroom)


class StudentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        classroom_qs = Classroom.objects.filter(is_active=True)
        if not self.request.user.is_admin:
            classroom_qs = classroom_qs.filter(maestro=self.request.user)
        classroom = get_object_or_404(classroom_qs, pk=self.kwargs['classroom_id'])
        return Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings')

    def perform_destroy(self, instance):
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
        qs = Student.objects.filter(is_active=True)
        if not request.user.is_admin:
            qs = qs.filter(classroom__maestro=request.user)
        return get_object_or_404(qs, pk=student_id)


class FaceStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        qs = Student.objects.filter(is_active=True).prefetch_related('face_encodings')
        if not request.user.is_admin:
            qs = qs.filter(classroom__maestro=request.user)
        student = get_object_or_404(qs, pk=student_id)
        serializer = FaceStatusSerializer(student)
        return Response(serializer.data)
