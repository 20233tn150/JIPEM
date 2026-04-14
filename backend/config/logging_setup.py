"""
Configuración central de loguru para JIPEM.

Sinks:
  - Consola (stderr): nivel LOG_LEVEL, coloreado, formato legible
  - logs/app.log: INFO+, JSON, rotación 10 MB, retención 7 días (no pipeline)
  - logs/cv_pipeline.log: DEBUG+, JSON, rotación 20 MB, retención 14 días (solo pipeline)

Uso de niveles:
  DEBUG    — detalle frame a frame, scores coseno individuales (solo dev)
  INFO     — eventos de negocio: sesión iniciada/completada, modelos cargados
  WARNING  — situaciones recuperables: sin embeddings, umbral no alcanzado
  ERROR    — excepciones capturadas, sesión marcada como error
  CRITICAL — fallo fatal al cargar modelo InsightFace
"""

import logging
import sys
from pathlib import Path

from decouple import config
from loguru import logger

LOG_LEVEL: str = config('LOG_LEVEL', default='INFO').upper()
LOGS_DIR: Path = Path(__file__).resolve().parent.parent / 'logs'

CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
    "{message}"
)

FILE_FORMAT = (
    "{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | "
    "{name}:{function}:{line} | {message}"
)


class InterceptHandler(logging.Handler):
    """Redirige stdlib logging → loguru preservando módulo y línea originales."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


def setup_logging() -> None:
    """Inicializa loguru con los tres sinks e instala InterceptHandler en stdlib."""
    LOGS_DIR.mkdir(exist_ok=True)

    # Eliminar el sink por defecto de loguru (stderr sin formato)
    logger.remove()

    # ── Sink 1: Consola ──────────────────────────────────────────────────────
    logger.add(
        sys.stderr,
        level=LOG_LEVEL,
        format=CONSOLE_FORMAT,
        colorize=True,
    )

    # ── Sink 2: app.log — INFO+, todo excepto pipeline ───────────────────────
    logger.add(
        LOGS_DIR / 'app.log',
        level='INFO',
        format=FILE_FORMAT,
        rotation='10 MB',
        retention='7 days',
        compression='zip',
        serialize=True,
        encoding='utf-8',
        filter=lambda record: not record['extra'].get('pipeline', False),
    )

    # ── Sink 3: cv_pipeline.log — DEBUG+, solo pipeline=True ─────────────────
    logger.add(
        LOGS_DIR / 'cv_pipeline.log',
        level='DEBUG',
        format=FILE_FORMAT,
        rotation='20 MB',
        retention='14 days',
        compression='zip',
        serialize=True,
        encoding='utf-8',
        filter=lambda record: bool(record['extra'].get('pipeline', False)),
    )

    # ── Redirigir stdlib logging → loguru ────────────────────────────────────
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

    logger.info(
        "Logging configured — level={} logs_dir={}",
        LOG_LEVEL, LOGS_DIR,
    )
