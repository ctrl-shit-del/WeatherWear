/**
 * WeatherWear — Analytics Module
 * Wardrobe usage charts, sustainability tracker, season coverage
 */

const Analytics = (() => {

  const COLORS = [
    '#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff',
    '#fd79a8', '#00cec9', '#a29bfe', '#55efc4', '#fab1a0'
  ];

  function renderBarChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight || 200;

    ctx.clearRect(0, 0, W, H);

    const maxVal = Math.max(...data, 1);
    const barCount = labels.length;
    if (barCount === 0) return;
    const padding = { left: 40, right: 20, top: 20, bottom: 50 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;
    const barW = Math.min((chartW / barCount) * 0.65, 60);
    const barSpacing = chartW / barCount;

    // Background grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter';
      ctx.fillText(Math.round(maxVal - (maxVal / 4) * i), 2, y + 4);
    }

    // Bars
    data.forEach((val, i) => {
      const x = padding.left + barSpacing * i + (barSpacing - barW) / 2;
      const barH = (val / maxVal) * chartH;
      const y = padding.top + chartH - barH;

      // Bar gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barH);
      const color = options.colors?.[i] || COLORS[i % COLORS.length];
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color + '55');
      ctx.fillStyle = gradient;

      // Rounded top
      const r = Math.min(4, barW / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.arcTo(x + barW, y, x + barW, y + r, r);
      ctx.lineTo(x + barW, y + barH);
      ctx.lineTo(x, y + barH);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      const labelText = labels[i].length > 8 ? labels[i].slice(0, 8) + '…' : labels[i];
      ctx.fillText(labelText, x + barW / 2, H - padding.bottom + 14);

      // Value on top
      if (val > 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(val, x + barW / 2, y - 4);
      }
    });
  }

  function renderDonutChart(canvasId, labels, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight || 200;
    ctx.clearRect(0, 0, W, H);

    const total = data.reduce((a, b) => a + b, 0);
    if (total === 0) return;

    const cx = W / 2;
    const cy = H / 2;
    const outerR = Math.min(W, H) * 0.38;
    const innerR = outerR * 0.55;
    let startAngle = -Math.PI / 2;

    data.forEach((val, i) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      const color = options.colors?.[i] || COLORS[i % COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#0d0d1a';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += sliceAngle;
    });

    // Inner hole
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
    ctx.fillStyle = options.bgColor || '#0d0d1a';
    ctx.fill();

    // Center text
    if (options.centerLabel) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 16px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(options.centerLabel, cx, cy + 6);
    }

    // Legend (below)
    const legendY = H - (labels.length > 4 ? 2 : 1) * 18;
    labels.forEach((label, i) => {
      if (i >= 6) return;
      const col = i % 2;
      const row = Math.floor(i / 2);
      const lx = col === 0 ? 8 : W / 2 + 4;
      const ly = legendY + row * 18;
      ctx.fillStyle = options.colors?.[i] || COLORS[i % COLORS.length];
      ctx.fillRect(lx, ly - 9, 10, 10);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(`${label} (${Math.round(data[i] / total * 100)}%)`, lx + 14, ly);
    });
  }

  function renderGaugeChart(canvasId, value, max, label, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight || 120;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H * 0.72;
    const r = Math.min(W / 2, H) * 0.75;

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.stroke();

    // Value arc
    const pct = Math.min(value / max, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, Math.PI + pct * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Value text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(r * 0.5)}px Outfit`;
    ctx.textAlign = 'center';
    ctx.fillText(value, cx, cy + 4);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '11px Inter';
    ctx.fillText(label, cx, cy + 18);
  }

  function renderOutfitHistory() {
    const history = Storage.get('outfit_history', []);
    const container = document.getElementById('outfit-history-timeline');
    if (!container) return;
    if (!history.length) {
      container.innerHTML = '<p class="empty-state">No outfit history yet. Start using the app!</p>';
      return;
    }
    container.innerHTML = history.slice(0, 10).map((entry, i) => {
      const date = new Date(entry.date);
      const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const outfit = OutfitDB.getById(entry.outfitId);
      return `
        <div class="timeline-item" style="animation-delay: ${i * 0.05}s">
          <div class="timeline-date">${dateStr}</div>
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <span class="timeline-outfit">${outfit?.name || 'Unknown Outfit'}</span>
            <span class="timeline-weather">${entry.weather?.temp}°C · ${entry.weather?.condition}</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderSustainabilityReport() {
    const stats = Wardrobe.getStats();
    const sustainEl = document.getElementById('sustainability-score');
    if (sustainEl) sustainEl.textContent = stats.sustainablePercent + '%';

    const co2El = document.getElementById('co2-saved');
    if (co2El) co2El.textContent = (stats.co2Saved > 0 ? '+' : '') + stats.co2Saved + ' kg';

    const fabricList = document.getElementById('fabric-breakdown');
    if (fabricList) {
      const entries = Object.entries(stats.byFabric).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const ecoFabrics = ['organic cotton', 'recycled polyester', 'hemp', 'bamboo', 'linen', 'merino wool'];
      fabricList.innerHTML = entries.map(([fab, count]) => {
        const isEco = ecoFabrics.some(f => fab.toLowerCase().includes(f));
        return `<div class="fabric-item">
          <span class="fabric-name">${fab}</span>
          <span class="fabric-badge ${isEco ? 'eco' : 'synth'}">${isEco ? '🌿 Eco' : '⚗️ Synthetic'}</span>
          <span class="fabric-count">${count} items</span>
        </div>`;
      }).join('') || '<p class="empty-state">Add wardrobe items to see fabric breakdown.</p>';
    }
  }

  function renderAll() {
    const stats = Wardrobe.getStats();

    // Most worn bar chart
    if (stats.mostWorn.length) {
      renderBarChart('chart-most-worn',
        stats.mostWorn.map(i => i.name.split(' ').slice(0, 2).join(' ')),
        stats.mostWorn.map(i => i.wearCount || 0));
    }

    // Type donut
    if (Object.keys(stats.byType).length) {
      renderDonutChart('chart-by-type',
        Object.keys(stats.byType),
        Object.values(stats.byType),
        { centerLabel: `${stats.total}\nitems` });
    }

    // Season donut
    if (Object.keys(stats.bySeason).length) {
      renderDonutChart('chart-by-season',
        Object.keys(stats.bySeason),
        Object.values(stats.bySeason));
    }

    // Underused items
    const underusedEl = document.getElementById('underused-items');
    if (underusedEl) {
      const items = stats.neverWorn.slice(0, 5);
      underusedEl.innerHTML = items.length
        ? items.map(i => `<div class="underused-item">
            <span class="underused-icon">${Wardrobe.TYPES.includes(i.type) ? '👔' : '✨'}</span>
            <span class="underused-name">${i.name}</span>
            <span class="underused-tag">${i.type} · ${i.season}</span>
          </div>`).join('')
        : '<p class="empty-state">All your clothes are being worn regularly! 🎉</p>';
    }

    renderOutfitHistory();
    renderSustainabilityReport();
  }

  return { renderAll, renderBarChart, renderDonutChart, renderGaugeChart, renderSustainabilityReport };
})();
