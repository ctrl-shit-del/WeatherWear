/**
 * WeatherWear — Inspiration Board Module
 * Pinterest-style masonry grid showing Indian outfit inspirations
 */

const WIKIMEDIA_COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

function getSelectedInspirationAudience() {
  if (typeof Storage === 'undefined') return 'women';
  return Storage.get('inspiration_audience', 'women') || 'women';
}

function setSelectedInspirationAudience(audience) {
  if (typeof Storage === 'undefined') return;
  Storage.set('inspiration_audience', audience);
}

function updateInspirationAudienceUI(activeAudience) {
  document.querySelectorAll('.inspiration-audience-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.audience === activeAudience);
  });
}

function bindInspirationAudienceToggle() {
  const toggle = document.getElementById('inspiration-audience-toggle');
  if (!toggle || toggle.dataset.bound === '1') return;

  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.inspiration-audience-btn');
    if (!btn) return;
    const audience = btn.dataset.audience || 'women';
    setSelectedInspirationAudience(audience);
    renderInspirationBoard();
  });

  toggle.dataset.bound = '1';
}

async function fetchWikimediaCandidates(query) {
  try {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      generator: 'search',
      gsrsearch: `${query} fashion outfit -cat -animal`,
      gsrlimit: '12',
      gsrnamespace: '6',
      prop: 'imageinfo',
      iiprop: 'url',
      iiurlwidth: '700'
    });

    const res = await fetch(`${WIKIMEDIA_COMMONS_API}?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pages = Object.values(data?.query?.pages || {});

    return pages
      .map((p) => p?.imageinfo?.[0]?.thumburl || p?.imageinfo?.[0]?.url)
      .filter(Boolean)
      .filter((u) => !/\.svg($|\?)/i.test(u));
  } catch (err) {
    console.warn('[Inspiration] Wikimedia fetch failed:', err);
    return [];
  }
}

async function resolveInspirationImage(item, usedUrls) {
  const query = item.search || item.title || 'indian ethnic wear';
  const candidates = await fetchWikimediaCandidates(query);
  const unique = candidates.find((u) => !usedUrls.has(u));

  if (unique) {
    usedUrls.add(unique);
    return unique;
  }

  // Fallback to CORS-friendly image using picsum.photos (public domain, CORS-enabled)
  // This avoids OpaqueResponseBlocking issues with source.unsplash.com redirects
  const sig = Math.abs(item.id.split('_').join('').split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  
  // Use picsum.photos which properly supports CORS
  const pictureId = 300 + (sig % 50); // Use varied but deterministic images
  const fallback = `https://picsum.photos/700/900?random=${sig}`;
  usedUrls.add(fallback);
  return fallback;
}

window.renderInspirationBoard = async function() {
  const grid = document.getElementById('masonry-grid');
  if (!grid) return;

  bindInspirationAudienceToggle();

  const weather = typeof Storage !== 'undefined' ? Storage.get('last_weather') : null;
  const prefs = typeof Storage !== 'undefined'
    ? Storage.get('user_prefs', { style: 'casual' })
    : { style: 'casual' };
  const audienceBucket = getSelectedInspirationAudience();
  updateInspirationAudienceUI(audienceBucket);

  const CATALOG = [
    {
      id: 'inspo_01',
      title: 'Breezy Cotton Kurti Set',
      tags: ['kurti', 'summer', 'casual', 'cotton', 'indian'],
      search: 'Indian women cotton kurti set street style',
      weather: ['hot', 'warm'],
      styles: ['casual', 'boho'],
      audience: ['women'],
      height: 340,
      url: ''
    },
    {
      id: 'inspo_02',
      title: 'Pastel Chikankari Kurta',
      tags: ['kurta', 'daywear', 'smart', 'indian'],
      search: 'Indian chikankari kurta pastel outfit',
      weather: ['warm', 'mild'],
      styles: ['smart_casual', 'casual'],
      audience: ['women', 'unisex'],
      height: 300,
      url: ''
    },
    {
      id: 'inspo_03',
      title: 'Classic Silk Saree Draping',
      tags: ['saree', 'silk', 'festive', 'indian'],
      search: 'Indian silk saree draping festive look',
      weather: ['mild', 'cool', 'warm'],
      styles: ['formal', 'smart_casual'],
      audience: ['women'],
      height: 420,
      url: ''
    },
    {
      id: 'inspo_04',
      title: 'Monsoon Anarkali Layers',
      tags: ['anarkali', 'rainy', 'ethnic', 'indian'],
      search: 'Indian anarkali suit rainy day ethnic outfit',
      weather: ['rainy', 'mild', 'cool'],
      styles: ['smart_casual', 'boho'],
      audience: ['women'],
      height: 380,
      url: ''
    },
    {
      id: 'inspo_05',
      title: 'Lehenga for Evening Events',
      tags: ['lehenga', 'festive', 'wedding', 'indian'],
      search: 'Indian lehenga evening wedding guest look',
      weather: ['mild', 'cool'],
      styles: ['formal'],
      audience: ['women'],
      height: 410,
      url: ''
    },
    {
      id: 'inspo_06',
      title: 'Indo-Western Office Fit',
      tags: ['indo-western', 'office', 'tailored', 'indian'],
      search: 'Indo western office wear India formal outfit',
      weather: ['mild', 'cool', 'warm'],
      styles: ['formal', 'smart_casual'],
      audience: ['unisex', 'women'],
      height: 320,
      url: ''
    },
    {
      id: 'inspo_07',
      title: 'Festive Sharara Set',
      tags: ['sharara', 'festive', 'indian', 'ethnic'],
      search: 'Indian sharara set festive style',
      weather: ['warm', 'mild'],
      styles: ['boho', 'formal'],
      audience: ['women'],
      height: 360,
      url: ''
    },
    {
      id: 'inspo_08',
      title: 'Winter Shawl with Kurta',
      tags: ['winter', 'shawl', 'kurta', 'indian'],
      search: 'Indian winter shawl kurta layered outfit',
      weather: ['cool', 'cold'],
      styles: ['casual', 'smart_casual'],
      audience: ['unisex'],
      height: 350,
      url: ''
    },
    {
      id: 'inspo_09',
      title: 'Bandhgala Evening Menswear',
      tags: ['bandhgala', 'menswear', 'formal', 'indian'],
      search: 'Indian men bandhgala evening formal wear',
      weather: ['mild', 'cool'],
      styles: ['formal'],
      audience: ['men'],
      height: 390,
      url: ''
    },
    {
      id: 'inspo_10',
      title: 'Sherwani Ceremony Look',
      tags: ['sherwani', 'wedding', 'menswear', 'indian'],
      search: 'Indian sherwani wedding ceremony men outfit',
      weather: ['mild', 'cool'],
      styles: ['formal'],
      audience: ['men'],
      height: 430,
      url: ''
    },
    {
      id: 'inspo_11',
      title: 'Printed Co-ord Kurta Set',
      tags: ['co-ord', 'kurta', 'dailywear', 'indian'],
      search: 'Indian printed kurta co-ord set streetwear',
      weather: ['hot', 'warm'],
      styles: ['casual', 'streetwear'],
      audience: ['unisex', 'women'],
      height: 300,
      url: ''
    },
    {
      id: 'inspo_12',
      title: 'Dupatta Styling for Monsoon',
      tags: ['dupatta', 'rainy', 'ethnic', 'indian'],
      search: 'Indian dupatta styling monsoon ethnic outfit',
      weather: ['rainy', 'warm', 'mild'],
      styles: ['casual', 'boho'],
      audience: ['women'],
      height: 340,
      url: ''
    }
  ];

  function getWeatherBucket(w) {
    if (!w) return 'mild';
    const main = (w.condition_main || '').toLowerCase();
    if (main.includes('rain') || main.includes('drizzle') || main.includes('thunder')) return 'rainy';
    if (w.temp <= 12) return 'cold';
    if (w.temp <= 20) return 'cool';
    if (w.temp <= 28) return 'mild';
    if (w.temp <= 34) return 'warm';
    return 'hot';
  }

  function titleByBucket(bucket) {
    const map = {
      rainy: 'Indian Monsoon Looks',
      cold: 'Indian Winter Layering',
      cool: 'Indian Transitional Styles',
      mild: 'Everyday Indian Ethnic Fits',
      warm: 'Breathable Indian Daywear',
      hot: 'Lightweight Indian Summer Looks'
    };
    return map[bucket] || 'Indian Style Inspiration';
  }

  const weatherBucket = getWeatherBucket(weather);
  const styleBucket = prefs.style || 'casual';

  let selected = CATALOG.filter(item =>
    item.weather.includes(weatherBucket) &&
    item.styles.includes(styleBucket) &&
    item.audience.includes(audienceBucket)
  );

  // Fall back gracefully so board never appears empty.
  if (selected.length < 6) {
    selected = CATALOG.filter(item =>
      item.weather.includes(weatherBucket) && item.audience.includes(audienceBucket)
    );
  }
  if (selected.length < 6) {
    selected = CATALOG.filter(item => item.audience.includes(audienceBucket));
  }
  if (selected.length < 6) {
    selected = CATALOG;
  }

  // Rotate cards on each shuffle without introducing random unrelated content.
  const seed = Math.floor(Date.now() / 60000) % CATALOG.length;
  const ordered = selected.slice(seed).concat(selected.slice(0, seed)).slice(0, 12);

  const audienceLabel = audienceBucket.charAt(0).toUpperCase() + audienceBucket.slice(1);
  const title = `${titleByBucket(weatherBucket)} · ${styleBucket.replace('_', ' ')} · ${audienceLabel}`;

  grid.innerHTML = `
    <div style="column-span: all; margin-bottom: 20px;">
      <div style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Curated for You</div>
      <div style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 700;">${title}</div>
      <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Fetching live inspiration images...</div>
    </div>
  `;

  const usedUrls = new Set();
  const cardsWithUrls = await Promise.all(
    ordered.map(async (item) => ({
      ...item,
      resolvedUrl: await resolveInspirationImage(item, usedUrls)
    }))
  );

  const html = cardsWithUrls.map(img => `
    <div style="break-inside: avoid; margin-bottom: 16px; border-radius: 12px; overflow: hidden; position: relative; background: var(--bg-card); box-shadow: var(--shadow-sm); cursor: pointer;" class="hover-lift">
      <img src="${img.resolvedUrl}" alt="${img.title}" style="display: block; width: 100%; border-radius: 12px; height: auto;" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='https://via.placeholder.com/400x${img.height}?text=Indian+Style+Look'" />
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); padding: 16px 12px 10px; color: white; display: flex; justify-content: space-between; align-items: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
        <span style="font-size: 0.75rem; font-weight: 500;"><strong>${img.title}</strong><br/>${img.tags.map(t => '#' + t).join(' ')}</span>
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
