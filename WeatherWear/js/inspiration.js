/**
 * WeatherWear — Inspiration Board Module
 * Pinterest-style masonry grid showing outfit inspirations
 */

window.renderInspirationBoard = function() {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  const weather = typeof Storage !== 'undefined' ? Storage.get('last_weather') : null;
  
  // Decide what keywords to search for based on weather
  let query = 'outfit model fashion';
  let title = 'General Style Inspiration';
  
  if (weather) {
    const temp = weather.temp;
    if (temp < 10) {
      query = 'winter coat scarf outfit';
      title = 'Winter & Cold Weather Layers';
    } else if (temp < 20) {
      query = 'fall autumn sweater outfit';
      title = 'Cool Fall & Spring Styles';
    } else if (temp > 25) {
      query = 'summer outfit beach fashion';
      title = 'Warm Summer Fits';
    }
    
    if (weather.condition_main && weather.condition_main.toLowerCase().includes('rain')) {
       query = 'raincoat umbrella outfit';
       title = 'Rainy Day Outfits';
    }
  }

  // Generate 12 placeholder images from Unsplash Source API based on keywords
  // Unsplash source API is deprecated but we can use their new endpoint or a robust placeholder service
  // Or just mock some nice static image paths if we had local assets. We will use a reliable remote placeholder
  const queries = query.split(' ');
  const images = [];
  
  // Generate random heights to create the masonry effect
  const heights = [200, 250, 300, 350, 400];
  
  for (let i = 0; i < 12; i++) {
    const keyword = queries[i % queries.length];
    const height = heights[Math.floor(Math.random() * heights.length)];
    // We use loremflickr for reliable keyword-based placeholders instead of Unsplash Source API
    const uri = `https://loremflickr.com/400/${height}/${keyword.split(' ')[0]}?random=${i}`;
    
    images.push({
      url: uri,
      tags: [keyword, 'style', 'fashion'],
      likes: Math.floor(Math.random() * 500) + 10,
      height: height
    });
  }

  const html = images.map(img => `
    <div style="break-inside: avoid; margin-bottom: 16px; border-radius: 12px; overflow: hidden; position: relative; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer;" class="hover-lift">
      <img src="${img.url}" alt="Outfit Inspiration" style="display: block; width: 100%; border-radius: 12px; height: auto;" loading="lazy" onerror="this.src='https://via.placeholder.com/400x${img.height}?text=Outfit+Inspo'" />
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 16px 12px 10px; color: white; display: flex; justify-content: space-between; align-items: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <span style="font-size: 0.75rem; font-weight: 500;">
          ${img.tags.map(t => '#' + t).join(' ')}
        </span>
        <button class="btn btn-sm btn-icon" style="background: rgba(255,255,255,0.2) !important; color: white !important; backdrop-filter: blur(4px); padding: 4px;" onclick="showToast('Saved to your board!', 'success', 2000)">📌</button>
      </div>
    </div>
  `).join('');

  grid.innerHTML = `
    <div style="column-span: all; margin-bottom: 20px;">
      <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Curated for You</div>
      <div style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 700;">${title}</div>
    </div>
    ${html}
  `;
};
