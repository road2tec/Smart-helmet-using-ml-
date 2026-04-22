from modules.drowsiness_detection import DrowsinessDetector as _EarDrowsinessDetector


class DrowsinessDetector:
    """
    Backward-compatible wrapper around MediaPipe EAR drowsiness detector.
    """

    def __init__(self, dat_path: str = "models/shape_predictor_68_face_landmarks.dat") -> None:
        # dat_path is kept only for API compatibility with older code paths.
        _ = dat_path
        self.impl = _EarDrowsinessDetector()

    def detect(self, frame) -> bool:
        return self.impl.detect(frame)

    def analyze(self, frame):
        return self.impl.analyze(frame)
