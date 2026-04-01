import random

class GPSModule:
    def __init__(self, start_lat=18.5204, start_lng=73.8567):
        """
        Simulates a Neo-6M GPS module with default starting location (Pune, India).
        """
        self.lat = start_lat
        self.lng = start_lng

    def get_coordinates(self):
        """
        Simulates fetching real-time GPS coordinates.
        Uses small random variations to simulate movement.
        Returns:
            dict: Lat and Lng coordinates.
        """
        self.lat += random.uniform(-0.0001, 0.0001)
        self.lng += random.uniform(-0.0001, 0.0001)
        
        return {
            'lat': round(self.lat, 6),
            'lng': round(self.lng, 6)
        }
