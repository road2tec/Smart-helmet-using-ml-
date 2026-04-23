import random
import time
from typing import Optional

import cv2
import numpy as np

class AccidentDetector:
    def __init__(
        self,
        threshold=5.0,
        motion_spike_threshold=24.0,
        stillness_threshold=6.0,
        confirmation_frames=8,
        impact_window_sec=2.2,
        cooldown_sec=120,
        allow_without_scene=False,
        immediate_impact_threshold=38.0,
    ):
        """
        Simulates an MPU-6050 accelerometer/gyroscope.
        Threshold: g-force above which an accident is suspected.

        Also supports a camera-based impact heuristic:
        - detect a sudden motion spike
        - then detect short stillness window
        """
        self.threshold = threshold
        self.motion_spike_threshold = motion_spike_threshold
        self.stillness_threshold = stillness_threshold
        self.confirmation_frames = confirmation_frames
        self.impact_window_sec = impact_window_sec
        self.cooldown_sec = cooldown_sec
        self.allow_without_scene = allow_without_scene
        self.immediate_impact_threshold = immediate_impact_threshold

        self.prev_gray: Optional[np.ndarray] = None
        self.impact_candidate_at: Optional[float] = None
        self.post_impact_still_frames = 0
        self.last_alert_at = 0.0
        self.last_motion_score = 0.0

    def _detect_simulated_accident(self):
        # Randomly trigger accident for simulation.
        return True if random.random() > 0.99 else False

    def _compute_motion_score(self, frame):
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        gray = cv2.GaussianBlur(gray, (5, 5), 0)

        if self.prev_gray is None:
            self.prev_gray = gray
            self.last_motion_score = 0.0
            return self.last_motion_score

        diff = cv2.absdiff(self.prev_gray, gray)
        self.prev_gray = gray
        self.last_motion_score = float(np.mean(diff))
        return self.last_motion_score

    def detect_accident(self, frame=None, scene_active=True):
        """
        Detect accident using either:
        - simulated IMU mode when frame is None
        - camera motion heuristic when frame is provided

        Returns:
            bool: True if accident detected, False otherwise.
        """
        now = time.time()
        if (now - self.last_alert_at) < self.cooldown_sec:
            return False

        if frame is None:
            detected = self._detect_simulated_accident()
            if detected:
                self.last_alert_at = now
            return detected

        motion_score = self._compute_motion_score(frame)

        # Very large spikes are treated as immediate impact events in an active scene.
        if motion_score >= self.immediate_impact_threshold and scene_active:
            self.last_alert_at = now
            self.impact_candidate_at = None
            self.post_impact_still_frames = 0
            return True

        # Begin accident candidate when a sudden spike appears in active scene,
        # or in fallback mode when scene AI modules are unavailable.
        if motion_score >= self.motion_spike_threshold and (scene_active or self.allow_without_scene):
            self.impact_candidate_at = now
            self.post_impact_still_frames = 0

        if self.impact_candidate_at is None:
            return False

        # Candidate expires if no confirmation pattern follows quickly.
        if (now - self.impact_candidate_at) > self.impact_window_sec:
            self.impact_candidate_at = None
            self.post_impact_still_frames = 0
            return False

        # Look for stillness just after spike to confirm impact-like event.
        if motion_score <= self.stillness_threshold:
            self.post_impact_still_frames += 1
        else:
            self.post_impact_still_frames = 0

        if self.post_impact_still_frames >= self.confirmation_frames:
            self.last_alert_at = now
            self.impact_candidate_at = None
            self.post_impact_still_frames = 0
            return True

        return False

    def get_last_motion_score(self):
        return round(self.last_motion_score, 2)

    def get_imu_data(self):
        """
        Returns simulated IMU (x,y,z) data.
        """
        return {
            'accel': {
                'x': round(random.uniform(-1.0, 1.0), 2),
                'y': round(random.uniform(-1.0, 1.0), 2),
                'z': round(random.uniform(9.0, 10.0), 2) # Near 1g (9.8 m/s^2)
            },
            'gyro': {
                'x': round(random.uniform(-0.1, 0.1), 2),
                'y': round(random.uniform(-0.1, 0.1), 2),
                'z': round(random.uniform(-0.1, 0.1), 2)
            }
        }
