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
  6. Mark student present if detected in >= PRESENCE_THRESHOLD_PCT of processed frames.
"""

import io
import os
import threading

import cv2
import numpy as np
from loguru import logger

PRESENCE_THRESHOLD_PCT = 0.10
# Process 1 of every N frames. At 30fps a 32s video -> 96 processed frames.
FRAMES_TO_SKIP = 10

# ArcFace cosine similarity threshold.
# buffalo_l ArcFace: same person typically > 0.35, different person typically < 0.25.
COSINE_THRESHOLD = 0.35

_face_app = None
_face_app_lock = threading.Lock()


def _get_face_app():
    """Lazy-initialize InsightFace FaceAnalysis (thread-safe singleton)."""
    global _face_app
    if _face_app is None:
        with _face_app_lock:
            if _face_app is None:
                try:
                    from insightface.app import FaceAnalysis
                    app = FaceAnalysis(
                        name='buffalo_l',
                        allowed_modules=['detection', 'recognition'],
                        providers=['CPUExecutionProvider'],
                    )
                    app.prepare(ctx_id=-1, det_size=(320, 320))
                    _face_app = app
                    logger.bind(pipeline=True).info("InsightFace buffalo_l loaded (detection+recognition only).")
                except Exception as exc:
                    logger.bind(pipeline=True).critical("Failed to load InsightFace model: {}", exc)
                    raise
    return _face_app


def _build_recognizer(students):
    """
    Load ArcFace embeddings from DB and compute one mean embedding per student.

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
                logger.bind(pipeline=True).warning(
                    "Student {}: encoding shape={}, expected 512. Re-register face samples.",
                    student.id, arr.shape[0],
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
        logger.bind(pipeline=True).warning(
            "No valid ArcFace embeddings found — students need to re-register."
        )
        return {}

    logger.bind(pipeline=True).info(
        "ArcFace embeddings ready: {} students.", len(student_embeddings)
    )
    return student_embeddings


def _recognize_faces_in_frame(faces, session_id, student_embeddings, frame_count_map):
    """
    Match each InsightFace-detected face against student embeddings.

    Each face in the frame is assigned to at most one student (seen_in_frame
    prevents double-counting). Low-confidence detections are skipped.
    """
    seen_in_frame = set()
    log = logger.bind(pipeline=True, session_id=session_id)

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

        log.debug(
            "best={} score={:.4f} threshold={} det={:.2f} all={}",
            best_sid, best_score, COSINE_THRESHOLD, face.det_score, scores,
        )

        if best_sid is not None and best_score >= COSINE_THRESHOLD:
            frame_count_map[best_sid] = frame_count_map.get(best_sid, 0) + 1
            seen_in_frame.add(best_sid)


def process_attendance_video(session_id: int, video_path: str) -> None:
    from apps.attendance.models import AttendanceSession
    from apps.classrooms.models import Student

    log = logger.bind(pipeline=True, session_id=session_id)
    session = None
    try:
        session = AttendanceSession.objects.get(pk=session_id)
        session.status = AttendanceSession.STATUS_PROCESSING
        session.save(update_fields=['status'])
        log.info("Attendance processing started — classroom={}", session.classroom_id)

        classroom = session.classroom
        students = list(Student.objects.filter(
            classroom=classroom, is_active=True
        ).prefetch_related('face_encodings'))

        face_app = _get_face_app()
        student_embeddings = _build_recognizer(students)

        if not student_embeddings:
            log.warning("No embeddings — marking all {} students absent.", len(students))
            _finalize_session(session, students, {}, log)
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
            # 0.5x reduces pixel count 4x while keeping faces at classroom
            # distance visible with det_size=(320, 320).
            small = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
            faces = face_app.get(small)
            if faces:
                _recognize_faces_in_frame(faces, session_id, student_embeddings, frame_count_map)

        cap.release()
        log.info(
            "{} frames processed (of {}) — detections={}",
            processed_frames, total_frames, frame_count_map,
        )

        presence_map = {}
        if processed_frames > 0:
            for sid, count in frame_count_map.items():
                presence_map[sid] = count / processed_frames

        _finalize_session(session, students, presence_map, log)

    except Exception as exc:
        log.exception("Error processing session.")
        if session:
            session.status = AttendanceSession.STATUS_ERROR
            session.error_message = str(exc)
            session.save(update_fields=['status', 'error_message'])
    finally:
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
                log.debug("Deleted video: {}", video_path)
            except Exception as e:
                log.warning("Could not delete video {}: {}", video_path, e)


def _finalize_session(session, students, presence_map, log):
    from apps.attendance.models import AttendanceRecord

    records = []
    for student in students:
        pct = presence_map.get(student.id, 0.0)
        is_present = pct >= PRESENCE_THRESHOLD_PCT
        log.info(
            "Student {} — presence={:.1%} → {}",
            student.id, pct, 'PRESENTE' if is_present else 'AUSENTE',
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
    log.info("Session completed — {} records saved.", len(records))


def start_attendance_processing(session_id: int, video_path: str) -> None:
    thread = threading.Thread(
        target=process_attendance_video,
        args=(session_id, video_path),
        daemon=True,
    )
    thread.start()
