from pathlib import Path
from typing import Dict, List

import cv2

from modules.age_detection import AgeDetector


class FaceAgeDetection:
    """
    Backward-compatible wrapper around the new AgeDetector.
    """

    def __init__(self) -> None:
        backend_dir = Path(__file__).resolve().parents[1]
        model_dir = backend_dir / "models" / "age_dnn"

        self.detector = None
        self.fallback_face = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        try:
            # Keep API responses fast: do not block requests waiting on model downloads.
            self.detector = AgeDetector(model_dir=str(model_dir), auto_download=False)
            print("FaceAgeDetection initialized with local OpenCV DNN age model.")
        except Exception as exc:
            print(f"Warning: Age detector unavailable (local models missing): {exc}")

    def _fallback_detect(self, frame) -> List[Dict]:
        """Fallback when DNN models are missing: detect face and return a neutral age bucket."""
        if frame is None:
            return []

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.fallback_face.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(70, 70))

        results: List[Dict] = []
        for (x, y, w, h) in faces:
            results.append(
                {
                    "rect": (int(x), int(y), int(w), int(h)),
                    "age": "N/A",
                    "age_group": "18+",
                    "binary_age": "Above 18",
                }
            )
        return results

    def detect_and_predict(self, frame) -> List[Dict]:
        """
        Return structure compatible with existing API consumers.
        """
        if self.detector is None:
            return self._fallback_detect(frame)

        detections = self.detector.detect(frame)
        results: List[Dict] = []
        for det in detections:
            results.append(
                {
                    "rect": det["rect"],
                    "age": det.get("age_bucket", "N/A"),
                    "age_group": det.get("age_group", "N/A"),
                    "binary_age": det.get("age_label", "N/A"),
                }
            )
        return results
