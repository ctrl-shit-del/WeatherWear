/**
 * WeatherWear — Recommendation Engine
 * Comfort Score + Outfit Matching with ML-style weighted regression
 */

const RecommendationEngine = (() => {

  /**
   * Compute a comfort score (1–10) from weather parameters.
   * Mimics an XGBoost regression output using a weighted scoring approach.
   */
  function computeComfortScore(weatherData) {
    const { temp, feels_like, humidity, wind_speed, precipitation, uv_index } = weatherData;

    // Ideal comfort zone: 18–24°C, 40–60% humidity, <15 km/h wind, no rain, UV < 5
    let score = 10;

    // Temperature deviation penalty (optimal: 20°C)
    const tempDev = Math.abs(temp - 20);
    score -= Math.min(tempDev * 0.35, 4.5); // weight 35%

    // Feels-like penalty
    const feelsDelta = Math.abs(feels_like - temp);
    score -= Math.min(feelsDelta * 0.15, 2); // weight 15%

    // Humidity penalty (optimal: 50%)
    const humDev = Math.max(0, humidity - 60);
    score -= Math.min(humDev * 0.04, 2); // weight 15% (approx)

    // Wind chill penalty (optimal: <15 km/h)
    const windPenalty = Math.max(0, wind_speed - 15) * 0.06;
    score -= Math.min(windPenalty, 2); // weight 15%

    // Precipitation penalty
    if (precipitation > 0) score -= Math.min(precipitation * 0.5 + 1.5, 2.5); // weight 10%

    // UV penalty (only high UV)
    if (uv_index > 7) score -= Math.min((uv_index - 7) * 0.15, 0.5); // weight 5%

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
  }

  function getComfortLabel(score) {
    if (score >= 8.5) return { label: 'Perfect', color: '#00b894', icon: '✨' };
    if (score >= 7) return { label: 'Comfortable', color: '#00cec9', icon: '😊' };
    if (score >= 5.5) return { label: 'Okay', color: '#fdcb6e', icon: '🙂' };
    if (score >= 4) return { label: 'Uneasy', color: '#e17055', icon: '😐' };
    if (score >= 2.5) return { label: 'Uncomfortable', color: '#d63031', icon: '😟' };
    return { label: 'Extreme', color: '#6c5ce7', icon: '🥶' };
  }

  /**
   * Score an outfit against current weather/user preferences
   */
  function scoreOutfit(outfit, weatherData, conditionTags, userPrefs = {}) {
    let score = 0;

    // Temperature match (0–40 pts)
    const tempFit = outfit.temp_range[0] <= weatherData.temp && weatherData.temp <= outfit.temp_range[1];
    if (tempFit) score += 40;
    else {
      const dist = Math.min(
        Math.abs(weatherData.temp - outfit.temp_range[0]),
        Math.abs(weatherData.temp - outfit.temp_range[1])
      );
      score += Math.max(0, 40 - dist * 5);
    }

    // Condition match (0–30 pts)
    const condMatch = outfit.conditions.filter(c => conditionTags.includes(c)).length;
    score += condMatch * (30 / Math.max(outfit.conditions.length, 1));

    // User style preference bonus (0–15 pts)
    const stylePref = userPrefs.style || 'casual';
    if (outfit.tags.includes(stylePref)) score += 15;
    else if (outfit.occasion.includes(stylePref)) score += 10;

    // Sustainability bonus (0–10 pts)
    if (userPrefs.sustainabilityMode) score += (outfit.sustainability_score / 10) * 10;

    // Calendar Context (V2 Bonus: 0-25 pts)
    if (userPrefs.calendarContext && (outfit.tags.includes(userPrefs.calendarContext) || outfit.occasion.includes(userPrefs.calendarContext))) {
      score += 25;
    }

    // Style score bonus (0–5 pts)
    score += (outfit.style_score / 10) * 5;

    // Feedback history bonus
    const feedbackHistory = Storage.get('feedback_history', {});
    if (feedbackHistory[outfit.id]) {
      const positiveRatio = feedbackHistory[outfit.id].positive /
        (feedbackHistory[outfit.id].total || 1);
      score += positiveRatio * 10;
    }

    return score;
  }

  /**
   * Match user wardrobe items to outfit requirements
   */
  function matchWardrobeItems(outfit, wardrobeItems) {
    if (!wardrobeItems || wardrobeItems.length === 0) return { matched: [], missing: outfit.items };
    const matched = [];
    const missing = [];
    for (const required of outfit.items) {
      const found = wardrobeItems.find(wi =>
        wi.type === required.type &&
        (wi.season === 'all' ||
          (outfit.tags || []).some(t => wi.tags?.includes(t)) ||
          wi.name.toLowerCase().includes(required.name.toLowerCase().split(' ')[0]))
      );
      if (found) matched.push({ ...required, wardrobeItem: found });
      else missing.push(required);
    }
    return { matched, missing };
  }

  /**
   * Main recommendation function
   * Returns top outfits in 3 tiers: wardrobe, curated, hybrid
   */
  async function getRecommendations(weatherData, userPrefs = {}) {
    const allOutfits = await OutfitDB.load();
    const conditionTags = WeatherService.getConditionTags(weatherData);
    const comfortScore = computeComfortScore(weatherData);
    const wardrobeItems = Storage.get('wardrobe_items', []);

    // Filter candidates
    let candidates = OutfitDB.filterByTemp(allOutfits, weatherData.temp);
    if (candidates.length < 3) candidates = allOutfits; // fallback if no temp match
    if (userPrefs.occasion) {
      const byOccasion = OutfitDB.filterByOccasion(candidates, [userPrefs.occasion]);
      if (byOccasion.length >= 2) candidates = byOccasion;
    }

    // Score all candidates
    const scored = candidates.map(outfit => ({
      ...outfit,
      _score: scoreOutfit(outfit, weatherData, conditionTags, userPrefs),
      _wardrobeMatch: matchWardrobeItems(outfit, wardrobeItems),
      _conditionTags: conditionTags
    })).sort((a, b) => b._score - a._score);

    // Build 3-tier output
    const curated = scored[0] || null;
    const curated2 = scored[1] || null;

    // Wardrobe outfit: highest scoring with at least 1 wardrobe match
    const wardrobeOutfit = wardrobeItems.length > 0
      ? scored.find(o => o._wardrobeMatch.matched.length > 0) || null
      : null;

    // Hybrid: partial wardrobe + curated fill-in
    const hybridOutfit = wardrobeItems.length > 0 && scored[1]
      ? {
          ...scored[1],
          isHybrid: true,
          _wardrobeMatch: matchWardrobeItems(scored[1], wardrobeItems)
        }
      : (curated2 ? { ...curated2, isHybrid: false } : null);

    // Record outfit shown in history
    const history = Storage.get('outfit_history', []);
    if (curated) {
      history.unshift({ outfitId: curated.id, date: new Date().toISOString(), weather: { temp: weatherData.temp, condition: weatherData.condition_main } });
      Storage.set('outfit_history', history.slice(0, 100));
    }

    return {
      comfortScore,
      comfortLabel: getComfortLabel(comfortScore),
      conditionTags,
      curated,
      wardrobeOutfit,
      hybridOutfit,
      allScored: scored
    };
  }

  /**
   * Submit outfit feedback
   */
  function submitFeedback(outfitId, positive) {
    const history = Storage.get('feedback_history', {});
    if (!history[outfitId]) history[outfitId] = { positive: 0, negative: 0, total: 0 };
    history[outfitId].total++;
    if (positive) history[outfitId].positive++;
    else history[outfitId].negative++;
    Storage.set('feedback_history', history);
  }

  /**
   * Generate extreme weather alert
   */
  function getWeatherAlert(weatherData) {
    const alerts = [];
    if (weatherData.temp <= -10) alerts.push({ type: 'danger', msg: '❄️ Extreme cold — frostbite risk! Cover all exposed skin.' });
    else if (weatherData.temp >= 40) alerts.push({ type: 'danger', msg: '🌡️ Extreme heat — heatstroke risk! Stay hydrated and indoors if possible.' });
    if (weatherData.uv_index >= 8) alerts.push({ type: 'warning', msg: `☀️ Very high UV (${Math.round(weatherData.uv_index)}) — wear SPF 50+ and UV-block clothing.` });
    if (weatherData.wind_speed > 60) alerts.push({ type: 'warning', msg: '💨 Storm-force winds — avoid loose clothing and secure accessories.' });
    if (weatherData.precipitation > 20) alerts.push({ type: 'warning', msg: '🌧️ Heavy rainfall — full waterproof gear recommended.' });
    const main = weatherData.condition_main.toLowerCase();
    if (main.includes('thunder')) alerts.push({ type: 'danger', msg: '⛈️ Thunderstorm active — avoid metal accessories and take shelter.' });
    return alerts;
  }

  return {
    computeComfortScore,
    getComfortLabel,
    getRecommendations,
    submitFeedback,
    getWeatherAlert
  };
})();
