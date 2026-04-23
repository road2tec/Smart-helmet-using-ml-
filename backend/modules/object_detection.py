from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from ultralytics import YOLO


class ObjectDetection:
    """
    Real-time road-safety object detector using YOLOv8.
    """

    VEHICLE_CLASSES = {
        "bicycle",
        "car",
        "motorcycle",
        "bus",
        "truck",
    }
    ANIMAL_CLASSES = {
        "bird",
        "cat",
        "dog",
        "horse",
        "sheep",
        "cow",
        "elephant",
        "bear",
        "zebra",
        "giraffe",
    }
    OBSTACLE_CLASSES = {
        "person",
        "traffic light",
        "stop sign",
        "fire hydrant",
        "bench",
        "suitcase",
        "backpack",
    }

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        conf_threshold: float = 0.20,
        iou_threshold: float = 0.45,
        imgsz: int = 640,
        enable_speed_breaker_heuristic: bool = True,
    ) -> None:
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.imgsz = imgsz
        self.enable_speed_breaker_heuristic = enable_speed_breaker_heuristic

        # Accept either backend-local model path or project-root model path.
        model_candidates = [Path(model_path), Path("backend") / model_path]
        selected_model_path: Optional[Path] = None
        for candidate in model_candidates:
            if candidate.exists():
                selected_model_path = candidate
                break
        if selected_model_path is None:
            selected_model_path = Path(model_path)

        self.model: Optional[YOLO] = None
        try:
            self.model = YOLO(str(selected_model_path))
            try:
                self.model.fuse()
            except Exception:
                # Some backends/models cannot be fused; inference still works.
                pass
        except Exception as exc:
            print(f"Warning: YOLO model failed to load: {exc}")

    def _categorize_label(self, label: str) -> Optional[str]:
        if label in self.VEHICLE_CLASSES:
            return "vehicle"
        if label in self.ANIMAL_CLASSES:
            return "animal"
        if label in self.OBSTACLE_CLASSES:
            return "obstacle"
        # Keep additional YOLO classes as generic obstacles to improve practical detection coverage.
        return "obstacle"

    def _detect_speed_breaker_heuristic(self, frame: np.ndarray) -> Optional[Dict]:
        """
        Optional fallback heuristic for speed breaker-like horizontal edge bands.
        """
        h, w = frame.shape[:2]
        y1 = int(h * 0.65)
        roi = frame[y1:h, :]
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blur, 70, 150)

        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=60,
            minLineLength=max(40, int(w * 0.15)),
            maxLineGap=15,
        )
        if lines is None:
            return None

        horizontal_count = 0
        for line in lines[:, 0, :]:
            x_start, y_start, x_end, y_end = line
            dy = abs(y_end - y_start)
            dx = abs(x_end - x_start)
            if dx > 0 and dy / dx < 0.15:
                horizontal_count += 1

        if horizontal_count < 8:
            return None

        return {
            "label": "speed_breaker",
            "confidence": min(0.95, 0.45 + horizontal_count / 40.0),
            "rect": [0, y1, w, h],
            "category": "obstacle",
        }

    def detect(self, frame: np.ndarray) -> List[Dict]:
        """
        Returns filtered detections in format:
            {
                'label': str,
                'confidence': float,
                'rect': [x1, y1, x2, y2],
                'category': 'vehicle' | 'animal' | 'obstacle'
            }
        """
        if frame is None or frame.size == 0:
            return []

        if self.model is None:
            return []

        detections: List[Dict] = []

        results = self.model.predict(
            source=frame,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            imgsz=self.imgsz,
            verbose=False,
        )

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = str(result.names[class_id]).lower()
                confidence = float(box.conf[0])

                category = self._categorize_label(label)
                if category is None:
                    continue

                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append(
                    {
                        "label": label,
                        "confidence": confidence,
                        "rect": [int(x1), int(y1), int(x2), int(y2)],
                        "category": category,
                    }
                )

        if self.enable_speed_breaker_heuristic:
            speed_breaker = self._detect_speed_breaker_heuristic(frame)
            if speed_breaker is not None:
                detections.append(speed_breaker)

        return detections

    @staticmethod
    def annotate(frame: np.ndarray, detections: List[Dict]) -> np.ndarray:
        color_by_category = {
            "vehicle": (255, 165, 0),
            "animal": (0, 255, 255),
            "obstacle": (0, 0, 255),
        }
        for det in detections:
            x1, y1, x2, y2 = det["rect"]
            label = det.get("label", "object")
            conf = det.get("confidence", 0.0)
            category = det.get("category", "obstacle")
            color = color_by_category.get(category, (255, 255, 255))

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                frame,
                f"{label} {conf:.2f}",
                (x1, max(20, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                color,
                2,
                cv2.LINE_AA,
            )
        return frame
