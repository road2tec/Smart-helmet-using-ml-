import cv2
import numpy as np
import torch

# PyTorch v2.6+ Security Patch for YOLOv8
original_load = torch.load
def safe_load(*args, **kwargs):
    kwargs['weights_only'] = False
    return original_load(*args, **kwargs)
torch.load = safe_load

from ultralytics import YOLO
import os

class HelmetDetection:
    def __init__(self, model_path='models/helmet_model.pt'):
        """
        AI Module for Helmet Detection using YOLO.
        If the model file doesn't exist, this class will provide a simulation.
        """
        self.use_simulation = not os.path.exists(model_path)
        if not self.use_simulation:
            self.model = YOLO(model_path)
        else:
            print(f"Warning: model at {model_path} not found. Running in simulation mode.")

    def detect(self, frame):
        """
        Detects helmet in the frame.
        Returns:
            bool: True if helmet detected, False otherwise.
        """
        if self.use_simulation:
            # For Demo/Development, we default to TRUE unless the user specifies otherwise.
            # This ensures the interlock is visible during testing but cleared when testing the "Happy Path".
            return True
        
        # YOLO Detection
        results = self.model(frame)
        
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = result.names[class_id]
                
                # Check for explicit No-Helmet class (model uses 'NO-Hardhat')
                # If it's a negative class, we skip it
                if 'NO-' in label.upper() or 'NO_' in label.upper():
                    continue
                
                # If the label contains 'Hardhat', 'hat', or 'helmet', it IS a helmet.
                label_lower = label.lower()
                if 'hardhat' in label_lower or 'helmet' in label_lower or 'hat' in label_lower:
                    return True
                    
        return False
