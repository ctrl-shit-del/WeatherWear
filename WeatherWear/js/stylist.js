/**
 * WeatherWear — AI Stylist Module
 * Conversational outfit advisor with intent detection and natural language responses
 */

const Stylist = (() => {
  let _currentWeather = null;
  let _currentRecommendations = null;
  let _currentCalendar = null;
  let _userPrefs = Storage.get('user_prefs', { units: 'metric' });
  let _conversationHistory = Storage.get('stylist_history', []);

  const INTENTS = [
    { name: 'why_outfit', patterns: ['why', 'explain', 'reason', 'tell me', 'because', 'how come'] },
    { name: 'alternative', patterns: ['alternative', 'swap', 'instead', 'other', 'different', 'else', 'option', 'change'] },
    { name: 'event_based', patterns: ['meeting', 'party', 'gym', 'date', 'wedding', 'interview', 'concert', 'beach', 'office', 'work', 'formal', 'casual', 'outdoor'] },
    { name: 'weather_ask', patterns: ['weather', 'temperature', 'rain', 'hot', 'cold', 'wind', 'humid', 'uv', 'forecast'] },
    { name: 'shopping', patterns: ['buy', 'shop', 'purchase', 'get', 'where', 'store', 'price', 'cost', 'link'] },
    { name: 'wardrobe', patterns: ['my wardrobe', 'my clothes', 'i have', 'i own', 'from my', 'what i have'] },
    { name: 'sustainability', patterns: ['eco', 'sustainable', 'environment', 'carbon', 'fabric', 'green', 'organic', 'impact'] },
    { name: 'no_option', patterns: ['no jeans', 'no suit', 'hate', "don't like", "don't want", 'without', 'avoid', 'not'] },
    { name: 'greeting', patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'help me', 'assist', 'suggest'] },
    { name: 'thanks', patterns: ['thanks', 'thank you', 'great', 'perfect', 'awesome', 'love it', 'nice', 'cool'] },
  ];

  const OUTFIT_EMOJI = {
    top: '👕', base: '🧤', mid: '🧥', outer: '🧥', bottom: '👖',
    shoes: '👟', accessory: '🎩', dress: '👗', suit: '🤵'
  };

  const CONDITION_PHRASES = {
    thunderstorm: 'with active thunderstorms in the area',
    rain: 'given the rainy conditions',
    drizzle: 'with light drizzle expected',
    snow: 'in the snowy weather',
    clear: 'under the clear sunny sky',
    clouds: 'on this overcast day',
    fog: 'with reduced visibility due to fog'
  };

  function detectIntent(message) {
    const lower = message.toLowerCase();
    for (const intent of INTENTS) {
      if (intent.patterns.some(p => lower.includes(p))) return intent.name;
    }
    return 'general';
  }

  function extractItemMention(message) {
    const items = ['jeans', 'trousers', 'shirt', 'jacket', 'coat', 'boots', 'sneakers', 'sandals',
      'dress', 'skirt', 'sweater', 'hoodie', 'blazer', 'shorts', 'suit', 'tie', 'scarf', 'gloves'];
    const lower = message.toLowerCase();
    return items.find(item => lower.includes(item)) || null;
  }

  function cToF(celsius) {
    return Math.round((celsius * 9) / 5 + 32);
  }

  function formatTemp(celsius) {
    const isImperial = (_userPrefs?.units || 'metric') === 'imperial';
    const value = isImperial ? cToF(celsius) : Math.round(celsius);
    const unit = isImperial ? 'F' : 'C';
    return `${value}°${unit}`;
  }

  function getWeatherContext() {
    if (!_currentWeather) return 'the current weather conditions';
    const { temp, feels_like, condition_main, humidity, wind_speed } = _currentWeather;
    return `${formatTemp(temp)} (feels like ${formatTemp(feels_like)}), ${condition_main.toLowerCase()} skies, ${humidity}% humidity and ${wind_speed} km/h winds`;
  }

  async function chat(message) {
    const intent = detectIntent(message);
    
    // Prepare payload
    const payload = {
      weather: _currentWeather,
      outfit: _currentRecommendations?.curated,
      message: message,
      intent: intent
    };

    try {
      const response = await fetch('/api/get_stylist_advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('AI Stylist offline');
      
      const data = await response.json();
      const stylist_message = data.stylist_message;

      _conversationHistory.push(
        { role: 'user', content: message, ts: Date.now() },
        { role: 'stylist', content: stylist_message, ts: Date.now() }
      );

      if (_conversationHistory.length > 50) _conversationHistory = _conversationHistory.slice(-50);
      Storage.set('stylist_history', _conversationHistory);

      return { intent, response: stylist_message };
    } catch (err) {
      console.error('[Stylist] API error:', err);
      return { 
        intent: 'error', 
        response: "I'm having a bit of trouble connecting to my creative brain right now! Let's try again in a moment." 
      };
    }
  }

  function setContext(weather, recommendations, calendarEvents = null, userPrefs = null) {
    _currentWeather = weather;
    _currentRecommendations = recommendations;
    _currentCalendar = calendarEvents;
    if (userPrefs) _userPrefs = userPrefs;
  }

  function getHistory() { return _conversationHistory; }
  function clearHistory() { 
    _conversationHistory = []; 
    Storage.set('stylist_history', []);
  }

  return { chat, setContext, getHistory, clearHistory };
})();
