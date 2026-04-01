import cv2
import numpy as np
from ultralytics import YOLO
import os

class ObjectDetection:
    def __init__(self, model_path='yolov8n.pt'):
        """
        AI Module for Object Detection using YOLO.
        Detects: cars, persons, cycles, obstacles.
        """
        try:
            # YOLO typically downloads yolov8n.pt automatically if not provided locally
            self.model = YOLO(model_path)
            self.use_simulation = False
        except Exception as e:
            print(f"Warning: YOLO Object detection failed to load ({str(e)}). Switching to simulation.")
            self.use_simulation = True
        
        self.classes_of_interest = ['person', 'bicycle', 'car', 'motorcycle', 'bus', 'truck']

    def detect(self, frame):
        """
        Detects objects in the frame.
        Returns:
            list: list of detected objects.
        """
        if self.use_simulation:
            # Random simulation detections
            return [{'label': 'person', 'confidence': 0.95, 'rect': [10, 10, 50, 50]}]

        results = self.model(frame)
        
        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = result.names[class_id]
                confidence = float(box.conf[0])
                
                if label in self.classes_of_interest and confidence > 0.5:
                    detections.append({
                        'label': label,
                        'confidence': confidence,
                        'rect': box.xyxy[0].tolist() # (x1, y1, x2, y2)
                    })
        return detections
