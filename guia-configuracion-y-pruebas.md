# Presentia — Guía de pruebas y puesta en marcha

> **Uso interno del equipo.**
> Si es la **primera vez** que configuras el proyecto en un equipo nuevo, empieza por la sección 0.
> Si ya tienes el entorno listo, ve directo a la sección 1.

---

## 0. Instalación desde cero (equipo nuevo — solo Windows)

> Tiempo estimado: 25–40 min (la mayor parte es descarga).
> Sigue los pasos **en orden**. No omitas ninguno.

---

### 0.1 Visual Studio Build Tools 2022

Algunas librerías Python (insightface, opencv) necesitan compilar código C++ en la instalación.

1. Descarga el instalador desde:
   **https://visualstudio.microsoft.com/visual-cpp-build-tools/**
   → botón "Download Build Tools"

2. Ejecuta `vs_BuildTools.exe`.

3. En la pantalla de selección de cargas de trabajo marca exactamente estas opciones:

   - [ ] **Desarrollo para el escritorio con C++**  ← marcar esta carga de trabajo

   Dentro de esa carga, en el panel derecho asegúrate de que estén marcados:
   - [x] MSVC v143 – VS 2022 C++ x64/x86 build tools
   - [x] Windows 11 SDK (o Windows 10 SDK si tu equipo es Windows 10)
   - [x] Herramientas de CMake de C++ para Windows

4. Haz clic en **Instalar** y espera (~5 GB de descarga).

5. **Verifica** abriendo una terminal nueva y ejecutando:
   ```
   cl
   ```
   Debe mostrar algo como `Microsoft (R) C/C++ Optimizing Compiler...` — si dice "no se reconoce el comando", reinicia la terminal.

> Si `cl` sigue sin encontrarse, búscalo manualmente:
> Inicio → "x64 Native Tools Command Prompt for VS 2022" — ese prompt ya tiene cl en el PATH.

---

### 0.2 Python 3.10

> El proyecto **requiere exactamente Python 3.10.x**. Versiones mayores (3.11, 3.12, 3.13) no son compatibles con insightface.

1. Descarga Python 3.10.11 (última versión de la rama 3.10):
   **https://www.python.org/downloads/release/python-31011/**
   → "Windows installer (64-bit)" al fondo de la página.

2. Ejecuta el instalador. En la primera pantalla:
   - [x] **Add Python 3.10 to PATH** ← marcar esto antes de instalar
   - Haz clic en **"Install Now"**

3. **Verifica**:
   ```bash
   python --version
   ```
   Debe mostrar `Python 3.10.11`.

   > Si tienes varias versiones de Python, puede que `python` apunte a otra.
   > En ese caso usa `py -3.10 --version` o la ruta completa
   > `C:\Users\TU_USUARIO\AppData\Local\Programs\Python\Python310\python.exe`.

---

### 0.3 Node.js y MySQL

Si aún no los tienes:

- **Node.js 18+**: https://nodejs.org → versión LTS
- **MySQL 8.0+**: https://dev.mysql.com/downloads/installer/
  - En el instalador elige "Developer Default" o al menos "MySQL Server + MySQL Workbench"
  - Guarda la contraseña de root que elijas — la necesitarás en el `.env`

Verifica:
```bash
node --version   # → v18.x.x o mayor
mysql --version  # → mysql  Ver 8.x.x
```

---

### 0.4 Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd JIPEM
```

---

### 0.5 Crear el entorno virtual con Python 3.10

```bash
cd backend

# Crear venv con Python 3.10 explícitamente
py -3.10 -m venv venv
```

> Si `py -3.10` no funciona, usa la ruta completa:
> ```bash
> "C:\Users\TU_USUARIO\AppData\Local\Programs\Python\Python310\python.exe" -m venv venv
> ```

Activa el venv:
```bash
# Windows (PowerShell o CMD)
venv\Scripts\activate
```

El prompt debería cambiar a `(venv)` al inicio.

**Verifica que el venv usa Python 3.10:**
```bash
python --version
# → Python 3.10.11
```

---

### 0.6 Instalar dependencias

Con el venv activado:

```bash
pip install -r requirements.txt
```

Esto instala Django, insightface, OpenCV, y todas las demás dependencias.

> **El primer `pip install` tarda 5–15 minutos** porque descarga paquetes grandes (insightface ~200 MB, opencv ~50 MB).
> Algunas librerías compilan código C++ — si ves mensajes de MSBuild o cl.exe es normal.

Si algún paquete falla con error de compilación, verifica que el paso 0.1 (VS Build Tools) se completó correctamente.

---

### 0.7 Primera vez que corra el servidor — descarga de modelos de IA

La primera vez que el servidor procese un video o reciba una captura facial, insightface descarga los modelos de reconocimiento facial (~270 MB) automáticamente:

```
Downloading buffalo_l.zip from github.com/deepinsight/insightface...
```

Esto solo ocurre una vez. Los modelos quedan en `C:\Users\TU_USUARIO\.insightface\models\buffalo_l\`.

Necesitas conexión a internet para esto. Las siguientes ejecuciones son inmediatas.

---

## 1. Base de datos — SQL inicial

Conéctate a MySQL como root y ejecuta:

```sql
CREATE DATABASE IF NOT EXISTS jipem_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Opcional: crear usuario específico para la app
CREATE USER IF NOT EXISTS 'jipem_user'@'localhost' IDENTIFIED BY 'jipem_pass_2026';
GRANT ALL PRIVILEGES ON jipem_db.* TO 'jipem_user'@'localhost';
FLUSH PRIVILEGES;

SHOW DATABASES LIKE 'jipem_db';
```

> Si usas `root` directamente pon `DATABASE_USER=root` / `DATABASE_PASSWORD=<tu_password>` en el `.env`.

---

## 2. Configurar el backend

### 2.1 Archivo `.env`

Crea el archivo `backend/.env`:

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

> Ajusta `DATABASE_USER` y `DATABASE_PASSWORD` según tu MySQL.

### 2.2 Aplicar migraciones

```bash
# Desde backend/ con el venv activo
python manage.py migrate
```

Salida esperada:
```
Applying users.0001_initial... OK
Applying classrooms.0001_initial... OK
Applying attendance.0001_initial... OK
Applying fatigue.0001_initial... OK
...
```

---

## 3. Crear usuarios de prueba

```bash
python manage.py shell
```

Pega y ejecuta dentro del shell:

```python
from apps.users.models import User

admin = User.objects.create_user(
    username='admin', password='Admin123!',
    name='Administrador General', role='admin',
)
admin.is_staff = True
admin.is_superuser = True
admin.save()
print(f"[OK] Admin: {admin.username}")

m1 = User.objects.create_user(
    username='prof.garcia', password='Maestro123!',
    name='Carlos García López', role='maestro',
)
print(f"[OK] Maestro: {m1.username}")

m2 = User.objects.create_user(
    username='prof.torres', password='Maestro123!',
    name='Ana Torres Ruiz', role='maestro',
)
print(f"[OK] Maestro: {m2.username}")

for u in User.objects.all().values('username', 'name', 'role'):
    print(f"  {u['username']:20} | {u['role']:8} | {u['name']}")
```

```python
exit()
```

### Credenciales

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin123!` | Administrador |
| `prof.garcia` | `Maestro123!` | Maestro |
| `prof.torres` | `Maestro123!` | Maestro |

---

## 4. Levantar el backend

```bash
# Desde backend/ con el venv activo
python manage.py runserver
```

Servidor en: **http://localhost:8000**

Prueba rápida:
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "Admin123!"}'
```

Respuesta esperada: JSON con `access`, `refresh` y datos del usuario.

---

## 5. Levantar el frontend

```bash
# Nueva terminal — desde JIPEM/frontend/
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm run dev
```

App en: **http://localhost:5173**

---

## 6. Verificación SQL

```sql
USE jipem_db;
SHOW TABLES;
SELECT id, username, name, role, is_active FROM users_user;
DESCRIBE classrooms_faceencoding;
DESCRIBE attendance_session;
```

---

## 7. Flujo completo de pruebas

### 7.1 Login y roles

1. Ir a `http://localhost:5173`
2. Login como `admin` / `Admin123!` → verificar sección "Administración" en sidebar
3. Logout → login como `prof.garcia` → verificar que no aparece "Administración"

### 7.2 Crear grupo y alumnos

> Sesión: `prof.garcia`

1. **Grupos → Nuevo grupo**: nombre `"Programación Avanzada"`, materia `"Estructura de Datos"`
2. Abrir el grupo → **Agregar alumno**
3. Crear al menos 2 alumnos:

| Nombre | Matrícula | Edad | Sexo |
|---|---|---|---|
| Juan Pérez Soto | 210001 | 20 | M |
| María López Reyes | 210002 | 21 | F |

### 7.3 Captura de muestras faciales

> Mínimo **5 muestras** por alumno. Requiere cámara web.

1. Detalle del alumno → **Capturar rostro**
2. Permitir acceso a cámara en el navegador
3. Clic en **Tomar muestra** al menos 5 veces — variar ligeramente la posición y luz
4. El indicador debe mostrar `5/5` o más
5. Repetir para cada alumno

> **Importante:** toma las muestras a la misma distancia y condiciones de luz que el video de asistencia. Si el video es de salón a 2 metros, toma las fotos también a 2 metros.

### 7.4 Sesión de asistencia

> Necesitas un video `.mp4` / `.avi` / `.mov` / `.mkv` de 30s–5min con los alumnos visibles.

1. **Asistencia → Nueva sesión** → seleccionar grupo y fecha
2. En el detalle → **Subir video**
3. Esperar procesamiento — la UI se actualiza cada 3s
4. Al completar, verificar registros (Presente / Ausente por alumno)

**Tiempos esperados de procesamiento:**

| Duración del video | Tiempo estimado |
|---|---|
| 30 segundos | ~1–2 minutos |
| 2 minutos | ~3–5 minutos |
| 5 minutos | ~8–12 minutos |

> El procesamiento corre en CPU. La primera sesión puede tardar más porque carga los modelos de IA en memoria.

### 7.5 Análisis de fatiga individual

1. **Análisis de Fatiga → Nuevo análisis**
2. Seleccionar alumno y fecha
3. Subir video del alumno (idealmente con momentos de ojos cerrados)
4. Verificar: puntuación de atención, fatiga y clasificación

| Situación en el video | Atención esperada | Clasificación |
|---|---|---|
| Ojos abiertos todo el tiempo | 70–100 | Atento |
| Parpadeo frecuente / distracciones | 40–69 | Distraído |
| Ojos cerrados varios segundos | 0–39 | Fatigado |

### 7.6 Panel de administración

> Sesión: `admin`

1. **Administración → Maestros** → crear nuevo maestro
2. Verificar que aparece en la lista
3. Desactivar un maestro (soft delete) → verificar que no puede iniciar sesión

### 7.7 Páginas informativas

1. **Cómo funciona** → leer explicación de PERCLOS
2. **Términos y condiciones** → revisar los artículos
3. `http://localhost:5173/tech-docs` → documentación técnica interna

---

## 8. Restablecer datos de prueba

Para limpiar sin borrar usuarios:

```sql
USE jipem_db;
DELETE FROM fatigue_individual_analysis;
DELETE FROM attendance_record;
DELETE FROM attendance_session;
DELETE FROM classrooms_faceencoding;
DELETE FROM classrooms_student;
DELETE FROM classrooms_classroom;
```

Para reiniciar todo desde cero:

```bash
mysql -u root -p -e "DROP DATABASE jipem_db; CREATE DATABASE jipem_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
python manage.py migrate
python manage.py shell  # → repetir script del paso 3
```

---

## 9. Referencia rápida de comandos

```bash
# ── Backend ────────────────────────────────────────────────────────────────
cd backend
venv\Scripts\activate            # activar entorno virtual (Windows)

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
mysql -u root -p                 # conectar
USE jipem_db;
SHOW TABLES;
```

---

## 10. Solución de problemas comunes

| Error | Causa probable | Solución |
|---|---|---|
| `No module named 'django'` | venv no activado o Python incorrecto | Ejecutar `venv\Scripts\activate` y verificar `python --version` → debe ser 3.10.x |
| `No module named 'insightface'` | Dependencias no instaladas en el venv | Activar venv y ejecutar `pip install -r requirements.txt` |
| `UndefinedValueError: SECRET not found` | Falta el archivo `.env` | Crear `backend/.env` según el paso 2.1 |
| `django.db.OperationalError: (1045)` | Credenciales MySQL incorrectas | Revisar `DATABASE_USER` y `DATABASE_PASSWORD` en `.env` |
| `Failed building wheel for insightface` | Python 3.11/3.12/3.13 en lugar de 3.10 | Recrear el venv con `py -3.10 -m venv venv` |
| `Unable to find a compatible Visual Studio` | VS Build Tools no instalado | Completar el paso 0.1 (VS Build Tools 2022) |
| `Downloading buffalo_l.zip...` al arrancar | Primera vez — descarga normal | Esperar la descarga (~270 MB), solo ocurre una vez |
| `Network Error` en el frontend | Backend no está corriendo | Levantar `python manage.py runserver` |
| `CORS error` en el navegador | Origen del frontend no permitido | Agregar `http://localhost:5173` a `CORS_ALLOWED_ORIGINS` en `.env` |
| Video procesado pero todos ausentes | Alumnos sin muestras faciales en formato nuevo | Borrar muestras antiguas desde SQL y re-registrar con la UI |
| Cámara no disponible en FaceCapture | Navegador sin permiso de cámara | Permitir cámara; en Chrome: `chrome://flags/#unsafely-treat-insecure-origin-as-secure` |

---

## 11. Notas técnicas del reconocimiento facial

El sistema usa **InsightFace buffalo_l** (ArcFace ResNet50):

- **Registro:** se toman muestras → insightface detecta y alinea el rostro → se extrae un embedding de 512 dimensiones → se guarda en la DB.
- **Reconocimiento en video:** se procesa 1 de cada 10 frames al 50% de escala → insightface detecta caras → se compara el embedding con los alumnos registrados usando similitud coseno → umbral 0.35 para marcar coincidencia.
- **Presencia:** un alumno se marca presente si aparece en ≥ 10% de los frames procesados.

**Factores que mejoran la precisión:**
- Registrar fotos a la misma distancia y luz que el video (ideal: desde el mismo ángulo de cámara).
- Mínimo 5 muestras, idealmente 8–10 con variaciones de posición.
- Videos con buena iluminación del rostro (evitar contraluz).

---

*Presentia · JIPEM · Universidad Tecnológica Emiliano Zapata · 8vo semestre 2026*
