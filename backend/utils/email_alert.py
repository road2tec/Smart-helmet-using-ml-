import smtplib
import ssl
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Dict, Tuple

from utils.config import Config


def send_accident_alert_email(location: Dict, recipient: str = "") -> Tuple[bool, str]:
    """
    Sends an accident alert email containing detected location details.
    """
    email_user = (Config.EMAIL_USER or "").strip()
    email_pass = (Config.EMAIL_PASS or "").strip()
    to_email = (recipient or Config.ALERT_EMAIL_TO or "").strip()

    if not email_user or not email_pass:
        return False, "EMAIL_USER or EMAIL_PASS is not configured"

    if not to_email:
        return False, "ALERT_EMAIL_TO is not configured"

    lat = location.get("lat", "N/A")
    lng = location.get("lng", "N/A")
    city = location.get("city", "Unknown")
    region = location.get("region", "Unknown")
    country = location.get("country", "Unknown")
    source = location.get("source", "unknown")
    map_link = location.get("map_link", "")

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    message = EmailMessage()
    message["Subject"] = "SMARTCORE ALERT: Accident detected"
    message["From"] = email_user
    message["To"] = to_email
    message.set_content(
        "Emergency Alert from SMARTCORE\n\n"
        "An accident was detected in the live camera pipeline.\n\n"
        f"Time: {timestamp}\n"
        f"Latitude: {lat}\n"
        f"Longitude: {lng}\n"
        f"City: {city}\n"
        f"Region: {region}\n"
        f"Country: {country}\n"
        f"Location Source: {source}\n"
        f"Map: {map_link}\n"
    )

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(Config.SMTP_SERVER, Config.SMTP_PORT, context=context) as server:
            server.login(email_user, email_pass)
            server.send_message(message)
    except Exception as exc:
        return False, f"Failed to send alert email: {exc}"

    return True, f"Alert email sent to {to_email}"