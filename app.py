"""
SORS - Smart Outfit Recommendation System
Flask Backend Application
"""

import json
import os
from functools import wraps
from datetime import datetime

from flask import (
    Flask, render_template, request, jsonify,
    session, redirect, url_for, g, make_response
)

from modules.weather import get_weather
from modules.wardrobe import (
    load_wardrobe, add_item, remove_item,
    update_item, get_analytics, increment_wear
)
from modules.recommendation_engine import recommend

# ---------------------------------------------------------------------------
# App Setup
# ---------------------------------------------------------------------------

app = Flask(__name__, template_folder="WeatherWear", static_folder="WeatherWear", static_url_path="")
app.secret_key = os.environ.get("SECRET_KEY", "sors_super_secret_2026_key")

# Enable CORS for local file testing
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

USERS_FILE = os.path.join(os.path.dirname(__file__), "data/users.json")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def load_users() -> dict:
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}


def save_users(users: dict) -> None:
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            if request.is_json:
                return jsonify({"error": "Authentication required"}), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated


def current_user() -> dict:
    users = load_users()
    return users.get(session.get("user_id", ""), {})


# ---------------------------------------------------------------------------
# Page Routes
# ---------------------------------------------------------------------------


@app.route("/")
def index():
    if "user_id" not in session:
        return redirect(url_for("login_page"))
    return render_template("index.html", user=current_user())


@app.route("/login")
def login_page():
    if "user_id" in session:
        return redirect(url_for("index"))
    return render_template("login.html")


# ---------------------------------------------------------------------------
# Auth API
# ---------------------------------------------------------------------------


@app.route("/api/auth/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    username = data.get("username", "").strip().lower()
    password = data.get("password", "")

    users = load_users()
    user = users.get(username)

    if user and user.get("password") == password:
        session["user_id"] = username
        session.permanent = False
        return jsonify({
            "success": True,
            "user": {
                "id": username,
                "name": user.get("name", username.title()),
                "email": user.get("email", ""),
                "preferences": user.get("preferences", {})
            }
        })

    return jsonify({"success": False, "error": "Invalid username or password"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def api_logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/auth/user")
@login_required
def api_get_user():
    user = current_user()
    return jsonify({
        "id": session["user_id"],
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "preferences": user.get("preferences", {})
    })


@app.route("/api/auth/preferences", methods=["PUT"])
@login_required
def api_update_preferences():
    data = request.get_json() or {}
    users = load_users()
    uid = session["user_id"]
    if uid in users:
        if "preferences" not in users[uid]:
            users[uid]["preferences"] = {}
        users[uid]["preferences"].update(data)
        save_users(users)
        return jsonify({"success": True, "preferences": users[uid]["preferences"]})
    return jsonify({"error": "User not found"}), 404


# ---------------------------------------------------------------------------
# Weather API
# ---------------------------------------------------------------------------


@app.route("/api/weather", methods=["POST"])
@login_required
def api_weather():
    data = request.get_json() or {}
    city = data.get("city", "").strip()

    if not city:
        # Fall back to user's saved location
        user = current_user()
        city = user.get("preferences", {}).get("location", "Mumbai")

    result = get_weather(city)
    return jsonify(result)


# ---------------------------------------------------------------------------
# Recommendation API
# ---------------------------------------------------------------------------


@app.route("/api/recommend", methods=["POST"])
@login_required
def api_recommend():
    data = request.get_json() or {}
    weather_data = data.get("weather", {})
    mode = data.get("mode", "hybrid")

    if not weather_data:
        return jsonify({"error": "Weather data required"}), 400

    uid = session["user_id"]
    wardrobe = load_wardrobe(uid)
    user = current_user()
    preferences = user.get("preferences", {})

    result = recommend(weather_data, wardrobe, preferences, mode)
    return jsonify({"success": True, **result})


# ---------------------------------------------------------------------------
# Wardrobe API
# ---------------------------------------------------------------------------


@app.route("/api/wardrobe", methods=["GET"])
@login_required
def api_get_wardrobe():
    uid = session["user_id"]
    items = load_wardrobe(uid)
    return jsonify({"items": items, "total": len(items)})


@app.route("/api/wardrobe", methods=["POST"])
@login_required
def api_add_wardrobe():
    data = request.get_json() or {}
    uid = session["user_id"]
    new_item = add_item(uid, data)
    return jsonify({"success": True, "item": new_item}), 201


@app.route("/api/wardrobe/<item_id>", methods=["DELETE"])
@login_required
def api_remove_wardrobe(item_id):
    uid = session["user_id"]
    success = remove_item(uid, item_id)
    if success:
        return jsonify({"success": True})
    return jsonify({"error": "Item not found"}), 404


@app.route("/api/wardrobe/<item_id>", methods=["PUT"])
@login_required
def api_update_wardrobe(item_id):
    data = request.get_json() or {}
    uid = session["user_id"]
    updated = update_item(uid, item_id, data)
    if updated:
        return jsonify({"success": True, "item": updated})
    return jsonify({"error": "Item not found"}), 404


@app.route("/api/wardrobe/wear", methods=["POST"])
@login_required
def api_mark_worn():
    data = request.get_json() or {}
    item_ids = data.get("item_ids", [])
    uid = session["user_id"]
    increment_wear(uid, item_ids)
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# Analytics API
# ---------------------------------------------------------------------------


@app.route("/api/analytics")
@login_required
def api_analytics():
    uid = session["user_id"]
    analytics = get_analytics(uid)
    return jsonify(analytics)


# ---------------------------------------------------------------------------
# Feedback API
# ---------------------------------------------------------------------------

FEEDBACK_FILE = os.path.join(os.path.dirname(__file__), "data/feedback.json")


def load_feedback() -> list:
    try:
        with open(FEEDBACK_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []


def save_feedback(feedback: list) -> None:
    with open(FEEDBACK_FILE, "w") as f:
        json.dump(feedback, f, indent=2)


@app.route("/api/feedback", methods=["POST"])
@login_required
def api_feedback():
    data = request.get_json() or {}
    feedback = load_feedback()
    entry = {
        "user_id": session["user_id"],
        "outfit_id": data.get("outfit_id"),
        "outfit_name": data.get("outfit_name"),
        "rating": data.get("rating", 0),
        "comment": data.get("comment", ""),
        "weather_context": data.get("weather_context", {}),
        "timestamp": datetime.now().isoformat()
    }
    feedback.append(entry)
    save_feedback(feedback)
    return jsonify({"success": True})


# ---------------------------------------------------------------------------
# V2 Advanced Features (Calendar & Trends)
# ---------------------------------------------------------------------------

@app.route("/api/calendar/today", methods=["GET", "OPTIONS"])
def api_calendar_today():
    if request.method == "OPTIONS":
        return make_response()
    # Mocking Calendar API response for V2 MVP
    # In production, this would call Google Calendar API using stored OAuth tokens
    events = [
        {"time": "09:00 AM", "title": "Coffee catchup (Casual)", "tags": ["casual", "day"]},
        {"time": "14:00 PM", "title": "Board Meeting", "tags": ["formal", "office", "smart casual"]},
        {"time": "18:30 PM", "title": "Evening Gym Session", "tags": ["sport", "workout"]}
    ]
    return jsonify({"success": True, "events": events, "inferred_context": "hybrid"})

@app.route("/api/trends", methods=["GET", "OPTIONS"])
def api_trends():
    if request.method == "OPTIONS":
        return make_response()
    # Mocking Trend Scraper response for V2 MVP
    trends = [
        {"name": "Oversized Linen Shirts", "trend_score": 98, "price": "$45", "drop": True},
        {"name": "Chunky Loafers", "trend_score": 92, "price": "$120", "drop": False},
        {"name": "Tech-Wear Cargo Pants", "trend_score": 88, "price": "$85", "drop": True}
    ]
    return jsonify({"success": True, "trending_items": trends})

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------


@app.route("/api/health")
def api_health():
    return jsonify({
        "status": "ok",
        "app": "SORS",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("DEBUG", "true").lower() == "true"
    print(f"🎽 SORS starting on http://localhost:{port}")
    print(f"   Demo login: username=demo, password=demo123")
    app.run(host="0.0.0.0", port=port, debug=debug)
