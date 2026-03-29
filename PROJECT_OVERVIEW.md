# SORS: Smart Outfit Recommendation System — Comprehensive Overview

Welcome to the technical heart of **SORS**, a hybrid AI-powered fashion assistant that combines the analytical precision of Machine Learning with the conversational flair of Large Language Models.

---

## 1. Project Vision
**SORS** (Smart Outfit Recommendation System) transforms a static digital wardrobe into a proactive stylist. It analyzes real-time weather data to ensure the user is always comfortable, stylish, and prepared for the elements.

---

## 2. Data Architecture

### A. Digital Wardrobe (`wardrobe_demo.json`)
The foundation of the system is the user's uploaded items. Each item is indexed with:
- **Metadata**: Category (Top, Bottom, etc.), Fabric (Cotton, Wool, etc.), and Color.
- **Smart Tags**: Weather suitability (Warm, Cold, etc.), Rain Protection (Boolean), and Occasion (Casual, Office).
- **Usage Tracking**: `times_worn` and `last_worn` to avoid repetitive suggestions.

### B. Curated Knowledge Base (`outfit_knowledge.json`)
A dataset of expert-defined outfit "templates" used as a baseline for high-quality recommendations, covering 20+ scenarios from "Arctic Layer Stack" to "Tropical Storm Ready."

### C. Synthetic ML Dataset (3,000 Rows)
Since historical user comfort data is private, we generated a high-fidelity synthetic dataset using **3,000 unique weather/outfit combinations**. This data maps:
- **Inputs**: {Temp, Humidity, Wind, Rain%, UV} + {Clothing Fabric, Layers, Suitability}.
- **Target**: A **Comfort Score (1-10)** derived from thermodynamic and fashion comfort principles.

---

## 3. The Machine Learning Brain (Analytical)

We replaced simple "If/Else" rules with a **Random Forest Regressor** model.

- **Model Type**: Random Forest Regressor (Scikit-Learn).
- **Features (12 total)**:
    - **Weather**: `temp`, `humidity`, `wind_speed`, `rain_prob`, `uv_index`.
    - **Outfit**: `outfit_temp_range`, `is_rain_suitable`, `is_uv_protection`, `is_wind_resistant`, `layering_count`.
    - **Preference**: `occasion_match`, `sustainability_score`.
- **Logics**: The model understands non-linear relationships, such as how **high humidity makes heat feel hotter** and requires more breathable fabrics, or how **wind speed increases the need for specific outerwear**.
- **Accuracy**: Achieved an **R² score of ~0.98**, ensuring predictions are extremely reliable.

---

## 4. The AI Stylist (Conversational LLM)

While the ML model provides the "Science," the LLM provides the "Art."

- **Model**: **Google Gemini 1.5 Flash**.
- **Role**: Acting as a "Friendly, expert Fashion Stylist."
- **Integration**: Accessed via the `google-generativeai` SDK.
- **Workflow**:
    1. The ML model picks the best outfit based on score.
    2. The weather and chosen outfit are sent to Gemini.
    3. Gemini generates a conversational response explaining **why** it works (e.g., "Since it's 32°C but 80% humid, this linen shirt will help you breathe!").
    4. Gemini offers a **"Stylist's Swap"** (e.g., "If you want a more relaxed look, swap the loafers for white sneakers").

---

## 5. API Infrastructure (Backend)

Built using **Python Flask**, the backend serves as the orchestrator.

### Key API Endpoints:
| Endpoint | Method | Purpose |
| :--- | :--- | :--- |
| `/api/weather` | POST | Fetches real-time weather via OpenWeatherMap API for any city. |
| `/api/recommend` | POST | Runs the ML model to rank and return the top 8 outfit options. |
| `/api/get_stylist_advice` | POST | **[NEW]** Triggers the Gemini LLM for conversational stylist feedback. |
| `/api/wardrobe` | GET/POST | Manages the user's digital closet (Add/Delete/View). |

---

## 6. How it All Fits Together

1. **Input**: User searches for "Mumbai" on the frontend.
2. **Weather Retrieval**: Backend fetches 32°C, 80% Humidity.
3. **ML Candidate Scoring**: The system generates 100+ outfit candidates from the wardrobe and scores them using the **Random Forest Model**.
4. **Ranking**: The top-scoring outfit is selected.
5. **AI Commentary**: The selected outfit is passed to **Gemini**, which writes a stylish text description.
6. **Response**: The frontend receives a single JSON payload with images, items, and the human-like stylist message.

---

## 7. Future Roadmap
- **User Feedback Loop**: Using the `/api/feedback` endpoint to re-train the ML model based on *actual* user ratings.
- **Visual AI**: Integrating computer vision to auto-tag clothing items from user-uploaded photos.
- **Calendar Awareness**: Automatically suggesting "Formal" outfits when a "Meeting" event is detected in the user's calendar.
