/**
 * WeatherWear — Live Trend Scraper Integration Module
 * Fetches trends from the backend Scraper simulation API and visualizes them
 */

window.fetchLiveTrends = async function() {
  const grid = document.getElementById('trends-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="empty-state" style="grid-column:1/-1">
      <p>Fetching real-time trends...</p>
      <div class="loading-spinner" style="border-top-color:var(--brand-primary); margin:20px auto"></div>
    </div>`;

  try {
    const res = await fetch('http://localhost:5000/api/trends');
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (!data.success || !data.trending_items) {
      throw new Error("Invalid response format");
    }

    renderTrends(data.trending_items);
    
  } catch (error) {
    console.warn("[Trends] Mocking data because backend cannot be reached:", error);
    // Fallback Mock Data if backend fails (e.g., when launched as file:// without Flask)
    setTimeout(() => {
      renderTrends([
        { "name": "Oversized Linen Shirts", "trend_score": 98, "price": "$45", "drop": true },
        { "name": "Chunky Loafers", "trend_score": 92, "price": "$120", "drop": false },
        { "name": "Tech-Wear Cargo Pants", "trend_score": 88, "price": "$85", "drop": true },
        { "name": "Vintage Denim Jackets", "trend_score": 82, "price": "$60", "drop": false }
      ]);
    }, 800);
  }
};

function renderTrends(items) {
  const grid = document.getElementById('trends-grid');
  if (!grid) return;

  grid.innerHTML = items.map(item => `
    <div class="card hover-lift" style="position:relative; overflow:hidden">
      ${item.trend_score > 95 ? '<div style="position:absolute; top:-1px; right:-1px; background:var(--brand-primary); padding:4px 12px; border-bottom-left-radius:12px; font-size:0.75rem; font-weight:700">HOT</div>' : ''}
      <div style="font-size:2rem; margin-bottom:8px">📈</div>
      <div class="card-title" style="margin-bottom:4px">${item.name}</div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px">
        <span class="badge ${item.trend_score > 90 ? 'badge-amber' : 'badge-purple'}">🔥 Score ${item.trend_score}</span>
        <span style="font-weight:700; color:var(--text-secondary)">${item.price}</span>
      </div>
      ${item.drop ? '<div style="margin-top:12px; font-size:0.8rem; color:var(--brand-green);">⬇ Price Drop Detected!</div>' : ''}
      <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:16px" onclick="addToWishlist('${item.name}')">🤍 Save to Wishlist</button>
    </div>
  `).join('');
}

window.addToWishlist = function(itemName) {
  window.showToast?.(`Added "${itemName}" to wishlist!`, 'success') || alert(`Added ${itemName} to wishlist`);
};

// ─── Inspiration Board Logic ───────────────────────────────────────────────

window.renderInspirationBoard = function() {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  // Real Pinterest-style images from Unsplash source API for fashion
  const images = [
    { url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80', height: 280, title: 'Streetwear Casual' },
    { url: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&q=80', height: 350, title: 'Smart Minimalist' },
    { url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80', height: 220, title: 'Summer Layers' },
    { url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80', height: 300, title: 'Winter Layers' },
    { url: 'https://images.unsplash.com/photo-1550614000-4b95d466f2bd?w=400&q=80', height: 260, title: 'Tailored Fit' },
    { url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80', height: 380, title: 'Urban Chic' },
    { url: 'https://images.unsplash.com/photo-1509631179647-0ca7729f9571?w=400&q=80', height: 240, title: 'Weekend Vibes' },
    { url: 'https://images.unsplash.com/photo-1485230895905-efb528a47ff7?w=400&q=80', height: 320, title: 'Accessorized' },
    { url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80', height: 280, title: 'Light Accents' }
  ];

  // Shuffle images to make 'Shuffle' button work
  const shuffled = images.sort(() => 0.5 - Math.random());

  grid.innerHTML = shuffled.map((img, i) => `
    <div class="masonry-item" style="
      margin-bottom: 16px; 
      page-break-inside: avoid; 
      break-inside: avoid;
      position: relative;
      border-radius: var(--radius-lg);
      transform: translateY(20px);
      opacity: 0;
      animation: slideUpFade 0.5s ${i * 0.08}s forwards ease-out;
      background: var(--glass-bg);
      border: 1px solid var(--border-card);
      overflow: hidden;
    ">
      <img src="${img.url}" style="width:100%; height:${img.height}px; object-fit:cover; display:block;" alt="${img.title}" loading="lazy"/>
      <div style="position:absolute; bottom:0; left:0; width:100%; padding:12px; background:linear-gradient(transparent, rgba(0,0,0,0.8)); color:white;">
        <div style="font-weight:700; font-size:0.9rem">${img.title}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:6px; width:100%; padding:4px; font-size:0.75rem" onclick="event.stopPropagation(); addToWishlist('${img.title}')">🤍 Save Look</button>
      </div>
    </div>
  `).join('');
};
