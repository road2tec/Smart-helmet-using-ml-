import urllib.request
from pathlib import Path
from typing import Dict, List, Tuple

import cv2
import numpy as np


class AgeDetector:
    """
    Binary age detector (Above 18 / Below 18) using OpenCV DNN models.
    """

    FACE_PROTO_URLS = [
        "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt",
        "https://github.com/opencv/opencv/raw/master/samples/dnn/face_detector/deploy.prototxt",
    ]
    FACE_MODEL_URLS = [
        "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000_fp16.caffemodel",
        "https://github.com/opencv/opencv_3rdparty/raw/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000_fp16.caffemodel",
    ]
    AGE_PROTO_URLS = [
        "https://raw.githubusercontent.com/spmallick/learnopencv/master/AgeGender/age_deploy.prototxt",
        "https://github.com/spmallick/learnopencv/raw/master/AgeGender/age_deploy.prototxt",
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/model/age_deploy.prototxt",
    ]
    AGE_MODEL_URLS = [
        "https://raw.githubusercontent.com/spmallick/learnopencv/master/AgeGender/age_net.caffemodel",
        "https://github.com/spmallick/learnopencv/raw/master/AgeGender/age_net.caffemodel",
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/model/age_net.caffemodel",
    ]

    AGE_BUCKETS = [
        "0-2",
        "4-6",
        "8-12",
        "15-20",
        "25-32",
        "38-43",
        "48-53",
        "60-100",
    ]
    AGE_BUCKET_MIDPOINTS = [1.0, 5.0, 10.0, 17.5, 28.5, 40.5, 50.5, 80.0]

    def __init__(
        self,
        model_dir: str = "models/age_dnn",
        face_confidence_threshold: float = 0.6,
        auto_download: bool = True,
    ) -> None:
        self.model_dir = Path(model_dir)
        self.face_confidence_threshold = face_confidence_threshold
        self.auto_download = auto_download

        self.face_prototxt = self.model_dir / "deploy.prototxt"
        self.face_model = self.model_dir / "res10_300x300_ssd_iter_140000_fp16.caffemodel"
        self.age_prototxt = self.model_dir / "age_deploy.prototxt"
        self.age_model = self.model_dir / "age_net.caffemodel"

        self.face_net = None
        self.age_net = None

        self._ensure_models()
        self._load_models()

    def _ensure_file(self, file_path: Path, urls: List[str]) -> None:
        if file_path.exists():
            return

        if not self.auto_download:
            raise FileNotFoundError(f"Missing model file: {file_path}")

        file_path.parent.mkdir(parents=True, exist_ok=True)

        last_error = None
        for url in urls:
            try:
                print(f"Downloading model file: {file_path.name}")
                urllib.request.urlretrieve(url, file_path)
                if file_path.exists() and file_path.stat().st_size > 0:
                    return
            except Exception as exc:
                last_error = exc

        raise RuntimeError(
            f"Could not download required model file '{file_path.name}'. "
            f"Please place it manually under '{self.model_dir}'."
        ) from last_error

    def _ensure_models(self) -> None:
        self._ensure_file(self.face_prototxt, self.FACE_PROTO_URLS)
        self._ensure_file(self.face_model, self.FACE_MODEL_URLS)
        self._ensure_file(self.age_prototxt, self.AGE_PROTO_URLS)
        self._ensure_file(self.age_model, self.AGE_MODEL_URLS)

    def _load_models(self) -> None:
        try:
            self.face_net = cv2.dnn.readNetFromCaffe(
                str(self.face_prototxt), str(self.face_model)
            )
            self.age_net = cv2.dnn.readNetFromCaffe(
                str(self.age_prototxt), str(self.age_model)
            )
        except Exception as exc:
            raise RuntimeError(
                "Failed to load age detection DNN models. "
                "Verify model files exist and are valid."
            ) from exc

    def _predict_binary_age(self, face_bgr: np.ndarray) -> Tuple[str, str, float]:
        """
        Returns:
            (binary_label, age_bucket, confidence)
        """
        blob = cv2.dnn.blobFromImage(
            image=face_bgr,
            scalefactor=1.0,
            size=(227, 227),
            mean=(78.4263377603, 87.7689143744, 114.895847746),
            swapRB=False,
        )

        self.age_net.setInput(blob)
        age_preds = self.age_net.forward()[0]
        age_idx = int(np.argmax(age_preds))
        confidence = float(age_preds[age_idx])

        age_bucket = self.AGE_BUCKETS[age_idx]
        midpoint = self.AGE_BUCKET_MIDPOINTS[age_idx]
        binary_label = "Above 18" if midpoint >= 18.0 else "Below 18"
        return binary_label, age_bucket, confidence

    def detect(self, frame_bgr: np.ndarray) -> List[Dict]:
        """
        Detect faces and classify each as Above 18 / Below 18.
        """
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        h, w = frame_bgr.shape[:2]
        blob = cv2.dnn.blobFromImage(
            image=frame_bgr,
            scalefactor=1.0,
            size=(300, 300),
            mean=(104.0, 117.0, 123.0),
            swapRB=False,
            crop=False,
        )

        self.face_net.setInput(blob)
        detections = self.face_net.forward()

        results: List[Dict] = []
        for i in range(detections.shape[2]):
            conf = float(detections[0, 0, i, 2])
            if conf < self.face_confidence_threshold:
                continue

            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            x1, y1, x2, y2 = box.astype(int)

            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(w - 1, x2)
            y2 = min(h - 1, y2)

            if x2 <= x1 or y2 <= y1:
                continue

            face_roi = frame_bgr[y1:y2, x1:x2]
            if face_roi.size == 0:
                continue

            binary_label, age_bucket, age_conf = self._predict_binary_age(face_roi)
            legacy_age_group = "18+" if binary_label == "Above 18" else "<18"

            results.append(
                {
                    "rect": (int(x1), int(y1), int(x2 - x1), int(y2 - y1)),
                    "age_label": binary_label,
                    "age_bucket": age_bucket,
                    "confidence": age_conf,
                    "age_group": legacy_age_group,
                }
            )

        return results

    @staticmethod
    def annotate(frame_bgr: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw face boxes and binary age labels on frame.
        """
        for det in detections:
            x, y, w, h = det["rect"]
            label = det.get("age_label", "Unknown")
            conf = det.get("confidence", 0.0)

            color = (0, 200, 0) if label == "Above 18" else (0, 0, 255)
            cv2.rectangle(frame_bgr, (x, y), (x + w, y + h), color, 2)
            cv2.putText(
                frame_bgr,
                f"{label} ({conf:.2f})",
                (x, max(20, y - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2,
                cv2.LINE_AA,
            )

        return frame_bgr
