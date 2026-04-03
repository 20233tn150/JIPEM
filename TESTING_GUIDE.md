# Presentia — Guía de pruebas y puesta en marcha

> **Uso interno del equipo.** Sigue los pasos en orden. Tiempo estimado desde cero: ~10 min.

---

## Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| MySQL | 8.0+ | `mysql --version` |
| Git | cualquiera | `git --version` |

---

## 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd JIPEM
```

---

## 2. Base de datos — SQL inicial

Conéctate a MySQL como root y ejecuta:

```sql
-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS jipem_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Crear el usuario de la app (opcional, si no usas root)
CREATE USER IF NOT EXISTS 'jipem_user'@'localhost' IDENTIFIED BY 'jipem_pass_2026';
GRANT ALL PRIVILEGES ON jipem_db.* TO 'jipem_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES LIKE 'jipem_db';
```

> Si prefieres usar `root` directamente, omite la parte de `CREATE USER` y pon
> `DATABASE_USER=root` / `DATABASE_PASSWORD=root` en el `.env`.

---

## 3. Configurar el backend

### 3.1 Crear entorno virtual e instalar dependencias

```bash
cd backend

# Crear venv (solo la primera vez)
python -m venv .venv

# Activar el venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r ../requirements.txt
```

### 3.2 Crear el archivo `.env`

Crea el archivo `backend/.env` con el siguiente contenido:

```env
SECRET=jipem-utemz-8vo-2026-xk4$p!n#q@wz-presentia-secret
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_NAME=jipem_db
DATABASE_USER=root
DATABASE_PASSWORD=root
DATABASE_HOST=localhost
DATABASE_PORT=3306

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

> Ajusta `DATABASE_USER` y `DATABASE_PASSWORD` según tu instalación de MySQL.

### 3.3 Aplicar migraciones (crea todas las tablas)

```bash
# Desde backend/ con el venv activo
python manage.py migrate
```

Deberías ver algo como:

```
Applying users.0001_initial... OK
Applying classrooms.0001_initial... OK
Applying attendance.0001_initial... OK
Applying fatigue.0001_initial... OK
...
```

---

## 4. Crear usuarios de prueba

Las contraseñas de Django se hashean con PBKDF2-SHA256 y **no se pueden insertar como texto plano en SQL**. Usa el siguiente script desde Django shell:

```bash
# Desde backend/ con el venv activo
python manage.py shell
```

Dentro del shell, pega y ejecuta esto completo:

```python
from apps.users.models import User

# ── Usuario Administrador ──────────────────────────────────────────────────
admin = User.objects.create_user(
    username='admin',
    password='Admin123!',
    name='Administrador General',
    role='admin',
)
admin.is_staff = True      # acceso al panel /admin/
admin.is_superuser = True
admin.save()
print(f"[OK] Admin creado: {admin.username}")

# ── Usuario Maestro 1 ──────────────────────────────────────────────────────
m1 = User.objects.create_user(
    username='prof.garcia',
    password='Maestro123!',
    name='Carlos García López',
    role='maestro',
)
print(f"[OK] Maestro creado: {m1.username}")

# ── Usuario Maestro 2 ──────────────────────────────────────────────────────
m2 = User.objects.create_user(
    username='prof.torres',
    password='Maestro123!',
    name='Ana Torres Ruiz',
    role='maestro',
)
print(f"[OK] Maestro creado: {m2.username}")

print("\nUsuarios en DB:")
for u in User.objects.all().values('username', 'name', 'role'):
    print(f"  {u['username']:20} | {u['role']:8} | {u['name']}")
```

Salir del shell:

```python
exit()
```

### Credenciales de acceso rápido

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador — ve todos los datos, gestiona maestros |
| `prof.garcia` | `Maestro123!` | Maestro — solo ve sus propios grupos y sesiones |
| `prof.torres` | `Maestro123!` | Maestro — cuenta independiente para probar aislamiento |

---

## 5. SQL de verificación — ver tablas creadas

Después de `migrate`, puedes verificar en MySQL:

```sql
USE jipem_db;

-- Ver todas las tablas generadas
SHOW TABLES;

-- Verificar usuarios creados
SELECT id, username, name, role, is_active, is_staff
FROM users_user;

-- Ver estructura de tablas clave
DESCRIBE classrooms_student;
DESCRIBE classrooms_faceencoding;
DESCRIBE attendance_session;
DESCRIBE fatigue_individual_analysis;
```

---

## 6. Levantar el backend

```bash
# Desde backend/ con el venv activo
python manage.py runserver
```

Servidor disponible en: **http://localhost:8000**

Prueba rápida desde el navegador o curl:

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123!"}'
```

Respuesta esperada: JSON con `access`, `refresh` y datos del usuario.

---

## 7. Configurar y levantar el frontend

```bash
# Nueva terminal — desde la raíz JIPEM/
cd frontend

# Instalar dependencias (solo la primera vez)
npm install

# Crear el archivo de entorno
# (crear frontend/.env con este contenido)
echo "VITE_API_URL=http://localhost:8000/api" > .env

# Levantar servidor de desarrollo
npm run dev
```

App disponible en: **http://localhost:5173**

---

## 8. Flujo completo de pruebas

Sigue este orden para probar todas las funcionalidades:

### 8.1 Login y roles

1. Ir a `http://localhost:5173`
2. Iniciar sesión como `admin` / `Admin123!`
3. Verificar que aparece la sección **Administración → Maestros** en el sidebar
4. Cerrar sesión
5. Iniciar sesión como `prof.garcia` / `Maestro123!`
6. Verificar que **no** aparece la sección de Administración

---

### 8.2 Crear grupo y alumnos

> Sesión activa: `prof.garcia`

1. Ir a **Grupos → Nuevo grupo**
2. Crear grupo: nombre `"Programación Avanzada"`, materia `"Estructura de Datos"`
3. Abrir el grupo → **Agregar alumno**
4. Crear 2 alumnos:

| Nombre | Matrícula | Edad | Sexo |
|---|---|---|---|
| Juan Pérez Soto | 210001 | 20 | M |
| María López Reyes | 210002 | 21 | F |

---

### 8.3 Captura de muestras faciales

> Requiere cámara web. Mínimo **5 muestras** por alumno.

1. En el detalle de un alumno → botón **Capturar rostro**
2. Permitir acceso a la cámara en el navegador
3. Hacer clic en **Tomar muestra** al menos 5 veces (con ligeras variaciones de posición/luz)
4. Verificar que el indicador muestra `5/5` o más
5. Repetir para el segundo alumno

---

### 8.4 Sesión de asistencia

> Necesitas un video de 30s–5min con el rostro del alumno visible.

1. Ir a **Asistencia → Nueva sesión**
2. Seleccionar el grupo creado y fecha de hoy
3. En el detalle de la sesión → **Subir video**
4. Subir el video (`.mp4`, `.avi`, `.mov`, `.mkv`, máx. 500 MB)
5. Esperar el procesamiento (la UI actualiza automáticamente cada 3s)
6. Al completar, verificar registros de asistencia
7. Probar corrección manual: hacer clic en el badge `Presente` / `Ausente` de un alumno

**Probar recuperación de error:**

1. Subir un archivo de texto renombrado como `.mp4` (debería fallar)
2. Verificar que aparece el panel de error con botón **Reintentar**
3. Subir un video válido desde el mismo panel
4. Verificar que la sesión se completa correctamente

---

### 8.5 Análisis de fatiga individual

1. Ir a **Análisis de Fatiga → Nuevo análisis**
2. Seleccionar alumno y fecha
3. Subir un video del alumno (idealmente con momentos de ojos cerrados para ver el score)
4. Esperar procesamiento
5. Verificar: puntuación de atención, puntuación de fatiga y clasificación (`Atento` / `Distraído` / `Fatigado`)

**Scores de referencia esperados:**

| Situación en el video | Atención esperada | Clasificación |
|---|---|---|
| Ojos abiertos todo el tiempo | 70–100 | Atento |
| Parpadeo frecuente / distracciones | 40–69 | Distraído |
| Ojos cerrados varios segundos | 0–39 | Fatigado |

---

### 8.6 Panel de administración

> Sesión activa: `admin`

1. Ir a **Administración → Maestros**
2. Crear un nuevo maestro desde la UI
3. Verificar que aparece en la lista
4. Desactivar el maestro (soft delete)
5. Verificar que el maestro desactivado no puede iniciar sesión

---

### 8.7 Páginas informativas

1. Ir a **Cómo funciona** → leer explicación de PERCLOS para familiarizarse
2. Ir a **Términos y condiciones** → revisar los 9 artículos
3. Ir directamente a `http://localhost:5173/tech-docs` → documentación técnica interna

---

## 9. Restablecer datos de prueba

Para limpiar y empezar desde cero sin borrar usuarios:

```sql
USE jipem_db;

-- Borrar en orden (respetando FK)
DELETE FROM fatigue_individual_analysis;
DELETE FROM attendance_record;
DELETE FROM attendance_session;
DELETE FROM classrooms_faceencoding;
DELETE FROM classrooms_student;
DELETE FROM classrooms_classroom;

-- Reiniciar auto-increment (opcional)
ALTER TABLE classrooms_classroom AUTO_INCREMENT = 1;
ALTER TABLE classrooms_student AUTO_INCREMENT = 1;
ALTER TABLE attendance_session AUTO_INCREMENT = 1;
```

Para borrar **todo** incluyendo usuarios y volver a migrar:

```bash
# MySQL
mysql -u root -p -e "DROP DATABASE jipem_db; CREATE DATABASE jipem_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Django
python manage.py migrate
python manage.py shell  # → repetir script de usuarios del paso 4
```

---

## 10. Referencia rápida de comandos

```bash
# ── Backend ────────────────────────────────────────────────────────────────
cd backend
.venv\Scripts\activate          # Windows
source .venv/bin/activate        # macOS / Linux

python manage.py migrate         # aplicar migraciones
python manage.py runserver       # levantar en :8000
python manage.py shell           # consola interactiva Django
python manage.py createsuperuser # crear superusuario Django admin

# ── Frontend ───────────────────────────────────────────────────────────────
cd frontend
npm install                      # instalar dependencias (primera vez)
npm run dev                      # levantar en :5173
npm run build                    # build de producción → dist/

# ── MySQL ──────────────────────────────────────────────────────────────────
mysql -u root -p                 # conectar a MySQL
USE jipem_db;                    # seleccionar BD
SHOW TABLES;                     # listar tablas
```

---

## 11. Solución de problemas comunes

| Error | Causa probable | Solución |
|---|---|---|
| `UndefinedValueError: SECRET not found` | Falta el archivo `.env` o tiene nombres incorrectos | Verificar que `backend/.env` existe y usa `SECRET=` (no `SECRET_KEY=`) |
| `django.db.OperationalError: (1045)` | Credenciales MySQL incorrectas | Revisar `DATABASE_USER` y `DATABASE_PASSWORD` en `.env` |
| `TypeError: unsupported operand type(s) for /: 'str'` | `MEDIA_ROOT` no configurado | Verificar que `settings.py` tiene `MEDIA_ROOT = BASE_DIR / 'tmp_media'` |
| `Network Error` en el frontend | Backend no está corriendo | Levantar `python manage.py runserver` |
| `CORS error` en el navegador | Origen del frontend no en `CORS_ALLOWED_ORIGINS` | Agregar `http://localhost:5173` al `.env` del backend |
| `unpickling stack underflow` | Encodings guardados con numpy pero cargados con pickle | Ya corregido — encodings se cargan con `np.load(io.BytesIO(...))` |
| Video se procesa pero todos salen ausentes | Alumnos sin muestras faciales | Capturar mínimo 5 muestras por alumno antes de subir el video |
| Cámara no disponible en FaceCapture | Navegador sin permiso o HTTPS requerido | Permitir cámara en el navegador; en Chrome: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` |

---

*Presentia · JIPEM · Universidad Tecnológica Emiliano Zapata · 8vo semestre 2026*
