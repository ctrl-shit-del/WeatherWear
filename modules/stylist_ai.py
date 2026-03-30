def get_conversational_advice(weather: dict, outfit: dict, user_query: str = None) -> str:
    """
    Python-only rule-based stylist, no external AI APIs.
    """
    temp = weather.get('temp', 25)
    condition = weather.get('condition_main', weather.get('condition', 'clear'))
    outfit_name = outfit.get('name', 'this outfit')
    
    query = (user_query or "").lower()
    
    # Event-based rules
    if "class" in query or "school" in query or "college" in query or "university" in query:
        return f"For class, comfort is key! Given it's {temp}°C today, {outfit_name} works perfectly. Consider a comfortable pair of sneakers and layer up if your lecture halls are air-conditioned."
    elif "funeral" in query:
        return "For a funeral, it is respectful to wear formal, dark, and muted clothing. A dark suit or a dark, conservative dress is appropriate. Avoid flashy accessories."
    elif "wedding" in query:
        return f"For a wedding, a formal suit or elegant dress is perfect. Since it's {temp}°C, make sure the fabric matches the weather! Don't wear white unless explicitly asked."
    elif "party" in query or "club" in query:
        return "For a party, you can be more expressive! A smart-casual look or a trendy statement piece will make you stand out. Wear comfortable shoes if you plan to dance."
    elif "meeting" in query or "interview" in query or "work" in query or "office" in query:
        return f"For a professional setting, a smart-casual or formal look is best. {outfit_name} could be a good base, but ensure you have a neat blazer or tailored trousers."
    elif "gym" in query or "workout" in query or "exercise" in query:
        return "For the gym, moisture-wicking and flexible clothing is essential. Pair athletic shorts or leggings with a breathable top and good training shoes."
    elif "date" in query:
        return f"For a date, smart casual is usually a safe and stylish bet. Given the {condition} weather at {temp}°C, {outfit_name} is a solid start. Just make sure it looks neat and fits well!"
    
    # Needs/intent-based rules
    elif "swap" in query or "alternative" in query or "instead" in query:
        return f"If you want to change up {outfit_name}, try swapping your top for a different color, or choosing a different style of footwear that still works for {temp}°C."
    elif "why" in query or "reason" in query:
        return f"This outfit ({outfit_name}) is recommended because the temperature is {temp}°C with {condition} conditions, making the selected fabrics and layers optimal for your comfort."
    
    # Weather-based generic fallback
    else:
        if "snow" in condition.lower() or temp < 5:
            return f"It's freezing ({temp}°C) today! Layer up heavily. {outfit_name} is a base, but make sure you have a heavy coat, scarf, and gloves."
        elif "rain" in condition.lower() or "drizzle" in condition.lower():
            return f"It looks like rain today. Make sure to pair {outfit_name} with a waterproof jacket or grab an umbrella before you head out!"
        elif temp > 30:
            return f"It's quite hot today ({temp}°C). {outfit_name} should be lightweight and breathable. Drink plenty of water and wear sunglasses!"
        else:
            return f"Hello! It's a nice {temp}°C day with {condition} skies. '{outfit_name}' is a solid choice. Let me know if you are dressing for a specific event like a meeting, class, or party!"
