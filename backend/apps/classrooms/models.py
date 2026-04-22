from django.db import models
from django.conf import settings


class Classroom(models.Model):
    """Grupo académico. Cada grupo pertenece a un maestro y contiene alumnos."""
    name = models.CharField(max_length=100)
    subject = models.CharField(max_length=100)
    maestro = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='classrooms',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'classrooms_classroom'
        verbose_name = 'Grupo'
        verbose_name_plural = 'Grupos'
        indexes = [
            models.Index(fields=['maestro', 'is_active']),
        ]

    def __str__(self):
        return f"{self.name} — {self.subject}"


class Student(models.Model):
    """
    Alumno inscrito en un grupo. La matrícula es única por grupo (no globalmente),
    por lo que un alumno puede estar en varios grupos con la misma matrícula.
    Requiere al menos 5 FaceEncoding para participar en análisis de asistencia o fatiga.
    """

    SEX_CHOICES = [('M', 'Masculino'), ('F', 'Femenino')]

    name = models.CharField(max_length=255)
    matricula = models.CharField(max_length=20, db_index=True)
    age = models.PositiveIntegerField()
    sex = models.CharField(max_length=1, choices=SEX_CHOICES)
    wears_glasses = models.BooleanField(default=False)
    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.CASCADE,
        related_name='students',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'classrooms_student'
        verbose_name = 'Alumno'
        verbose_name_plural = 'Alumnos'
        unique_together = [('matricula', 'classroom')]

    def __str__(self):
        return f"{self.name} ({self.matricula})"

    @property
    def has_enough_face_samples(self):
        return self.face_encodings.count() >= 5


class FaceEncoding(models.Model):
    """
    Vector ArcFace 512-d L2-normalizado de un alumno, serializado con numpy.save().
    Cada alumno necesita al menos 5 muestras para habilitar el reconocimiento.
    El centroide normalizado de todos sus encodings es el vector de referencia en los pipelines.
    """
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='face_encodings',
    )
    encoding_data = models.BinaryField()  # numpy array serialized with pickle
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'classrooms_faceencoding'
        verbose_name = 'Encoding Facial'
        verbose_name_plural = 'Encodings Faciales'
