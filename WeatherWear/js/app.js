/**
 * WeatherWear — Main App Module
 * Bootstraps all modules, manages navigation, renders all pages
 */

// ─── Time-of-Day Theme Engine ─────────────────────────────────────────────────
(function TimeThemeEngine() {
  const PERIODS = [
    { cls: 'tod-night',   start:   0, end: 269,  label: '🌙 Night',        emoji: '🌙' },
    { cls: 'tod-dawn',    start: 270, end: 389,  label: '🌅 Dawn',          emoji: '🌅' },
    { cls: 'tod-morning', start: 390, end: 659,  label: '☀️ Morning',       emoji: '🌄' },
    { cls: 'tod-day',     start: 660, end: 959,  label: '🌤️ Afternoon',    emoji: '☀️' },
    { cls: 'tod-golden',  start: 960, end: 1109, label: '🌇 Golden Hour',   emoji: '🌇' },
    { cls: 'tod-evening', start:1110, end: 1259, label: '🌆 Sunset',        emoji: '🌆' },
    { cls: 'tod-dusk',    start:1260, end: 1349, label: '🌃 Dusk',          emoji: '🌃' },
    { cls: 'tod-night',   start:1350, end: 1439, label: '🌙 Night',         emoji: '🌙' },
  ];

  function getMinutesOfDay() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function getPeriod(minutes) {
    return PERIODS.find(p => minutes >= p.start && minutes <= p.end) || PERIODS[0];
  }

  function applyTheme() {
    const mins = getMinutesOfDay();
    const period = getPeriod(mins);
    const html = document.documentElement;

    // Remove all time classes
    html.classList.remove('tod-night','tod-dawn','tod-morning','tod-day','tod-golden','tod-evening','tod-dusk');
    html.classList.add(period.cls);

    // Update time display in sidebar
    const timeEl = document.getElementById('time-of-day-label');
    if (timeEl) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeEl.textContent = `${period.emoji} ${timeStr} · ${period.label.split(' ').slice(1).join(' ')}`;
    }
  }

  // Apply immediately on load
  applyTheme();

  // Re-apply every 60 seconds to catch period transitions
  setInterval(applyTheme, 60 * 1000);

  // Export for use in init
  window._applyTimeTheme = applyTheme;
})();

(async () => {
  'use strict';

  // Load DB immediately
  await OutfitDB.load();

  // ─── State ────────────────────────────────────────────────────────────────
  const DEFAULT_API_KEY = '7685d40703bbc7c9ff3adfffce2c6f0c';

  const state = {
    currentPage: 'dashboard',
    weather: null,
    recommendations: null,
    userPrefs: Storage.get('user_prefs', {
      apiKey: DEFAULT_API_KEY,
      units: 'metric',
      style: 'casual',
      occasion: '',
      sustainabilityMode: false,
      defaultCity: 'Mumbai'
    }),
    wardrobeFilter: 'all',
    isLoading: false,
  };

  // Ensure API key is filled in if it wasn't previously saved
  if (!state.userPrefs.apiKey) {
    state.userPrefs.apiKey = DEFAULT_API_KEY;
    Storage.set('user_prefs', state.userPrefs);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function cToF(celsius) {
    return Math.round((celsius * 9) / 5 + 32);
  }

  function formatTemp(celsius) {
    const isImperial = state.userPrefs.units === 'imperial';
    const value = isImperial ? cToF(celsius) : Math.round(celsius);
    const unit = isImperial ? 'F' : 'C';
    return `${value}°${unit}`;
  }

  function formatTempValue(celsius) {
    const isImperial = state.userPrefs.units === 'imperial';
    return isImperial ? cToF(celsius) : Math.round(celsius);
  }

  function clearWeatherCache() {
    Storage.clear('weather_');
    Storage.remove('last_weather');
  }

  function showToast(msg, type = 'info', duration = 3000) {
    const tc = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.className = `toast toast-${type} toast-dismiss`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    tc.appendChild(toast);
    setTimeout(() => toast.remove(), duration + 300);
  }

  function setLoading(show) {
    state.isLoading = show;
    const btn = document.getElementById('search-btn');
    if (btn) {
      if (show) {
        btn.innerHTML = '<span class="loading-spinner"></span>';
        btn.disabled = true;
      } else {
        btn.innerHTML = '🔍';
        btn.disabled = false;
      }
    }
  }

  function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.querySelector(`[data-page="${page}"]`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');
    state.currentPage = page;

    const titles = {
      dashboard: '🌤️ Dashboard',
      wardrobe: '👗 My Wardrobe',
      stylist: '🤖 AI Stylist',
      analytics: '📊 Analytics',
      settings: '⚙️ Settings'
    };
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = titles[page] || page;

    if (page === 'analytics') {
      setTimeout(() => Analytics.renderAll(), 100);
    }
    if (page === 'wardrobe') renderWardrobePage();
    if (page === 'stylist' && state.weather) {
      Stylist.setContext(state.weather, state.recommendations, state.userPrefs.calendarEvents, state.userPrefs);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ─── Weather & Calendar Fetch ──────────────────────────────────────────────
  async function fetchAndRenderWeather(city, useGeo = false) {
    setLoading(true);
    try {
      const weather = await WeatherService.getWeather(
        city || state.userPrefs.defaultCity,
        state.userPrefs.apiKey,
        'metric',
        useGeo
      );
      state.weather = weather;
      Storage.set('last_weather', weather);

      // Fetch Calendar Context (V2 Feature)
      try {
        const calRes = await fetch('http://localhost:5000/api/calendar/today');
        if (calRes.ok) {
          const calData = await calRes.json();
          if (calData.success) {
            state.userPrefs.calendarContext = calData.inferred_context;
            state.userPrefs.calendarEvents = calData.events;
            console.log("Calendar events loaded:", calData.events);
          }
        }
      } catch(e) { /* Backend not running, skip calendar */ }

      // Get recommendations
      const recs = await RecommendationEngine.getRecommendations(weather, state.userPrefs);
      state.recommendations = recs;

      // Update stylist context
      Stylist.setContext(weather, recs, state.userPrefs.calendarEvents, state.userPrefs);

      renderDashboard();
      showToast(`Weather updated for ${weather.city}`, 'success', 2000);
    } catch (err) {
      console.error('[App] Weather error:', err);
      showToast('Could not fetch weather. Showing demo data.', 'warning');
      // Fallback to mock data
      const mock = WeatherService.MOCK_WEATHER;
      state.weather = mock;
      const recs = await RecommendationEngine.getRecommendations(mock, state.userPrefs);
      state.recommendations = recs;
      Stylist.setContext(mock, recs, null, state.userPrefs);
      renderDashboard();
    } finally {
      setLoading(false);
    }
  }

  // ─── Dashboard Render ─────────────────────────────────────────────────────
  function renderDashboard() {
    const w = state.weather;
    const recs = state.recommendations;
    if (!w) return;

    const mood = WeatherService.getWeatherMood(w);
    const hero = document.getElementById('weather-hero');
    if (hero) {
      hero.className = `weather-hero mood-${mood}`;
    }

    // Weather data
    set('wd-city', `📍 ${w.city}, ${w.country}`);
    set('wd-temp', formatTemp(w.temp));
    set('wd-condition', w.condition);
    set('wd-feels', `Feels like ${formatTemp(w.feels_like)}`);
    set('wd-humidity', `${w.humidity}%`);
    set('wd-wind', `${w.wind_speed} km/h ${WeatherService.getWindDirection(w.wind_deg)}`);
    set('wd-uv', Math.round(w.uv_index || 0));
    set('wd-precip', w.precipitation > 0 ? `${w.precipitation.toFixed(1)}mm` : 'None');
    set('wd-pressure', `${w.pressure} hPa`);
    set('wd-visibility', w.visibility >= 10000 ? 'Clear' : `${(w.visibility / 1000).toFixed(1)} km`);

    // Sunrise/Sunset
    if (w.sunrise) {
      set('wd-sunrise', formatTime(w.sunrise));
      set('wd-sunset', formatTime(w.sunset));
    }

    // Weather mood icon overlay
    renderWeatherParticles(mood);

    // Comfort score
    if (recs) {
      renderComfortScore(recs.comfortScore, recs.comfortLabel);

      // Alerts
      const alerts = RecommendationEngine.getWeatherAlert(w);
      renderAlerts(alerts);

      // Condition tags
      const tagsEl = document.getElementById('condition-tags');
      if (tagsEl) {
        tagsEl.innerHTML = recs.conditionTags.map(t =>
          `<span class="badge badge-purple">${t}</span>`
        ).join('');
      }

      // Outfit cards
      renderOutfitCards(recs);
    }

    // Forecast
    renderForecast(w.forecast || []);

    // Last updated
    const lu = document.getElementById('last-updated');
    if (lu) lu.textContent = `Updated ${new Date(w.timestamp).toLocaleTimeString()}`;
  }

  function set(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function formatTime(unix) {
    return new Date(unix * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderComfortScore(score, label) {
    const scoreEl = document.getElementById('comfort-score-num');
    const labelEl = document.getElementById('comfort-label-text');
    const svgPath = document.getElementById('comfort-ring-fill');

    if (scoreEl) scoreEl.textContent = score.toFixed(1);
    if (labelEl) {
      labelEl.textContent = label.label;
      labelEl.style.color = label.color;
    }
    if (scoreEl) scoreEl.style.color = label.color;

    if (svgPath) {
      const r = 44;
      const circumference = 2 * Math.PI * r;
      const pct = score / 10;
      svgPath.style.stroke = label.color;
      svgPath.style.strokeDashoffset = circumference * (1 - pct);
    }
  }

  function renderAlerts(alerts) {
    const container = document.getElementById('weather-alerts');
    if (!container) return;
    if (!alerts.length) { container.innerHTML = ''; return; }
    container.innerHTML = alerts.map(a =>
      `<div class="alert alert-${a.type}">${a.msg}</div>`
    ).join('');
  }

  function renderWeatherParticles(mood) {
    const container = document.getElementById('weather-particles');
    if (!container) return;
    container.innerHTML = '';

    if (mood === 'rainy' || mood === 'storm') {
      for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'weather-particle rain-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (0.6 + Math.random() * 0.8) + 's';
        p.style.animationDelay = Math.random() * 2 + 's';
        p.style.opacity = 0.4 + Math.random() * 0.4;
        container.appendChild(p);
      }
      if (mood === 'storm') {
        const lightning = document.createElement('div');
        lightning.className = 'weather-particle lightning-particle';
        lightning.textContent = '⚡';
        lightning.style.right = '15%';
        lightning.style.top = '10%';
        container.appendChild(lightning);
      }
    }

    if (mood === 'snow') {
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'weather-particle snow-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.animationDuration = (2 + Math.random() * 3) + 's';
        p.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(p);
      }
    }

    if (mood === 'sunny_hot' || mood === 'sunny_warm') {
      const sun = document.createElement('div');
      sun.className = 'sun-particle';
      sun.innerHTML = '<div class="sun-particle-core"></div>' +
        [0, 45, 90, 135, 180, 225, 270, 315].map(deg =>
          `<div class="sun-ray" style="transform: translateX(-50%) translateY(-100%) rotate(${deg}deg); animation-delay: ${deg / 360}s"></div>`
        ).join('');
      container.appendChild(sun);
    }

    if (mood === 'cloudy' || mood === 'overcast') {
      [{ top: '12%', left: '10%' }, { top: '24%', right: '15%' }].forEach((pos, i) => {
        const cloud = document.createElement('div');
        cloud.className = 'weather-particle cloud-particle';
        Object.assign(cloud.style, pos);
        cloud.style.animationDelay = i * 1.5 + 's';
        cloud.style.animationDuration = (6 + i * 2) + 's';
        container.appendChild(cloud);
      });
    }
  }

  function renderOutfitCards(recs) {
    const container = document.getElementById('outfit-cards');
    if (!container) return;

    const tiers = [
      { key: 'curated', label: 'Curated Pick', badge: 'curated', icon: '✨' },
      { key: 'wardrobeOutfit', label: 'From Wardrobe', badge: 'wardrobe', icon: '👔' },
      { key: 'hybridOutfit', label: 'Hybrid', badge: 'hybrid', icon: '🔀' }
    ];

    container.innerHTML = tiers.filter(t => recs[t.key]).map(tier => {
      const outfit = recs[tier.key];
      if (!outfit) return '';

      const wardrobeMatch = outfit._wardrobeMatch;
      const items = outfit.items.map(item => {
        const isFromWardrobe = wardrobeMatch?.matched?.some(m => m.type === item.type);
        return `<div class="outfit-item-row">
          <span class="outfit-item-icon">${getItemEmoji(item.type)}</span>
          <span class="outfit-item-name">${item.name}</span>
          <span class="outfit-item-fabric">${item.fabric}</span>
          ${isFromWardrobe ? '<span class="outfit-item-from-wardrobe">✔ Yours</span>' : ''}
        </div>`;
      }).join('');

      const accessories = outfit.accessories?.map(a =>
        `<span class="accessory-tag">+ ${a}</span>`
      ).join('') || '';

      const colorDots = (outfit.color_palette || []).map(c =>
        `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};border:2px solid rgba(255,255,255,0.2);"></span>`
      ).join('');

      const shoppingLinks = outfit.shopping_links?.slice(0, 2).map(l =>
        `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-ghost btn-sm">🛍️ ${l.item}</a>`
      ).join('') || '';

      return `
        <div class="outfit-card animate-slide-up">
          <div class="outfit-card-header">
            <span class="outfit-tier-badge tier-${tier.badge}">${tier.icon} ${tier.label}</span>
            <div class="outfit-name">${outfit.name}</div>
            <div style="display:flex;gap:6px;margin-top:4px;align-items:center;">
              ${colorDots}
              <span style="font-size:0.75rem;color:var(--text-muted);margin-left:6px;">
                ${outfit.conditions?.join(' · ') || ''}
              </span>
            </div>
          </div>
          <div class="outfit-scores">
            <span class="score-pill"><span class="score-stars">${'★'.repeat(Math.round(outfit.style_score / 2))}${'☆'.repeat(5 - Math.round(outfit.style_score / 2))}</span> Style</span>
            <span class="score-pill">🌿 ${outfit.sustainability_score}/10 Eco</span>
            ${outfit.isHybrid ? '<span class="badge badge-amber">🔀 Hybrid</span>' : ''}
          </div>
          <div class="outfit-items stagger-children">${items}</div>
          ${accessories ? `<div class="outfit-accessories">${accessories}</div>` : ''}
          <div class="outfit-actions">
            <button class="btn btn-primary btn-sm ripple" onclick="handleWearOutfit('${outfit.id}')">👕 Wore This</button>
            <button class="btn btn-secondary btn-sm ripple" onclick="handleFeedback('${outfit.id}', true)">👍</button>
            <button class="btn btn-ghost btn-sm ripple" onclick="handleFeedback('${outfit.id}', false)">👎</button>
            ${shoppingLinks}
          </div>
        </div>`;
    }).join('');
  }

  function renderForecast(forecast) {
    const container = document.getElementById('forecast-strip');
    if (!container || !forecast?.length) return;

    const weatherIcons = {
      Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
      Thunderstorm: '⛈️', Snow: '❄️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️'
    };

    container.innerHTML = forecast.map(day => `
      <div class="forecast-day hover-lift">
        <div class="forecast-day-name">${day.day}</div>
        <div class="forecast-icon">${weatherIcons[day.condition] || '🌤️'}</div>
        <div class="forecast-temps">
          <span class="forecast-high">${formatTempValue(day.temp_max)}°</span>
          <span class="forecast-low">${formatTempValue(day.temp_min)}°</span>
        </div>
        ${day.precip_prob > 20 ? `<div class="forecast-rain">💧 ${day.precip_prob}%</div>` : ''}
      </div>
    `).join('');
  }

  function getItemEmoji(type) {
    const map = { top: '👕', base: '🧤', mid: '🧣', outer: '🧥', bottom: '👖', shoes: '👟', accessory: '🎩', dress: '👗', suit: '🤵' };
    return map[type] || '👔';
  }

  // ─── Wardrobe Page ─────────────────────────────────────────────────────────
  function renderWardrobePage() {
    const items = Wardrobe.getAll();
    const grid = document.getElementById('wardrobe-grid');
    if (!grid) return;

    const filter = state.wardrobeFilter;
    const filtered = filter === 'all' ? items : items.filter(i => i.type === filter || i.season === filter);

    updateWardrobeStats(items);

    if (!filtered.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div style="font-size:3rem;margin-bottom:12px">👗</div>
        <p>No wardrobe items yet.</p>
        <p style="margin-top:8px">Add your first item to get personalized recommendations!</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="openAddItemModal()">+ Add First Item</button>
      </div>`;
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <div class="wardrobe-item-card hover-scale" onclick="openEditItemModal('${item.id}')">
        <div class="wardrobe-item-photo">${getItemEmoji(item.type)}</div>
        ${item.wearCount > 0 ? `<span class="wear-count-badge">Worn ${item.wearCount}×</span>` : ''}
        <div class="wardrobe-item-actions">
          <button class="btn btn-sm btn-secondary btn-icon" onclick="event.stopPropagation(); Wardrobe.recordWear('${item.id}'); renderWardrobePage(); showToast('Wear recorded!','success');" title="Mark as worn">✓</button>
          <button class="btn btn-sm btn-danger btn-icon" onclick="event.stopPropagation(); deleteWardrobeItem('${item.id}');" title="Delete">×</button>
        </div>
        <div class="wardrobe-item-info">
          <div class="wardrobe-item-name">${item.name}</div>
          <div class="wardrobe-item-meta">${item.type} · ${item.season} · ${item.fabric}</div>
          <div style="display:flex;flex-wrap:wrap;gap:3px;margin-top:6px;">
            ${(item.tags || []).slice(0, 3).map(t => `<span class="badge badge-purple" style="font-size:0.65rem;">${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `).join('');
  }

  function updateWardrobeStats(items) {
    set('wardrobe-count', items.length);
    set('wardrobe-worn-count', items.filter(i => i.wearCount > 0).length);
    const susCount = items.filter(i => i.tags?.includes('sustainable')).length;
    set('wardrobe-eco-count', susCount);
    const totalWears = items.reduce((a, i) => a + (i.wearCount || 0), 0);
    set('wardrobe-total-wears', totalWears);
  }

  function deleteWardrobeItem(id) {
    Wardrobe.remove(id);
    renderWardrobePage();
    showToast('Item removed', 'info');
  }

  window.deleteWardrobeItem = deleteWardrobeItem;

  // ─── Outfit Feedback ──────────────────────────────────────────────────────
  window.handleFeedback = function(outfitId, positive) {
    RecommendationEngine.submitFeedback(outfitId, positive);
    showToast(positive ? '👍 Thanks! Improving your recommendations.' : '👎 Noted! We\'ll refine this.', 'success', 2000);
  };

  window.handleWearOutfit = function(outfitId) {
    const history = Storage.get('outfit_history', []);
    // Mark wear
    showToast('✅ Outfit logged! Your style history is updated.', 'success', 2500);
  };

  // ─── Add/Edit Wardrobe Item Modal ─────────────────────────────────────────
  window.openAddItemModal = function(prefillData = {}) {
    const modal = document.getElementById('modal-add-item');
    if (!modal) return;
    // Reset form
    const form = document.getElementById('form-add-item');
    if (form) form.reset();
    document.getElementById('modal-add-title').textContent = 'Add Wardrobe Item';
    document.getElementById('form-item-id').value = '';
    if (prefillData.name) document.getElementById('item-name').value = prefillData.name;
    modal.style.display = 'flex';
  };

  window.openEditItemModal = function(id) {
    const item = Wardrobe.getById(id);
    if (!item) return;
    const modal = document.getElementById('modal-add-item');
    if (!modal) return;
    document.getElementById('modal-add-title').textContent = 'Edit Item';
    document.getElementById('form-item-id').value = id;
    document.getElementById('item-name').value = item.name || '';
    document.getElementById('item-type').value = item.type || 'top';
    document.getElementById('item-season').value = item.season || 'all';
    document.getElementById('item-fabric').value = item.fabric || 'cotton';
    document.getElementById('item-color').value = item.color || '';
    modal.style.display = 'flex';
  };

  window.closeModal = function(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  };

  // ─── AI Stylist Page ───────────────────────────────────────────────────────
  function appendChatBubble(content, role) {
    const msgs = document.getElementById('chat-messages');
    if (!msgs) return;

    const isUser = role === 'user';
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'flex-end';
    wrapper.style.gap = '8px';
    wrapper.style.justifyContent = isUser ? 'flex-end' : 'flex-start';

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.innerHTML = renderMarkdown(content);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const meta = document.createElement('div');
    meta.className = 'chat-bubble-meta';
    meta.textContent = time;
    bubble.appendChild(meta);

    if (!isUser) {
      const avatar = document.createElement('div');
      avatar.className = 'stylist-avatar';
      avatar.textContent = '🤖';
      wrapper.appendChild(avatar);
    }

    wrapper.appendChild(bubble);
    msgs.appendChild(wrapper);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function renderMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--brand-secondary)">$1</a>');
  }

  function showTypingIndicator() {
    const msgs = document.getElementById('chat-messages');
    const typing = document.createElement('div');
    typing.id = 'typing-indicator';
    typing.style.display = 'flex';
    typing.style.alignItems = 'center';
    typing.style.gap = '8px';
    typing.innerHTML = `<div class="stylist-avatar">🤖</div>
      <div class="chat-bubble stylist" style="padding: 10px 16px">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>`;
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    return typing;
  }

  async function sendStylistMessage(message) {
    if (!message.trim()) return;
    const input = document.getElementById('chat-input');
    if (input) input.value = '';

    appendChatBubble(message, 'user');

    // Show typing
    const typingEl = showTypingIndicator();
    // No artificial delay needed if we are fetching from API
    
    const { response } = await Stylist.chat(message);
    typingEl.remove();
    appendChatBubble(response, 'stylist');
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  function renderSettingsPage() {
    const prefs = state.userPrefs;
    const apiKeyEl = document.getElementById('setting-api-key');
    if (apiKeyEl) apiKeyEl.value = prefs.apiKey || '';
    const unitsEl = document.getElementById('setting-units');
    if (unitsEl) unitsEl.value = prefs.units || 'metric';
    const styleEl = document.getElementById('setting-style');
    if (styleEl) styleEl.value = prefs.style || 'casual';
    const cityEl = document.getElementById('setting-default-city');
    if (cityEl) cityEl.value = prefs.defaultCity || '';
    const ecoEl = document.getElementById('setting-eco-mode');
    if (ecoEl) ecoEl.checked = prefs.sustainabilityMode || false;
  }

  function saveSettings() {
    const previousUnits = state.userPrefs.units || 'metric';
    state.userPrefs = {
      apiKey: document.getElementById('setting-api-key')?.value || '',
      units: document.getElementById('setting-units')?.value || 'metric',
      style: document.getElementById('setting-style')?.value || 'casual',
      defaultCity: document.getElementById('setting-default-city')?.value || '',
      sustainabilityMode: document.getElementById('setting-eco-mode')?.checked || false,
    };
    Storage.set('user_prefs', state.userPrefs);

    if (previousUnits !== state.userPrefs.units) {
      clearWeatherCache();
    }

    showToast('Settings saved!', 'success');
    // Refresh weather with new settings
    if (state.weather) fetchAndRenderWeather(state.weather.city);
  }

  // ─── Form: Add/Edit Wardrobe Item ─────────────────────────────────────────
  function handleWardrobeFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('form-item-id').value;
    const data = {
      name: document.getElementById('item-name').value,
      type: document.getElementById('item-type').value,
      season: document.getElementById('item-season').value,
      fabric: document.getElementById('item-fabric').value,
      color: document.getElementById('item-color').value,
    };
    if (!data.name || !data.type) { showToast('Please fill required fields', 'error'); return; }

    if (id) {
      Wardrobe.update(id, data);
      showToast('Item updated!', 'success');
    } else {
      Wardrobe.add(data);
      showToast('Item added to wardrobe!', 'success');
    }

    closeModal('modal-add-item');
    renderWardrobePage();
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    // Apply time theme immediately (already done by engine, refresh display)
    if (window._applyTimeTheme) window._applyTimeTheme();

    // Navigation
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.addEventListener('click', () => navigateTo(nav.dataset.page));
    });

    // Search
    const searchInput = document.getElementById('city-search');
    const searchBtn = document.getElementById('search-btn');
    const geoBtn = document.getElementById('geo-btn');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const city = searchInput?.value?.trim();
        if (city) fetchAndRenderWeather(city);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          const city = searchInput.value.trim();
          if (city) fetchAndRenderWeather(city);
        }
      });
    }

    if (geoBtn) {
      geoBtn.addEventListener('click', () => fetchAndRenderWeather('', true));
    }

    // Wardrobe filter buttons
    document.querySelectorAll('.wardrobe-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.wardrobe-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.wardrobeFilter = btn.dataset.filter;
        renderWardrobePage();
      });
    });

    // Wardrobe form submit
    const wardrobeForm = document.getElementById('form-add-item');
    if (wardrobeForm) wardrobeForm.addEventListener('submit', handleWardrobeFormSubmit);

    // Chat
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');

    if (chatSend) {
      chatSend.addEventListener('click', () => {
        const msg = chatInput?.value?.trim();
        if (msg) sendStylistMessage(msg);
      });
    }

    if (chatInput) {
      chatInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const msg = chatInput.value.trim();
          if (msg) sendStylistMessage(msg);
        }
      });
    }

    // Quick prompts
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => sendStylistMessage(btn.dataset.prompt));
    });

    // Settings
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSettings);

    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
      clearDataBtn.addEventListener('click', () => {
        if (confirm('Clear all WeatherWear data? This cannot be undone.')) {
          Storage.clear();
          showToast('All data cleared.', 'info');
          setTimeout(() => location.reload(), 1000);
        }
      });
    }

    // Modal overlay click to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.style.display = 'none';
      });
    });

    // Settings page render
    document.querySelector('[data-page="settings"]')?.addEventListener('click', () => {
      setTimeout(renderSettingsPage, 50);
    });

    // Load last weather or fetch fresh
    const lastWeather = Storage.get('last_weather');
    if (lastWeather && Date.now() - lastWeather.timestamp < 15 * 60 * 1000) {
      state.weather = lastWeather;
      RecommendationEngine.getRecommendations(lastWeather, state.userPrefs).then(recs => {
        state.recommendations = recs;
        Stylist.setContext(lastWeather, recs, state.userPrefs.calendarEvents, state.userPrefs);
        renderDashboard();
      });
    } else {
      fetchAndRenderWeather(state.userPrefs.defaultCity || 'Mumbai');
    }

    // Initial greeting from stylist or render history
    setTimeout(() => {
      const msgs = document.getElementById('chat-messages');
      if (msgs && !msgs.children.length) {
        const history = Stylist.getHistory();
        if (history && history.length > 0) {
          history.forEach(msg => {
            appendChatBubble(msg.content, msg.role);
          });
        } else {
          appendChatBubble(
            "👋 Hi! I'm your **AI Style Advisor** powered by WeatherWear.\n\nI can help you pick the perfect outfit, explain style choices, suggest alternatives, and even plan looks for special events!\n\nTry asking: *\"Why is today's outfit recommended?\"* or *\"What should I wear to a party?\"*",
            'stylist'
          );
        }
      }
    }, 500);

    // Set initial active nav
    navigateTo('dashboard');
  }

  // Expose globals for onclick handlers
  window.openAddItemModal = window.openAddItemModal;
  window.openEditItemModal = window.openEditItemModal;
  window.closeModal = window.closeModal;
  window.fetchAndRenderWeather = fetchAndRenderWeather;

  init();
})();
