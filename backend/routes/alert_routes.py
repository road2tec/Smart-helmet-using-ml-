from flask import Blueprint, jsonify, request
from hardware.gps_module import GPSModule
from hardware.accident_detection import AccidentDetector
from utils.db import db
import datetime

alert_bp = Blueprint('alerts', __name__)

# Initialize hardware simulations
gps_module = GPSModule()
accident_detector = AccidentDetector()

@alert_bp.route('/check-accident', methods=['GET'])
def check_accident():
    """
    Check if an accident is detected and send alerts if true.
    """
    accident = accident_detector.detect_accident()
    location = gps_module.get_coordinates()
    
    if accident:
        # Log to MongoDB
        alert_log = {
            'type': 'Accident Detected',
            'location': location,
            'timestamp': datetime.datetime.utcnow(),
            'status': 'Panic Alert Sent'
        }
        db.logs.insert_one(alert_log)
        
        return jsonify({
            'accident_detected': True,
            'location': location,
            'message': 'ACCIDENT DETECTED! Sending GPS alert...'
        }), 200

    return jsonify({
        'accident_detected': False,
        'location': location
    }), 200

@alert_bp.route('/send', methods=['POST'])
def send_manual_alert():
    """
    Send a manual panic alert with current GPS location.
    """
    location = gps_module.get_coordinates()
    
    manual_alert = {
        'type': 'Manual Panic Alert',
        'location': location,
        'timestamp': datetime.datetime.utcnow(),
        'status': 'Manual Alert Distributed'
    }
    db.logs.insert_one(manual_alert)
    
    return jsonify({
        'success': True,
        'location': location,
        'message': 'Manual Panic alert sent successfully with GPS location!'
    }), 200

@alert_bp.get('/history')
def get_alert_history():
    """
    Returns history of safety alerts/accidents.
    """
    logs = list(db.logs.find().sort('timestamp', -1).limit(20))
    for log in logs:
        log['_id'] = str(log['_id']) # Convert ObjectId to string
    return jsonify({'history': logs}), 200
