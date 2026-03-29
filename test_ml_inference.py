import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.recommendation_engine import recommend
from modules.wardrobe import load_wardrobe

def test_inference():
    print("Testing ML Recommendation Engine Inference...")
    
    # Mock data
    weather_data_cold = {
        "temp": 2,
        "humidity": 60,
        "wind_speed": 40,
        "rain_prob": 80,
        "uv_index": 1,
        "temp_label": "Very Cold"
    }
    
    weather_data_hot = {
        "temp": 35,
        "humidity": 40,
        "wind_speed": 5,
        "rain_prob": 0,
        "uv_index": 9,
        "temp_label": "Hot"
    }
    
    # Load a sample wardrobe (using 'demo' user)
    wardrobe = load_wardrobe("demo")
    preferences = {"occasion": "casual", "sustainability_priority": True}
    
    print("\n--- Cold & Rainy Scenario ---")
    result_cold = recommend(weather_data_cold, wardrobe, preferences, mode="hybrid")
    for rec in result_cold['recommendations'][:2]:
        print(f"Outfit: {rec['name']}")
        print(f"ML Comfort Score: {rec['comfort_score']}/10")
        print(f"Items: {', '.join(rec['items'])}")
        print("-" * 20)
        
    print("\n--- Hot & Sunny Scenario ---")
    result_hot = recommend(weather_data_hot, wardrobe, preferences, mode="hybrid")
    for rec in result_hot['recommendations'][:2]:
        print(f"Outfit: {rec['name']}")
        print(f"ML Comfort Score: {rec['comfort_score']}/10")
        print(f"Items: {', '.join(rec['items'])}")
        print("-" * 20)

    # Basic contract verification
    assert "recommendations" in result_cold
    assert "accessories" in result_cold
    assert "comfort_score" in result_cold['recommendations'][0]
    print("\n✅ API Contract Verified: Success")

if __name__ == "__main__":
    test_inference()
