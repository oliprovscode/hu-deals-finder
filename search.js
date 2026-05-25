// PricePulse HU — search.js

var DEALS = [];
var watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');
var currentCategory = 'all';
var currentSort = 'discount';
var activeStores = [];
var activeBrands = [];
var priceRangeMin = 0;
var priceRangeMax = 500000;

function getQuery() {
  return (new URLSearchParams(window.location.search).get('q') || '').trim();
}

function formatHUF(n) {
  return Number(n).toLocaleString('hu-HU') + ' Ft';
}

function showSkeletons(count) {
  var grid = document.getElementById('dealsGrid');
  var html = '';
  for (var i = 0; i < (count || 8); i++) {
    html += '<div class="deal-card skeleton-card">'
      + '<div class="skel skel-img"></div>'
      + '<div class="skel skel-line short"></div>'
      + '<div class="skel skel-line"></div>'
      + '<div class="skel skel-line medium"></div>'
      + '<div class="skel skel-actions"></div>'
      + '</div>';
  }
  grid.innerHTML = html;
}

async function fetchDeals(q) {
  var res = await fetch('/api/search?q=' + encodeURIComponent(q));
  if (!res.ok) throw new Error('API error ' + res.status);
  var data = await res.json();
  return parseResults(data);
}

function parseResults(data) {
  return (data.shopping_results || []).map(function(item, i) {
    var price = parseFloat((item.price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
    var original = parseFloat((item.old_price || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || price;
    var discount = original > price ? Math.round((1 - price / original) * 100) : 0;
    var url = item.product_link || item.link || '#';
    var typeStr = (item.product_type || '') + ' ' + (item.title || '');
    var brand = extractBrand(item.title || '');
    return {
      id: 5000 + i,
      name: item.title || 'Termék',
      store: item.source || 'Bolt',
      brand: brand,
      category: mapCat(typeStr),
      price: price,
      original: original,
      discount: discount,
      inStock: item.in_stock !== false,
      img: item.thumbnail || '',
      url: url
    };
  }).filter(function(d) { return d.name && d.price > 0; });
}

function extractBrand(title) {
  var known = ['Apple','Samsung','Sony','LG','Philips','Bosch','Dyson','Nike','Adidas','Casio',
    'Seiko','Tissot','Fossil','Garmin','CeraVe','The Ordinary','COSRX','Nivea','Garnier',
    'Huawei','Xiaomi','Lenovo','Asus','Dell','HP','Nespresso','Tefal','Rowenta','Moulinex',
    'Swatch','Hamilton','Longines','TAG Heuer','Omega','Rolex','Citizen','Orient'];
  for (var i = 0; i < known.length; i++) {
    if (title.toLowerCase().includes(known[i].toLowerCase())) return known[i];
  }
  return title.split(' ')[0] || 'Egyéb';
}

function mapCat(s) {
  if (typeof s !== 'string') s = '';
  s = s.toLowerCase();
  if (s.includes('ora') || s.includes('watch') || s.includes('karora') || s.includes('chrono') || s.includes('timepiece') || s.includes('karóra')) return 'watches';
  if (s.includes('skincare') || s.includes('arcapo') || s.includes('serum') || s.includes('moisturizer') || s.includes('cerave') || s.includes('ordinary') || s.includes('borapo') || s.includes('toner') || s.includes('cleanser') || s.includes('bőrápo')) return 'skincare';
  if (s.includes('parfum') || s.includes('perfume') || s.includes('fragrance') || s.includes('makeup') || s.includes('smink') || s.includes('lipstick') || s.includes('foundation') || s.includes('illatszer')) return 'beauty';
  if (s.includes('cipo') || s.includes('shoe') || s.includes('ruha') || s.includes('jacket') || s.includes('clothes') || s.includes('fashion') || s.includes('divat') || s.includes('polo') || s.includes('nadrag') || s.includes('dress') || s.includes('sneaker') || s.includes('cipő')) return 'fashion';
  if (s.includes('sport') || s.includes('fitness') || s.includes('gym') || s.includes('kerekpar') || s.includes('bike') || s.includes('futo') || s.includes('edzo')) return 'sports';
  if (s.includes('butor') || s.includes('furniture') || s.includes('otthon') || s.includes('lampa') || s.includes('szonyeg') || s.includes('konyha')) return 'home';
  if (s.includes('laptop') || s.includes('notebook') || s.includes('phone') || s.includes('telefon') || s.includes('tv') || s.includes('tablet') || s.includes('headphone') || s.includes('gaming') || s.includes('console') || s.includes('electronics')) return 'electronics';
  return 'all';
}

function buildSidebarFilters() {
  // stores
  var stores = [...new Set(DEALS.map(function(d){ return d.store; }))].sort();
  var storeList = document.getElementById('storeList');
  if (storeList) {
    storeList.innerHTML = stores.map(function(s) {
      return '<label class="check-label"><input type="checkbox" value="' + s + '" checked onchange="updateStoreFilter()"><span>' + s + '</span></label>';
    }).join('');
    activeStores = stores.slice();
  }
  // brands
  var brands = [...new Set(DEALS.map(function(d){ return d.brand; }))].sort();
  var brandList = document.getElementById('brandList');
  if (brandList) {
    brandList.innerHTML = brands.map(function(b) {
      return '<label class="check-label"><input type="checkbox" value="' + b + '" checked onchange="updateBrandFilter()"><span>' + b + '</span></label>';
    }).join('');
    activeBrands = brands.slice();
  }
  // price range
  var prices = DEALS.map(function(d){ return d.price; }).filter(Boolean);
  if (prices.length) {
    var minP = Math.floor(Math.min.apply(null, prices) / 1000) * 1000;
    var maxP = Math.ceil(Math.max.apply(null, prices) / 1000) * 1000;
    priceRangeMin = minP; priceRangeMax = maxP;
    var rMin = document.getElementById('rangeMin');
    var rMax = document.getElementById('rangeMax');
    if (rMin && rMax) {
      rMin.min = minP; rMin.max = maxP; rMin.value = minP;
      rMax.min = minP; rMax.max = maxP; rMax.value = maxP;
      document.getElementById('priceMin').textContent = minP.toLocaleString('hu-HU');
      document.getElementById('priceMax').textContent = maxP.toLocaleString('hu-HU');
    }
  }
}

function updateStoreFilter() {
  activeStores = [];
  document.querySelectorAll('#storeList input:checked').forEach(function(cb){ activeStores.push(cb.value); });
  renderDeals();
}

function updateBrandFilter() {
  activeBrands = [];
  document.querySelectorAll('#brandList input:checked').forEach(function(cb){ activeBrands.push(cb.value); });
  renderDeals();
}

function updatePriceRange() {
  var rMin = document.getElementById('rangeMin');
  var rMax = document.getElementById('rangeMax');
  if (!rMin || !rMax) return;
  var lo = parseInt(rMin.value);
  var hi = parseInt(rMax.value);
  if (lo > hi) { var tmp = lo; lo = hi; hi = tmp; }
  priceRangeMin = lo; priceRangeMax = hi;
  document.getElementById('priceMin').textContent = lo.toLocaleString('hu-HU');
  document.getElementById('priceMax').textContent = hi.toLocaleString('hu-HU');
  renderDeals();
}

function isWatched(id) {
  return watchlist.some(function(w) { return w.id === id; });
}

function toggleWatch(id) {
  if (isWatched(id)) {
    watchlist = watchlist.filter(function(w) { return w.id !== id; });
  } else {
    var deal = DEALS.find(function(d) { return d.id === id; });
    if (deal) watchlist.push(Object.assign({}, deal, { addedAt: new Date().toISOString() }));
  }
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderDeals();
}

function filterCategory(cat, btn) {
  currentCategory = cat;
  document.querySelectorAll('.filter-cat-list .filter-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderDeals();
}

function sortDeals() {
  currentSort = document.getElementById('sortSelect').value;
  renderDeals();
}

function filteredDeals() {
  var inStockOnly = document.getElementById('inStockOnly') && document.getElementById('inStockOnly').checked;
  var d = DEALS.slice();
  if (currentCategory !== 'all') {
    d = d.filter(function(x) { return x.category === currentCategory || x.category === 'all'; });
  }
  d = d.filter(function(x) { return x.price >= priceRangeMin && x.price <= priceRangeMax; });
  if (activeStores.length) d = d.filter(function(x) { return activeStores.includes(x.store); });
  if (activeBrands.length) d = d.filter(function(x) { return activeBrands.includes(x.brand); });
  if (inStockOnly) d = d.filter(function(x) { return x.inStock; });
  if (currentSort === 'discount') d.sort(function(a,b){ return b.discount - a.discount; });
  else if (currentSort === 'price-asc') d.sort(function(a,b){ return a.price - b.price; });
  else if (currentSort === 'price-desc') d.sort(function(a,b){ return b.price - a.price; });
  return d;
}

function renderDeals() {
  var lang = localStorage.getItem('pp_lang') || 'hu';
  var grid = document.getElementById('dealsGrid');
  var deals = filteredDeals();
  var countEl = document.getElementById('resultsCount');
  if (countEl) countEl.textContent = deals.length + (lang === 'hu' ? ' találat' : ' results');
  if (!deals.length) {
    grid.innerHTML = '<p class="no-results">' + (lang === 'hu' ? 'Nincs találat erre a szűrőre.' : 'No results for this filter.') + '</p>';
    return;
  }
  grid.innerHTML = deals.map(function(d) {
    var watched = isWatched(d.id);
    var watchLabel = lang === 'hu' ? (watched ? 'Figyelt' : 'Figyelés') : (watched ? 'Watching' : 'Watch');
    var viewLabel = lang === 'hu' ? 'Megnézem' : 'View Deal';
    return '<div class="deal-card">'
      + (d.discount > 0 ? '<span class="deal-badge">-' + d.discount + '%</span>' : '')
      + (d.img
        ? '<img class="deal-img" src="' + d.img + '" alt="' + d.name.replace(/"/g,'') + '" loading="lazy" onerror="this.style.display=\'none\'"/>'
        : '<div class="deal-img-placeholder"></div>')
      + '<div class="deal-store">' + d.store + '</div>'
      + '<div class="deal-name">' + d.name + '</div>'
      + '<div class="deal-pricing">'
        + (d.price > 0 ? '<span class="deal-price">' + formatHUF(d.price) + '</span>' : '')
        + (d.original > d.price ? '<span class="deal-original">' + formatHUF(d.original) + '</span>' : '')
      + '</div>'
      + '<div class="deal-actions">'
        + '<a href="' + d.url + '" target="_blank" rel="noopener noreferrer" class="btn-secondary">' + viewLabel + '</a>'
        + '<button class="btn-watch' + (watched ? ' watching' : '') + '" onclick="toggleWatch(' + d.id + ')">' + watchLabel + '</button>'
      + '</div>'
    + '</div>';
  }).join('');
}

function reSearch(e) {
  e.preventDefault();
  var q = document.getElementById('searchInput').value.trim();
  if (q) window.location.href = '/search.html?q=' + encodeURIComponent(q);
}

document.addEventListener('DOMContentLoaded', function() {
  var q = getQuery();
  var input = document.getElementById('searchInput');
  var meta = document.getElementById('searchMeta');
  var topbar = document.getElementById('resultsTopbar');
  var lang = localStorage.getItem('pp_lang') || 'hu';

  if (input) input.value = q;
  if (!q) {
    document.getElementById('dealsGrid').innerHTML = '<p class="no-results">' + (lang === 'hu' ? 'Írj be egy keresési kifejezést.' : 'Enter a search term above.') + '</p>';
    return;
  }

  if (meta) meta.textContent = (lang === 'hu' ? '"' + q + '" keresése...' : 'Searching for "' + q + '"...');
  showSkeletons(8);

  fetchDeals(q).then(function(results) {
    DEALS = results;
    if (meta) meta.textContent = DEALS.length + (lang === 'hu' ? ' találat: "' + q + '"' : ' results for "' + q + '"');
    if (topbar) topbar.style.display = 'flex';
    buildSidebarFilters();
    renderDeals();
  }).catch(function(err) {
    console.error('[PricePulse]', err);
    if (meta) meta.textContent = lang === 'hu' ? 'Hiba a betöltés során.' : 'Could not load results.';
    document.getElementById('dealsGrid').innerHTML = '<p class="no-results">' + (lang === 'hu' ? 'A keresés nem elérhető. Állítsd be a SERPAPI_KEY értéket a Vercel-ben.' : 'Search unavailable. Make sure SERPAPI_KEY is set in Vercel.') + '</p>';
  });
});
