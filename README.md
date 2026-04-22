# Presentia — JIPEM

Sistema de asistencia y análisis de fatiga basado en reconocimiento facial.  
UTEZ · Ingeniería en Tecnologías de la Información · 8vo semestre 2026.

---

## Requisitos del sistema

| Componente | Versión mínima |
|---|---|
| Python | 3.10 |
| Node.js | 18 |
| MySQL | 8.0 |
| Sistema operativo | Windows 10/11 o Ubuntu 22.04 |

---

## Instalación del backend

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd JIPEM/backend
```

### 2. Crear y activar el entorno virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python -m venv venv
source venv/bin/activate
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

> **Nota sobre InsightFace:** al ejecutar por primera vez, el sistema descargará automáticamente el modelo `buffalo_l` (~300 MB) desde el servidor de InsightFace. Se requiere conexión a internet.

### 4. Configurar variables de entorno

Crea un archivo `.env` en `backend/` con el siguiente contenido:

```env
SECRET_KEY=cambia-esta-clave-por-una-aleatoria-larga
DEBUG=True

DB_ENGINE=django.db.backends.mysql
DB_NAME=presentia_db
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_HOST=localhost
DB_PORT=3306

ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 5. Crear la base de datos en MySQL

```sql
CREATE DATABASE presentia_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6. Aplicar migraciones

```bash
python manage.py migrate
```

### 7. Poblar la base de datos con datos de prueba

```bash
python manage.py seed_db
```

Esto crea:
- **Admin:** `admin` / `Admin123!`
- **Maestro:** `prof_garcia` / `Prof123!`
- **Maestro:** `prof_lopez` / `Prof123!`
- 4 grupos con 5 alumnos cada uno

Para borrar los datos existentes y volver a sembrar:

```bash
python manage.py seed_db --flush
```

### 8. Iniciar el servidor de desarrollo

```bash
python manage.py runserver
```

El backend quedará disponible en `http://localhost:8000`.

---

## Instalación del frontend

### 1. Instalar dependencias

```bash
cd JIPEM/frontend
npm install
```

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

El frontend quedará disponible en `http://localhost:5173`.

---

## Estructura del proyecto

```
JIPEM/
├── backend/
│   ├── config/           # settings.py, urls.py
│   ├── apps/
│   │   ├── users/        # Autenticación JWT, gestión de maestros
│   │   ├── classrooms/   # Grupos, alumnos, captura de rostros
│   │   ├── attendance/   # Sesiones de asistencia por video
│   │   ├── fatigue/      # Análisis de fatiga individual
│   │   ├── reports/      # Reportes HTML
│   │   └── dashboards/   # Estadísticas
│   └── manage.py
└── frontend/
    └── src/
        ├── api/          # axios con interceptores JWT
        ├── context/      # AuthContext
        ├── components/   # Layout, PageHeader, StatusBadge
        └── pages/        # Todas las vistas de la app
```

---

## Tecnologías principales

- **Backend:** Django 5.2 + Django REST Framework + SimpleJWT
- **Reconocimiento facial:** InsightFace (modelo buffalo_l, ArcFace 512-d)
- **Análisis de fatiga:** PERCLOS con OpenCV Haarcascade
- **Base de datos:** MySQL 8
- **Frontend:** React 19 + Vite + Tailwind CSS
- **Logging:** loguru
