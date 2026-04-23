import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def _int_env(name, default):
    """Safely parse integer env vars with fallback defaults."""
    value = os.getenv(name)
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_super_secret_key_123')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/helmet_safety_db')
    ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 1 day
    EMAIL_USER = os.getenv('EMAIL_USER', '')
    EMAIL_PASS = os.getenv('EMAIL_PASS', '')
    ALERT_EMAIL_TO = os.getenv('ALERT_EMAIL_TO', 'pawankute240@gmail.com')
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = _int_env('SMTP_PORT', 465)
    ACCIDENT_ALERT_COOLDOWN_SEC = _int_env('ACCIDENT_ALERT_COOLDOWN_SEC', 120)
