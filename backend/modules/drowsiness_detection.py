import threading
import time
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

try:
    import mediapipe as mp
except Exception:
    mp = None

try:
    import winsound
except Exception:
    winsound = None


class DrowsinessDetector:
    """
    Drowsiness detector using EAR from MediaPipe Face Mesh.
    Falls back to OpenCV Haar face/eye detection when MediaPipe is unavailable.
    """

    # 6-point eye landmarks: [left, top-left, top-right, right, bottom-right, bottom-left]
    LEFT_EYE_IDX = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_IDX = [362, 385, 387, 263, 373, 380]

    def __init__(
        self,
        ear_threshold: float = 0.23,
        closed_time_threshold: float = 0.9,
        beep_cooldown_sec: float = 1.2,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
    ) -> None:
        self.ear_threshold = ear_threshold
        self.closed_time_threshold = closed_time_threshold
        self.beep_cooldown_sec = beep_cooldown_sec

        self.use_mediapipe = bool(mp is not None and hasattr(mp, "solutions"))
        self.face_mesh = None
        if self.use_mediapipe:
            self._mp_face_mesh = mp.solutions.face_mesh
            self.face_mesh = self._mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=min_detection_confidence,
                min_tracking_confidence=min_tracking_confidence,
            )
        else:
            print("Warning: MediaPipe unavailable, using Haar fallback for drowsiness detection.")

        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")
        self.eye_glasses_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye_tree_eyeglasses.xml"
        )
        self.min_open_eyes = 2
        self.missing_face_grace_sec = 0.9

        self.eyes_closed_since: Optional[float] = None
        self.last_beep_time = 0.0
        self.last_face_seen_at = 0.0

    @staticmethod
    def _euclidean(p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        return float(np.linalg.norm(np.array(p1) - np.array(p2)))

    def _eye_aspect_ratio(self, eye_points: List[Tuple[float, float]]) -> float:
        vertical_1 = self._euclidean(eye_points[1], eye_points[5])
        vertical_2 = self._euclidean(eye_points[2], eye_points[4])
        horizontal = self._euclidean(eye_points[0], eye_points[3])
        if horizontal < 1e-6:
            return 0.0
        return (vertical_1 + vertical_2) / (2.0 * horizontal)

    def _extract_eye_points(
        self, landmarks, frame_w: int, frame_h: int, indices: List[int]
    ) -> List[Tuple[float, float]]:
        points = []
        for idx in indices:
            lm = landmarks[idx]
            points.append((lm.x * frame_w, lm.y * frame_h))
        return points

    def _play_beep_async(self) -> None:
        def _beep_worker() -> None:
            if winsound is not None:
                try:
                    winsound.Beep(1800, 250)
                    return
                except Exception:
                    pass
                try:
                    winsound.MessageBeep(winsound.MB_ICONEXCLAMATION)
                    return
                except Exception:
                    pass
            # Terminal bell fallback
            print("\a", end="", flush=True)

        threading.Thread(target=_beep_worker, daemon=True).start()

    def analyze(self, frame_bgr: np.ndarray) -> Dict:
        """
        Returns detection details including EAR and drowsy state.
        """
        result = {
            "is_drowsy": False,
            "ear": 0.0,
            "eyes_closed_duration": 0.0,
            "alert_text": "",
            "face_landmarks": None,
            "eyes_detected": 0,
        }

        now = time.time()

        if frame_bgr is None or frame_bgr.size == 0:
            self.eyes_closed_since = None
            return result

        if self.use_mediapipe and self.face_mesh is not None:
            frame_h, frame_w = frame_bgr.shape[:2]
            frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            mesh_result = self.face_mesh.process(frame_rgb)

            if not mesh_result.multi_face_landmarks:
                if self.eyes_closed_since is not None and (now - self.last_face_seen_at) <= self.missing_face_grace_sec:
                    closed_duration = now - self.eyes_closed_since
                    is_drowsy = closed_duration >= self.closed_time_threshold
                    if is_drowsy and now - self.last_beep_time >= self.beep_cooldown_sec:
                        self._play_beep_async()
                        self.last_beep_time = now
                    result.update(
                        {
                            "is_drowsy": is_drowsy,
                            "ear": 0.0,
                            "eyes_closed_duration": float(closed_duration),
                            "alert_text": "Drowsiness Detected" if is_drowsy else "",
                        }
                    )
                    return result

                self.eyes_closed_since = None
                return result

            face_landmarks = mesh_result.multi_face_landmarks[0].landmark
            self.last_face_seen_at = now

            left_eye = self._extract_eye_points(face_landmarks, frame_w, frame_h, self.LEFT_EYE_IDX)
            right_eye = self._extract_eye_points(face_landmarks, frame_w, frame_h, self.RIGHT_EYE_IDX)

            left_ear = self._eye_aspect_ratio(left_eye)
            right_ear = self._eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0
            face_detected = True
        else:
            # Haar fallback: if a face is visible but both eyes disappear for sustained time, treat as drowsy.
            gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
            if len(faces) == 0:
                if self.eyes_closed_since is not None and (now - self.last_face_seen_at) <= self.missing_face_grace_sec:
                    closed_duration = now - self.eyes_closed_since
                    is_drowsy = closed_duration >= self.closed_time_threshold
                    if is_drowsy and now - self.last_beep_time >= self.beep_cooldown_sec:
                        self._play_beep_async()
                        self.last_beep_time = now
                    result.update(
                        {
                            "is_drowsy": is_drowsy,
                            "ear": 0.0,
                            "eyes_closed_duration": float(closed_duration),
                            "alert_text": "Drowsiness Detected" if is_drowsy else "",
                        }
                    )
                    return result

                self.eyes_closed_since = None
                return result

            x, y, w, h = faces[0]
            self.last_face_seen_at = now
            roi_gray = gray[y : y + h, x : x + w]
            roi_gray = cv2.equalizeHist(roi_gray)
            upper_half = roi_gray[: max(1, h // 2), :]
            eyes = self.eye_cascade.detectMultiScale(
                upper_half,
                scaleFactor=1.08,
                minNeighbors=4,
                minSize=(16, 16),
            )
            eyes_glasses = self.eye_glasses_cascade.detectMultiScale(
                upper_half,
                scaleFactor=1.08,
                minNeighbors=4,
                minSize=(16, 16),
            )
            face_detected = True
            # Synthetic EAR score in fallback mode for UI compatibility.
            eyes_detected = max(len(eyes), len(eyes_glasses))
            ear = 0.30 if eyes_detected >= self.min_open_eyes else 0.10
            left_eye = []
            right_eye = []
            face_landmarks = None

        is_drowsy = False
        closed_duration = 0.0

        if face_detected and ear < self.ear_threshold:
            if self.eyes_closed_since is None:
                self.eyes_closed_since = now
            closed_duration = now - self.eyes_closed_since
            if closed_duration >= self.closed_time_threshold:
                is_drowsy = True
                if now - self.last_beep_time >= self.beep_cooldown_sec:
                    self._play_beep_async()
                    self.last_beep_time = now
        else:
            self.eyes_closed_since = None

        result.update(
            {
                "is_drowsy": is_drowsy,
                "ear": float(ear),
                "eyes_closed_duration": float(closed_duration),
                "alert_text": "Drowsiness Detected" if is_drowsy else "",
                "face_landmarks": face_landmarks,
                "left_eye_points": left_eye,
                "right_eye_points": right_eye,
                "eyes_detected": int(locals().get("eyes_detected", 2)),
            }
        )
        return result

    def detect(self, frame_bgr: np.ndarray) -> bool:
        """
        Backward-compatible method expected by existing Flask routes.
        """
        return bool(self.analyze(frame_bgr)["is_drowsy"])

    @staticmethod
    def annotate(frame_bgr: np.ndarray, analysis: Dict) -> np.ndarray:
        left_eye_points = analysis.get("left_eye_points") or []
        right_eye_points = analysis.get("right_eye_points") or []

        for points in (left_eye_points, right_eye_points):
            if len(points) >= 6:
                pts = np.array(points, dtype=np.int32)
                cv2.polylines(frame_bgr, [pts], isClosed=True, color=(255, 255, 0), thickness=1)

        ear_text = f"EAR: {analysis.get('ear', 0.0):.2f}"
        cv2.putText(
            frame_bgr,
            ear_text,
            (20, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 0),
            2,
            cv2.LINE_AA,
        )

        if analysis.get("is_drowsy", False):
            cv2.putText(
                frame_bgr,
                "Drowsiness Detected",
                (20, 65),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 0, 255),
                3,
                cv2.LINE_AA,
            )

        return frame_bgr
