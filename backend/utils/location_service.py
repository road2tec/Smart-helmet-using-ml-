import json
import urllib.error
import urllib.request
from typing import Dict, Optional

from hardware.gps_module import GPSModule


_gps_fallback = GPSModule()


def _fetch_json(url: str, timeout_sec: float = 4.0) -> Optional[Dict]:
    try:
        with urllib.request.urlopen(url, timeout=timeout_sec) as response:
            if response.status != 200:
                return None
            payload = response.read().decode("utf-8", errors="ignore")
            return json.loads(payload)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None
    except Exception:
        return None


def _format_location(lat, lng, city, region, country, ip, source):
    return {
        "lat": lat,
        "lng": lng,
        "city": city or "Unknown",
        "region": region or "Unknown",
        "country": country or "Unknown",
        "ip": ip or "Unknown",
        "source": source,
        "map_link": f"https://www.google.com/maps?q={lat},{lng}",
    }


def _safe_round_float(value, digits=6):
    try:
        return round(float(value), digits)
    except (TypeError, ValueError):
        return None


def get_laptop_location() -> Dict:
    """
    Fetches approximate laptop location using IP geolocation.
    Falls back to simulated GPS coordinates if external services are unavailable.
    """
    ipapi_data = _fetch_json("https://ipapi.co/json/")
    ipapi_lat = _safe_round_float(ipapi_data.get("latitude")) if ipapi_data else None
    ipapi_lng = _safe_round_float(ipapi_data.get("longitude")) if ipapi_data else None
    if ipapi_data and ipapi_lat is not None and ipapi_lng is not None:
        return _format_location(
            lat=ipapi_lat,
            lng=ipapi_lng,
            city=ipapi_data.get("city"),
            region=ipapi_data.get("region"),
            country=ipapi_data.get("country_name"),
            ip=ipapi_data.get("ip"),
            source="ipapi.co",
        )

    ip_api_data = _fetch_json("http://ip-api.com/json/")
    ip_api_lat = _safe_round_float(ip_api_data.get("lat")) if ip_api_data else None
    ip_api_lng = _safe_round_float(ip_api_data.get("lon")) if ip_api_data else None
    if ip_api_data and ip_api_data.get("status") == "success" and ip_api_lat is not None and ip_api_lng is not None:
        return _format_location(
            lat=ip_api_lat,
            lng=ip_api_lng,
            city=ip_api_data.get("city"),
            region=ip_api_data.get("regionName"),
            country=ip_api_data.get("country"),
            ip=ip_api_data.get("query"),
            source="ip-api.com",
        )

    gps_coords = _gps_fallback.get_coordinates()
    return _format_location(
        lat=gps_coords["lat"],
        lng=gps_coords["lng"],
        city="Unknown",
        region="Unknown",
        country="Unknown",
        ip="Unknown",
        source="gps-fallback",
    )