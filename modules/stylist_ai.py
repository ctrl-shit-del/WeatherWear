from google import genai
import os
import json

# Configure Gemini API Client
# The user must set GOOGLE_API_KEY environment variable
API_KEY = os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=API_KEY) if API_KEY else None

# Using gemini-2.0-flash as verified by the model diagnostic for your API key.
MODEL_NAME = "gemini-2.0-flash"

SYSTEM_PROMPT = """
You are an expert, friendly fashion stylist. Your goal is to provide conversational, human-like advice 
based on a specific weather report, a recommended outfit, and optional user questions.

Core Pillars (Prioritize these if matching):
1. 🎨 **Rationale**: "Why this outfit?" - Explain comfort based on fabric/layers vs. current weather.
2. 🔄 **Swap/Alternative**: "No jeans / What instead?" - Suggest 2-3 specific stylish alternatives for any item.
3. 📅 **Events/Occasion**: "Work meeting / Job interview / Wedding" - Suggest context-specific style adaptations (e.g., retro student, formal, smart-casual).
4. 🌿 **Sustainability**: "Eco check" - Discuss the sustainability of the items (fabrics, longevity).
5. 🛍️ **Shopping**: "Shopping links" - Mention generic brand styles or stores where to find similar pieces. 
6. 🌡️ **Weather Intelligence**: "Today's weather" - A stylish summary of the conditions.

Personality Rules:
1. Always reference the current weather context.
2. Keep it concise (under 75 words).
3. If the user asks for a specific "Vibe" (e.g., "Retro Student"), fully embrace that style while keeping it weather-appropriate.
4. Output in plain text (no markdown links).
"""

def get_client():
    """Lazy initialization of the Gemini client."""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        print(f"Error initializing Gemini client: {e}")
        return None

def get_conversational_advice(weather: dict, outfit: dict, user_query: str = None) -> str:
    """
    Calls the new Google GenAI SDK to get conversational stylist advice.
    """
    client = get_client()
    if not client:
        return "Hey! I'm your AI Stylist. I'd love to help, but my API key is missing. Set GOOGLE_API_KEY to unlock me!"

    try:
        prompt_parts = [
            f"Current Weather: {json.dumps(weather)}",
            f"Recommended Outfit: {json.dumps(outfit)}"
        ]
        
        if user_query:
            prompt_parts.append(f"User Question: '{user_query}'")
        else:
            prompt_parts.append("Prompt: Give me a quick stylish overview and one swap suggestion!")

        prompt = "\n".join(prompt_parts)
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            config={'system_instruction': SYSTEM_PROMPT},
            contents=prompt
        )
        
        return response.text.strip()
    except Exception as e:
        print(f"Error calling Gemini SDK: {e}")
        return f"Hello! It's a {weather.get('temp')}°C day. This {outfit.get('name')} is a solid choice. If you want a change, try swapping your footwear for something more breathable!"
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return f"Hello! It looks like a {weather.get('temp')}°C day. This {outfit.get('name')} is a solid choice because it matches the conditions, but I'm having a bit of trouble connecting to my creative brain right now!"

