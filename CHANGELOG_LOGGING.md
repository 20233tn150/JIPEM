# Logging con Loguru — Implementación

**Fecha:** 2026-04-14  
**Versión:** 1.0.0

---

## Qué se implementó

Se reemplazó el sistema de logging estándar de Python (`import logging`) con **loguru**,
integrando tres sinks diferenciados y cobertura completa de niveles para todas las apps del backend.

### Módulo central

`backend/config/logging_setup.py` contiene:
- La función `setup_logging()` que configura los tres sinks
- `InterceptHandler`: captura todo el `logging` estándar de Django, DRF y dependencias y lo
  redirige a loguru, sin perder ningún mensaje interno del framework

---

## Dónde se guardan los logs

### Consola (stderr)
Siempre activa. Formato coloreado con timestamp completo, nivel, módulo, función y línea.

### `backend/logs/app.log`
- Eventos de negocio generales: usuarios, aulas, solicitudes HTTP, errores de vistas
- **Nivel mínimo:** INFO
- **Rotación:** al alcanzar 10 MB se crea un nuevo archivo
- **Retención:** archivos de más de 7 días se eliminan automáticamente
- **Compresión:** los archivos rotados se comprimen en `.zip`
- **Formato:** JSON estructurado (una línea por evento)
- **Excluye:** logs de las pipelines CV

### `backend/logs/cv_pipeline.log`
- Exclusivo para el procesamiento de video: asistencia y análisis de fatiga
- **Nivel mínimo:** DEBUG (incluye scores coseno frame a frame en modo desarrollo)
- **Rotación:** al alcanzar 20 MB
- **Retención:** archivos de más de 14 días se eliminan automáticamente
- **Compresión:** `.zip`
- **Formato:** JSON estructurado
- **Incluye solo:** mensajes con `pipeline=True` en el contexto (binding de loguru)

---

## Niveles de log y cuándo se usan

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| `DEBUG` | Detalle técnico interno, solo útil en desarrollo | Score coseno por cada rostro detectado en un frame |
| `INFO` | Eventos de negocio importantes, flujo normal | Sesión completada, modelo InsightFace cargado, estudiante PRESENTE/AUSENTE |
| `WARNING` | Situación recuperable, resultado degradado posible | Sin embeddings registrados, rostro con baja confianza, video sin cara del estudiante |
| `ERROR` | Excepción capturada, operación fallida | Sesión marcada como error, video no se pudo abrir |
| `CRITICAL` | Fallo fatal, el servicio no puede funcionar | InsightFace no carga (modelo corrupto o dependencia faltante) |

---

## Cómo cambiar el nivel de log

Editar `backend/.env`:

```ini
# Desarrollo (ver todo, incluyendo scores frame a frame)
LOG_LEVEL=DEBUG

# Producción (solo eventos de negocio y errores)
LOG_LEVEL=INFO
```

El cambio aplica en el siguiente reinicio del servidor.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `backend/requirements.txt` | `loguru==0.7.3` añadido |
| `backend/config/logging_setup.py` | NUEVO — configuración central con 3 sinks e InterceptHandler |
| `backend/config/settings.py` | `LOGGING_CONFIG = None` — Django no configura logging |
| `backend/manage.py` | Llama `setup_logging()` al arrancar (antes de Django) |
| `backend/config/wsgi.py` | Llama `setup_logging()` en producción WSGI |
| `backend/config/asgi.py` | Llama `setup_logging()` en producción ASGI |
| `backend/apps/attendance/tasks.py` | loguru + `logger.bind(pipeline=True, session_id=X)` |
| `backend/apps/fatigue/tasks.py` | loguru + `logger.bind(pipeline=True, analysis_id=X)` |
| `backend/apps/classrooms/views.py` | `from loguru import logger` |
| `backend/apps/fatigue/views.py` | `from loguru import logger` |
| `backend/.env.example` | `LOG_LEVEL=DEBUG` añadido |
| `.gitignore` | `backend/logs/*.log`, `*.zip`, `*.gz` ignorados |

---

## Ejemplo de salida en consola (dev, LOG_LEVEL=DEBUG)

```
2026-04-14 10:32:09.001 | INFO     | config.logging_setup:setup_logging:99 | Logging configured — level=DEBUG logs_dir=...
2026-04-14 10:32:11.042 | INFO     | apps.attendance.tasks:_get_face_app:50 | InsightFace buffalo_l loaded (detection+recognition only).
2026-04-14 10:32:11.100 | INFO     | apps.attendance.tasks:_build_recognizer:94 | ArcFace embeddings ready: 28 students.
2026-04-14 10:32:11.210 | INFO     | apps.attendance.tasks:process_attendance_video:153 | Attendance processing started — classroom=3
2026-04-14 10:32:11.800 | DEBUG    | apps.attendance.tasks:_recognize_faces_in_frame:133 | best=7 score=0.4821 threshold=0.35 det=0.94 all={7: 0.4821, 12: 0.1203}
2026-04-14 10:32:14.107 | INFO     | apps.attendance.tasks:process_attendance_video:183 | 96 frames processed (of 960) — detections={7: 45, 12: 38}
2026-04-14 10:32:14.201 | INFO     | apps.attendance.tasks:_finalize_session:226 | Student 7 — presence=46.9% → PRESENTE
2026-04-14 10:32:14.205 | INFO     | apps.attendance.tasks:_finalize_session:226 | Student 12 — presence=39.6% → PRESENTE
2026-04-14 10:32:14.890 | WARNING  | apps.attendance.tasks:_build_recognizer:74 | Student 15: encoding shape=256, expected 512. Re-register face samples.
2026-04-14 10:32:15.001 | INFO     | apps.attendance.tasks:_finalize_session:237 | Session completed — 28 records saved.
```

## Ejemplo de salida en consola (prod, LOG_LEVEL=INFO)

Los mensajes `DEBUG` (scores por frame) no aparecen. Solo INFO, WARNING, ERROR, CRITICAL.
