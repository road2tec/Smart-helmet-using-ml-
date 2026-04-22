import argparse
import concurrent.futures
import threading
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

from modules.age_detection import AgeDetector
from modules.drowsiness_detection import DrowsinessDetector
from modules.object_detection import ObjectDetection


class ThreadedCamera:
    """
    Continuously grabs frames on a background thread to reduce capture latency.
    """

    def __init__(
        self,
        camera_index: int = 0,
        width: int = 960,
        height: int = 540,
        target_fps: int = 30,
    ) -> None:
        self.camera_index = camera_index
        self.width = width
        self.height = height
        self.target_fps = target_fps

        self.cap: Optional[cv2.VideoCapture] = None
        self.frame_lock = threading.Lock()
        self.latest_frame: Optional[np.ndarray] = None
        self.running = False
        self.thread: Optional[threading.Thread] = None

    def start(self) -> None:
        self.cap = self._open_camera()

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)
        if hasattr(cv2, "CAP_PROP_BUFFERSIZE"):
            try:
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            except Exception:
                pass

        self.running = True
        self.thread = threading.Thread(target=self._update_loop, daemon=True)
        self.thread.start()

    def _open_camera(self) -> cv2.VideoCapture:
        backend_entries = []
        if hasattr(cv2, "CAP_DSHOW"):
            backend_entries.append(("DSHOW", cv2.CAP_DSHOW))
        if hasattr(cv2, "CAP_MSMF"):
            backend_entries.append(("MSMF", cv2.CAP_MSMF))
        backend_entries.append(("ANY", cv2.CAP_ANY))

        candidate_indices = [self.camera_index]
        candidate_indices.extend([idx for idx in [0, 1, 2, 3] if idx != self.camera_index])

        for idx in candidate_indices:
            for backend_name, backend in backend_entries:
                cap = cv2.VideoCapture(idx, backend)
                if cap is None or not cap.isOpened():
                    if cap is not None:
                        cap.release()
                    continue

                # Confirm this camera/backend returns valid frames before accepting.
                first_frame_ok = False
                for _ in range(30):
                    ok, frame = cap.read()
                    if ok and frame is not None and frame.size > 0:
                        first_frame_ok = True
                        break
                    time.sleep(0.04)

                if first_frame_ok:
                    self.camera_index = idx
                    print(f"[Camera] Using index {idx} via {backend_name}")
                    return cap

                cap.release()

        raise RuntimeError(
            f"Could not open any camera. Tried preferred index {self.camera_index} and fallback indices 0-3"
        )

    def _update_loop(self) -> None:
        assert self.cap is not None
        read_failures = 0
        while self.running:
            ok, frame = self.cap.read()
            if ok:
                read_failures = 0
                with self.frame_lock:
                    self.latest_frame = frame
            else:
                read_failures += 1
                if read_failures >= 25:
                    try:
                        self.cap.release()
                    except Exception:
                        pass
                    try:
                        self.cap = self._open_camera()
                        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.width)
                        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, self.height)
                        self.cap.set(cv2.CAP_PROP_FPS, self.target_fps)
                        read_failures = 0
                    except Exception:
                        time.sleep(0.3)
                time.sleep(0.01)

    def read(self) -> Tuple[bool, Optional[np.ndarray]]:
        with self.frame_lock:
            if self.latest_frame is None:
                return False, None
            return True, self.latest_frame.copy()

    def stop(self) -> None:
        self.running = False
        if self.thread is not None:
            self.thread.join(timeout=1.0)
        if self.cap is not None:
            self.cap.release()


class SmartDriverSafetyPipeline:
    """
    Unified age + drowsiness + road object safety pipeline.
    """

    def __init__(self, backend_dir: Path) -> None:
        self.backend_dir = backend_dir

        self.age_detector: Optional[AgeDetector] = None
        self.drowsiness_detector: Optional[DrowsinessDetector] = None
        self.object_detector: Optional[ObjectDetection] = None

        self._init_modules()

        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=2)
        self.age_future: Optional[concurrent.futures.Future] = None
        self.object_future: Optional[concurrent.futures.Future] = None

        self.last_age_submit = 0.0
        self.last_object_submit = 0.0
        self.age_interval_sec = 0.35
        self.object_interval_sec = 0.25

        self.latest_age_results: List[Dict] = []
        self.latest_object_results: List[Dict] = []
        self.latest_drowsiness: Dict = {
            "is_drowsy": False,
            "ear": 0.0,
            "alert_text": "",
            "left_eye_points": [],
            "right_eye_points": [],
        }

    def _init_modules(self) -> None:
        age_model_dir = self.backend_dir / "models" / "age_dnn"
        yolo_model_path = self.backend_dir / "yolov8n.pt"

        try:
            self.age_detector = AgeDetector(model_dir=str(age_model_dir), auto_download=True)
            print("[OK] Age detector initialized")
        except Exception as exc:
            print(f"[WARN] Age detector unavailable: {exc}")

        try:
            self.drowsiness_detector = DrowsinessDetector()
            print("[OK] Drowsiness detector initialized")
        except Exception as exc:
            print(f"[WARN] Drowsiness detector unavailable: {exc}")

        try:
            model_path = str(yolo_model_path if yolo_model_path.exists() else "yolov8n.pt")
            self.object_detector = ObjectDetection(
                model_path=model_path,
                conf_threshold=0.35,
                iou_threshold=0.45,
                imgsz=512,
                enable_speed_breaker_heuristic=True,
            )
            if self.object_detector.model is not None:
                print("[OK] Object detector initialized")
            else:
                print("[WARN] Object detector model failed to initialize")
        except Exception as exc:
            print(f"[WARN] Object detector unavailable: {exc}")

    def _refresh_async_results(self) -> None:
        if self.age_future is not None and self.age_future.done():
            try:
                self.latest_age_results = self.age_future.result()
            except Exception as exc:
                print(f"Age task failed: {exc}")
            self.age_future = None

        if self.object_future is not None and self.object_future.done():
            try:
                self.latest_object_results = self.object_future.result()
            except Exception as exc:
                print(f"Object task failed: {exc}")
            self.object_future = None

    def _submit_async_tasks(self, frame: np.ndarray, now: float) -> None:
        if (
            self.age_detector is not None
            and self.age_future is None
            and (now - self.last_age_submit) >= self.age_interval_sec
        ):
            frame_for_age = frame.copy()
            self.age_future = self.executor.submit(self.age_detector.detect, frame_for_age)
            self.last_age_submit = now

        if (
            self.object_detector is not None
            and self.object_future is None
            and (now - self.last_object_submit) >= self.object_interval_sec
        ):
            frame_for_obj = frame.copy()
            self.object_future = self.executor.submit(self.object_detector.detect, frame_for_obj)
            self.last_object_submit = now

    def process_frame(self, frame: np.ndarray) -> Tuple[np.ndarray, Dict]:
        now = time.time()
        self._refresh_async_results()
        self._submit_async_tasks(frame, now)

        # Drowsiness should stay per-frame for better responsiveness.
        if self.drowsiness_detector is not None:
            try:
                self.latest_drowsiness = self.drowsiness_detector.analyze(frame)
            except Exception as exc:
                print(f"Drowsiness inference failed: {exc}")

        annotated = frame.copy()

        if self.age_detector is not None:
            annotated = self.age_detector.annotate(annotated, self.latest_age_results)

        if self.object_detector is not None:
            annotated = self.object_detector.annotate(annotated, self.latest_object_results)

        if self.drowsiness_detector is not None:
            annotated = self.drowsiness_detector.annotate(annotated, self.latest_drowsiness)

        status = {
            "drowsy": self.latest_drowsiness.get("is_drowsy", False),
            "age_faces": len(self.latest_age_results),
            "objects": len(self.latest_object_results),
            "age_labels": [det.get("age_label", "") for det in self.latest_age_results],
        }
        return annotated, status

    def shutdown(self) -> None:
        if self.age_future is not None:
            self.age_future.cancel()
        if self.object_future is not None:
            self.object_future.cancel()
        self.executor.shutdown(wait=False, cancel_futures=True)


def draw_overlay(frame: np.ndarray, fps: float, status: Dict) -> np.ndarray:
    cv2.rectangle(frame, (10, 10), (420, 120), (0, 0, 0), -1)
    cv2.rectangle(frame, (10, 10), (420, 120), (40, 200, 40), 2)

    drowsy_text = "YES" if status.get("drowsy", False) else "NO"
    age_labels = status.get("age_labels", [])
    age_text = ", ".join(age_labels[:2]) if age_labels else "No face"

    cv2.putText(
        frame,
        f"FPS: {fps:.1f}",
        (20, 38),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.65,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        f"Drowsy: {drowsy_text}",
        (20, 66),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (0, 0, 255) if status.get("drowsy", False) else (0, 255, 0),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        f"Age: {age_text}",
        (20, 92),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (255, 255, 0),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        f"Objects: {status.get('objects', 0)}",
        (20, 116),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 165, 255),
        2,
        cv2.LINE_AA,
    )

    cv2.putText(
        frame,
        "Press Q to quit",
        (20, frame.shape[0] - 20),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    return frame


def run_pipeline(camera_index: int) -> None:
    backend_dir = Path(__file__).resolve().parent
    camera = ThreadedCamera(camera_index=camera_index)
    pipeline = SmartDriverSafetyPipeline(backend_dir=backend_dir)

    if (
        pipeline.age_detector is None
        and pipeline.drowsiness_detector is None
        and pipeline.object_detector is None
    ):
        raise RuntimeError("All AI modules failed to initialize. Check dependencies and model files.")

    frame_count = 0
    fps = 0.0
    fps_start = time.time()

    try:
        camera.start()
        print("Pipeline started. Press Q in the video window to stop.")

        while True:
            ok, frame = camera.read()
            if not ok or frame is None:
                time.sleep(0.01)
                continue

            annotated, status = pipeline.process_frame(frame)

            frame_count += 1
            elapsed = time.time() - fps_start
            if elapsed >= 1.0:
                fps = frame_count / elapsed
                frame_count = 0
                fps_start = time.time()

            annotated = draw_overlay(annotated, fps, status)
            cv2.imshow("Smart Driver Safety System", annotated)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break

    finally:
        camera.stop()
        pipeline.shutdown()
        cv2.destroyAllWindows()
        print("Pipeline stopped.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smart Driver Safety System")
    parser.add_argument("--camera", type=int, default=0, help="Webcam index (default: 0)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    try:
        run_pipeline(camera_index=args.camera)
    except Exception as exc:
        print(f"Fatal error: {exc}")
