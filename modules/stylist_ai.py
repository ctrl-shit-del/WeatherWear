import os
import google.generativeai as genai
import json

# Configure Gemini API
# The user must set GOOGLE_API_KEY environment variable
API_KEY = os.environ.get("GOOGLE_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-1.5-flash"

SYSTEM_PROMPT = """
You are an expert, friendly fashion stylist. Your goal is to provide conversational, human-like advice 
based on a specific weather report and an outfit recommended by an ML model.

Rules:
1. Reference the specific weather (e.g., temperature, rain probability).
2. Explain why the recommended items are a good choice (e.g., fabric, layering).
3. Offer exactly one "Stylist's Swap" - a specific alternative for one item in the outfit.
4. Keep the tone professional but warm and stylish.
5. Keep it concise (under 100 words).
6. Output in plain text, do not use markdown links.
"""

def get_conversational_advice(weather: dict, outfit: dict) -> str:
    """
    Calls the Gemini API to get a conversational explanation for an outfit.
    """
    if not API_KEY:
        return "Hey! I'm your AI Stylist. I'd love to give you advice, but my API key is missing. Please set GOOGLE_API_KEY to unlock me!"

    try:
        model = genai.GenerativeModel(MODEL_NAME, system_instruction=SYSTEM_PROMPT)
        
        prompt = f"""
        Weather: {json.dumps(weather)}
        Recommended Outfit: {json.dumps(outfit)}
        
        Tell me why this works and suggest a swap!
        """
        
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return f"Hello! It looks like a {weather.get('temp')}°C day. This {outfit.get('name')} is a solid choice because it matches the conditions, but I'm having a bit of trouble connecting to my creative brain right now!"

