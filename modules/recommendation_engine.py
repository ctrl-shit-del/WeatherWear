"""
Rule-based Outfit Recommendation Engine for SORS.

Modes:
  - wardrobe: only owned items
  - curated: only knowledge base items
  - hybrid: combines both

Ranking factors:
  - Temperature match
  - Rain suitability
  - UV protection
  - Wind resistance
  - User preferences (occasion, sustainability)
  - Layering appropriateness
"""

import json
import os
import math
import joblib
import pandas as pd

OUTFIT_KB_FILE = os.path.join(os.path.dirname(__file__), "../data/outfit_knowledge.json")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/comfort_model.joblib")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "../models/temp_range_encoder.joblib")

# Load ML model and encoder
try:
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
    ML_ENABLED = True
except Exception as e:
    print(f"⚠️ Failed to load ML model: {e}. Falling back to rule-based engine.")
    ML_ENABLED = False


def _load_kb() -> dict:
    with open(OUTFIT_KB_FILE, "r") as f:
        return json.load(f)


def _temp_to_range(temp: float) -> str:
    if temp < 5:   return "very_cold"
    if temp < 15:  return "cold"
    if temp < 22:  return "cool"
    if temp < 30:  return "warm"
    return "hot"


def _compute_comfort_score(outfit: dict, weather: dict, preferences: dict) -> float:
    """
    Score an outfit from 0..10 based on ML model prediction or rule-based fallback.
    """
    if not ML_ENABLED:
        # Fallback to rule-based if ML model fails to load
        return _compute_comfort_score_rule_based(outfit, weather, preferences)

    # Prepare features for ML model
    # Features order must match train_model.py:
    # [temp, humidity, wind_speed, rain_prob, uv_index, outfit_temp_range, is_rain_suitable, 
    #  is_uv_protection, is_wind_resistant, layering_count, occasion_match, sustainability_score]
    
    temp = weather.get("temp", 20)
    humidity = weather.get("humidity", 50)
    wind_speed = weather.get("wind_speed", 10)
    rain_prob = weather.get("rain_prob", 0)
    uv_index = weather.get("uv_index", 3)
    
    outfit_temp_range = outfit.get("temp_range", "cool")
    is_rain_suitable = 1 if outfit.get("rain_suitable") else 0
    is_uv_protection = 1 if outfit.get("uv_protection") else 0
    is_wind_resistant = 1 if outfit.get("wind_resistant") else 0
    layering_count = outfit.get("layering_count", 1)
    
    # Occasion match logic
    user_occasion = preferences.get("occasion", "casual")
    outfit_occasions = outfit.get("occasion", [])
    occasion_match = 1 if user_occasion in outfit_occasions else 0
    
    # Sustainability
    sustainability_score = outfit.get("sustainability_score", 5)
    
    # Encode temp range using the saved encoder
    try:
        encoded_range = encoder.transform([outfit_temp_range])[0]
    except:
        encoded_range = 0 # Default fallback
        
    features = pd.DataFrame([{
        "temp": temp,
        "humidity": humidity,
        "wind_speed": wind_speed,
        "rain_prob": rain_prob,
        "uv_index": uv_index,
        "outfit_temp_range": encoded_range,
        "is_rain_suitable": is_rain_suitable,
        "is_uv_protection": is_uv_protection,
        "is_wind_resistant": is_wind_resistant,
        "layering_count": layering_count,
        "occasion_match": occasion_match,
        "sustainability_score": sustainability_score
    }])
    
    prediction = model.predict(features)[0]
    return round(max(1.0, min(10.0, float(prediction))), 1)


def _compute_comfort_score_rule_based(outfit: dict, weather: dict, preferences: dict) -> float:
    """Original rule-based logic preserved as fallback."""
    score = outfit.get("comfort_base", 7.0)
    temp = weather.get("temp", 20)
    rain_prob = weather.get("rain_prob", 0)
    uv_index = weather.get("uv_index", 3)
    wind_speed = weather.get("wind_speed", 10)
    expected_range = _temp_to_range(temp)
    outfit_range = outfit.get("temp_range", "cool")

    # Penalize wrong temperature range heavily
    range_order = ["very_cold", "cold", "cool", "warm", "hot"]
    diff = abs(range_order.index(expected_range) - range_order.index(outfit_range))
    score -= diff * 2.5

    # Rain bonus/penalty
    if rain_prob >= 60:
        if outfit.get("rain_suitable"):
            score += 2
        else:
            score -= 3
    elif rain_prob >= 30 and not outfit.get("rain_suitable"):
        score -= 1

    # UV protection bonus
    if uv_index >= 7 and outfit.get("uv_protection"):
        score += 1.5

    # Wind resistance
    if wind_speed >= 35 and outfit.get("wind_resistant"):
        score += 1

    # Occasion preference match
    user_occasion = preferences.get("occasion", "casual")
    outfit_occasions = outfit.get("occasion", [])
    if user_occasion in outfit_occasions:
        score += 1

    # Sustainability bonus
    if preferences.get("sustainability_priority") and outfit.get("sustainability_score", 5) >= 8:
        score += 0.5

    # Clamp to [1, 10]
    return round(max(1.0, min(10.0, score)), 1)


def _gen_explanation(outfit: dict, weather: dict, score: float) -> str:
    """Generate AI Stylist explanation text for an outfit."""
    name = outfit.get("name", "This outfit")
    temp = weather.get("temp", 20)
    rain_prob = weather.get("rain_prob", 0)
    uv = weather.get("uv_index", 3)
    wind = weather.get("wind_speed", 10)
    temp_label = weather.get("temp_label", "cool")

    reasons = []
    reasons.append(f"**{name}** is ideal for today's {temp_label.lower()} {temp}°C conditions.")

    fabrics = outfit.get("fabrics", [])
    if fabrics:
        reasons.append(f"The {', '.join(fabrics[:2])} fabrics offer optimal thermal balance for this temperature.")

    if rain_prob >= 60 and outfit.get("rain_suitable"):
        reasons.append(f"With {rain_prob}% chance of rain, this waterproof-ready ensemble keeps you dry.")
    elif rain_prob >= 30:
        reasons.append(f"Note: {rain_prob}% rain probability — consider packing a compact umbrella as backup.")

    if uv >= 7 and outfit.get("uv_protection"):
        reasons.append(f"UV index of {uv} is high — this outfit includes dedicated sun protection accessories.")
    elif uv >= 7:
        reasons.append(f"UV index is {uv} — adding sunglasses and a hat is strongly recommended.")

    if wind >= 35 and outfit.get("wind_resistant"):
        reasons.append(f"Wind-resistant construction handles today's {wind} km/h gusts comfortably.")

    layering = outfit.get("layering_count", 1)
    if layering >= 2:
        reasons.append(
            f"The {layering}-layer system lets you adapt as temperatures shift throughout the day."
        )

    sustainability = outfit.get("sustainability_score", 5)
    if sustainability >= 8:
        reasons.append("♻️ This is a sustainability-friendly choice — eco-conscious materials and versatile design.")

    score_comment = ""
    if score >= 9:
        score_comment = "Perfect match — highly recommended for today."
    elif score >= 7:
        score_comment = "Great choice with minor trade-offs."
    elif score >= 5:
        score_comment = "Decent option — some adjustments may improve comfort."
    else:
        score_comment = "Sub-optimal for current conditions — consider alternatives."

    return " ".join(reasons) + f"\n\n*Comfort Score: {score}/10 — {score_comment}*"


def _wardrobe_to_outfit(items: list, weather: dict) -> list:
    """
    Combine wardrobe items into curated outfit suggestions.
    Groups tops + bottoms + outerwear + accessories.
    """
    tops = [i for i in items if i.get("category") == "top"]
    bottoms = [i for i in items if i.get("category") == "bottom"]
    outerwear = [i for i in items if i.get("category") == "outerwear"]
    footwear = [i for i in items if i.get("category") == "footwear"]
    accessories = [i for i in items if i.get("category") == "accessory"]

    temp = weather.get("temp", 22)
    rain = weather.get("rain_prob", 0) >= 60
    hot = temp >= 28

    generated = []
    used = 0

    for top in tops[:3]:
        outfit_items = [top["name"]]
        temp_range = _temp_to_range(temp)

        # Pick a suitable bottom
        suitable_bottoms = [b for b in bottoms if temp_range in b.get("weather_suitability", [])]
        if not suitable_bottoms:
            suitable_bottoms = bottoms
        if suitable_bottoms:
            outfit_items.append(suitable_bottoms[used % len(suitable_bottoms)]["name"])

        # Add outerwear if cold
        if temp < 22:
            suitable_ow = [o for o in outerwear if rain and o.get("rain_suitable") or not rain]
            if suitable_ow:
                outfit_items.append(suitable_ow[0]["name"])

        # Add footwear
        suitable_fw = [f for f in footwear if temp_range in f.get("weather_suitability", [])]
        if not suitable_fw:
            suitable_fw = footwear
        if suitable_fw:
            outfit_items.append(suitable_fw[0]["name"])

        # Add relevant accessories
        rain_item = next((a for a in accessories if a.get("rain_suitable")), None)
        if rain and rain_item:
            outfit_items.append(rain_item["name"])
        uv_item = next((a for a in accessories if "UV" in " ".join(a.get("tags", []))), None)
        if weather.get("uv_index", 0) >= 7 and uv_item and uv_item["name"] not in outfit_items:
            outfit_items.append(uv_item["name"])

        outfit_ids = [top["id"]] + [
            next((i["id"] for i in items if i["name"] == name), None)
            for name in outfit_items[1:]
        ]
        outfit_ids = [oid for oid in outfit_ids if oid]

        rain_suitable = any(i.get("rain_suitable") for i in items if i["name"] in outfit_items)

        generated.append({
            "id": f"MY{used + 1:03d}",
            "name": f"My Outfit #{used + 1} — {top['name']} Edition",
            "items": outfit_items,
            "temp_range": temp_range,
            "source": "wardrobe",
            "item_ids": outfit_ids,
            "fabrics": list({i.get("fabric", "") for i in items if i["name"] in outfit_items}),
            "occasion": top.get("tags", ["casual"]),
            "rain_suitable": rain_suitable,
            "uv_protection": any("UV" in " ".join(i.get("tags", [])) for i in items if i["name"] in outfit_items),
            "wind_resistant": any(i.get("category") == "outerwear" for i in items if i["name"] in outfit_items),
            "layering_count": len([x for x in outfit_items if x in [i["name"] for i in outerwear]]) + 1,
            "comfort_base": 7,
            "sustainability_score": 6,
            "description": f"Built from your wardrobe using your {top['name']} as the centrepiece."
        })
        used += 1

    return generated


def recommend(weather_data: dict, wardrobe: list, preferences: dict, mode: str = "hybrid") -> dict:
    """
    Main recommendation function.

    Args:
        weather_data: weather info dict from weather module
        wardrobe: list of wardrobe items
        preferences: user preference dict
        mode: 'wardrobe', 'curated', or 'hybrid'

    Returns:
        dict with 'recommendations', 'accessories', 'layering_tip', 'shopping_hints'
    """
    kb = _load_kb()
    temp = weather_data.get("temp", 20)
    temp_range = _temp_to_range(temp)
    rain_prob = weather_data.get("rain_prob", 0)
    uv_index = weather_data.get("uv_index", 3)
    wind_speed = weather_data.get("wind_speed", 10)

    results = []

    # --- Curated Knowledge Base outfits ---
    if mode in ("curated", "hybrid"):
        kb_outfits = kb.get("outfits", [])
        for outfit in kb_outfits:
            score = _compute_comfort_score(outfit, weather_data, preferences)
            if score >= 3:  # Only include scoring items
                outfit_copy = dict(outfit)
                outfit_copy["comfort_score"] = score
                outfit_copy["explanation"] = _gen_explanation(outfit_copy, weather_data, score)
                outfit_copy["source"] = "curated"
                results.append(outfit_copy)

    # --- User Wardrobe outfits ---
    if mode in ("wardrobe", "hybrid") and wardrobe:
        wardrobe_outfits = _wardrobe_to_outfit(wardrobe, weather_data)
        for outfit in wardrobe_outfits:
            score = _compute_comfort_score(outfit, weather_data, preferences)
            outfit["comfort_score"] = score
            outfit["explanation"] = _gen_explanation(outfit, weather_data, score)
            results.append(outfit)

    # Sort by comfort score
    results.sort(key=lambda x: x.get("comfort_score", 0), reverse=True)

    # Get top recommendations (limit for display)
    top_results = results[:8]

    # --- Accessory suggestions ---
    accessories_kb = kb.get("accessories", {})
    suggested_accessories = []
    if rain_prob >= 40:
        suggested_accessories.extend(accessories_kb.get("rain", []))
    if uv_index >= 6:
        suggested_accessories.extend(accessories_kb.get("high_uv", []))
    if temp < 10:
        suggested_accessories.extend(accessories_kb.get("cold", []))
    if wind_speed >= 30:
        suggested_accessories.extend(accessories_kb.get("wind", []))

    # Deduplicate
    suggested_accessories = list(dict.fromkeys(suggested_accessories))[:6]

    # --- Layering tip ---
    layering_guide = kb.get("layering_guide", {})
    layering_tip = None
    if temp < 15:
        layers_needed = 3 if temp < 5 else 2
        layering_tip = {
            "layers": layers_needed,
            "base": layering_guide.get("base_layer", ""),
            "mid": layering_guide.get("mid_layer", "") if layers_needed >= 2 else "",
            "outer": layering_guide.get("outer_layer", "") if layers_needed >= 3 else "",
            "tip": layering_guide.get("tip", "")
        }

    # --- Shopping hints ---
    shopping_hints = _get_shopping_hints(wardrobe, weather_data, temp_range)

    return {
        "recommendations": top_results,
        "total_found": len(results),
        "accessories": suggested_accessories,
        "layering_tip": layering_tip,
        "shopping_hints": shopping_hints,
        "mode": mode,
        "weather_summary": weather_data.get("temp_label", "moderate"),
        "top_pick": top_results[0] if top_results else None
    }


def _get_shopping_hints(wardrobe: list, weather: dict, temp_range: str) -> list:
    """Detect gaps in wardrobe and suggest shopping opportunities."""
    hints = []
    categories = [i.get("category", "") for i in wardrobe]
    rain_suitable = any(i.get("rain_suitable") for i in wardrobe)
    has_uv_acc = any("UV" in " ".join(i.get("tags", [])) for i in wardrobe)

    if "outerwear" not in categories:
        hints.append("🛍️ Add a versatile jacket — missing from your wardrobe for variable weather days.")
    if not rain_suitable and weather.get("rain_prob", 0) >= 30:
        hints.append("🌂 Consider a waterproof jacket or compact umbrella for rainy days.")
    if not has_uv_acc and weather.get("uv_index", 0) >= 6:
        hints.append("🕶️ UV-blocking sunglasses and a wide-brim hat would complete your summer wardrobe.")
    if "footwear" not in categories:
        hints.append("👟 Add versatile footwear options — none currently in wardrobe.")
    if len(wardrobe) < 5:
        hints.append("👔 Your wardrobe is minimal — adding a few essentials will unlock more outfit combinations.")

    return hints[:4]
