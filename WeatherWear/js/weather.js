/**
 * WeatherWear — Weather Module
 * OpenWeather API integration with mock fallback mode
 */

const WeatherService = (() => {
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';
  const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

  // Mock data for demo mode (no API key needed)
  const MOCK_WEATHER = {
    city: 'Mumbai',
    country: 'IN',
    temp: 28,
    feels_like: 32,
    humidity: 78,
    wind_speed: 14,
    wind_deg: 220,
    precipitation: 0,
    uv_index: 7,
    condition: 'Haze',
    condition_main: 'Haze',
    condition_icon: '50d',
    visibility: 3000,
    pressure: 1008,
    sunrise: Date.now() / 1000 - 3600,
    sunset: Date.now() / 1000 + 18000,
    timestamp: Date.now(),
    forecast: [
      { day: 'Tomorrow', temp_min: 26, temp_max: 31, condition: 'Rain', icon: '10d', precip_prob: 70 },
      { day: 'Wed', temp_min: 24, temp_max: 29, condition: 'Thunderstorm', icon: '11d', precip_prob: 90 },
      { day: 'Thu', temp_min: 25, temp_max: 30, condition: 'Clouds', icon: '04d', precip_prob: 20 },
      { day: 'Fri', temp_min: 27, temp_max: 33, condition: 'Clear', icon: '01d', precip_prob: 5 },
      { day: 'Sat', temp_min: 26, temp_max: 32, condition: 'Clear', icon: '01d', precip_prob: 10 }
    ]
  };

  const conditionMap = {
    clear: ['Clear'],
    sunny: ['Clear'],
    partly_cloudy: ['Clouds'],
    overcast: ['Clouds'],
    drizzle: ['Drizzle'],
    rain: ['Rain'],
    heavy_rain: ['Rain'],
    thunderstorm: ['Thunderstorm'],
    snow: ['Snow'],
    blizzard: ['Snow'],
    freezing: ['Snow'],
    fog: ['Mist', 'Fog', 'Haze', 'Smoke'],
    cold: [],
    cool: [],
    mild: [],
    warm: [],
    hot: [],
    breezy: [],
    windy: [],
    humid: []
  };

  function mapConditionMain(apiMain) {
    const lower = apiMain.toLowerCase();
    if (lower.includes('thunder')) return 'thunderstorm';
    if (lower.includes('drizzle')) return 'drizzle';
    if (lower.includes('rain')) return 'rain';
    if (lower.includes('snow')) return 'snow';
    if (lower.includes('mist') || lower.includes('fog') || lower.includes('haze') || lower.includes('smoke')) return 'fog';
    if (lower.includes('cloud')) return 'partly_cloudy';
    return 'clear';
  }

  function mapTempCondition(temp) {
    if (temp <= 0) return 'freezing';
    if (temp <= 8) return 'cold';
    if (temp <= 15) return 'cool';
    if (temp <= 22) return 'mild';
    if (temp <= 28) return 'warm';
    return 'hot';
  }

  async function fetchWeatherByCity(city, apiKey, units = 'metric') {
    if (!apiKey) return { ...MOCK_WEATHER, city };

    try {
      // Geocode city
      const geoResp = await fetch(`${GEO_URL}/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`);
      const geoData = await geoResp.json();
      if (!geoData.length) throw new Error('City not found');
      const { lat, lon, name, country } = geoData[0];

      return await fetchWeatherByCoords(lat, lon, apiKey, units, name, country);
    } catch (err) {
      console.error('[Weather] City fetch error:', err);
      throw err;
    }
  }

  async function fetchWeatherByCoords(lat, lon, apiKey, units = 'metric', cityName = '', country = '') {
    if (!apiKey) return MOCK_WEATHER;

    try {
      const [currentResp, forecastResp, uvResp] = await Promise.all([
        fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`),
        fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}&cnt=40`),
        fetch(`${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${apiKey}`)
          .catch(() => ({ json: () => ({ value: 0 }) }))
      ]);

      const [current, forecastRaw] = await Promise.all([currentResp.json(), forecastResp.json()]);
      let uvData = { value: 0 };
      try { uvData = await uvResp.json(); } catch (e) {}

      // Parse forecast — one per day at noon
      const forecastByDay = {};
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      forecastRaw.list.forEach(item => {
        const d = new Date(item.dt * 1000);
        const dayKey = d.toDateString();
        const todayKey = new Date().toDateString();
        if (dayKey === todayKey) return;
        if (!forecastByDay[dayKey]) {
          const dayLabel = dayKey === new Date(Date.now() + 86400000).toDateString()
            ? 'Tomorrow'
            : dayNames[d.getDay()];
          forecastByDay[dayKey] = {
            day: dayLabel,
            temps: [], pops: [], icons: [], conditions: []
          };
        }
        forecastByDay[dayKey].temps.push(item.main.temp);
        forecastByDay[dayKey].pops.push((item.pop || 0) * 100);
        forecastByDay[dayKey].icons.push(item.weather[0].icon);
        forecastByDay[dayKey].conditions.push(item.weather[0].main);
      });

      const forecast = Object.values(forecastByDay).slice(0, 5).map(d => ({
        day: d.day,
        temp_min: Math.round(Math.min(...d.temps)),
        temp_max: Math.round(Math.max(...d.temps)),
        condition: d.conditions[Math.floor(d.conditions.length / 2)],
        icon: d.icons[Math.floor(d.icons.length / 2)],
        precip_prob: Math.round(Math.max(...d.pops))
      }));

      const precipMm = (current.rain?.['1h'] || 0) + (current.snow?.['1h'] || 0);

      return {
        city: cityName || current.name,
        country: country || current.sys.country,
        temp: Math.round(current.main.temp),
        feels_like: Math.round(current.main.feels_like),
        humidity: current.main.humidity,
        wind_speed: Math.round((current.wind?.speed || 0) * 3.6), // m/s to km/h
        wind_deg: current.wind?.deg || 0,
        precipitation: precipMm,
        uv_index: uvData.value || 0,
        condition: current.weather[0].description,
        condition_main: current.weather[0].main,
        condition_icon: current.weather[0].icon,
        visibility: current.visibility || 10000,
        pressure: current.main.pressure,
        sunrise: current.sys.sunrise,
        sunset: current.sys.sunset,
        timestamp: Date.now(),
        lat, lon, forecast,
        units
      };
    } catch (err) {
      console.error('[Weather] Fetch error:', err);
      throw err;
    }
  }

  async function getWeather(city, apiKey, units = 'metric', useGeolocation = false) {
    const cacheKey = `weather_${city || 'geo'}_${units}`;
    const cached = Storage.get(cacheKey);
    if (cached) return { ...cached, fromCache: true };

    let data;
    if (useGeolocation && navigator.geolocation) {
      data = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            try {
              const wd = await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, apiKey, units);
              resolve(wd);
            } catch (e) { reject(e); }
          },
          () => fetchWeatherByCity(city || 'London', apiKey, units).then(resolve).catch(reject),
          { timeout: 5000 }
        );
      });
    } else {
      data = await fetchWeatherByCity(city || 'London', apiKey, units);
    }

    Storage.set(cacheKey, data, 15); // 15-minute TTL
    return data;
  }

  function getConditionTags(weatherData) {
    const tags = [];
    const condMain = mapConditionMain(weatherData.condition_main);
    tags.push(condMain);
    tags.push(mapTempCondition(weatherData.temp));
    if (weatherData.wind_speed > 30) tags.push('windy');
    if (weatherData.wind_speed > 15) tags.push('breezy');
    if (weatherData.humidity > 80) tags.push('humid');
    if (weatherData.precipitation > 0) tags.push('rain');
    if (weatherData.uv_index > 7) tags.push('high_uv');
    return [...new Set(tags)];
  }

  function getWeatherMood(weatherData) {
    const main = weatherData.condition_main.toLowerCase();
    if (main.includes('thunder')) return 'storm';
    if (main.includes('rain') || main.includes('drizzle')) return 'rainy';
    if (main.includes('snow')) return 'snow';
    if (main.includes('cloud')) return weatherData.temp < 15 ? 'overcast' : 'cloudy';
    if (weatherData.temp >= 28) return 'sunny_hot';
    if (weatherData.temp >= 20) return 'sunny_warm';
    if (weatherData.temp >= 12) return 'mild';
    return 'cold';
  }

  function getWindDirection(deg) {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  }

  return {
    getWeather,
    getConditionTags,
    getWeatherMood,
    getWindDirection,
    mapTempCondition,
    MOCK_WEATHER
  };
})();
