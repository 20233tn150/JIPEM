"""
Fatigue analysis — individual student video.

Metric: PERCLOS (Percentage of Eye Closure)
  Gold-standard indicator for drowsiness used in automotive safety research.

Pipeline:
  1. Load student face encodings and train LBPH recognizer.
  2. Read video frame by frame (1 of every FRAMES_TO_SKIP).
  3. Detect and identify the student's face using Haarcascade + LBPH.
  4. For each detected face analyze the upper 60% (eye zone):
       - If haarcascade_eye detects open eyes → eye_detected_frames++
       - If no eyes detected for EYE_CLOSED_CONSEC_FRAMES consecutive frames
         → accumulate eyes_closed_secs and count closure_episodes
  5. Compute PERCLOS = 1 - (eye_detected_frames / face_frames)
  6. Scoring:
       fatigue_score = min(100, perclos * 200 + closure_episodes * 5)
       attention_score = 100 - fatigue_score
  7. Classify: atento (≥70), distraido (40–69), fatigado (<40).
  8. Store closure_episodes in yawn_count field (repurposed).
  9. Delete video.
"""

import io
import os
import logging
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# ── Processing constants ────────────────────────────────────────────────────
FRAMES_TO_SKIP = 5
FACE_SIZE = (128, 128)
LBPH_CONFIDENCE_THRESHOLD = 100
PRESENCE_THRESHOLD_PCT = 0.10

# Seconds of consecutive no-eye-detection to count as a closure episode
EYE_CLOSED_CONSEC_SECS = 0.5

# ── Cascades (loaded once at import) ───────────────────────────────────────
_CASCADE_PATH = cv2.data.haarcascades
_FACE_CASCADE = cv2.CascadeClassifier(
    os.path.join(_CASCADE_PATH, 'haarcascade_frontalface_default.xml')
)
_EYE_CASCADE = cv2.CascadeClassifier(
    os.path.join(_CASCADE_PATH, 'haarcascade_eye.xml')
)


def _classify(attention_score: float) -> str:
    if attention_score >= 70:
        return 'atento'
    elif attention_score >= 40:
        return 'distraido'
    return 'fatigado'


def _build_student_recognizer(encodings):
    """Train LBPH recognizer from numpy-saved face samples. Returns recognizer or None."""
    if not encodings:
        return None
    face_images = [np.load(io.BytesIO(bytes(fe.encoding_data))) for fe in encodings]
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.train(face_images, np.zeros(len(face_images), dtype=np.int32))
    return recognizer


def _select_best_face(faces, gray_eq, recognizer):
    """Return the face most likely to belong to the student (lowest LBPH confidence)."""
    if recognizer is None:
        return max(faces, key=lambda f: f[2] * f[3])

    best_face, best_conf = None, float('inf')
    for (x, y, w, h) in faces:
        pad = int(0.1 * min(w, h))
        x1, y1 = max(0, x - pad), max(0, y - pad)
        x2, y2 = min(gray_eq.shape[1], x + w + pad), min(gray_eq.shape[0], y + h + pad)
        face_crop = gray_eq[y1:y2, x1:x2]
        if face_crop.size == 0:
            continue
        try:
            _, confidence = recognizer.predict(cv2.resize(face_crop, FACE_SIZE))
            if confidence < LBPH_CONFIDENCE_THRESHOLD and confidence < best_conf:
                best_conf = confidence
                best_face = (x, y, w, h)
        except Exception:
            continue
    return best_face


def _analyze_eyes(face_crop, state, eye_closed_frames, fps):
    """
    Detect open eyes in the upper 60% of the face.

    Updates:
      - eye_detected_frames: count of frames where eyes were found
      - no_eye_counter: consecutive frames without eyes
      - eyes_closed_secs: accumulated seconds with eyes closed
      - closure_episodes: count of distinct sustained-closure events
    """
    top = face_crop[:int(face_crop.shape[0] * 0.6), :]
    if top.size == 0:
        return
    top_resized = cv2.resize(top, (0, 0), fx=2.0, fy=2.0)
    eyes = _EYE_CASCADE.detectMultiScale(
        top_resized, scaleFactor=1.1, minNeighbors=3, minSize=(15, 15)
    )

    if len(eyes) == 0:
        state['no_eye_counter'] += 1
        if state['no_eye_counter'] >= eye_closed_frames:
            state['eyes_closed_secs'] += FRAMES_TO_SKIP / fps
            # Count each distinct episode only when the threshold is first crossed
            if state['no_eye_counter'] == eye_closed_frames:
                state['closure_episodes'] += 1
    else:
        state['eye_detected_frames'] += 1
        state['no_eye_counter'] = 0


def _process_single_frame(gray_eq, state, recognizer, use_recognition, eye_closed_frames, fps):
    """Detect the student's face and run eye analysis."""
    faces = _FACE_CASCADE.detectMultiScale(
        gray_eq, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
    )
    if len(faces) == 0:
        state['no_eye_counter'] = 0
        return

    best_face = _select_best_face(faces, gray_eq, recognizer if use_recognition else None)
    if best_face is None:
        state['no_eye_counter'] = 0
        return

    (x, y, w, h) = best_face
    pad = int(0.1 * min(w, h))
    x1, y1 = max(0, x - pad), max(0, y - pad)
    x2, y2 = min(gray_eq.shape[1], x + w + pad), min(gray_eq.shape[0], y + h + pad)
    face_crop = gray_eq[y1:y2, x1:x2]
    if face_crop.size == 0:
        return

    state['face_frames'] += 1
    _analyze_eyes(face_crop, state, eye_closed_frames, fps)


def _run_video_loop(cap, fps, recognizer, use_recognition, state, eye_closed_frames):
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
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray_eq = cv2.equalizeHist(gray)
        _process_single_frame(gray_eq, state, recognizer, use_recognition, eye_closed_frames, fps)
    return processed_frames


def _compute_scores(state):
    """
    PERCLOS-based scoring.

    PERCLOS = fraction of face-visible frames where eyes were NOT detected.
    Research thresholds (adapted for classroom context):
      < 0.15  → alert        (attention 70-100)
      0.15-0.35 → drowsy     (attention 40-69)
      > 0.35  → very drowsy  (attention < 40)

    Formula:
      fatigue = min(100, perclos * 200 + closure_episodes * 5)
      attention = 100 - fatigue
    """
    face_frames = state['face_frames']
    if face_frames == 0:
        return None

    perclos = 1.0 - (state['eye_detected_frames'] / face_frames)
    fatigue = min(100.0, perclos * 200.0 + state['closure_episodes'] * 5.0)
    attention = max(0.0, 100.0 - fatigue)

    logger.info(
        f"PERCLOS={perclos:.2f}  eye_detected={state['eye_detected_frames']}"
        f"/{face_frames}  closure_episodes={state['closure_episodes']}"
        f"  eyes_closed_secs={state['eyes_closed_secs']:.1f}"
        f"  → fatigue={fatigue:.1f}  attention={attention:.1f}"
    )
    return {
        'attention': attention,
        'fatigue': fatigue,
        'closure_episodes': state['closure_episodes'],
        'eyes_closed_secs': state['eyes_closed_secs'],
        'perclos': perclos,
    }


def process_individual_fatigue(analysis_id: int, video_path: str) -> None:
    from apps.fatigue.models import IndividualFatigueAnalysis
    from apps.classrooms.models import FaceEncoding

    analysis = None
    try:
        analysis = IndividualFatigueAnalysis.objects.select_related('student').get(pk=analysis_id)
        analysis.status = IndividualFatigueAnalysis.STATUS_PROCESSING
        analysis.save(update_fields=['status'])

        student = analysis.student
        encodings = list(FaceEncoding.objects.filter(student=student))
        recognizer = _build_student_recognizer(encodings)
        use_recognition = recognizer is not None

        if use_recognition:
            logger.info(f"Fatigue {analysis_id}: LBPH trained with {len(encodings)} samples.")
        else:
            logger.warning(f"Fatigue {analysis_id}: no encodings — using dominant face.")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        eye_closed_frames = max(1, int(EYE_CLOSED_CONSEC_SECS * fps / FRAMES_TO_SKIP))

        state = {
            'face_frames': 0,
            'eye_detected_frames': 0,
            'no_eye_counter': 0,
            'eyes_closed_secs': 0.0,
            'closure_episodes': 0,
        }

        processed_frames = _run_video_loop(cap, fps, recognizer, use_recognition, state, eye_closed_frames)
        cap.release()

        face_frames = state['face_frames']
        logger.info(f"Fatigue {analysis_id}: {processed_frames} frames processed, face in {face_frames}.")

        if processed_frames > 0 and (face_frames / processed_frames) >= PRESENCE_THRESHOLD_PCT:
            scores = _compute_scores(state)
            analysis.attention_score = round(scores['attention'], 2)
            analysis.fatigue_score = round(scores['fatigue'], 2)
            analysis.yawn_count = scores['closure_episodes']   # repurposed field
            analysis.eyes_closed_secs = round(scores['eyes_closed_secs'], 2)
            analysis.result_label = _classify(scores['attention'])
        else:
            logger.warning(f"Fatigue {analysis_id}: face below presence threshold.")
            analysis.result_label = ''

        analysis.status = IndividualFatigueAnalysis.STATUS_COMPLETED
        analysis.save(update_fields=[
            'status', 'attention_score', 'fatigue_score',
            'yawn_count', 'eyes_closed_secs', 'result_label',
        ])

    except Exception as exc:
        logger.exception(f"Error processing fatigue {analysis_id}: {exc}")
        if analysis:
            analysis.status = IndividualFatigueAnalysis.STATUS_ERROR
            analysis.error_message = str(exc)
            analysis.save(update_fields=['status', 'error_message'])
    finally:
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
            except Exception as e:
                logger.warning(f"Could not delete video {video_path}: {e}")


def start_individual_fatigue_processing(analysis_id: int, video_path: str) -> None:
    thread = threading.Thread(
        target=process_individual_fatigue,
        args=(analysis_id, video_path),
        daemon=True,
    )
    thread.start()
