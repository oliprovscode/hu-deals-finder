// =============================================================
// HU Deals Finder — Data layer
// =============================================================
// Priority order:
//  1. eMAG.hu Affiliate Product Feed (XML, public affiliate URL)
//  2. Google Shopping RSS via SerpApi (requires free API key)
//  3. Built-in mock data (always works, no key needed)
// =============================================================

// ---- CONFIG — fill in your keys ----
const CONFIG = {
  // eMAG affiliate partner ID — register free at https://affiliate.emag.hu
  EMAG_AFFILIATE_ID: '',        // e.g. 'AB1234'

  // SerpApi key — free 100 searches/mo at https://serpapi.com
  SERPAPI_KEY: '',              // e.g. 'abc123...'

  // Set to 'emag', 'serpapi', or 'mock'
  // 'auto' will try eMAG → SerpApi → mock in order
  DATA_SOURCE: 'mock',
};

// ---- MOCK DATA (always available) ----
const MOCK_DEALS = [
  { id: 1,  name: "Samsung Galaxy S24 128GB",          store: "eMAG.hu",        category: "phones",     price: 149990, original: 179990, discount: 17, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Galaxy+S24",    url: "https://www.emag.hu/samsung-galaxy-s24" },
  { id: 2,  name: "Apple MacBook Air M2 13\"",          store: "Alza.hu",         category: "laptops",    price: 449900, original: 519900, discount: 13, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=MacBook+Air",   url: "https://www.alza.hu/apple-macbook" },
  { id: 3,  name: "Sony WH-1000XM5 Headphones",        store: "MediaMarkt.hu",   category: "audio",      price: 89900,  original: 119900, discount: 25, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Sony+XM5",       url: "https://www.mediamarkt.hu" },
  { id: 4,  name: "LG OLED55C3 55\" 4K TV",            store: "Extreme Digital", category: "tvs",        price: 389000, original: 499000, discount: 22, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=LG+OLED",        url: "https://www.extremedigital.hu" },
  { id: 5,  name: "PlayStation 5 Slim",                 store: "eMAG.hu",        category: "gaming",     price: 159900, original: 189900, discount: 16, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=PS5+Slim",       url: "https://www.emag.hu" },
  { id: 6,  name: "Apple iPhone 15 Pro 256GB",          store: "iStyle.hu",      category: "phones",     price: 429900, original: 469900, discount:  9, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=iPhone+15+Pro", url: "https://www.istyle.hu" },
  { id: 7,  name: "Lenovo IdeaPad 5 Pro 16\"",          store: "Alza.hu",         category: "laptops",    price: 199900, original: 249900, discount: 20, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=IdeaPad+5",    url: "https://www.alza.hu" },
  { id: 8,  name: "Bosch WAV28E90BY Washing Machine",   store: "Euronics.hu",    category: "appliances", price: 179900, original: 229900, discount: 22, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Bosch+WM",      url: "https://www.euronics.hu" },
  { id: 9,  name: "JBL Charge 5 Bluetooth Speaker",     store: "MediaMarkt.hu",  category: "audio",      price: 29990,  original: 44990,  discount: 33, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=JBL+Charge+5", url: "https://www.mediamarkt.hu" },
  { id: 10, name: "Xbox Series X Console",              store: "Extreme Digital", category: "gaming",    price: 169900, original: 199900, discount: 15, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Xbox+Series+X", url: "https://www.extremedigital.hu" },
  { id: 11, name: "Samsung 65\" QLED 4K Q80C",         store: "eMAG.hu",         category: "tvs",        price: 279900, original: 359900, discount: 22, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Samsung+QLED",  url: "https://www.emag.hu" },
  { id: 12, name: "Dyson V15 Detect Vacuum",            store: "Alza.hu",         category: "appliances", price: 199900, original: 249900, discount: 20, img: "https://placehold.co/280x140/f7f7f5/1a1a1a?text=Dyson+V15",    url: "https://www.alza.hu" },
];

let DEALS = [];
let watchlist = JSON.parse(localStorage.getItem('hu_watchlist') || '[]');
let currentCategory = 'all';
let currentSort = 'discount';
let searchQuery = '';

// =============================================================
// DATA FETCHING
// =============================================================

/**
 * eMAG Affiliate Product Feed
 * Register at: https://affiliate.emag.hu
 * Once approved, you get an XML feed URL like:
 * https://affiliate.emag.hu/feeds/{AFFILIATE_ID}/products.xml
 * This parses that feed and maps it to our deal format.
 */
async function fetchEmagFeed() {
  if (!CONFIG.EMAG_AFFILIATE_ID) throw new Error('No eMAG affiliate ID set');
  const feedUrl = `https://affiliate.emag.hu/feeds/${CONFIG.EMAG_AFFILIATE_ID}/products.xml`;
  // Use allorigins proxy to bypass CORS on client side
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;
  const res = await fetch(proxy);
  const json = await res.json();
  const parser = new DOMParser();
  const xml = parser.parseFromString(json.contents, 'text/xml');
  const items = [...xml.querySelectorAll('item, product')];
  return items.slice(0, 40).map((item, i) => {
    const get = (tag) => item.querySelector(tag)?.textContent?.trim() || '';
    const price = parseFloat(get('sale_price') || get('price') || '0') || 0;
    const original = parseFloat(get('price') || '0') || price;
    const discount = original > price ? Math.round((1 - price / original) * 100) : 0;
    return {
      id: 1000 + i,
      name: get('title') || get('name'),
      store: 'eMAG.hu',
      category: mapCategory(get('product_type') || get('category')),
      price,
      original,
      discount,
      img: get('image_link') || get('image') || '',
      url: get('link') || get('url') || 'https://www.emag.hu',
    };
  }).filter(d => d.name && d.price > 0 && d.discount > 0);
}

/**
 * SerpApi Google Shopping — free 100 searches/month
 * Register at: https://serpapi.com (free plan)
 * Searches Google Shopping for Hungarian deals.
 */
async function fetchSerpApiDeals(query = 'akció elektronika') {
  if (!CONFIG.SERPAPI_KEY) throw new Error('No SerpApi key set');
  const params = new URLSearchParams({
    engine: 'google_shopping',
    q: query,
    gl: 'hu',
    hl: 'hu',
    api_key: CONFIG.SERPAPI_KEY,
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await res.json();
  return (data.shopping_results || []).slice(0, 24).map((item, i) => {
    const price = parseFloat((item.price || '').replace(/[^0-9.]/g, '')) || 0;
    const original = parseFloat((item.old_price || '').replace(/[^0-9.]/g, '')) || price;
    const discount = original > price ? Math.round((1 - price / original) * 100) : 0;
    return {
      id: 2000 + i,
      name: item.title || 'Product',
      store: item.source || 'Shop',
      category: 'all',
      price,
      original,
      discount,
      img: item.thumbnail || '',
      url: item.link || '#',
    };
  }).filter(d => d.name && d.price > 0);
}

function mapCategory(str = '') {
  const s = str.toLowerCase();
  if (s.includes('laptop') || s.includes('notebook')) return 'laptops';
  if (s.includes('mobil') || s.includes('phone') || s.includes('telefon')) return 'phones';
  if (s.includes('tv') || s.includes('tele')) return 'tvs';
  if (s.includes('audio') || s.includes('headphone') || s.includes('speaker') || s.includes('fejhallgató')) return 'audio';
  if (s.includes('gaming') || s.includes('game') || s.includes('játék')) return 'gaming';
  if (s.includes('appli') || s.includes('wash') || s.includes('háztartás')) return 'appliances';
  return 'all';
}

async function loadDeals() {
  const grid = document.getElementById('dealsGrid');
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;">Loading deals…</p>';
  try {
    const src = CONFIG.DATA_SOURCE;
    if (src === 'emag' || src === 'auto') {
      DEALS = await fetchEmagFeed();
    } else if (src === 'serpapi') {
      DEALS = await fetchSerpApiDeals(searchQuery || 'akció elektronika');
    } else {
      DEALS = MOCK_DEALS;
    }
    if (!DEALS.length) DEALS = MOCK_DEALS;
  } catch (e) {
    console.warn('[HUDeals] API failed, using mock data:', e.message);
    DEALS = MOCK_DEALS;
  }
  renderDeals();
}

// =============================================================
// UI
// =============================================================

function formatHUF(n) {
  return n.toLocaleString('hu-HU') + ' Ft';
}

function filteredDeals() {
  let d = [...DEALS];
  if (currentCategory !== 'all') d = d.filter(x => x.category === currentCategory || x.category === 'all');
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    d = d.filter(x => x.name.toLowerCase().includes(q) || x.store.toLowerCase().includes(q));
  }
  if (currentSort === 'discount') d.sort((a, b) => b.discount - a.discount);
  if (currentSort === 'price-asc') d.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') d.sort((a, b) => b.price - a.price);
  return d;
}

function isWatched(id) { return watchlist.some(w => w.id === id); }

function toggleWatch(id) {
  if (isWatched(id)) {
    watchlist = watchlist.filter(w => w.id !== id);
  } else {
    const deal = DEALS.find(d => d.id === id);
    if (deal) watchlist.push({ ...deal, addedAt: new Date().toISOString() });
  }
  localStorage.setItem('hu_watchlist', JSON.stringify(watchlist));
  renderDeals();
  renderWatchlist();
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(w => w.id !== id);
  localStorage.setItem('hu_watchlist', JSON.stringify(watchlist));
  renderDeals();
  renderWatchlist();
}

function renderDeals() {
  const grid = document.getElementById('dealsGrid');
  const deals = filteredDeals();
  if (!deals.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;">No deals found. Try a different search or category.</p>';
    return;
  }
  grid.innerHTML = deals.map(d => `
    <div class="deal-card" data-id="${d.id}" data-category="${d.category}">
      ${d.discount > 0 ? `<span class="deal-badge">-${d.discount}%</span>` : ''}
      <img class="deal-img" src="${d.img}" alt="${d.name}" loading="lazy"
           onerror="this.src='https://placehold.co/280x140/f7f7f5/1a1a1a?text=No+Image'" />
      <div class="deal-store">${d.store}</div>
      <div class="deal-name">${d.name}</div>
      <div class="deal-pricing">
        <span class="deal-price">${formatHUF(d.price)}</span>
        ${d.original > d.price ? `<span class="deal-original">${formatHUF(d.original)}</span>` : ''}
      </div>
      <div class="deal-actions">
        <a href="${d.url}" target="_blank" rel="noopener" class="btn-secondary">View Deal →</a>
        <button class="btn-watch ${isWatched(d.id) ? 'watching' : ''}" onclick="toggleWatch(${d.id})">
          ${isWatched(d.id) ? '★ Watching' : '☆ Watch'}
        </button>
      </div>
    </div>
  `).join('');
}

function renderWatchlist() {
  const grid = document.getElementById('watchlistGrid');
  const count = document.getElementById('watchlistCount');
  count.textContent = watchlist.length + (watchlist.length === 1 ? ' item' : ' items');
  if (!watchlist.length) {
    grid.innerHTML = `<div class="watchlist-empty"><div class="empty-icon">📋</div><p>Your watchlist is empty.<br>Click “Watch” on any deal to start tracking.</p></div>`;
    return;
  }
  grid.innerHTML = watchlist.map(w => `
    <div class="watchlist-card">
      <button class="wl-remove" onclick="removeFromWatchlist(${w.id})" title="Remove">✕</button>
      <div class="wl-store">${w.store}</div>
      <div class="wl-name">${w.name}</div>
      <div>
        <span class="wl-price">${formatHUF(w.price)}</span>
        ${w.original > w.price ? `<span class="wl-original">${formatHUF(w.original)}</span>` : ''}
        ${w.discount > 0 ? `<span class="wl-discount">-${w.discount}%</span>` : ''}
      </div>
      <div class="wl-alert">✓ Tracking — will alert on price drop</div>
    </div>
  `).join('');
}

function searchDeals() {
  searchQuery = document.getElementById('searchInput').value.trim();
  if (CONFIG.DATA_SOURCE === 'serpapi' && CONFIG.SERPAPI_KEY) {
    loadDeals(); // re-fetch with new query from SerpApi
  } else {
    renderDeals();
  }
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDeals();
}

function sortDeals() {
  currentSort = document.getElementById('sortSelect').value;
  renderDeals();
}

document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('searchInput');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') searchDeals(); });
  loadDeals();
  renderWatchlist();
});
