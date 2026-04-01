import random

class AlcoholSensor:
    def __init__(self, threshold=0.5):
        """
        Simulates an MQ-3 alcohol sensor.
        Threshold: float value above which indicates intoxication.
        """
        self.threshold = threshold

    def get_reading(self):
        """
        Simulates reading alcohol level from the sensor.
        Returns:
            float: Simulated value between 0.0 and 5.0.
        """
        # Normally returns 0-5V or scaled value.
        # Most of the time it should be low (<0.1)
        if random.random() > 0.95:
            # Simulate a drunk person
            return round(random.uniform(0.6, 2.5), 2)
        return round(random.uniform(0.01, 0.08), 2)

    def is_intoxicated(self, reading):
        return reading >= self.threshold
