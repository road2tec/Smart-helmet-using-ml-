import cv2
import numpy as np
import os

class FaceAgeDetection:
    def __init__(self):
        """
        Face Detection using OpenCV built-in Haar Cascade (zero downloads needed).
        Age estimation uses a face-region heuristic for demo purposes.
        For production: replace with a real DNN age model.
        """
        print("Face & Age Detection: Using OpenCV built-in face detector.")
        # Built-in - always works, no download needed
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)

    def _estimate_age_demo(self, face_roi):
        """
        Lightweight age estimator using face region analysis.
        Returns a consistent age range for the same face.
        """
        try:
            # Use average pixel intensity + gradient variance as a proxy signal
            gray_face = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
            gray_face = cv2.resize(gray_face, (64, 64))
            
            # Measure edge density (wrinkles/sharpness proxy)
            edges = cv2.Laplacian(gray_face, cv2.CV_64F)
            edge_var = edges.var()
            
            # Map edge variance to an age range (higher variance = older face)
            # Rough scale: edge_var 0-50 → young, 50-150 → mid, 150+ → older
            if edge_var < 60:
                age_label = '(15-25)'
                min_age = 15
            elif edge_var < 120:
                age_label = '(25-35)'
                min_age = 25
            elif edge_var < 200:
                age_label = '(35-50)'
                min_age = 35
            else:
                age_label = '(50+)'
                min_age = 50
                
        except Exception:
            age_label = '(25-35)'
            min_age = 25
            
        age_group = '18+' if min_age >= 18 else '<18'
        return age_label, age_group

    def detect_and_predict(self, frame):
        """
        Detects faces and estimates age group.
        Returns list of dicts with age and age_group per detected face.
        """
        results = []
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
            )

            for (x, y, w, h) in faces:
                face_roi = frame[y:y+h, x:x+w]
                if face_roi.size == 0:
                    continue
                age_label, age_group = self._estimate_age_demo(face_roi)
                results.append({
                    'rect': (int(x), int(y), int(w), int(h)),
                    'age': age_label,
                    'age_group': age_group
                })
        except Exception as e:
            print(f"Face detection error: {e}")

        return results
