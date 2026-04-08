"""
Attendance processing — InsightFace (ArcFace) pipeline.

Pipeline:
  1. Load stored 512-d ArcFace embeddings from DB and compute mean per student.
  2. Read video frame by frame (every FRAMES_TO_SKIP frames).
  3. Run InsightFace FaceAnalysis on each frame:
       - SCRFD face detector (handles small/distant faces better than Haarcascade)
       - ArcFace embedding (512-d, L2-normalized, robust to lighting/distance)
  4. For each detected face, compute cosine similarity against all student embeddings.
  5. Assign face to the student with the highest similarity above COSINE_THRESHOLD.
  6. Mark student present if detected in ≥ PRESENCE_THRESHOLD_PCT of processed frames.
"""

import io
import os
import logging
import threading

import cv2
import numpy as np

logger = logging.getLogger(__name__)

PRESENCE_THRESHOLD_PCT = 0.10
# Process 1 of every N frames. At 30fps a 32s video → 96 processed frames.
# Enough coverage while cutting processing time ~3x vs FRAMES_TO_SKIP=3.
FRAMES_TO_SKIP = 10

# ArcFace cosine similarity threshold.
# Embeddings are L2-normalized so dot product = cosine similarity.
# buffalo_l ArcFace: same person typically > 0.35, different person typically < 0.25.
# Raise if false positives, lower if missing present students.
COSINE_THRESHOLD = 0.35

_face_app = None
_face_app_lock = threading.Lock()


def _get_face_app():
    """Lazy-initialize InsightFace FaceAnalysis (thread-safe singleton).

    allowed_modules=['detection', 'recognition'] skips three unused models:
      - landmark_2d_106 (2d106det.onnx)
      - landmark_3d_68  (1k3d68.onnx)
      - genderage       (genderage.onnx)
    This cuts per-frame inference from ~5 model passes to 2, roughly 3–4× faster.
    det_size=(320, 320): smaller internal detection grid, faster for video frames.
    """
    global _face_app
    if _face_app is None:
        with _face_app_lock:
            if _face_app is None:
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(
                    name='buffalo_l',
                    allowed_modules=['detection', 'recognition'],
                    providers=['CPUExecutionProvider'],
                )
                app.prepare(ctx_id=-1, det_size=(320, 320))
                _face_app = app
                logger.info("InsightFace buffalo_l loaded (detection+recognition only).")
    return _face_app


def _build_recognizer(students):
    """
    Load ArcFace embeddings from DB and compute one mean embedding per student.

    Uses mean embedding so outlier registration samples don't dominate.
    All vectors are L2-normalized so dot product = cosine similarity.

    Returns: {student_id: mean_normalized_embedding (512-d float32)}  or  {}
    """
    student_embeddings = {}

    for student in students:
        encodings = list(student.face_encodings.all())
        if not encodings:
            continue
        vecs = []
        for fe in encodings:
            arr = np.load(io.BytesIO(bytes(fe.encoding_data)), allow_pickle=True)
            arr = arr.flatten().astype(np.float32)
            if arr.shape[0] != 512:
                logger.warning(
                    f"Student {student.id}: encoding shape={arr.shape[0]}, "
                    "expected 512. Re-register this student's face samples."
                )
                continue
            norm = np.linalg.norm(arr)
            if norm > 1e-10:
                vecs.append(arr / norm)

        if vecs:
            mean_vec = np.mean(vecs, axis=0)
            norm = np.linalg.norm(mean_vec)
            student_embeddings[student.id] = mean_vec / norm if norm > 1e-10 else mean_vec

    if not student_embeddings:
        logger.warning("No valid ArcFace embeddings found — students need to re-register.")
        return {}

    logger.info(f"ArcFace embeddings ready: {len(student_embeddings)} students.")
    return student_embeddings


def _recognize_faces_in_frame(faces, session_id, student_embeddings, frame_count_map):
    """
    Match each InsightFace-detected face against student embeddings.

    Each face in the frame is assigned to at most one student (seen_in_frame
    prevents double-counting). Low-confidence detections are skipped.
    """
    seen_in_frame = set()

    for face in faces:
        if face.det_score < 0.5:
            continue

        query = face.embedding.astype(np.float32)
        norm = np.linalg.norm(query)
        if norm < 1e-10:
            continue
        query = query / norm

        best_sid = None
        best_score = -1.0
        scores = {}

        for sid, ref_embedding in student_embeddings.items():
            if sid in seen_in_frame:
                continue
            score = float(np.dot(query, ref_embedding))
            scores[sid] = round(score, 4)
            if score > best_score:
                best_score = score
                best_sid = sid

        logger.info(
            f"Session {session_id}: best={best_sid} score={best_score:.4f} "
            f"threshold={COSINE_THRESHOLD} det={face.det_score:.2f} all={scores}"
        )

        if best_sid is not None and best_score >= COSINE_THRESHOLD:
            frame_count_map[best_sid] = frame_count_map.get(best_sid, 0) + 1
            seen_in_frame.add(best_sid)


def process_attendance_video(session_id: int, video_path: str) -> None:
    from apps.attendance.models import AttendanceSession
    from apps.classrooms.models import Student

    session = None
    try:
        session = AttendanceSession.objects.get(pk=session_id)
        session.status = AttendanceSession.STATUS_PROCESSING
        session.save(update_fields=['status'])

        classroom = session.classroom
        students = list(Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings'))

        face_app = _get_face_app()
        student_embeddings = _build_recognizer(students)

        if not student_embeddings:
            logger.warning(f"Session {session_id}: No embeddings — marking all absent.")
            _finalize_session(session, students, {})
            return

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Cannot open video: {video_path}")

        frame_count_map = {}
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
            # 0.5x reduces pixel count 4× while keeping faces at classroom
            # distance visible with det_size=(320, 320).
            small = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            faces = face_app.get(small)
            if faces:
                _recognize_faces_in_frame(faces, session_id, student_embeddings, frame_count_map)

        cap.release()
        logger.info(
            f"Session {session_id}: {processed_frames} frames processed, "
            f"detections={frame_count_map}"
        )

        presence_map = {}
        if processed_frames > 0:
            for sid, count in frame_count_map.items():
                presence_map[sid] = count / processed_frames

        _finalize_session(session, students, presence_map)

    except Exception as exc:
        logger.exception(f"Error processing session {session_id}: {exc}")
        if session:
            session.status = AttendanceSession.STATUS_ERROR
            session.error_message = str(exc)
            session.save(update_fields=['status', 'error_message'])
    finally:
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
                logger.info(f"Deleted video: {video_path}")
            except Exception as e:
                logger.warning(f"Could not delete video {video_path}: {e}")


def _finalize_session(session, students, presence_map):
    from apps.attendance.models import AttendanceRecord

    records = []
    for student in students:
        pct = presence_map.get(student.id, 0.0)
        is_present = pct >= PRESENCE_THRESHOLD_PCT
        logger.info(
            f"Session {session.id}: student {student.id} — "
            f"presence={pct:.1%} → {'PRESENTE' if is_present else 'AUSENTE'}"
        )
        records.append(AttendanceRecord(
            session=session,
            student=student,
            minutes_present=int(pct * 100),
            is_present=is_present,
        ))

    AttendanceRecord.objects.bulk_create(records, ignore_conflicts=True)
    session.status = session.STATUS_COMPLETED
    session.save(update_fields=['status'])


def start_attendance_processing(session_id: int, video_path: str) -> None:
    thread = threading.Thread(
        target=process_attendance_video,
        args=(session_id, video_path),
        daemon=True,
    )
    thread.start()
