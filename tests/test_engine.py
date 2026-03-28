"""
SORS - Recommendation Engine Tests
Run with: python -m pytest tests/test_engine.py -v
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from modules.recommendation_engine import recommend, _temp_to_range, _compute_comfort_score
from modules.weather import get_temp_category


# ─── Temperature Category Tests ───────────────────────────────

def test_temp_very_cold():
    assert get_temp_category(-10) == "very_cold"
    assert get_temp_category(0) == "very_cold"
    assert get_temp_category(4) == "very_cold"

def test_temp_cold():
    assert get_temp_category(5) == "cold"
    assert get_temp_category(10) == "cold"
    assert get_temp_category(14) == "cold"

def test_temp_cool():
    assert get_temp_category(15) == "cool"
    assert get_temp_category(20) == "cool"
    assert get_temp_category(21) == "cool"

def test_temp_warm():
    assert get_temp_category(22) == "warm"
    assert get_temp_category(25) == "warm"
    assert get_temp_category(29) == "warm"

def test_temp_hot():
    assert get_temp_category(30) == "hot"
    assert get_temp_category(40) == "hot"


# ─── Comfort Score Tests ──────────────────────────────────────

def test_comfort_score_range():
    """Score must always stay between 1 and 10."""
    outfit = {
        "temp_range": "warm", "rain_suitable": False,
        "uv_protection": False, "wind_resistant": False,
        "occasion": ["casual"], "sustainability_score": 5,
        "comfort_base": 7
    }
    weather = {"temp": 25, "rain_prob": 10, "uv_index": 4, "wind_speed": 10}
    prefs = {"occasion": "casual", "sustainability_priority": False}
    score = _compute_comfort_score(outfit, weather, prefs)
    assert 1.0 <= score <= 10.0

def test_rain_flag():
    """Rain-suitable outfits should score higher when rain is likely."""
    base_outfit = {
        "temp_range": "warm", "uv_protection": False,
        "wind_resistant": False, "occasion": ["casual"],
        "sustainability_score": 5, "comfort_base": 7
    }
    weather = {"temp": 25, "rain_prob": 80, "uv_index": 3, "wind_speed": 10}
    prefs = {}
    rain_outfit = {**base_outfit, "rain_suitable": True}
    dry_outfit  = {**base_outfit, "rain_suitable": False}
    score_rain = _compute_comfort_score(rain_outfit, weather, prefs)
    score_dry  = _compute_comfort_score(dry_outfit,  weather, prefs)
    assert score_rain > score_dry, "Rain-suitable outfit should score better in rain"

def test_wrong_temp_range_penalized():
    """Hot outfit on a cold day should score much lower than cold outfit."""
    cold_weather = {"temp": 3, "rain_prob": 0, "uv_index": 2, "wind_speed": 10}
    prefs = {}
    hot_outfit  = {"temp_range": "hot",  "rain_suitable": False, "uv_protection": False, "wind_resistant": False, "occasion": [], "sustainability_score": 5, "comfort_base": 7}
    cold_outfit = {"temp_range": "very_cold", "rain_suitable": False, "uv_protection": False, "wind_resistant": True, "occasion": [], "sustainability_score": 5, "comfort_base": 8}
    assert _compute_comfort_score(cold_outfit, cold_weather, prefs) > _compute_comfort_score(hot_outfit, cold_weather, prefs)


# ─── Recommendation Engine Tests ──────────────────────────────

def test_curated_mode_returns_results():
    weather = {"temp": 22, "rain_prob": 10, "uv_index": 4, "wind_speed": 15, "temp_label": "Warm"}
    result = recommend(weather, [], {}, mode="curated")
    assert "recommendations" in result
    assert len(result["recommendations"]) > 0

def test_hybrid_mode_with_wardrobe():
    weather = {"temp": 15, "rain_prob": 50, "uv_index": 3, "wind_speed": 20, "temp_label": "Cool"}
    wardrobe = [
        {"id": "T1", "name": "Blue Shirt", "category": "top", "fabric": "cotton",
         "weather_suitability": ["cool", "warm"], "rain_suitable": False, "tags": ["casual"]},
        {"id": "T2", "name": "Dark Jeans", "category": "bottom", "fabric": "denim",
         "weather_suitability": ["cool", "cold"], "rain_suitable": False, "tags": ["casual"]},
        {"id": "T3", "name": "Rain Jacket", "category": "outerwear", "fabric": "synthetic",
         "weather_suitability": ["cool", "cold"], "rain_suitable": True, "tags": ["rain"]},
    ]
    result = recommend(weather, wardrobe, {}, mode="hybrid")
    assert len(result["recommendations"]) > 0
    # Should include wardrobe-sourced outfits
    sources = [r["source"] for r in result["recommendations"]]
    assert "wardrobe" in sources or "curated" in sources

def test_recommendations_sorted_by_score():
    weather = {"temp": 30, "rain_prob": 0, "uv_index": 8, "wind_speed": 5, "temp_label": "Hot"}
    result = recommend(weather, [], {}, mode="curated")
    scores = [r["comfort_score"] for r in result["recommendations"]]
    assert scores == sorted(scores, reverse=True), "Results must be sorted highest score first"

def test_weather_accessories_rain():
    weather = {"temp": 20, "rain_prob": 70, "uv_index": 3, "wind_speed": 10, "temp_label": "Cool"}
    result = recommend(weather, [], {}, mode="curated")
    # Should recommend rain accessories
    all_acc = " ".join(result.get("accessories", []))
    assert any(word in all_acc.lower() for word in ["umbrella", "poncho", "rain", "waterproof"])

def test_layering_tip_for_cold():
    weather = {"temp": 3, "rain_prob": 0, "uv_index": 1, "wind_speed": 15, "temp_label": "Very Cold"}
    result = recommend(weather, [], {}, mode="curated")
    assert result["layering_tip"] is not None, "Should provide layering tip for cold weather"
    assert result["layering_tip"]["layers"] >= 2

def test_shopping_hints_empty_wardrobe():
    weather = {"temp": 20, "rain_prob": 60, "uv_index": 7, "wind_speed": 10, "temp_label": "Cool"}
    result = recommend(weather, [], {}, mode="wardrobe")
    # With empty wardrobe, should give shopping hints
    assert len(result.get("shopping_hints", [])) > 0
