# WeatherWear — Smart Outfit Recommendation System (SORS)

A next-generation, weather-aware, personalized outfit recommendation web application featuring glassmorphic UI, dynamic theme shifting, and AI Stylist interactions. 

## 🚀 How to Run (Quick Start)

The application has a robust **Vanilla HTML/JS Frontend** that talks to a **Python Flask API Backend** (for advanced mock features like Live Calendar Sync and Web Scraped Fashion Trends).

### Step 1: Start the Backend (API Server)
This server runs the AI mock logic for calendar event context and live fashion trends.
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run the Flask API server
python app.py
```
*The server will start on `http://localhost:5000`.*

### Step 2: Open the Frontend
You don't even need a web server for the frontend! The entire UI runs cleanly as a local file.
Simply double-click the following file, or open it in your browser:
```text
d:\SORS\WeatherWear\index.html
```

*(Note: While the frontend can run completely offline using fallback mock data, keeping the `python app.py` backend running enables the "Real-Time Trends" and "Google Calendar Sync" V2 features to function properly.)*

---

## ✨ Features (V2 Expansion Complete)

| Feature | Description |
|---|---|
| 🌤️ **Real-time Weather Engine** | Connects to OpenWeather API to get real-time temp, humidity, wind, and conditions. Alerts for extreme heat or snow. |
| 🎨 **Time-of-Day Dynamic Theme** | The entire app's gradient color palette dynamically transitions from dawn 🌅 to sunset 🌆 and night 🌃 based on the actual local time! |
| 👗 **AI Comfort Score** | Uses ML-style weighted regression comparing 6 weather parameters to recommend 3 tiered outfits. |
| 📅 **Calendar Context Sync** | Fetches your daily schedule (mocked via backend) and boosts outfit scores based on your events (e.g., "Board Meeting"). |
| 📈 **Live Trend Scraper** | A mock Python scraper backend that feeds live fashion trends, price drops, and "hot" items straight into the app. |
| 📌 **Masonry Inspiration Board**| A real Pinterest-style staggered masonry grid displaying generated fashion style moodboards. |
| 👚 **Digital Wardrobe** | Powerful CRUD wardrobe manager with auto-tagging, wear tracking, and sustainability eco-scores. |
| 🤖 **Conversational AI Stylist** | An embedded AI chat window that understands 10 unique intents, explaining outfit reasoning, alternative layers, and answering style questions. |
| 📊 **Advanced Analytics** | Canvas-based local charts showing your wardrobe utilization, sustainability metrics, and CO2 offset savings. |

---

## 🏗️ Project Structure

```text
SORS/
├── app.py                    # Flask application handling CORS API routes for V2 features
├── requirements.txt          # Python packages (flask, flask-cors)
├── README.md                 # You are here
└── WeatherWear/              # ⬅️ V2 Frontend Client
    ├── index.html            # Main Single-Page Application
    ├── css/
    │   ├── main.css          # Core design system, glassmorphism UI, variables
    │   └── animations.css    # Particles, ring animations, fade-ins
    ├── js/
    │   ├── app.js            # App logic, tab routing, DOM binding
    │   ├── weather.js        # OpenWeatherMap fetch & parse lifecycle
    │   ├── recommendation.js # Comfort-score ML regression logic & Calendar Sync score boosts
    │   ├── stylist.js        # Rule-based conversational logic with history persistence
    │   ├── wardrobe.js       # Wardrobe array logic & auto-tagging functions
    │   ├── trends.js         # API hooks for Trends & Masonry board visual rendering
    │   ├── analytics.js      # Pure generic HTML5 Canvas chart implementations
    │   ├── storage.js        # Wrapper for LocalStorage persistence layer
    │   └── outfit-db.js      # Raw JSON data of baseline outfits
```

---

## 🌤️ Weather API Setup

The app has a built-in OpenWeather API key. To use your own:
1. Obtain a free [OpenWeatherMap API key](https://openweathermap.org/api).
2. Open `index.html` in the browser.
3. Go to the **Settings** tab.
4. Paste your key and click **Save**. It will be saved securely to your browser's Local Storage.

## 🧪 Future Roadmap
- **Phase 1:** Weather integration, rule-based engine, wardrobe management, analytics (✅ Complete)
- **Phase 2:** Advanced APIs (Calendar sync, Live Scraping for Trends) (✅ Complete)
- **Phase 3:** Visual Pinterest style boards & advanced filtering (✅ Complete)
- **Phase 4:** Actual user wardrobe upload parsing & User Auth flows (🔜 Planned)
