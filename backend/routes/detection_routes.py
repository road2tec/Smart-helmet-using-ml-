from flask import Blueprint, jsonify, Response, request
import cv2
import base64
import numpy as np
import datetime
import copy
import os
from pathlib import Path
from utils.db import db
from utils.config import Config
from utils.email_alert import send_accident_alert_email
from utils.location_service import get_laptop_location

# Hardware Simulation
from hardware.accident_detection import AccidentDetector
from hardware.alcohol_sensor import AlcoholSensor

detection_bp = Blueprint('detection', __name__)

# Lazy initialize heavy AI detectors so app boot is fast and auth routes stay available.
helmet_detector = None
face_age_detector = None
drowsiness_detector = None
object_detector = None
alcohol_sensor = AlcoholSensor()
accident_detector = AccidentDetector(cooldown_sec=Config.ACCIDENT_ALERT_COOLDOWN_SEC)


def ensure_detectors_initialized():
    """Initialize AI detectors only when detection endpoints are first used."""
    global helmet_detector, face_age_detector, drowsiness_detector, object_detector

    # Import AI modules lazily to keep app startup fast for auth/register endpoints.
    from modules.helmet_detection import HelmetDetection
    from modules.face_age import FaceAgeDetection
    from modules.drowsiness import DrowsinessDetector
    from modules.object_detection import ObjectDetection

    if helmet_detector is None:
        helmet_detector = HelmetDetection()
    if face_age_detector is None:
        face_age_detector = FaceAgeDetection()
    if drowsiness_detector is None:
        drowsiness_detector = DrowsinessDetector()
    if object_detector is None:
        object_detector = ObjectDetection()

import threading
import time

# Thread-safe global variables
global_frame = None
frame_lock = threading.Lock()
camera_active = False
thread = None
camera_error = ""
active_camera_index = None

# Cached AI state so /detect/status remains responsive even if inference is heavy.
ai_state_lock = threading.Lock()


def _default_ai_state():
    return {
        'helmet_worn': False,
        'age_results': [],
        'is_drowsy': False,
        'drowsiness_debug': {
            'ear': 0.0,
            'eyes_closed_duration': 0.0,
            'eyes_detected': 0,
        },
        'objects_detected': [],
        'accident_status': {
            'detected': False,
            'email_sent': False,
            'email_message': '',
            'location': None,
            'motion_score': 0.0,
        },
        'age_group': 'N/A',
        'speed_limit': 'Standard',
    }


latest_ai_state = _default_ai_state()
ai_worker_running = False
ai_worker_started_at = 0.0
ai_last_update = 0.0
ai_worker_error = ""
AI_MIN_INTERVAL_SEC = 0.35
AI_STUCK_SEC = 12.0

detector_init_attempted = {
    'helmet': False,
    'age': False,
    'drowsiness': False,
    'object': False,
}
detector_init_errors = {}

accident_state_lock = threading.Lock()
last_accident_event = {
    'active_until': 0.0,
    'payload': {
        'detected': False,
        'email_sent': False,
        'email_message': '',
        'location': None,
        'motion_score': 0.0,
    },
}
ACCIDENT_LATCH_SEC = 8.0


def _ensure_detector_instances():
    global helmet_detector, face_age_detector, drowsiness_detector, object_detector

    backend_dir = Path(__file__).resolve().parents[1]

    if not detector_init_attempted['helmet']:
        detector_init_attempted['helmet'] = True
        try:
            from modules.helmet_detection import HelmetDetection
            helmet_model_path = backend_dir / "models" / "helmet_model.pt"
            helmet_detector = HelmetDetection(model_path=str(helmet_model_path))
            detector_init_errors.pop('helmet', None)
        except Exception as exc:
            detector_init_errors['helmet'] = str(exc)

    if os.getenv("ENABLE_AGE_DETECTION_API", "1") == "1" and not detector_init_attempted['age']:
        detector_init_attempted['age'] = True
        try:
            from modules.face_age import FaceAgeDetection
            face_age_detector = FaceAgeDetection()
            detector_init_errors.pop('age', None)
        except Exception as exc:
            detector_init_errors['age'] = str(exc)

    if os.getenv("ENABLE_DROWSINESS_DETECTION_API", "1") == "1" and not detector_init_attempted['drowsiness']:
        detector_init_attempted['drowsiness'] = True
        try:
            from modules.drowsiness import DrowsinessDetector
            drowsiness_detector = DrowsinessDetector()
            detector_init_errors.pop('drowsiness', None)
        except Exception as exc:
            detector_init_errors['drowsiness'] = str(exc)

    # YOLO object detection can be heavy; keep it optional for API responsiveness.
    if os.getenv("ENABLE_OBJECT_DETECTION_API", "0") == "1" and not detector_init_attempted['object']:
        detector_init_attempted['object'] = True
        try:
            from modules.object_detection import ObjectDetection
            yolo_path = backend_dir / "yolov8n.pt"
            object_detector = ObjectDetection(model_path=str(yolo_path))
            detector_init_errors.pop('object', None)
        except Exception as exc:
            detector_init_errors['object'] = str(exc)


def _compute_ai_state(frame):
    state = _default_ai_state()
    local_errors = []

    try:
        _ensure_detector_instances()
    except Exception as exc:
        local_errors.append(f"Detector init failed: {exc}")
        return state, "; ".join(local_errors)

    if detector_init_errors:
        local_errors.append("Init warnings: " + "; ".join([f"{k}={v}" for k, v in detector_init_errors.items()]))

    try:
        if helmet_detector is not None:
            state['helmet_worn'] = bool(helmet_detector.detect(frame))
    except Exception as exc:
        local_errors.append(f"Helmet detection failed: {exc}")

    age_results = []
    try:
        if face_age_detector is not None:
            age_results = face_age_detector.detect_and_predict(frame)
    except Exception as exc:
        local_errors.append(f"Age detection failed: {exc}")

    try:
        if drowsiness_detector is not None:
            if hasattr(drowsiness_detector, 'analyze'):
                drowsy_info = drowsiness_detector.analyze(frame)
                state['is_drowsy'] = bool(drowsy_info.get('is_drowsy', False))
                state['drowsiness_debug'] = {
                    'ear': float(drowsy_info.get('ear', 0.0) or 0.0),
                    'eyes_closed_duration': float(drowsy_info.get('eyes_closed_duration', 0.0) or 0.0),
                    'eyes_detected': int(drowsy_info.get('eyes_detected', 0) or 0),
                }
            else:
                state['is_drowsy'] = bool(drowsiness_detector.detect(frame))
    except Exception as exc:
        local_errors.append(f"Drowsiness detection failed: {exc}")

    try:
        if object_detector is not None:
            state['objects_detected'] = object_detector.detect(frame)
    except Exception as exc:
        local_errors.append(f"Object detection failed: {exc}")

    try:
        active_labels = {'person', 'motorcycle', 'bicycle', 'car', 'bus', 'truck'}
        has_activity = any(
            str(det.get('label', '')).lower() in active_labels
            for det in state.get('objects_detected', [])
        )
        now = time.time()
        accident_detected = accident_detector.detect_accident(
            frame=frame,
            scene_active=has_activity,
        )

        current_payload = {
            'detected': accident_detected,
            'email_sent': False,
            'email_message': '',
            'location': None,
            'motion_score': accident_detector.get_last_motion_score(),
        }

        if accident_detected:
            location = get_laptop_location()
            email_sent, email_message = send_accident_alert_email(location=location)
            current_payload = {
                'detected': True,
                'email_sent': email_sent,
                'email_message': email_message,
                'location': location,
                'motion_score': accident_detector.get_last_motion_score(),
            }

            with accident_state_lock:
                last_accident_event['active_until'] = now + ACCIDENT_LATCH_SEC
                last_accident_event['payload'] = current_payload

        with accident_state_lock:
            is_latched = now <= last_accident_event['active_until']
            latched_payload = copy.deepcopy(last_accident_event['payload'])

        if is_latched:
            state['accident_status'] = latched_payload
            state['accident_status']['detected'] = True
        else:
            state['accident_status'] = current_payload
    except Exception as exc:
        local_errors.append(f"Accident alert failed: {exc}")

    state['age_results'] = [
        {
            'age': r.get('age', 'N/A'),
            'age_group': r.get('age_group', 'N/A'),
            'binary_age': r.get('binary_age', r.get('age_group', 'N/A'))
        }
        for r in age_results
    ]

    if state['age_results']:
        state['age_group'] = state['age_results'][0].get('age_group', 'N/A')
    else:
        state['age_group'] = 'N/A'

    if state['age_group'] in {'<18', 'Below 18'}:
        state['speed_limit'] = 'Restricted (30km/h)'

    return state, "; ".join(local_errors)


def _run_ai_worker(frame):
    global latest_ai_state, ai_worker_running, ai_last_update, ai_worker_error

    try:
        new_state, error_text = _compute_ai_state(frame)
        with ai_state_lock:
            latest_ai_state = new_state
            ai_last_update = time.time()
            ai_worker_error = error_text
    finally:
        ai_worker_running = False


def _parse_camera_indices():
    raw = os.getenv("CAMERA_INDEX", "0,1,2,3")
    indices = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            indices.append(int(part))
        except ValueError:
            continue
    return indices or [0, 1, 2, 3]


def _open_camera_device():
    def is_usable_frame(frame):
        if frame is None or frame.size == 0:
            return False
        # Reject dead/virtual camera feeds that return a fully black static frame.
        if float(frame.mean()) <= 1.0 and float(frame.std()) <= 1.0:
            return False
        return True

    backend_entries = []
    if hasattr(cv2, "CAP_DSHOW"):
        backend_entries.append(("DSHOW", cv2.CAP_DSHOW))
    if hasattr(cv2, "CAP_MSMF"):
        backend_entries.append(("MSMF", cv2.CAP_MSMF))
    backend_entries.append(("ANY", cv2.CAP_ANY))

    for idx in _parse_camera_indices():
        for backend_name, backend in backend_entries:
            cap = cv2.VideoCapture(idx, backend)
            if cap is None or not cap.isOpened():
                if cap is not None:
                    cap.release()
                continue

            # Keep capture queue small to avoid stale/blocked frames.
            if hasattr(cv2, "CAP_PROP_BUFFERSIZE"):
                try:
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                except Exception:
                    pass

            # Validate by reading a real frame before accepting this device.
            first_frame_ok = False
            for _ in range(30):
                ok, frame = cap.read()
                if ok and is_usable_frame(frame):
                    first_frame_ok = True
                    break
                time.sleep(0.04)

            if first_frame_ok:
                print(f"[Camera] Using index {idx} via {backend_name}")
                return cap, idx

            cap.release()

    return None, None


def _build_placeholder_frame(message: str) -> bytes:
    canvas = np.full((540, 960, 3), 18, dtype=np.uint8)
    cv2.rectangle(canvas, (40, 40), (920, 500), (40, 40, 40), 2)
    cv2.putText(
        canvas,
        "SMARTCORE CAMERA",
        (320, 210),
        cv2.FONT_HERSHEY_SIMPLEX,
        1.0,
        (90, 180, 255),
        2,
        cv2.LINE_AA,
    )
    cv2.putText(
        canvas,
        message[:95],
        (90, 290),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.72,
        (230, 230, 230),
        2,
        cv2.LINE_AA,
    )
    ok, buffer = cv2.imencode('.jpg', canvas)
    if not ok:
        return b""
    return buffer.tobytes()

def capture_thread():
    global global_frame, camera_active, camera_error, active_camera_index

    cap = None
    read_failures = 0

    while camera_active:
        if cap is None:
            cap, chosen_index = _open_camera_device()
            if cap is None:
                camera_error = "Unable to access camera. Close other apps or set CAMERA_INDEX=0,1"
                active_camera_index = None
                with frame_lock:
                    global_frame = None
                time.sleep(0.6)
                continue

            camera_error = ""
            active_camera_index = chosen_index
            read_failures = 0
            time.sleep(0.1)

        success, frame = cap.read()
        if success and frame is not None and frame.size > 0:
            read_failures = 0
            with frame_lock:
                global_frame = frame.copy()
            if camera_error:
                camera_error = ""
        else:
            read_failures += 1
            if read_failures >= 25:
                camera_error = f"No frames from camera index {active_camera_index}. Reconnecting..."
                with frame_lock:
                    global_frame = None
                cap.release()
                cap = None
                active_camera_index = None
                read_failures = 0
                time.sleep(0.3)
                continue

        time.sleep(0.02)  # Cap at ~50fps

    if cap is not None:
        cap.release()
    active_camera_index = None

def start_camera_if_needed():
    global camera_active, thread, camera_error
    if not camera_active:
        camera_active = True
        camera_error = "Starting camera..."
        thread = threading.Thread(target=capture_thread, daemon=True)
        thread.start()

@detection_bp.route('/stop', methods=['POST'])
def stop_camera():
    global camera_active, global_frame, camera_error, active_camera_index
    camera_active = False
    camera_error = ""
    active_camera_index = None
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
            placeholder = _build_placeholder_frame(camera_error or "Waiting for camera frames...")
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + placeholder + b'\r\n')
            time.sleep(0.12)
            continue
        
        # Stream raw JPG frame back to dashboard
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret:
            continue
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        time.sleep(0.05)

@detection_bp.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@detection_bp.route('/frame.jpg')
def frame_snapshot():
    """Return a single JPEG frame for frontend polling fallback."""
    start_camera_if_needed()
    success, frame = get_current_frame()

    if not success:
        placeholder = _build_placeholder_frame(camera_error or "Waiting for camera frames...")
        return Response(placeholder, mimetype='image/jpeg')

    ok, buffer = cv2.imencode('.jpg', frame)
    if not ok:
        placeholder = _build_placeholder_frame("Frame encode failed")
        return Response(placeholder, mimetype='image/jpeg')

    return Response(buffer.tobytes(), mimetype='image/jpeg')

@detection_bp.route('/status', methods=['GET'])
def get_status():
    """
    Main detection endpoint. Returns safe defaults if camera not started yet.
    """
    try:
        global ai_worker_running, ai_worker_started_at, ai_worker_error

        success, frame = get_current_frame()
        
        # Camera not started yet - return safe defaults (no 500!)
        if not success:
            camera_reason = camera_error or ("Camera not started" if not camera_active else "Waiting for camera frames")
            return jsonify({
                'success': True,
                'camera_active': camera_active,
                'camera_error': camera_reason,
                'camera_index': active_camera_index,
                'helmet_status': {'worn': False, 'block_reason': camera_reason},
                'alcohol_status': {'reading': 0, 'is_intoxicated': False, 'block_reason': ''},
                'rider_info': {'age_results': [], 'age_group': 'N/A', 'speed_limit': 'Standard'},
                'safety_status': {'is_drowsy': False, 'objects': []},
                'accident_status': {'detected': False, 'email_sent': False, 'email_message': '', 'location': None, 'motion_score': 0.0},
                'accident_detected': False,
                'ignition': {'blocked': True, 'reasons': [camera_reason]}
            }), 200

        # Keep API latency stable: run heavy AI in background and return cached snapshot.
        now = time.time()

        if ai_worker_running and (now - ai_worker_started_at) > AI_STUCK_SEC:
            ai_worker_running = False
            ai_worker_error = "AI inference timed out; retrying."

        if (not ai_worker_running) and ((now - ai_last_update) >= AI_MIN_INTERVAL_SEC):
            ai_worker_running = True
            ai_worker_started_at = now
            threading.Thread(target=_run_ai_worker, args=(frame.copy(),), daemon=True).start()

        with ai_state_lock:
            ai_snapshot = copy.deepcopy(latest_ai_state)
            ai_error_snapshot = ai_worker_error
            ai_last_update_snapshot = ai_last_update

        helmet_worn = bool(ai_snapshot.get('helmet_worn', False))
        age_results = ai_snapshot.get('age_results', [])
        is_drowsy = bool(ai_snapshot.get('is_drowsy', False))
        drowsiness_debug = ai_snapshot.get('drowsiness_debug', {'ear': 0.0, 'eyes_closed_duration': 0.0, 'eyes_detected': 0})
        objects_detected = ai_snapshot.get('objects_detected', [])
        accident_status = ai_snapshot.get('accident_status', {'detected': False, 'email_sent': False, 'email_message': '', 'location': None, 'motion_score': 0.0})
        age_group = ai_snapshot.get('age_group', 'N/A')
        speed_limit = ai_snapshot.get('speed_limit', 'Standard')
        ai_ready = ai_last_update_snapshot > 0
        
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
        if not ai_ready:
            start_blocked = True
            block_reasons.append("AI modules warming up")
        
        # Prepare data for storage/return
        status_data = {
            'success': True,
            'camera_active': True,
            'camera_error': camera_error,
            'ai_warning': ai_error_snapshot,
            'camera_index': active_camera_index,
            'ai_ready': ai_ready,
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
                'age_results': age_results,
                'age_group': age_group,
                'speed_limit': speed_limit
            },
            'safety_status': {
                'is_drowsy': is_drowsy,
                'drowsiness_debug': drowsiness_debug,
                'objects': objects_detected
            },
            'accident_status': accident_status,
            'accident_detected': bool(accident_status.get('detected', False)),
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
            
        if ai_ready and (current_time - get_status.last_save > 5): # Save every 5 seconds
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
