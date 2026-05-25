// PricePulse HU — app.js
// Self-hosted: replace YOUR_SERPAPI_KEY_HERE with your key from https://serpapi.com
// Deployed on Vercel: key is injected server-side via /api/search, never exposed here.

const SERPAPI_KEY = 'YOUR_SERPAPI_KEY_HERE';

const MOCK_DEALS = [
  { id:1,  name:'Samsung Galaxy S24 128GB',         store:'eMAG.hu',         category:'phones',     price:149990, original:179990, discount:17, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Galaxy+S24',    url:'https://www.emag.hu' },
  { id:2,  name:'Apple MacBook Air M2 13"',          store:'Alza.hu',          category:'laptops',    price:449900, original:519900, discount:13, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=MacBook+Air',   url:'https://www.alza.hu' },
  { id:3,  name:'Sony WH-1000XM5 Headphones',       store:'MediaMarkt.hu',    category:'audio',      price:89900,  original:119900, discount:25, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Sony+XM5',      url:'https://www.mediamarkt.hu' },
  { id:4,  name:'LG OLED55C3 55" 4K TV',            store:'Extreme Digital',  category:'tvs',        price:389000, original:499000, discount:22, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=LG+OLED',       url:'https://www.extremedigital.hu' },
  { id:5,  name:'PlayStation 5 Slim',               store:'eMAG.hu',          category:'gaming',     price:159900, original:189900, discount:16, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=PS5+Slim',      url:'https://www.emag.hu' },
  { id:6,  name:'Apple iPhone 15 Pro 256GB',        store:'iStyle.hu',        category:'phones',     price:429900, original:469900, discount:9,  img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=iPhone+15+Pro', url:'https://www.istyle.hu' },
  { id:7,  name:'Lenovo IdeaPad 5 Pro 16"',         store:'Alza.hu',          category:'laptops',    price:199900, original:249900, discount:20, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=IdeaPad+5',    url:'https://www.alza.hu' },
  { id:8,  name:'Bosch WAV28E90BY Washing Machine', store:'Euronics.hu',      category:'appliances', price:179900, original:229900, discount:22, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Bosch+WM',     url:'https://www.euronics.hu' },
  { id:9,  name:'JBL Charge 5 Bluetooth Speaker',   store:'MediaMarkt.hu',    category:'audio',      price:29990,  original:44990,  discount:33, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=JBL+Charge+5', url:'https://www.mediamarkt.hu' },
  { id:10, name:'Xbox Series X Console',            store:'Extreme Digital',  category:'gaming',     price:169900, original:199900, discount:15, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Xbox+Series+X', url:'https://www.extremedigital.hu' },
  { id:11, name:'Samsung 65" QLED 4K Q80C',        store:'eMAG.hu',          category:'tvs',        price:279900, original:359900, discount:22, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Samsung+QLED', url:'https://www.emag.hu' },
  { id:12, name:'Dyson V15 Detect Vacuum',          store:'Alza.hu',          category:'appliances', price:199900, original:249900, discount:20, img:'https://placehold.co/280x140/f0f0ee/1a1a1a?text=Dyson+V15',    url:'https://www.alza.hu' }
];

let DEALS = [];
let watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');
let currentCategory = 'all';
let currentSort = 'discount';
let searchQuery = '';

async function fetchLiveDeals(query) {
  const q = query || 'akcio elektronika Hungary';
  try {
    const proxyRes = await fetch('/api/search?q=' + encodeURIComponent(q));
    if (!proxyRes.ok) throw new Error('proxy unavailable');
    const proxyData = await proxyRes.json();
    const results = parseSerpResults(proxyData);
    if (results.length) return results;
    throw new Error('empty results');
  } catch (_) {
    if (SERPAPI_KEY === 'YOUR_SERPAPI_KEY_HERE') throw new Error('No API key');
    const params = new URLSearchParams({ engine: 'google_shopping', q, gl: 'hu', hl: 'hu', api_key: SERPAPI_KEY });
    const res = await fetch('https://serpapi.com/search.json?' + params);
    const data = await res.json();
    return parseSerpResults(data);
  }
}

function parseSerpResults(data) {
  return (data.shopping_results || []).slice(0, 30).map(function(item, i) {
    var price = parseFloat((item.price || '0').replace(/[^0-9.]/g, '')) || 0;
    var original = parseFloat((item.old_price || '0').replace(/[^0-9.]/g, '')) || price;
    var discount = original > price ? Math.round((1 - price / original) * 100) : 0;
    return {
      id: 3000 + i,
      name: item.title || 'Product',
      store: item.source || 'Shop',
      category: mapCategory(item.product_type || ''),
      price: price, original: original, discount: discount,
      img: item.thumbnail || 'https://placehold.co/280x140/f0f0ee/1a1a1a?text=No+Image',
      url: item.link || '#'
    };
  }).filter(function(d) { return d.name && d.price > 0; });
}

function mapCategory(s) {
  s = s.toLowerCase();
  if (s.includes('laptop') || s.includes('notebook')) return 'laptops';
  if (s.includes('mobil') || s.includes('phone') || s.includes('telefon')) return 'phones';
  if (s.includes('tv') || s.includes('tele')) return 'tvs';
  if (s.includes('audio') || s.includes('speaker') || s.includes('headphone')) return 'audio';
  if (s.includes('gaming') || s.includes('game')) return 'gaming';
  if (s.includes('appli') || s.includes('wash')) return 'appliances';
  return 'all';
}

async function loadDeals() {
  var grid = document.getElementById('dealsGrid');
  grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;">Loading deals...</p>';
  try {
    DEALS = await fetchLiveDeals(searchQuery);
    if (!DEALS.length) DEALS = MOCK_DEALS;
  } catch(e) {
    console.warn('[PricePulse] Live data unavailable, using sample data:', e.message);
    DEALS = MOCK_DEALS;
  }
  renderDeals();
}

function formatHUF(n) {
  return n.toLocaleString('hu-HU') + ' Ft';
}

function filteredDeals() {
  var d = DEALS.slice();
  if (currentCategory !== 'all') {
    d = d.filter(function(x) { return x.category === currentCategory || x.category === 'all'; });
  }
  if (searchQuery) {
    var q = searchQuery.toLowerCase();
    d = d.filter(function(x) { return x.name.toLowerCase().includes(q) || x.store.toLowerCase().includes(q); });
  }
  if (currentSort === 'discount') d.sort(function(a,b){ return b.discount - a.discount; });
  if (currentSort === 'price-asc') d.sort(function(a,b){ return a.price - b.price; });
  if (currentSort === 'price-desc') d.sort(function(a,b){ return b.price - a.price; });
  return d;
}

function isWatched(id) {
  return watchlist.some(function(w){ return w.id === id; });
}

function toggleWatch(id) {
  if (isWatched(id)) {
    watchlist = watchlist.filter(function(w){ return w.id !== id; });
  } else {
    var deal = DEALS.find(function(d){ return d.id === id; });
    if (deal) watchlist.push(Object.assign({}, deal, { addedAt: new Date().toISOString() }));
  }
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderDeals();
  renderWatchlist();
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(function(w){ return w.id !== id; });
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderDeals();
  renderWatchlist();
}

function renderDeals() {
  var grid = document.getElementById('dealsGrid');
  var deals = filteredDeals();
  if (!deals.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;">No deals found. Try a different search or category.</p>';
    return;
  }
  grid.innerHTML = deals.map(function(d) {
    return '<div class="deal-card" data-id="' + d.id + '">' +
      (d.discount > 0 ? '<span class="deal-badge">-' + d.discount + '%</span>' : '') +
      '<img class="deal-img" src="' + d.img + '" alt="' + d.name + '" loading="lazy" onerror="this.src=\'https://placehold.co/280x140/f0f0ee/1a1a1a?text=No+Image\'" />' +
      '<div class="deal-store">' + d.store + '</div>' +
      '<div class="deal-name">' + d.name + '</div>' +
      '<div class="deal-pricing">' +
        '<span class="deal-price">' + formatHUF(d.price) + '</span>' +
        (d.original > d.price ? '<span class="deal-original">' + formatHUF(d.original) + '</span>' : '') +
      '</div>' +
      '<div class="deal-actions">' +
        '<a href="' + d.url + '" target="_blank" rel="noopener" class="btn-secondary">View Deal</a>' +
        '<button class="btn-watch' + (isWatched(d.id) ? ' watching' : '') + '" onclick="toggleWatch(' + d.id + ')">' +
          (isWatched(d.id) ? 'Watching' : 'Watch') +
        '</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderWatchlist() {
  var grid = document.getElementById('watchlistGrid');
  var count = document.getElementById('watchlistCount');
  count.textContent = watchlist.length + (watchlist.length === 1 ? ' item' : ' items');
  if (!watchlist.length) {
    grid.innerHTML = '<div class="watchlist-empty"><p>Your watchlist is empty. Click Watch on any deal to start tracking.</p></div>';
    return;
  }
  grid.innerHTML = watchlist.map(function(w) {
    return '<div class="watchlist-card">' +
      '<button class="wl-remove" onclick="removeFromWatchlist(' + w.id + ')" title="Remove">&#10005;</button>' +
      '<div class="wl-store">' + w.store + '</div>' +
      '<div class="wl-name">' + w.name + '</div>' +
      '<div>' +
        '<span class="wl-price">' + formatHUF(w.price) + '</span>' +
        (w.original > w.price ? '<span class="wl-original">' + formatHUF(w.original) + '</span>' : '') +
        (w.discount > 0 ? '<span class="wl-discount">-' + w.discount + '%</span>' : '') +
      '</div>' +
      '<div class="wl-alert">Tracking - will update on price change</div>' +
    '</div>';
  }).join('');
}

function searchDeals() {
  searchQuery = document.getElementById('searchInput').value.trim();
  loadDeals();
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderDeals();
}

function sortDeals() {
  currentSort = document.getElementById('sortSelect').value;
  renderDeals();
}

document.addEventListener('DOMContentLoaded', function() {
  var inp = document.getElementById('searchInput');
  if (inp) inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') searchDeals(); });
  loadDeals();
  renderWatchlist();
});
