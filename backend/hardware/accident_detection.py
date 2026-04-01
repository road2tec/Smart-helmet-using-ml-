import random

class AccidentDetector:
    def __init__(self, threshold=5.0):
        """
        Simulates an MPU-6050 accelerometer/gyroscope.
        Threshold: g-force above which an accident is suspected.
        """
        self.threshold = threshold

    def detect_accident(self):
        """
        Simulates accelerometer readings to detect sharp impact or tilt.
        Returns:
            bool: True if accident detected, False otherwise.
        """
        # Accelerometer readings (normally +-2g, +-4g, etc.)
        # A value > threshold would indicate an impact.
        # Randomly trigger accident for simulation.
        return True if random.random() > 0.99 else False

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
