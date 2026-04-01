from flask import Blueprint, jsonify, Response
import cv2
import base64
import numpy as np

# AI Modules
from modules.helmet_detection import HelmetDetection
from modules.face_age import FaceAgeDetection
from modules.drowsiness import DrowsinessDetector
from modules.object_detection import ObjectDetection

# Hardware Simulation
from hardware.alcohol_sensor import AlcoholSensor

detection_bp = Blueprint('detection', __name__)

# Initialize Detectors
helmet_detector = HelmetDetection()
face_age_detector = FaceAgeDetection()
drowsiness_detector = DrowsinessDetector()
object_detector = ObjectDetection()
alcohol_sensor = AlcoholSensor()

import threading
import time

import threading
import time

# Thread-safe global variables
global_frame = None
frame_lock = threading.Lock()
camera_active = False
thread = None

def capture_thread():
    global global_frame, camera_active
    # Open camera ONLY when thread starts
    cap = cv2.VideoCapture(0)
    time.sleep(1) # Hardware warmup
    
    while camera_active:
        success, frame = cap.read()
        if success:
            with frame_lock:
                global_frame = frame.copy()
        time.sleep(0.02) # Cap at ~50fps
        
    cap.release()

def start_camera_if_needed():
    global camera_active, thread
    if not camera_active:
        camera_active = True
        thread = threading.Thread(target=capture_thread, daemon=True)
        thread.start()

def get_current_frame():
    with frame_lock:
        if global_frame is not None:
            return True, global_frame.copy()
        return False, None

def generate_frames():
    start_camera_if_needed() # Triggers the camera hardware ON
    while True:
        success, frame = get_current_frame()
        if not success:
            time.sleep(0.1)
            continue
        
        # Stream raw JPG frame back to dashboard
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@detection_bp.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@detection_bp.route('/status', methods=['GET'])
def get_status():
    """
    Main detection endpoint. Returns safe defaults if camera not started yet.
    """
    try:
        success, frame = get_current_frame()
        
        # Camera not started yet - return safe defaults (no 500!)
        if not success:
            return jsonify({
                'success': True,
                'camera_active': False,
                'helmet_status': {'worn': False, 'block_reason': 'Camera not started'},
                'alcohol_status': {'reading': 0, 'is_intoxicated': False, 'block_reason': ''},
                'rider_info': {'age_results': [], 'age_group': 'N/A', 'speed_limit': 'Standard'},
                'safety_status': {'is_drowsy': False, 'objects': []},
                'ignition': {'blocked': True, 'reasons': ['Camera not started']}
            }), 200

        # AI Detection
        helmet_worn = helmet_detector.detect(frame)
        age_results = face_age_detector.detect_and_predict(frame)
        is_drowsy = drowsiness_detector.detect(frame)
        objects_detected = object_detector.detect(frame)
        
        # Hardware simulation
        alcohol_reading = alcohol_sensor.get_reading()
        is_drunk = alcohol_sensor.is_intoxicated(alcohol_reading)
        
        # Core Safety Logic
        start_blocked = False
        block_reasons = []
        if not helmet_worn:
            start_blocked = True
            block_reasons.append("Helmet Not Worn")
        if is_drunk:
            start_blocked = True
            block_reasons.append("Alcohol Detected")

        # Handle Age groups
        age_group = "Unknown"
        if age_results:
            age_group = age_results[0]['age_group']
        
        speed_limit = "Standard"
        if age_group == "<18":
            speed_limit = "Restricted (30km/h)"
        
        return jsonify({
            'success': True,
            'camera_active': True,
            'helmet_status': {
                'worn': helmet_worn,
                'block_reason': "Please wear your helmet!" if not helmet_worn else ""
            },
            'alcohol_status': {
                'reading': alcohol_reading,
                'is_intoxicated': is_drunk,
                'block_reason': "Alcohol level exceeded! Start blocked." if is_drunk else ""
            },
            'rider_info': {
                'age_results': [{'age': r['age'], 'age_group': r['age_group']} for r in age_results],
                'age_group': age_group,
                'speed_limit': speed_limit
            },
            'safety_status': {
                'is_drowsy': is_drowsy,
                'objects': objects_detected
            },
            'ignition': {
                'blocked': start_blocked,
                'reasons': block_reasons
            }
        }), 200

    except Exception as e:
        return jsonify({'message': f'Server Error: {str(e)}'}), 500

@detection_bp.route('/helmet', methods=['GET'])
def check_helmet():
    success, frame = get_current_frame()
    if success:
        worn = helmet_detector.detect(frame)
        return jsonify({'helmet_worn': worn})
    return jsonify({'message': 'Camera error'}), 500

@detection_bp.route('/age', methods=['GET'])
def check_age():
    success, frame = get_current_frame()
    if success:
        results = face_age_detector.detect_and_predict(frame)
        return jsonify({'age_results': results})
    return jsonify({'message': 'Camera error'}), 500

@detection_bp.route('/drowsiness', methods=['GET'])
def check_drowsiness():
    success, frame = get_current_frame()
    if success:
        drowsy = drowsiness_detector.detect(frame)
        return jsonify({'is_drowsy': drowsy})
    return jsonify({'message': 'Camera error'}), 500
