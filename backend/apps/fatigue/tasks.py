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
    """Re-use the InsightFace app from the attendance module (same process singleton)."""
    from apps.attendance.tasks import _get_face_app as _attendance_get_face_app
    return _attendance_get_face_app()


# ── Student embedding ───────────────────────────────────────────────────────
def _build_student_embedding(student):
    """
    Load all ArcFace encodings for this student and return a single
    mean L2-normalized 512-d reference vector. Returns None if no valid encodings.
    """
    encodings = list(student.face_encodings.all())
    if not encodings:
        return None

    vecs = []
    for fe in encodings:
        arr = np.load(io.BytesIO(bytes(fe.encoding_data)), allow_pickle=True)
        arr = arr.flatten().astype(np.float32)
        if arr.shape[0] != 512:
            logger.bind(pipeline=True).warning(
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
    logger.bind(pipeline=True).info(
        "Student {}: ArcFace reference built from {} samples.", student.id, len(vecs)
    )
    return result


# ── Face identification ─────────────────────────────────────────────────────
def _find_student_face(faces, student_embedding):
    """
    From the list of InsightFace-detected faces, return the one most likely
    to be the target student (highest cosine similarity >= COSINE_THRESHOLD).
    Returns the face object or None.
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
    Detect open eyes in the upper 60% of the face crop (BGR).

    Updates state dict:
      eye_detected_frames  — frames where >=1 eye was found
      no_eye_counter       — consecutive frames without eyes
      eyes_closed_secs     — accumulated closure seconds
      closure_episodes     — count of distinct sustained-closure events
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
    if attention_score >= 70:
        return 'atento'
    elif attention_score >= 40:
        return 'distraido'
    return 'fatigado'


# ── Main processing function ────────────────────────────────────────────────
def process_individual_fatigue(analysis_id: int, video_path: str) -> None:
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
        student_embedding = _build_student_embedding(student)

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
                target_face = max(
                    faces,
                    key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
                )
                log.warning("No ArcFace encodings — using dominant face as fallback.")

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
    thread = threading.Thread(
        target=process_individual_fatigue,
        args=(analysis_id, video_path),
        daemon=True,
    )
    thread.start()
