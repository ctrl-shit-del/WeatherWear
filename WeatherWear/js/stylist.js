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

  async function getAIStylistResponse(message, outfit, weather) {
    try {
      const res = await fetch('http://localhost:5000/api/get_stylist_advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: weather || { temp: 25 }, // fallback to prevent 400
          outfit: outfit || { name: 'A casual outfit', items: [] },
          message: message
        })
      });
      if (!res.ok) throw new Error('API error ' + res.status);
      const data = await res.json();
      return data.stylist_message || `I'm having trouble connecting to my AI brain right now!`;
    } catch (err) {
      console.error('AI Stylist Error:', err);
      // Fallback
      return `I can help with event-specific outfits! Try asking:
- "What to wear to a meeting?"
- "Outfit for a party tonight?"
- "What to wear to the gym?"`;
    }
  }

  async function generateResponse(intent, message) {
    const outfit = _currentRecommendations?.curated;
    const weather = _currentWeather;
    const condPhrase = weather
      ? (CONDITION_PHRASES[weather.condition_main.toLowerCase()] || 'given today\'s conditions')
      : 'given today\'s conditions';

    switch (intent) {
      case 'greeting':
        return `👋 Hey there! I'm your **AI Style Advisor**. I can help you:
- Understand *why* today's outfit recommendation works
- Suggest alternatives for items you don't like
- Recommend outfits for specific events (e.g., "What to wear to a party tonight?")
- Give eco-friendly style tips
- Point you to where to shop

Right now, the weather is **${getWeatherContext()}**. What would you like to know?`;

      case 'why_outfit':
        if (!outfit) return "I need weather data to explain the outfit choice. Please search for a city first!";
        const items = outfit.items.map(i => `${OUTFIT_EMOJI[i.type] || '👔'} **${i.name}** (${i.fabric})`).join('\n');
        return `Great question! Here's why **"${outfit.name}"** works perfectly today:

🌡️ **Weather**: ${getWeatherContext()}

The outfit is designed for **${formatTemp(outfit.temp_range[0])} to ${formatTemp(outfit.temp_range[1])}** ${condPhrase}. Here's the breakdown:

${items}

**Key reasons:**
- The **${outfit.items[0]?.fabric}** provides ideal breathability/warmth for this temperature
- ${outfit.items.length > 2 ? 'The layering system lets you adapt as the day progresses' : 'The lightweight construction keeps you comfortable all day'}
- **Accessories** like ${outfit.accessories?.slice(0, 2).join(' and ')} complete the weather-appropriate look
${_currentCalendar?.length ? `- **Calendar Match**: Fits perfectly with your schedule today (e.g. ${_currentCalendar[0].title})` : ''}

Style score: ⭐ ${outfit.style_score}/10 | Eco score: 🌿 ${outfit.sustainability_score}/10`;

      case 'alternative': {
        const item = extractItemMention(message);
        if (!outfit) return "Please load the dashboard first so I can suggest alternatives!";
        if (item) {
          const swaps = {
            jeans: ['chinos', 'tailored trousers', 'jogger pants', 'corduroy pants'],
            boots: ['leather loafers', 'chelsea boots', 'white sneakers', 'Oxford shoes'],
            suit: ['smart blazer + chinos', 'linen trousers + blazer', 'turtleneck + dress pants'],
            sneakers: ['leather derbies', 'loafers', 'Chelsea boots', 'boat shoes'],
            shirt: ['turtleneck sweater', 'polo shirt', 'henley top', 'mock-neck tee'],
            jacket: ['thick cardigan', 'puffer vest', 'denim jacket', 'blazer'],
            scarf: ['neck gaiter', 'turtle-neck built-in', 'hooded top'],
            shorts: ['linen trousers', 'light chinos', 'joggers'],
          };
          const alternatives = swaps[item] || ['a different style of the same type', 'a coordinating piece in a neutral tone'];
          return `No problem! Instead of **${item}**, you can try:
${alternatives.map((a, i) => `${i + 1}. **${a}**`).join('\n')}

These all work ${condPhrase} and complement the rest of today's recommended outfit. Want me to explain why any of these work?`;
        }
        const nextBest = _currentRecommendations?.allScored?.[1];
        if (nextBest) {
          return `Here's an alternative outfit: **"${nextBest.name}"** 🔄

It works for similar conditions and has a **${nextBest.style_score}/10** style score. The key pieces include ${nextBest.items.slice(0, 3).map(i => i.name).join(', ')}.

Want more alternatives, or should I explain why this one works?`;
        }
        return `Try mixing a lighter layer on top with what you already have — the key is to stay comfortable in today's ${getWeatherContext()}.`;
      }

      case 'event_based': {
        const events = {
          class: { outfit: 'Comfortable jeans or chinos with a casual tee or sweater', tip: 'Layer up for air-conditioned lecture halls!' },
          meeting: { outfit: 'Smart-casual blazer with tailored trousers or chinos, Oxford shoes', tip: 'Keep accessories minimal — a watch and simple belt.' },
          party: { outfit: 'Dress shirt/blouse with tailored trousers or a midi dress, heeled shoes', tip: 'Add a statement accessory to elevate the look.' },
          gym: { outfit: 'Moisture-wicking top, athletic shorts/leggings, quality running shoes', tip: 'Bring a light jacket if heading outdoors afterward.' },
          date: { outfit: 'Smart casual — fitted shirt, dark jeans or chinos, clean leather shoes', tip: 'A subtle cologne and groomed appearance complete the look.' },
          beach: { outfit: 'Swimwear, linen shirt cover-up, flip-flops or espadrilles', tip: 'Pack reef-safe sunscreen and a wide-brim hat!' },
          interview: { outfit: 'Formal blazer, pressed shirt/blouse, tailored trousers, Oxford shoes', tip: 'Iron everything the night before. Less is more with accessories.' },
          concert: { outfit: 'Relaxed band tee, leather jacket, dark jeans, comfortable boots', tip: 'Comfortable shoes are key — you\'ll be on your feet!' },
          office: { outfit: 'Business casual — collared shirt, chinos/trousers, leather shoes or loafers', tip: 'Layer with a blazer for a polished yet flexible look.' },
          wedding: { outfit: 'Formal suit/dress in season-appropriate fabric', tip: 'Match formality to the venue and avoid white (or black for very casual weddings).' },
        };
        const lower = message.toLowerCase();
        const eventKey = Object.keys(events).find(k => lower.includes(k));
        if (eventKey) {
          const ev = events[eventKey];
          return `👔 **${eventKey.charAt(0).toUpperCase() + eventKey.slice(1)} Outfit** for today's weather (${getWeatherContext()}):

**Recommended look:** ${ev.outfit}

💡 **Style tip:** ${ev.tip}

This accounts for the **${weather ? formatTemp(weather.temp) : 'current temperature'}** ${condPhrase}. Would you like shopping links for any of these pieces?`;
        }
        // Fallback to AI for any general query that feels like an event or an outfit request
        return await getAIStylistResponse(message, outfit, weather);
      }

      case 'general':
      default:
        // Use AI as a default fallback instead of generic help text.
        return await getAIStylistResponse(message, outfit, weather);

      case 'weather_ask':
        if (!weather) return "I don't have weather data yet. Please search for a city on the dashboard!";
        return `📍 **Current Weather Summary:**

🌡️ Temperature: **${formatTemp(weather.temp)}** (feels like ${formatTemp(weather.feels_like)})
💧 Humidity: **${weather.humidity}%**
💨 Wind: **${weather.wind_speed} km/h**
🌡️ Condition: **${weather.condition}**
☀️ UV Index: **${Math.round(weather.uv_index || 0)}**
🌧️ Precipitation: **${weather.precipitation > 0 ? weather.precipitation + 'mm' : 'None'}**

${weather.uv_index > 7 ? '⚠️ High UV today — wear SPF 50+ and UV-protective clothing!' : ''}
${weather.wind_speed > 30 ? '⚠️ Strong winds — avoid loose clothing and secure scarves!' : ''}`;

      case 'shopping':
        if (!outfit?.shopping_links?.length) return "Let me pull up some shopping links... Check the **Shopping** tab on the outfit card for curated picks!";
        const links = outfit.shopping_links.map(l => `- 🛍️ **${l.item}** from [${l.store}](${l.url}) — ${l.price_range}`).join('\n');
        return `Here are curated shopping links for today's outfit **"${outfit.name}"**:

${links}

These are selected for quality and style. Want budget alternatives or sustainable options?`;

      case 'sustainability':
        const wardrobeStats = Wardrobe.getStats();
        return `🌿 **Sustainability in Your Style:**

Your wardrobe is **${wardrobeStats.sustainablePercent}%** sustainable (${wardrobeStats.sustainableCount} eco-friendly items out of ${wardrobeStats.total}).

**Why fabric choice matters:**
- 🌱 **Organic cotton / Linen / Hemp** — low water use, biodegradable
- 🔄 **Recycled polyester** — made from plastic bottles, 50% less energy
- ❌ **Virgin polyester / Nylon** — high microplastic pollution

**Today's recommendation sustainability score:** ${outfit ? `🌿 ${outfit.sustainability_score}/10` : 'Load the dashboard for today\'s score!'}

**Eco swap tip:** ${outfit?.items?.[0] ? `Replace ${outfit.items[0].fabric} with organic cotton or linen for a greener choice.` : 'Check fabric labels — choose natural over synthetic where possible.'}`;

      case 'no_option': {
        const avoidItem = extractItemMention(message);
        if (!avoidItem || !outfit) return "Tell me what you'd like to avoid and I'll suggest alternatives! (e.g., 'I don't want jeans')";
        const alternatives = {
          jeans: ['slim-fit chinos', 'tailored trousers', 'linen pants', 'corduroy pants'],
          suit: ['blazer + chinos combo', 'smart turtleneck + dress pants'],
          boots: ['loafers', 'clean white sneakers', 'boat shoes', 'oxford shoes'],
          shorts: ['linen trousers', 'jogger pants', 'chinos'],
          sneakers: ['loafers', 'derby shoes', 'chelsea boots'],
        };
        const alts = alternatives[avoidItem] || ['a complementary neutral-toned alternative'];
        return `No ${avoidItem}? No problem! 😊 Here's what you can wear instead ${condPhrase}:

${alts.map((a, i) => `${i + 1}. **${a}**`).join('\n')}

All of these pair well with the rest of today's suggested outfit. Want more details on any of these?`;
      }

      case 'thanks':
        const responses = [
          "You're welcome! You're going to look amazing today! 🌟",
          "Happy to help! Rock that outfit with confidence! 💪",
          "Anytime! Come back tomorrow for a fresh recommendation! 👔",
          "Glad I could help! Stay stylish and weather-ready! ✨",
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  async function chat(message) {
    const intent = detectIntent(message);
    const response = await generateResponse(intent, message);

    _conversationHistory.push(
      { role: 'user', content: message, ts: Date.now() },
      { role: 'stylist', content: response, ts: Date.now() }
    );

    // Keep last 50 messages
    if (_conversationHistory.length > 50) {
      _conversationHistory = _conversationHistory.slice(-50);
    }
    
    // Persist to local storage
    Storage.set('stylist_history', _conversationHistory);

    return { intent, response };
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
