import sys
import os
import json

# Add the project root to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.stylist_ai import get_conversational_advice

def test_stylist():
    print("Testing AI Stylist Conversational Advice...")
    
    # Mock data
    weather = {
        "city": "Mumbai",
        "temp": 32,
        "humidity": 80,
        "description": "Humid and Sunny",
        "rain_prob": 10
    }
    
    outfit = {
        "name": "Summer Linen Breeze",
        "items": ["White Linen Shirt", "Khaki Chinos", "Leather Sandals"],
        "temp_range": "hot",
        "fabrics": ["linen", "cotton"]
    }
    
    print("\nRequesting advice from Gemini...")
    advice = get_conversational_advice(weather, outfit)
    
    print("\n--- AI Stylist Advice ---")
    print(advice)
    print("-" * 25)
    
    if "API key is missing" in advice:
        print("\n⚠️ Note: API Key not set. Verification shows the fallback message correctly.")
    else:
        print("\n✅ Successfully received conversational response from Gemini.")

if __name__ == "__main__":
    test_stylist()
