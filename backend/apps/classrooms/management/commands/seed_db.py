"""
Pobla la base de datos con datos de prueba para demostración.

Uso:
    python manage.py seed_db
    python manage.py seed_db --flush   # borra datos existentes antes de sembrar

Crea:
  - 1 usuario administrador  (admin / Admin123!)
  - 2 maestros               (prof_garcia / Prof123! y prof_lopez / Prof123!)
  - 2 grupos por maestro
  - 5 alumnos por grupo
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.users.models import User
from apps.classrooms.models import Classroom, Student

ADMIN = {'username': 'admin',       'name': 'Administrador Sistema', 'password': 'Admin123!', 'role': 'admin'}
TEACHERS = [
    {'username': 'prof_garcia', 'name': 'Juan García Mendoza',  'password': 'Prof123!', 'role': 'maestro'},
    {'username': 'prof_lopez',  'name': 'Ana López Hernández',  'password': 'Prof123!', 'role': 'maestro'},
]

CLASSROOMS = [
    {'teacher': 'prof_garcia', 'name': 'ISC-8A', 'subject': 'Integradora II'},
    {'teacher': 'prof_garcia', 'name': 'ISC-8B', 'subject': 'Integradora II'},
    {'teacher': 'prof_lopez',  'name': 'IME-6A', 'subject': 'Redes de Computadoras'},
    {'teacher': 'prof_lopez',  'name': 'IME-6B', 'subject': 'Redes de Computadoras'},
]

STUDENTS_TEMPLATE = [
    {'name': 'Carlos Ramírez Díaz',     'matricula': '210001', 'age': 22, 'sex': 'M', 'wears_glasses': False},
    {'name': 'María Fernández Torres',  'matricula': '210002', 'age': 21, 'sex': 'F', 'wears_glasses': True},
    {'name': 'Luis Martínez Soto',      'matricula': '210003', 'age': 23, 'sex': 'M', 'wears_glasses': False},
    {'name': 'Sofía Hernández Ruiz',    'matricula': '210004', 'age': 22, 'sex': 'F', 'wears_glasses': False},
    {'name': 'Diego Morales Castillo',  'matricula': '210005', 'age': 21, 'sex': 'M', 'wears_glasses': True},
]


class Command(BaseCommand):
    help = 'Pobla la BD con datos de prueba (admin, 2 maestros, 4 grupos, 5 alumnos cada uno)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Elimina alumnos, grupos y maestros de prueba antes de sembrar.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            Student.objects.all().delete()
            Classroom.objects.all().delete()
            User.objects.filter(username__in=[t['username'] for t in TEACHERS]).delete()
            User.objects.filter(username=ADMIN['username']).delete()
            self.stdout.write(self.style.WARNING('Datos anteriores eliminados.'))

        # ── Admin ─────────────────────────────────────────────────────────────
        admin_user, created = User.objects.get_or_create(
            username=ADMIN['username'],
            defaults={'name': ADMIN['name'], 'role': ADMIN['role']},
        )
        if created:
            admin_user.set_password(ADMIN['password'])
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f"  Admin creado: {ADMIN['username']} / {ADMIN['password']}"))
        else:
            self.stdout.write(f"  Admin ya existe: {ADMIN['username']}")

        # ── Maestros ──────────────────────────────────────────────────────────
        teacher_map = {}
        for t in TEACHERS:
            user, created = User.objects.get_or_create(
                username=t['username'],
                defaults={'name': t['name'], 'role': t['role']},
            )
            if created:
                user.set_password(t['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  Maestro creado: {t['username']} / {t['password']}"))
            else:
                self.stdout.write(f"  Maestro ya existe: {t['username']}")
            teacher_map[t['username']] = user

        # ── Grupos ────────────────────────────────────────────────────────────
        classroom_map = {}
        for c in CLASSROOMS:
            maestro = teacher_map[c['teacher']]
            classroom, created = Classroom.objects.get_or_create(
                name=c['name'],
                maestro=maestro,
                defaults={'subject': c['subject']},
            )
            label = 'creado' if created else 'ya existe'
            self.stdout.write(f"  Grupo {label}: {c['name']} ({c['subject']}) — {maestro.username}")
            classroom_map[c['name']] = classroom

        # ── Alumnos ───────────────────────────────────────────────────────────
        for classroom_name, classroom in classroom_map.items():
            # Give each classroom a unique matricula prefix based on its id
            prefix = str(classroom.id).zfill(3)
            for i, tpl in enumerate(STUDENTS_TEMPLATE, start=1):
                matricula = f"{prefix}{tpl['matricula']}"
                student, created = Student.objects.get_or_create(
                    matricula=matricula,
                    classroom=classroom,
                    defaults={
                        'name': tpl['name'],
                        'age': tpl['age'],
                        'sex': tpl['sex'],
                        'wears_glasses': tpl['wears_glasses'],
                    },
                )
                if created:
                    self.stdout.write(f"    Alumno creado: {student.name} ({matricula}) → {classroom_name}")

        self.stdout.write(self.style.SUCCESS('\nBase de datos poblada exitosamente.'))
        self.stdout.write('\nCredenciales:')
        self.stdout.write(f"  Admin:   admin / Admin123!")
        self.stdout.write(f"  Maestro: prof_garcia / Prof123!")
        self.stdout.write(f"  Maestro: prof_lopez  / Prof123!")
