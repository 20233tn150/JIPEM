from rest_framework import serializers
from .models import Classroom, Student, FaceEncoding


class StudentSerializer(serializers.ModelSerializer):
    has_enough_face_samples = serializers.BooleanField(read_only=True)
    face_sample_count = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = (
            'id', 'name', 'matricula', 'age', 'sex',
            'wears_glasses', 'classroom', 'is_active',
            'has_enough_face_samples', 'face_sample_count', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'classroom')

    def get_face_sample_count(self, obj):
        return obj.face_encodings.count()

    def validate_matricula(self, value):
        """Matricula debe ser única dentro del mismo grupo, no globalmente."""
        view = self.context.get('view')
        if view is None:
            return value

        if self.instance:
            classroom = self.instance.classroom
        else:
            classroom_id = view.kwargs.get('classroom_id')
            if classroom_id is None:
                return value
            try:
                classroom = Classroom.objects.get(pk=classroom_id)
            except Classroom.DoesNotExist:
                return value

        qs = Student.objects.filter(matricula=value, classroom=classroom, is_active=True)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('Ya existe un alumno con esta matrícula en el grupo.')
        return value


class ClassroomSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    maestro_name = serializers.CharField(source='maestro.name', read_only=True)

    class Meta:
        model = Classroom
        fields = ('id', 'name', 'subject', 'maestro', 'maestro_name',
                  'is_active', 'student_count', 'created_at')
        read_only_fields = ('id', 'maestro', 'created_at')

    def get_student_count(self, obj):
        return obj.students.filter(is_active=True).count()


class FaceStatusSerializer(serializers.ModelSerializer):
    has_enough_samples = serializers.BooleanField(source='has_enough_face_samples')
    sample_count = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = ('id', 'name', 'has_enough_samples', 'sample_count')

    def get_sample_count(self, obj):
        return obj.face_encodings.count()
