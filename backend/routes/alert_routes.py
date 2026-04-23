from flask import Blueprint, jsonify
from hardware.accident_detection import AccidentDetector
from utils.db import db
from utils.email_alert import send_accident_alert_email
from utils.location_service import get_laptop_location
import datetime

alert_bp = Blueprint('alerts', __name__)

# Initialize hardware simulations
accident_detector = AccidentDetector()

@alert_bp.route('/check-accident', methods=['GET'])
def check_accident():
    """
    Check if an accident is detected and send alerts if true.
    """
    accident = accident_detector.detect_accident()
    location = get_laptop_location()
    
    if accident:
        email_sent, email_message = send_accident_alert_email(location=location)

        # Log to MongoDB
        alert_log = {
            'type': 'Accident Detected',
            'location': location,
            'timestamp': datetime.datetime.utcnow(),
            'status': 'Panic Alert Sent',
            'email_sent': email_sent,
            'email_message': email_message,
        }
        db.alerts.insert_one(alert_log)
        
        return jsonify({
            'accident_detected': True,
            'location': location,
            'email_sent': email_sent,
            'email_message': email_message,
            'message': 'ACCIDENT DETECTED! Sending GPS and email alert...'
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
    location = get_laptop_location()
    email_sent, email_message = send_accident_alert_email(location=location)
    
    manual_alert = {
        'type': 'Manual Panic Alert',
        'location': location,
        'timestamp': datetime.datetime.utcnow(),
        'status': 'Manual Alert Distributed',
        'email_sent': email_sent,
        'email_message': email_message,
    }
    db.alerts.insert_one(manual_alert)
    
    return jsonify({
        'success': True,
        'location': location,
        'email_sent': email_sent,
        'email_message': email_message,
        'message': 'Manual panic alert sent with laptop location'
    }), 200

@alert_bp.get('/history')
def get_alert_history():
    """
    Returns history of safety alerts/accidents.
    """
    logs = list(db.alerts.find().sort('timestamp', -1).limit(20))
    for log in logs:
        log['_id'] = str(log['_id']) # Convert ObjectId to string
    return jsonify({'history': logs}), 200
