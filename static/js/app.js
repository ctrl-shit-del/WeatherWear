/* ============================================================
   SORS — app.js  |  Main SPA JavaScript Logic
   ============================================================ */

'use strict';

// ─── State ───────────────────────────────────────────────────
const state = {
    user: null,
    weatherData: null,        // current weather fetched
    recommendations: null,   // last recommendations result
    wardrobe: [],
    analytics: null,
    currentMode: 'hybrid',
    currentView: 'dashboard',
    stylistContext: null,     // outfit being displayed in modal
    chartInstances: {},       // Chart.js instances
    sustainabilityPref: false,
};

// ─── Weather Icon Map ─────────────────────────────────────────
const WEATHER_ICONS = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '🌛',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌦️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
};
const CATEGORY_ICONS = { top: '👕', bottom: '👖', outerwear: '🧥', footwear: '👟', accessory: '🎩', set: '👔', other: '👗' };

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadUser();
    loadWardrobe();
    setGreeting();
    initSettingsForm();
    prefillCity();
});

// ─── User / Auth ──────────────────────────────────────────────
async function loadUser() {
    try {
        const res = await apiFetch('/api/auth/user');
        if (res.ok) {
            state.user = await res.json();
            document.getElementById('sidebar-user-name').textContent = state.user.name || state.user.id;
            document.getElementById('dash-user-name').textContent = (state.user.name || 'there').split(' ')[0];
            const av = (state.user.name || 'U')[0].toUpperCase();
            document.getElementById('user-avatar-text').textContent = av;
            state.sustainabilityPref = state.user.preferences?.sustainability_priority || false;
        }
    } catch (e) { /* ignore */ }
}

async function doLogout() {
    await apiFetch('/api/auth/logout', 'POST');
    window.location.href = '/login';
}

// ─── Greeting ─────────────────────────────────────────────────
function setGreeting() {
    const hour = new Date().getHours();
    let g = 'morning';
    if (hour >= 12 && hour < 17) g = 'afternoon';
    else if (hour >= 17) g = 'evening';
    const el = document.getElementById('time-greeting');
    if (el) el.textContent = g;
}

// ─── View Switching ───────────────────────────────────────────
const VIEW_META = {
    dashboard: { title: 'Dashboard', subtitle: 'Your outfit command center.' },
    recommend: {
        title: '✨ Recommendations', subtitle: 'Outfits tailored to today's weather.' },
  wardrobe:   { title: '👚 My Wardrobe', subtitle: 'Manage your clothing items.' },
    analytics: { title: '📊 Wardrobe Analytics', subtitle: 'Insights into your wardrobe usage.' },
    settings: { title: '⚙️ Settings', subtitle: 'Personalize your SORS experience.' },
};

function switchView(view) {
    // Hide all
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    // Show target
    document.getElementById(`view-${view}`)?.classList.add('active');
    document.getElementById(`nav-${view}`)?.classList.add('active');
    state.currentView = view;
    const meta = VIEW_META[view] || {};
    document.getElementById('topbar-title').textContent = meta.title || view;
    document.getElementById('topbar-subtitle').textContent = meta.subtitle || '';
    // Lazy load
    if (view === 'analytics') loadAnalytics();
    if (view === 'settings') populateSettings();
}

// ─── API Helper ───────────────────────────────────────────────
async function apiFetch(url, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts);
}

// ─── Weather ──────────────────────────────────────────────────
function prefillCity() {
    const city = state.user?.preferences?.location || 'Mumbai';
    document.getElementById('dash-city-input').value = city;
    document.getElementById('rec-city-input').value = city;
}

async function fetchWeather(ctx) {  // ctx = 'dash' | 'rec'
    const cityInput = document.getElementById(`${ctx}-city-input`);
    const city = cityInput?.value?.trim();
    if (!city) { showToast('Please enter a city name.', 'error'); return; }

    if (ctx === 'dash') {
        document.getElementById('dash-weather-empty').style.display = 'none';
        document.getElementById('dash-weather-display').style.display = 'none';
        document.getElementById('dash-weather-loading').style.display = 'flex';
    }

    try {
        const res = await apiFetch('/api/weather', 'POST', { city });
        if (!res.ok) throw new Error('API error');
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Weather fetch failed');

        state.weatherData = json.data;

        if (ctx === 'dash') renderDashWeather(json.data);
        if (ctx === 'rec') renderRecWeather(json.data);

        // Sync both inputs
        document.getElementById('dash-city-input').value = json.data.city;
        document.getElementById('rec-city-input').value = json.data.city;

    } catch (err) {
        showToast('Failed to fetch weather. Please try again.', 'error');
        if (ctx === 'dash') {
            document.getElementById('dash-weather-loading').style.display = 'none';
            document.getElementById('dash-weather-empty').style.display = 'block';
        }
    }
}

function renderDashWeather(d) {
    document.getElementById('dash-weather-loading').style.display = 'none';
    document.getElementById('dash-weather-display').style.display = 'block';
    document.getElementById('dash-weather-icon').textContent = WEATHER_ICONS[d.icon] || '🌤️';
    document.getElementById('dash-temp').textContent = d.temp;
    document.getElementById('dash-city-name').textContent = `${d.city}, ${d.country}`;
    document.getElementById('dash-weather-desc').textContent = d.description;
    document.getElementById('dash-feels-like').textContent = `${d.feels_like}°C`;
    document.getElementById('dash-humidity').textContent = `${d.humidity}%`;
    document.getElementById('dash-wind').textContent = `${d.wind_speed} km/h`;
    document.getElementById('dash-rain').textContent = `${d.rain_prob}%`;
    document.getElementById('dash-uv').textContent = d.uv_index;
    document.getElementById('dash-weather-source').textContent =
        d.source === 'live' ? '🟢 Live data' : '🟡 Demo data';

    const warningsEl = document.getElementById('dash-warnings');
    warningsEl.innerHTML = (d.warnings || []).map(w =>
        `<div class="weather-warning">${w}</div>`
    ).join('');

    // Update tips
    renderDashTips(d);
    showToast(`Weather loaded for ${d.city}`, 'success');
    document.getElementById('rec-badge').style.display = 'inline';
}

function renderDashTips(d) {
    const tips = d.warnings || [];
    if (d.comfort_note) tips.unshift('💡 ' + d.comfort_note);
    const tipsEl = document.getElementById('dash-tips');
    if (tips.length) {
        tipsEl.innerHTML = tips.map(t =>
            `<div class="weather-warning" style="border-left-color:var(--accent-purple);background:rgba(139,92,246,0.07);">${t}</div>`
        ).join('');
    }
}

function renderRecWeather(d) {
    const summaryEl = document.getElementById('rec-weather-summary');
    summaryEl.style.display = 'block';
    document.getElementById('rec-weather-icon').textContent = WEATHER_ICONS[d.icon] || '🌤️';
    document.getElementById('rec-temp').textContent = `${d.temp}°C`;
    document.getElementById('rec-city-label').textContent = `${d.city}, ${d.country} — ${d.description}`;

    const statChips = document.getElementById('rec-stat-chips');
    statChips.innerHTML = [
        `<div class="weather-stat" style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 12px;">🌡️ Feels ${d.feels_like}°C</div>`,
        `<div class="weather-stat" style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 12px;">💧 ${d.humidity}% humidity</div>`,
        `<div class="weather-stat" style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 12px;">🌧️ ${d.rain_prob}% rain</div>`,
        `<div class="weather-stat" style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 12px;">☀️ UV ${d.uv_index}</div>`,
    ].join('');

    const warningsEl = document.getElementById('rec-warnings');
    warningsEl.innerHTML = (d.warnings || []).map(w =>
        `<div class="weather-warning">${w}</div>`
    ).join('');
}

function goRecommendWithWeather() {
    switchView('recommend');
    if (state.weatherData) renderRecWeather(state.weatherData);
}

// ─── Recommendation Mode ──────────────────────────────────────
function setMode(mode) {
    state.currentMode = mode;
    ['hybrid', 'wardrobe', 'curated'].forEach(m => {
        document.getElementById(`mode-${m}`)?.classList.toggle('active', m === mode);
    });
}

// ─── Generate Recommendations ─────────────────────────────────
async function generateRecommendations() {
    if (!state.weatherData) {
        showToast('Please fetch weather first!', 'error');
        return;
    }
    const btn = document.getElementById('btn-generate');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating…';
    document.getElementById('rec-loading').style.display = 'flex';
    document.getElementById('rec-empty').style.display = 'none';
    document.getElementById('rec-results').style.display = 'none';

    try {
        const res = await apiFetch('/api/recommend', 'POST', {
            weather: state.weatherData,
            mode: state.currentMode
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        state.recommendations = data;
        renderRecommendations(data);
        document.getElementById('rec-badge').style.display = 'none';
        showToast(`Found ${data.recommendations.length} outfit suggestions!`, 'success');
    } catch (err) {
        showToast('Recommendation error. Please try again.', 'error');
        document.getElementById('rec-empty').style.display = 'block';
    } finally {
        document.getElementById('rec-loading').style.display = 'none';
        btn.disabled = false;
        btn.innerHTML = '✨ Generate Outfits';
    }
}

function renderRecommendations(data) {
    const resultsEl = document.getElementById('rec-results');
    resultsEl.style.display = 'block';

    // Count label
    document.getElementById('rec-count-label').textContent =
        `${data.recommendations.length} outfits found`;

    // Accessories
    const accSection = document.getElementById('accessories-section');
    const accChips = document.getElementById('accessory-chips');
    if (data.accessories?.length) {
        accSection.style.display = 'block';
        accChips.innerHTML = data.accessories.map(a =>
            `<div class="accessory-chip">✅ ${a}</div>`
        ).join('');
    }

    // Layering tip
    const layerSection = document.getElementById('layering-section');
    if (data.layering_tip) {
        layerSection.style.display = 'block';
        const lt = data.layering_tip;
        let stepsHtml = `<div class="layering-steps">`;
        if (lt.base) stepsHtml += layerStep(1, 'Base Layer', lt.base);
        if (lt.mid) stepsHtml += layerStep(2, 'Mid Layer', lt.mid);
        if (lt.outer) stepsHtml += layerStep(3, 'Outer Layer', lt.outer);
        stepsHtml += `</div>`;
        if (lt.tip) stepsHtml += `<div style="margin-top:10px;font-size:12px;color:var(--text-muted);">💡 ${lt.tip}</div>`;
        document.getElementById('layering-content').innerHTML = stepsHtml;
    }

    // Outfit Grid
    const grid = document.getElementById('outfit-grid');
    grid.innerHTML = '';
    data.recommendations.forEach((outfit, idx) => {
        grid.appendChild(createOutfitCard(outfit, idx === 0 && outfit === data.top_pick));
    });

    // Shopping hints
    const shopSection = document.getElementById('shopping-section');
    const shopList = document.getElementById('shopping-hints-list');
    if (data.shopping_hints?.length) {
        shopSection.style.display = 'block';
        shopList.innerHTML = data.shopping_hints.map(h =>
            `<div class="shopping-hint"><span>${h}</span></div>`
        ).join('');
    }
}

function layerStep(num, label, desc) {
    return `<div class="layer-step">
    <div class="layer-num">${num}</div>
    <div class="layer-label">${label}</div>
    <div class="layer-desc">${desc.slice(0, 80)}…</div>
  </div>`;
}

function createOutfitCard(outfit, isTop) {
    const card = document.createElement('div');
    card.className = `outfit-card fade-in${isTop ? ' top-pick' : ''}`;
    if (isTop) card.innerHTML += `<div class="top-pick-label">🥇 Top Pick</div>`;

    const score = outfit.comfort_score || 0;
    const pct = (score / 10) * 100;
    const sourceClass = outfit.source === 'wardrobe' ? 'badge-wardrobe' :
        outfit.source === 'curated' ? 'badge-curated' : 'badge-hybrid';
    const sourceLabel = outfit.source === 'wardrobe' ? '👚 Wardrobe' :
        outfit.source === 'curated' ? '💎 Curated' : '🔀 Hybrid';

    const items = outfit.items || [];
    const displayItems = items.slice(0, 4);
    const moreCount = items.length - 4;

    const badges = [];
    if (outfit.rain_suitable) badges.push('<span class="weather-badge badge-rain">☔ Rain OK</span>');
    if (outfit.uv_protection) badges.push('<span class="weather-badge badge-uv">🕶️ UV Shield</span>');
    if (outfit.wind_resistant) badges.push('<span class="weather-badge badge-wind">💨 Wind OK</span>');
    if ((outfit.sustainability_score || 0) >= 8) badges.push('<span class="weather-badge badge-eco">♻️ Eco</span>');

    card.innerHTML += `
    <div class="outfit-card-header">
      <div class="outfit-name">${outfit.name}</div>
      <span class="outfit-source-badge ${sourceClass}">${sourceLabel}</span>
    </div>
    <div class="comfort-score-bar">
      <div class="score-label">
        <span>Comfort Score</span>
        <span class="score-value">${score}/10</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%"></div>
      </div>
    </div>
    <div class="outfit-items">
      ${displayItems.map(i => `<span class="outfit-item-tag">${i}</span>`).join('')}
      ${moreCount > 0 ? `<span class="outfit-item-tag more">+${moreCount} more</span>` : ''}
    </div>
    <div class="outfit-badges">${badges.join('')}</div>
    <div class="outfit-actions">
      <button class="btn-stylist" onclick='openStylistModal(${JSON.stringify(outfit).split("'").join("&#39;")})'>🤖 AI Stylist</button>
      <button class="btn-wear" onclick='markWorn(${JSON.stringify(outfit.item_ids || [])}, "${outfit.name}")'>✓ Worn</button>
    </div>
  `;
    return card;
}

// ─── Wardrobe ─────────────────────────────────────────────────
async function loadWardrobe() {
    try {
        const res = await apiFetch('/api/wardrobe');
        const data = await res.json();
        state.wardrobe = data.items || [];
        renderWardrobeGrid(state.wardrobe);
        updateWardrobeStats();
    } catch (e) {
        document.getElementById('wardrobe-grid').innerHTML =
            '<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">Could not load wardrobe</div></div>';
    }
}

function renderWardrobeGrid(items) {
    const grid = document.getElementById('wardrobe-grid');
    const countBadge = document.getElementById('wardrobe-count-badge');
    const countLabel = document.getElementById('wardrobe-item-count');

    countBadge.textContent = items.length;
    countLabel.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

    if (!items.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">👚</div>
      <div class="empty-title">Wardrobe is empty</div>
      <div class="empty-desc">Add your first clothing item using the form above to get personalized recommendations.</div>
    </div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        const icon = CATEGORY_ICONS[item.category] || '👗';
        const bgColor = categoryBg(item.category);
        const tags = (item.tags || []).slice(0, 3);
        return `<div class="wardrobe-item-card fade-in">
      <div class="wardrobe-thumb" style="background:${bgColor}">
        <span>${icon}</span>
        <span class="wear-count-badge">${item.times_worn || 0}×</span>
        <button class="btn-remove-item" onclick="removeWardrobeItem('${item.id}', event)">✕</button>
      </div>
      <div class="wardrobe-item-info">
        <div class="wardrobe-item-name" title="${item.name}">${item.name}</div>
        <div class="wardrobe-item-meta">${item.fabric || '–'} · ${item.color || '–'}</div>
        <div class="wardrobe-item-tags">
          ${tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
          ${item.rain_suitable ? '<span class="tag-pill" style="background:rgba(59,130,246,0.12);color:var(--accent-blue);">☔ Rain</span>' : ''}
        </div>
      </div>
    </div>`;
    }).join('');
}

function categoryBg(cat) {
    const map = {
        top: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.1))',
        bottom: 'linear-gradient(135deg,rgba(16,185,129,0.2),rgba(6,182,212,0.1))',
        outerwear: 'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(239,68,68,0.1))',
        footwear: 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(139,92,246,0.1))',
        accessory: 'linear-gradient(135deg,rgba(244,63,94,0.15),rgba(245,158,11,0.1))',
    };
    return map[cat] || 'rgba(255,255,255,0.04)';
}

function filterWardrobe() {
    const q = document.getElementById('wardrobe-search').value.toLowerCase();
    const cat = document.getElementById('wardrobe-filter-cat').value;
    const filtered = state.wardrobe.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(q) || (item.tags || []).join(' ').toLowerCase().includes(q);
        const catMatch = !cat || item.category === cat;
        return nameMatch && catMatch;
    });
    renderWardrobeGrid(filtered);
}

function toggleAddForm() {
    const form = document.getElementById('add-item-form');
    const btn = document.getElementById('btn-toggle-add');
    const hidden = form.style.display === 'none';
    form.style.display = hidden ? '' : 'none';
    btn.textContent = hidden ? 'Hide Form' : 'Show Form';
}

const selectedSuitability = new Set(['cool', 'warm']);
function toggleSuit(btn) {
    const val = btn.dataset.val;
    if (selectedSuitability.has(val)) {
        selectedSuitability.delete(val);
        btn.classList.remove('active');
    } else {
        selectedSuitability.add(val);
        btn.classList.add('active');
    }
}

async function addWardrobeItem() {
    const name = document.getElementById('item-name').value.trim();
    if (!name) { showToast('Item name is required.', 'error'); return; }

    const tagsRaw = document.getElementById('item-tags').value;
    const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

    const item = {
        name,
        type: document.getElementById('item-type').value,
        category: document.getElementById('item-category').value,
        fabric: document.getElementById('item-fabric').value.trim(),
        color: document.getElementById('item-color').value.trim(),
        tags,
        weather_suitability: [...selectedSuitability],
        rain_suitable: document.getElementById('item-rain').checked,
        notes: document.getElementById('item-notes').value.trim(),
    };

    try {
        const res = await apiFetch('/api/wardrobe', 'POST', item);
        const data = await res.json();
        if (data.success) {
            state.wardrobe.push(data.item);
            renderWardrobeGrid(state.wardrobe);
            updateWardrobeStats();
            showToast(`"${name}" added to your wardrobe!`, 'success');
            // Clear form
            ['item-name', 'item-fabric', 'item-color', 'item-tags', 'item-notes'].forEach(id => {
                document.getElementById(id).value = '';
            });
            document.getElementById('item-rain').checked = false;
        }
    } catch (e) {
        showToast('Failed to add item. Please try again.', 'error');
    }
}

async function removeWardrobeItem(itemId, event) {
    event.stopPropagation();
    try {
        const res = await apiFetch(`/api/wardrobe/${itemId}`, 'DELETE');
        if (res.ok) {
            state.wardrobe = state.wardrobe.filter(i => i.id !== itemId);
            renderWardrobeGrid(state.wardrobe);
            updateWardrobeStats();
            showToast('Item removed from wardrobe.', 'info');
        }
    } catch (e) {
        showToast('Failed to remove item.', 'error');
    }
}

async function markWorn(itemIds, outfitName) {
    if (!itemIds?.length) { showToast('No wardrobe items to mark.', 'info'); return; }
    try {
        await apiFetch('/api/wardrobe/wear', 'POST', { item_ids: itemIds });
        showToast(`Marked "${outfitName}" as worn! Analytics updated.`, 'success');
        loadWardrobe(); // Refresh
    } catch (e) { /* ignore */ }
}

function updateWardrobeStats() {
    document.getElementById('stat-wardrobe-count').textContent = state.wardrobe.length;
    const totalWears = state.wardrobe.reduce((s, i) => s + (i.times_worn || 0), 0);
    document.getElementById('stat-total-wears').textContent = totalWears;
    document.getElementById('wardrobe-count-badge').textContent = state.wardrobe.length;

    // Most worn on dashboard
    const sorted = [...state.wardrobe].sort((a, b) => (b.times_worn || 0) - (a.times_worn || 0));
    const topWorn = sorted.slice(0, 5);
    const maxWorn = topWorn[0]?.times_worn || 1;
    const el = document.getElementById('dash-most-worn');
    el.innerHTML = topWorn.length ? topWorn.map((item, i) => `
    <div class="analytics-item">
      <div class="analytics-rank">${i + 1}</div>
      <div class="analytics-item-name">${item.name}</div>
      <div class="analytics-bar-row">
        <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${((item.times_worn || 0) / maxWorn * 100)}%"></div></div>
        <div class="wear-count-text">${item.times_worn || 0}×</div>
      </div>
    </div>`).join('') :
        '<div style="color:var(--text-muted);font-size:13px;padding:12px 0;">No items yet — add to wardrobe to track usage!</div>';
}

// ─── Analytics ────────────────────────────────────────────────
async function loadAnalytics() {
    if (state.analytics) { renderAnalytics(state.analytics); return; }
    document.getElementById('analytics-stats').innerHTML =
        '<div class="loading-overlay" style="grid-column:span 4;"><div class="spinner"></div> Loading analytics…</div>';
    try {
        const res = await apiFetch('/api/analytics');
        state.analytics = await res.json();
        renderAnalytics(state.analytics);
    } catch (e) { showToast('Failed to load analytics.', 'error'); }
}

function renderAnalytics(data) {
    // Stats grid
    const statsEl = document.getElementById('analytics-stats');
    statsEl.innerHTML = `
    <div class="metric-card"><div class="metric-icon">👚</div><div class="metric-value">${data.total}</div><div class="metric-label">Total Items</div></div>
    <div class="metric-card"><div class="metric-icon">🔄</div><div class="metric-value">${data.total_wears || 0}</div><div class="metric-label">Total Wears</div></div>
    <div class="metric-card"><div class="metric-icon">🏆</div><div class="metric-value">${data.most_worn?.[0]?.times_worn || 0}×</div><div class="metric-label">Most Worn Count</div></div>
    <div class="metric-card"><div class="metric-icon">😴</div><div class="metric-value">${data.underutilized?.length || 0}</div><div class="metric-label">Underutilized Items</div></div>
  `;

    // Most worn list
    const mostWornEl = document.getElementById('analytics-most-worn');
    const mw = data.most_worn || [];
    const maxW = mw[0]?.times_worn || 1;
    mostWornEl.innerHTML = mw.length ? mw.map((item, i) => `
    <div class="analytics-item">
      <div class="analytics-rank">${i + 1}</div>
      <div class="analytics-item-name">${item.name}</div>
      <div class="analytics-bar-row">
        <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${(item.times_worn / maxW * 100)}%"></div></div>
        <div class="wear-count-text">${item.times_worn}×</div>
      </div>
    </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;">No data yet.</div>';

    // Underutilized
    const underEl = document.getElementById('analytics-under');
    const under = data.underutilized || [];
    underEl.innerHTML = under.length ? under.map((item, i) => `
    <div class="analytics-item">
      <div class="analytics-rank" style="background:rgba(245,158,11,0.3);">!</div>
      <div class="analytics-item-name">${item.name}</div>
      <div style="font-size:11px;color:var(--text-muted);">${item.times_worn}× worn</div>
    </div>`).join('') : '<div style="color:var(--text-muted);font-size:13px;">All items are well utilized! 🎉</div>';

    // Charts
    renderChart('category-chart', 'Category Breakdown', data.by_category || {}, 'doughnut');
    renderChart('fabric-chart', 'Fabric Breakdown', data.by_fabric || {}, 'doughnut');

    state.analytics = null; // Reset so it refreshes next time
}

const CHART_COLORS = [
    'rgba(139,92,246,0.8)', 'rgba(59,130,246,0.8)', 'rgba(16,185,129,0.8)',
    'rgba(245,158,11,0.8)', 'rgba(244,63,94,0.8)', 'rgba(6,182,212,0.8)',
    'rgba(84,166,251,0.8)', 'rgba(251,146,60,0.8)'
];

function renderChart(canvasId, label, dataObj, type = 'doughnut') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (state.chartInstances[canvasId]) state.chartInstances[canvasId].destroy();
    const labels = Object.keys(dataObj);
    const values = Object.values(dataObj);
    if (!labels.length) { canvas.parentElement.innerHTML = '<div style="color:var(--text-muted);font-size:13px;padding:20px;text-align:center;">No data yet.</div>'; return; }
    state.chartInstances[canvasId] = new Chart(canvas, {
        type,
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: CHART_COLORS.slice(0, labels.length), borderWidth: 2, borderColor: 'rgba(13,13,26,0.8)' }]
        },
        options: {
            plugins: {
                legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12 } }
            },
            responsive: true, maintainAspectRatio: false,
        }
    });
}

// ─── AI Stylist Modal ─────────────────────────────────────────
function openStylistModal(outfit) {
    state.stylistContext = outfit;
    state.currentRating = 0;
    document.getElementById('stylist-outfit-name').textContent = outfit.name;
    document.getElementById('stylist-score').textContent = `${outfit.comfort_score || 0}/10`;
    document.getElementById('stylist-bar').style.width = `${((outfit.comfort_score || 0) / 10) * 100}%`;
    // Render explanation as basic markdown
    const raw = outfit.explanation || 'No explanation available.';
    document.getElementById('stylist-explanation').innerHTML = markdownToHtml(raw);
    // Reset stars
    document.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
    document.getElementById('stylist-modal').classList.add('open');
}

function closeStylistModal() {
    document.getElementById('stylist-modal').classList.remove('open');
}

function closeModal(event) {
    if (event.target.id === 'stylist-modal') closeStylistModal();
}

function markdownToHtml(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>').replace(/$/, '</p>');
}

let currentRating = 0;
function rateStar(val) {
    currentRating = val;
    document.querySelectorAll('.star').forEach(s => {
        s.classList.toggle('selected', parseInt(s.dataset.val) <= val);
    });
}

async function submitFeedback() {
    if (!state.stylistContext) return;
    const feedback = {
        outfit_id: state.stylistContext.id,
        outfit_name: state.stylistContext.name,
        rating: currentRating,
        weather_context: state.weatherData || {},
    };
    try {
        await apiFetch('/api/feedback', 'POST', feedback);
        showToast('Thank you for your feedback! 🌟', 'success');
        closeStylistModal();
    } catch (e) {
        showToast('Failed to submit feedback.', 'error');
    }
}

// ─── Settings ─────────────────────────────────────────────────
function initSettingsForm() {
    setTimeout(() => {
        if (state.user) populateSettings();
    }, 800);
}

function populateSettings() {
    if (!state.user) return;
    const p = state.user.preferences || {};
    const nameEl = document.getElementById('pref-name');
    if (nameEl) nameEl.value = state.user.name || '';
    const locEl = document.getElementById('pref-location');
    if (locEl) locEl.value = p.location || '';
    const styleEl = document.getElementById('pref-style');
    if (styleEl) styleEl.value = p.style || 'casual';
    const occasionEl = document.getElementById('pref-occasion');
    if (occasionEl) occasionEl.value = p.occasion || 'casual';
    const toggle = document.getElementById('toggle-sustainability');
    if (toggle) toggle.classList.toggle('on', !!p.sustainability_priority);
    state.sustainabilityPref = !!p.sustainability_priority;
}

function toggleSustainability() {
    state.sustainabilityPref = !state.sustainabilityPref;
    document.getElementById('toggle-sustainability').classList.toggle('on', state.sustainabilityPref);
}

async function savePreferences() {
    const prefs = {
        style: document.getElementById('pref-style').value,
        occasion: document.getElementById('pref-occasion').value,
        location: document.getElementById('pref-location').value.trim(),
        sustainability_priority: state.sustainabilityPref,
    };
    try {
        const res = await apiFetch('/api/auth/preferences', 'PUT', prefs);
        if (res.ok) {
            if (state.user) state.user.preferences = { ...state.user.preferences, ...prefs };
            prefillCity();
            showToast('Preferences saved! ✅', 'success');
        }
    } catch (e) {
        showToast('Failed to save preferences.', 'error');
    }
}

// ─── Toast ────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icons = { success: '✅', error: '❌', info: '💬' };
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '💬'}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// ─── Keyboard shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeStylistModal();
    if (e.key === 'Enter' && document.activeElement?.id === 'dash-city-input') fetchWeather('dash');
    if (e.key === 'Enter' && document.activeElement?.id === 'rec-city-input') fetchWeather('rec');
});
