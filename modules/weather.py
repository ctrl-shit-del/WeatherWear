"""
Weather module - fetches real-time weather data and categorizes it.
Supports OpenWeatherMap API with demo/mock fallback.
"""

import os
import json
import random
from datetime import datetime

# Try importing requests, fallback gracefully
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather"
UV_API_URL = "https://api.openweathermap.org/data/2.5/uvi"


DEMO_CITIES = {
    "mumbai": {
        "city": "Mumbai", "country": "IN",
        "temp": 30, "feels_like": 34, "humidity": 82,
        "wind_speed": 15, "description": "Partly cloudy", "icon": "02d",
        "rain_prob": 10, "uv_index": 8, "condition": "warm"
    },
    "delhi": {
        "city": "Delhi", "country": "IN",
        "temp": 22, "feels_like": 20, "humidity": 40,
        "wind_speed": 20, "description": "Clear sky", "icon": "01d",
        "rain_prob": 0, "uv_index": 6, "condition": "cool"
    },
    "london": {
        "city": "London", "country": "GB",
        "temp": 10, "feels_like": 8, "humidity": 75,
        "wind_speed": 30, "description": "Overcast clouds", "icon": "04d",
        "rain_prob": 60, "uv_index": 2, "condition": "cold"
    },
    "new york": {
        "city": "New York", "country": "US",
        "temp": 15, "feels_like": 13, "humidity": 55,
        "wind_speed": 25, "description": "Light rain", "icon": "10d",
        "rain_prob": 80, "uv_index": 3, "condition": "cool"
    },
    "dubai": {
        "city": "Dubai", "country": "AE",
        "temp": 38, "feels_like": 42, "humidity": 55,
        "wind_speed": 10, "description": "Sunny", "icon": "01d",
        "rain_prob": 0, "uv_index": 10, "condition": "hot"
    },
    "toronto": {
        "city": "Toronto", "country": "CA",
        "temp": 2, "feels_like": -3, "humidity": 65,
        "wind_speed": 28, "description": "Snow showers", "icon": "13d",
        "rain_prob": 90, "uv_index": 1, "condition": "very_cold"
    },
    "sydney": {
        "city": "Sydney", "country": "AU",
        "temp": 26, "feels_like": 27, "humidity": 68,
        "wind_speed": 18, "description": "Mostly sunny", "icon": "02d",
        "rain_prob": 15, "uv_index": 7, "condition": "warm"
    },
    "paris": {
        "city": "Paris", "country": "FR",
        "temp": 12, "feels_like": 10, "humidity": 70,
        "wind_speed": 22, "description": "Light drizzle", "icon": "09d",
        "rain_prob": 70, "uv_index": 3, "condition": "cool"
    },
    "singapore": {
        "city": "Singapore", "country": "SG",
        "temp": 31, "feels_like": 37, "humidity": 85,
        "wind_speed": 12, "description": "Thunderstorm", "icon": "11d",
        "rain_prob": 95, "uv_index": 6, "condition": "hot"
    },
    "bangalore": {
        "city": "Bangalore", "country": "IN",
        "temp": 24, "feels_like": 24, "humidity": 60,
        "wind_speed": 10, "description": "Pleasant and clear", "icon": "01d",
        "rain_prob": 5, "uv_index": 5, "condition": "warm"
    }
}


def get_temp_category(temp: float) -> str:
    """Categorize temperature into named ranges."""
    if temp < 5:
        return "very_cold"
    elif temp < 15:
        return "cold"
    elif temp < 22:
        return "cool"
    elif temp < 30:
        return "warm"
    else:
        return "hot"


def get_weather_description(data: dict) -> dict:
    """Build a human-readable weather summary."""
    temp = data.get("temp", 20)
    rain_prob = data.get("rain_prob", 0)
    uv_index = data.get("uv_index", 3)
    wind_speed = data.get("wind_speed", 10)
    humidity = data.get("humidity", 50)

    warnings = []
    if rain_prob >= 60:
        warnings.append("🌧️ High chance of rain — bring waterproofs")
    elif rain_prob >= 30:
        warnings.append("🌦️ Possible showers — keep an umbrella handy")
    if uv_index >= 8:
        warnings.append("☀️ Very high UV — sun protection essential")
    elif uv_index >= 6:
        warnings.append("🕶️ High UV — wear sunglasses and hat")
    if wind_speed >= 40:
        warnings.append("💨 Strong winds — secure loose clothing")
    if temp < 5:
        warnings.append("🥶 Extreme cold — layer up heavily")
    if humidity >= 80:
        warnings.append("💧 High humidity — choose breathable fabrics")

    return {
        "temp_category": get_temp_category(temp),
        "temp_label": _temp_label(temp),
        "warnings": warnings,
        "comfort_note": _comfort_note(temp, humidity)
    }


def _temp_label(temp: float) -> str:
    if temp < 5:
        return "Very Cold"
    elif temp < 15:
        return "Cold"
    elif temp < 22:
        return "Cool"
    elif temp < 30:
        return "Warm"
    else:
        return "Hot"


def _comfort_note(temp: float, humidity: float) -> str:
    if temp > 28 and humidity > 75:
        return "High heat + humidity — stay hydrated and choose moisture-wicking fabrics."
    elif temp < 5:
        return "Dangerously cold — maximize insulation layers."
    elif 18 <= temp <= 24 and humidity < 65:
        return "Near-perfect comfort conditions — enjoy your day!"
    else:
        return "Moderate conditions — dress in adaptable layers."


def get_weather_from_api(city: str, api_key: str) -> dict | None:
    """Fetch real weather from OpenWeatherMap."""
    if not REQUESTS_AVAILABLE:
        return None
    try:
        params = {
            "q": city,
            "appid": api_key,
            "units": "metric"
        }
        r = requests.get(OPENWEATHER_API_URL, params=params, timeout=5)
        if r.status_code == 200:
            raw = r.json()
            temp = raw["main"]["temp"]
            return {
                "city": raw["name"],
                "country": raw["sys"]["country"],
                "temp": round(temp, 1),
                "feels_like": round(raw["main"]["feels_like"], 1),
                "humidity": raw["main"]["humidity"],
                "wind_speed": round(raw["wind"]["speed"] * 3.6, 1),  # m/s → km/h
                "description": raw["weather"][0]["description"].title(),
                "icon": raw["weather"][0]["icon"],
                "rain_prob": int(raw.get("rain", {}).get("1h", 0) * 100),
                "uv_index": 0,  # Requires separate UV endpoint
                "condition": get_temp_category(temp),
                "source": "live"
            }
    except Exception:
        pass
    return None


def get_weather(city: str) -> dict:
    """
    Get weather data for a city.
    Uses OpenWeatherMap API if key is set, else demo data.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")

    if api_key and api_key != "your_api_key_here":
        result = get_weather_from_api(city, api_key)
        if result:
            desc = get_weather_description(result)
            result.update(desc)
            return {"success": True, "data": result}

    # Demo mode fallback
    city_lower = city.lower().strip()
    demo_data = DEMO_CITIES.get(city_lower)

    if not demo_data:
        # Generate plausible random demo data for unknown cities
        temp = random.randint(10, 30)
        demo_data = {
            "city": city.title(),
            "country": "IN",
            "temp": temp,
            "feels_like": temp - 2,
            "humidity": random.randint(40, 85),
            "wind_speed": random.randint(5, 35),
            "description": random.choice(["Clear sky", "Partly cloudy", "Overcast"]),
            "icon": "02d",
            "rain_prob": random.randint(0, 40),
            "uv_index": random.randint(2, 9),
            "condition": get_temp_category(temp)
        }

    result = dict(demo_data)
    desc = get_weather_description(result)
    result.update(desc)
    result["source"] = "demo"
    result["timestamp"] = datetime.now().strftime("%H:%M, %d %B %Y")

    return {"success": True, "data": result}
