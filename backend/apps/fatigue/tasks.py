"""
Fatigue analysis — individual student video.

Identity pipeline: InsightFace ArcFace (same model as attendance).
PERCLOS pipeline:  OpenCV Haarcascade eye detector on the identified face crop.

Steps:
  1. Load student's 512-d ArcFace embeddings from DB (mean vector, L2-normalized).
  2. Read video every FRAMES_TO_SKIP frames at 0.5x scale.
  3. Run InsightFace on each frame to detect faces + get embeddings.
  4. Find the face whose cosine similarity with the student reference >= COSINE_THRESHOLD.
  5. Crop that face region -> run Haarcascade eye detector on upper 60% of face.
  6. Accumulate PERCLOS (Percentage of Eye Closure) statistics.
  7. Score:
       fatigue_score  = min(100, perclos * 200 + closure_episodes * 5)
       attention_score = 100 - fatigue_score
  8. Classify: atento (>=70), distraido (40-69), fatigado (<40).
  9. Store closure_episodes in yawn_count field (repurposed).
 10. Delete video.
"""

import io
import os
import threading

import cv2
import numpy as np
from loguru import logger

# ── Processing constants ────────────────────────────────────────────────────
FRAMES_TO_SKIP = 5
PRESENCE_THRESHOLD_PCT = 0.10
COSINE_THRESHOLD = 0.35
EYE_CLOSED_CONSEC_SECS = 0.5

# ── Eye cascade (loaded once at import) ────────────────────────────────────
_EYE_CASCADE = cv2.CascadeClassifier(
    os.path.join(cv2.data.haarcascades, 'haarcascade_eye.xml')
)


# ── InsightFace singleton (shared with attendance pipeline) ─────────────────
def _get_face_app():
    """
    Reutiliza la aplicación InsightFace del módulo de asistencia.

    Returns:
        FaceAnalysis: Instancia del singleton del modelo.
    """
    from apps.attendance.tasks import _get_face_app as _attendance_get_face_app
    return _attendance_get_face_app()


# ── Student embedding ───────────────────────────────────────────────────────
def _build_student_embedding(student, log):
    """
    Carga y promedia las codificaciones ArcFace de un estudiante.

    Genera un vector de referencia de 512-d normalizado (L2).

    Args:
        student (Student): Instancia del modelo Student.
        log (logger): Logger con contexto vinculado.

    Returns:
        np.array: Vector promedio de 512 dimensiones o None si no hay encodings.
    """
    encodings = list(student.face_encodings.all())
    if not encodings:
        return None

    vecs = []
    for fe in encodings:
        arr = np.load(io.BytesIO(bytes(fe.encoding_data)), allow_pickle=True)
        arr = arr.flatten().astype(np.float32)
        if arr.shape[0] != 512:
            log.warning(
                "Student {}: encoding shape={}, expected 512. Re-register face samples.",
                student.id, arr.shape[0],
            )
            continue
        norm = np.linalg.norm(arr)
        if norm > 1e-10:
            vecs.append(arr / norm)

    if not vecs:
        return None

    mean_vec = np.mean(vecs, axis=0)
    norm = np.linalg.norm(mean_vec)
    result = mean_vec / norm if norm > 1e-10 else mean_vec
    log.info(
        "Student {}: ArcFace reference built from {} samples.", student.id, len(vecs)
    )
    return result


# ── Face identification ─────────────────────────────────────────────────────
def _find_student_face(faces, student_embedding):
    """
    Identifica el rostro del estudiante objetivo entre múltiples detecciones.

    Args:
        faces (list): Detecciones de InsightFace en el frame actual.
        student_embedding (np.array): Vector de referencia del estudiante.

    Returns:
        Face: El objeto de rostro con mayor similitud de coseno, o None si 
            ninguno supera el COSINE_THRESHOLD.
    """
    best_face = None
    best_score = -1.0

    for face in faces:
        if face.det_score < 0.5:
            continue
        query = face.embedding.astype(np.float32)
        norm = np.linalg.norm(query)
        if norm < 1e-10:
            continue
        query = query / norm
        score = float(np.dot(query, student_embedding))
        if score > best_score:
            best_score = score
            best_face = face

    if best_score >= COSINE_THRESHOLD:
        return best_face
    return None


# ── Eye analysis ────────────────────────────────────────────────────────────
def _analyze_eyes(face_bgr, state, eye_closed_frames, fps):
    """
    Detecta ojos abiertos en la región superior del rostro detectado.

    Utiliza Haarcascade en el 60% superior del recorte del rostro para mejorar 
    la precisión y reducir falsos positivos.

    Args:
        face_bgr (np.array): Recorte (crop) del rostro en formato BGR.
        state (dict): Diccionario de estado acumulativo para la sesión.
        eye_closed_frames (int): Umbral de frames para considerar un cierre sostenido.
        fps (float): Cuadros por segundo del video original.

    Note:
        Actualiza los contadores de frames con ojos detectados, segundos de 
        cierre acumulados y episodios de micro-sueño.
    """
    gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    h = gray.shape[0]
    top = gray[:int(h * 0.6), :]
    if top.size == 0:
        return

    top_up = cv2.resize(top, (0, 0), fx=2.0, fy=2.0)
    eyes = _EYE_CASCADE.detectMultiScale(
        top_up, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15)
    )

    if len(eyes) == 0:
        state['no_eye_counter'] += 1
        if state['no_eye_counter'] >= eye_closed_frames:
            state['eyes_closed_secs'] += FRAMES_TO_SKIP / fps
            if state['no_eye_counter'] == eye_closed_frames:
                state['closure_episodes'] += 1
    else:
        state['eye_detected_frames'] += 1
        state['no_eye_counter'] = 0


# ── Score computation ───────────────────────────────────────────────────────
def _compute_scores(state, log):
    """
    Calcula los puntajes finales de fatiga y atención basados en PERCLOS.

    La fatiga se calcula como: min(100, perclos * 200 + episodios_cierre * 5).

    Args:
        state (dict): Diccionario con las estadísticas acumuladas del video.
        log (logger): Instancia de loguru.

    Returns:
        dict: Contiene scores de 'attention', 'fatigue', 'perclos' y estadísticas,
            o None si no se detectó el rostro en ningún frame.
    """
    face_frames = state['face_frames']
    if face_frames == 0:
        return None

    perclos = 1.0 - (state['eye_detected_frames'] / face_frames)
    fatigue = min(100.0, perclos * 200.0 + state['closure_episodes'] * 5.0)
    attention = max(0.0, 100.0 - fatigue)

    log.info(
        "PERCLOS={:.2f} eye_detected={}/{} closure_episodes={} "
        "eyes_closed_secs={:.1f} → fatigue={:.1f} attention={:.1f}",
        perclos, state['eye_detected_frames'], face_frames,
        state['closure_episodes'], state['eyes_closed_secs'],
        fatigue, attention,
    )
    return {
        'attention': attention,
        'fatigue': fatigue,
        'closure_episodes': state['closure_episodes'],
        'eyes_closed_secs': state['eyes_closed_secs'],
        'perclos': perclos,
    }


def _classify(attention_score: float) -> str:
    """
    Clasifica el nivel de atención en etiquetas legibles.

    Args:
        attention_score (float): Score de 0 a 100.

    Returns:
        str: 'atento' (>=70), 'distraido' (40-69) o 'fatigado' (<40).
    """
    if attention_score >= 70:
        return 'atento'
    elif attention_score >= 40:
        return 'distraido'
    return 'fatigado'


# ── Main processing function ────────────────────────────────────────────────
def process_individual_fatigue(analysis_id: int, video_path: str) -> None:
    """
    Orquestador principal del análisis de fatiga individual.

    Flujo:
    1. Actualiza estado a 'PROCESSING'.
    2. Procesa el video frame a frame identificando al estudiante.
    3. Analiza la región ocular en cada frame positivo.
    4. Calcula scores y clasifica el resultado final.
    5. Limpia archivos temporales y persiste en DB.

    Args:
        analysis_id (int): ID del registro IndividualFatigueAnalysis.
        video_path (str): Ruta al video temporal subido.

    Note:
        Se utiliza el campo 'yawn_count' para almacenar técnicamente los 
        'episodios de cierre' (micro-sueños), dada la reutilización del modelo.
    """
    from apps.fatigue.models import IndividualFatigueAnalysis

    log = logger.bind(pipeline=True, analysis_id=analysis_id)
    analysis = None
    try:
        analysis = IndividualFatigueAnalysis.objects.select_related(
            'student'
        ).prefetch_related('student__face_encodings').get(pk=analysis_id)
        analysis.status = IndividualFatigueAnalysis.STATUS_PROCESSING
        analysis.save(update_fields=['status'])
        log.info(
            "Fatigue processing started — student={}", analysis.student_id
        )

        student = analysis.student
        student_embedding = _build_student_embedding(student, log)
        if student_embedding is None:
            log.warning(
                "No ArcFace encodings for student {} — will use dominant face as fallback.",
                student.id,
            )

        face_app = _get_face_app()

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        eye_closed_frames = max(1, int(EYE_CLOSED_CONSEC_SECS * fps / FRAMES_TO_SKIP))
        log.debug("fps={:.1f} eye_closed_frames={}", fps, eye_closed_frames)

        state = {
            'face_frames': 0,
            'eye_detected_frames': 0,
            'no_eye_counter': 0,
            'eyes_closed_secs': 0.0,
            'closure_episodes': 0,
        }

        total_frames = 0
        processed_frames = 0

        while True:
            ret, frame = cap.read()
            if not ret:
                break
            total_frames += 1
            if total_frames % FRAMES_TO_SKIP != 0:
                continue
            processed_frames += 1

            small = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            faces = face_app.get(small)
            if not faces:
                state['no_eye_counter'] = 0
                continue

            if student_embedding is not None:
                target_face = _find_student_face(faces, student_embedding)
            else:
                # No encodings — use largest detected face as fallback
                target_face = max(
                    faces,
                    key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                )

            if target_face is None:
                state['no_eye_counter'] = 0
                continue

            x1, y1, x2, y2 = [int(v) for v in target_face.bbox]
            h_s, w_s = small.shape[:2]
            x1 = max(0, x1); y1 = max(0, y1)
            x2 = min(w_s, x2); y2 = min(h_s, y2)

            face_crop = small[y1:y2, x1:x2]
            if face_crop.size == 0:
                continue

            state['face_frames'] += 1
            _analyze_eyes(face_crop, state, eye_closed_frames, fps)

        cap.release()
        log.info(
            "{} frames processed (of {}) — face detected in {} frames.",
            processed_frames, total_frames, state['face_frames'],
        )

        if processed_frames > 0 and (state['face_frames'] / processed_frames) >= PRESENCE_THRESHOLD_PCT:
            scores = _compute_scores(state, log)
            if scores:
                analysis.attention_score = round(scores['attention'], 2)
                analysis.fatigue_score = round(scores['fatigue'], 2)
                analysis.yawn_count = scores['closure_episodes']
                analysis.eyes_closed_secs = round(scores['eyes_closed_secs'], 2)
                analysis.result_label = _classify(scores['attention'])
                log.info(
                    "Result: label={} attention={:.1f} fatigue={:.1f}",
                    analysis.result_label, analysis.attention_score, analysis.fatigue_score,
                )
            else:
                analysis.result_label = ''
        else:
            log.warning(
                "Face below presence threshold ({}/{} frames).",
                state['face_frames'], processed_frames,
            )
            analysis.result_label = ''

        analysis.status = IndividualFatigueAnalysis.STATUS_COMPLETED
        analysis.save(update_fields=[
            'status', 'attention_score', 'fatigue_score',
            'yawn_count', 'eyes_closed_secs', 'result_label',
        ])

    except Exception as exc:
        log.exception("Error processing fatigue analysis.")
        if analysis:
            analysis.status = IndividualFatigueAnalysis.STATUS_ERROR
            analysis.error_message = str(exc)
            analysis.save(update_fields=['status', 'error_message'])
    finally:
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
                log.debug("Deleted video: {}", video_path)
            except Exception as e:
                log.warning("Could not delete video {}: {}", video_path, e)


def start_individual_fatigue_processing(analysis_id: int, video_path: str) -> None:
    """
    Inicia el procesamiento de fatiga en un hilo de ejecución separado (daemon).

    Args:
        analysis_id (int): ID del análisis para seguimiento.
        video_path (str): Ruta del archivo de video.
    """
    thread = threading.Thread(
        target=process_individual_fatigue,
        args=(analysis_id, video_path),
        daemon=True,
    )
    thread.start()
