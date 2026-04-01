from flask import Blueprint, jsonify, Response, request
import cv2
import base64
import numpy as np
import datetime
from utils.db import db

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

@detection_bp.route('/stop', methods=['POST'])
def stop_camera():
    global camera_active, global_frame
    camera_active = False
    with frame_lock:
        global_frame = None
    return jsonify({'success': True, 'message': 'Camera securely terminated.'}), 200

def get_current_frame():
    with frame_lock:
        if global_frame is not None:
            return True, global_frame.copy()
        return False, None

def generate_frames():
    start_camera_if_needed()
    while camera_active:
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
        
        # Prepare data for storage/return
        status_data = {
            'success': True,
            'camera_active': True,
            'timestamp': datetime.datetime.utcnow().isoformat(),
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
        }

        # Persist to MongoDB (throttled to avoid bloat - save every ~5s)
        # We use a simple time check or just save if camera is active
        # To avoid spamming DB, we'll save every 10th request or so, or check time
        current_time = time.time()
        if not hasattr(get_status, 'last_save'):
            get_status.last_save = 0
            
        if current_time - get_status.last_save > 5: # Save every 5 seconds
            db.history.insert_one({
                'helmet': helmet_worn,
                'faces': status_data['rider_info']['age_results'],
                'objects': objects_detected,
                'status': 'OK' if helmet_worn and not is_drunk else 'WARNING',
                'timestamp': datetime.datetime.now(datetime.timezone.utc) # Aware datetime
            })
            get_status.last_save = current_time

        return jsonify(status_data), 200

    except Exception as e:
        return jsonify({'message': f'Server Error: {str(e)}'}), 500

@detection_bp.route('/history', methods=['GET'])
def get_history():
    """Fetch stored detection history from MongoDB."""
    try:
        # Get last 50 logs
        logs = list(db.history.find().sort('timestamp', -1).limit(50))
        
        # Convert ObjectId and datetime to string for JSON serialization
        for log in logs:
            log['_id'] = str(log['_id'])
            if 'timestamp' in log:
                # Add Z suffix if not present to ensure browser detects UTC
                ts = log['timestamp']
                if ts.tzinfo is None:
                    log['timestamp'] = ts.isoformat() + "Z"
                else:
                    log['timestamp'] = ts.isoformat()
                
        return jsonify({'success': True, 'logs': logs}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching history: {str(e)}'}), 500
