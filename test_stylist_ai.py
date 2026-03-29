from modules.stylist_ai import get_conversational_advice
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_stylist():
    print("Testing NEW AI Stylist (google-genai SDK)...")
    
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
        "items": [
            {"name": "White Linen Shirt", "type": "top", "fabric": "linen"},
            {"name": "Khaki Chinos", "type": "bottom", "fabric": "cotton"}
        ],
        "temp_range": [25, 35]
    }
    
    print("\n1. Requesting generic advice...")
    advice_generic = get_conversational_advice(weather, outfit)
    print(f"Advice: {advice_generic[:150]}...")
    
    print("\n2. Requesting specific advice (Retro Student)...")
    query = "I have a meet today with my professor what should i wear. i need to feel like retro student"
    advice_query = get_conversational_advice(weather, outfit, query)
    
    print("\n--- AI Stylist Response (Custom Query) ---")
    print(advice_query)
    print("-" * 25)
    
    if "API key is missing" in advice_generic:
        print("\n⚠️ Note: API Key not set. Verification shows the fallback message correctly.")
    elif "Error" in advice_generic:
        print("\n❌ Error calling SDK. Check API Key and model availability.")
    else:
        print("\n✅ Successfully received conversational response from the NEW Gemini SDK.")

if __name__ == "__main__":
    test_stylist()
