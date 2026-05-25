// PricePulse HU — search.js

var DEALS = [];
var watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');
var compareList = JSON.parse(localStorage.getItem('pp_compare') || '[]');
var MAX_COMPARE = 4;
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

function getLang() {
  return localStorage.getItem('pp_lang') || 'hu';
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

async function fetchProductDetail(productId) {
  try {
    var res = await fetch('/api/product?id=' + encodeURIComponent(productId));
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

function parseResults(data) {
  return (data.shopping_results || []).map(function(item, i) {
    var priceRaw = (item.price || '').replace(/\s/g, '').replace(/[Ff][Tt]/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');
    var price = parseFloat(priceRaw) || 0;
    var origRaw = (item.old_price || '').replace(/\s/g, '').replace(/[Ff][Tt]/g, '').replace(/[^0-9.,]/g, '').replace(',', '.');
    var original = parseFloat(origRaw) || price;
    var discount = original > price ? Math.round((1 - price / original) * 100) : 0;
    var url = item.product_link || item.link || '#';
    var brand = extractBrand(item);
    var category = mapCat(item);
    return {
      id: 5000 + i,
      product_id: item.product_id || null,
      name: item.title || 'Termék',
      store: item.source || 'Bolt',
      brand: brand,
      category: category,
      price: price,
      original: original,
      discount: discount,
      inStock: item.in_stock !== false,
      img: item.thumbnail || '',
      url: url,
      rating: item.rating || null,
      reviews: item.reviews || null
    };
  }).filter(function(d) { return d.name && d.price > 0; });
}

function extractBrand(item) {
  var known = [
    'Apple','Samsung','Sony','LG','Philips','Bosch','Dyson','Nike','Adidas','Puma','Reebok',
    'Casio','Seiko','Tissot','Fossil','Garmin','Suunto','Polar','Fitbit',
    'CeraVe','The Ordinary','COSRX','Nivea','Garnier','Neutrogena',"L'Oréal",'Maybelline','Clinique',
    'Huawei','Xiaomi','Lenovo','Asus','Dell','HP','Acer','MSI','Razer',
    'Nespresso','Tefal','Rowenta','De Longhi','Moulinex',
    'Swatch','Hamilton','Longines','TAG Heuer','Omega','Rolex','Citizen','Orient','Invicta',
    'Ikea','Zara','H&M','New Balance','Converse','Vans','Timberland',
    'iRobot','Karcher','Black+Decker','Makita','DeWalt'
  ];
  var title = (item.title || '');
  var titleLow = title.toLowerCase();
  if (item.brand && item.brand.trim()) return item.brand.trim();
  for (var i = 0; i < known.length; i++) {
    if (titleLow.includes(known[i].toLowerCase())) return known[i];
  }
  var tokens = title.split(/\s+/);
  for (var j = 0; j < Math.min(tokens.length, 4); j++) {
    var t = tokens[j].replace(/[^a-zA-Z0-9\-+]/g, '');
    if (t.length > 2 && /^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(t) && !/^\d/.test(t)) return t;
  }
  return 'Egyéb';
}

function mapCat(item) {
  var signals = [
    (item.product_type || ''),
    (item.extensions ? item.extensions.join(' ') : ''),
    (item.title || ''),
    (item.category || '')
  ].join(' ').toLowerCase();

  if (/laptop|notebook|computer|pc |desktop|monitor|television|smart tv|\btv\b|tablet|phone|smartphone|headphone|earphone|earbuds|speaker|camera|printer|router|gaming|console|playstation|xbox|nintendo|processor|graphics card|ssd|hdd|ram|elektronik/.test(signals)) return 'electronics';
  if (/\bwatch\b|karóra|kar\s*óra|wristwatch|chronograph|timepiece|óramű|pocket watch|smartwatch/.test(signals)) return 'watches';
  if (/serum|moisturizer|moisturiser|sunscreen|spf|toner|cleanser|face wash|eye cream|retinol|hyaluronic|niacinamide|skincare|skin care|bőrápoló|arcápoló|arckrém/.test(signals)) return 'skincare';
  if (/perfume|parfum|fragrance|eau de|cologne|lipstick|foundation|mascara|concealer|blush|eyeshadow|makeup|make-up|szépség|illatszer|smink/.test(signals)) return 'beauty';
  if (/shoes|shoe|sneaker|boot|sandal|trainer|cipő|clothing|clothes|jacket|coat|dress|shirt|trouser|jeans|skirt|hoodie|divat|fashion|apparel/.test(signals)) return 'fashion';
  if (/sport|fitness|gym|bicycle|bike|cycling|running|football|basketball|tennis|swimming|yoga|treadmill|kerékpár|futó|edzés/.test(signals)) return 'sports';
  if (/furniture|sofa|chair|table|bed|mattress|lamp|carpet|rug|kitchen|cookware|vacuum|washing machine|dishwasher|fridge|oven|otthon|bútor|lámpa|konyha/.test(signals)) return 'home';
  return 'other';
}

function buildSidebarFilters() {
  var stores = [...new Set(DEALS.map(function(d){ return d.store; }))].sort();
  var storeList = document.getElementById('storeList');
  if (storeList) {
    storeList.innerHTML = stores.length
      ? stores.map(function(s) {
          return '<label class="check-label"><input type="checkbox" value="' + s + '" checked onchange="updateStoreFilter()"><span>' + s + '</span></label>';
        }).join('')
      : '<p class="filter-empty-hint">Nincs elérhető bolt</p>';
    activeStores = stores.slice();
  }

  var brandCounts = {};
  DEALS.forEach(function(d) { brandCounts[d.brand] = (brandCounts[d.brand] || 0) + 1; });
  var brands = Object.keys(brandCounts).sort(function(a,b){ return brandCounts[b] - brandCounts[a]; });
  var brandList = document.getElementById('brandList');
  if (brandList) {
    brandList.innerHTML = brands.length
      ? brands.map(function(b) {
          return '<label class="check-label"><input type="checkbox" value="' + b + '" checked onchange="updateBrandFilter()"><span>' + b + ' <span class="filter-count">(' + brandCounts[b] + ')</span></span></label>';
        }).join('')
      : '<p class="filter-empty-hint">Nincs elérhető márka</p>';
    activeBrands = brands.slice();
  }

  var prices = DEALS.map(function(d){ return d.price; }).filter(Boolean);
  if (prices.length) {
    var minP = Math.floor(Math.min.apply(null, prices) / 100) * 100;
    var maxP = Math.ceil(Math.max.apply(null, prices) / 100) * 100;
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

function isCompared(id) {
  return compareList.some(function(c) { return c.id === id; });
}

function toggleCompare(id) {
  var lang = getLang();
  if (isCompared(id)) {
    compareList = compareList.filter(function(c) { return c.id !== id; });
  } else {
    if (compareList.length >= MAX_COMPARE) {
      alert(lang === 'hu' ? 'Legfeljebb 4 terméket hasonlíthatsz össze.' : 'You can compare up to 4 products.');
      return;
    }
    var deal = DEALS.find(function(d) { return d.id === id; });
    if (deal) compareList.push(Object.assign({}, deal));
  }
  localStorage.setItem('pp_compare', JSON.stringify(compareList));
  renderDeals();
  syncCompareTray();
}

function syncCompareTray() {
  var lang = getLang();
  var tray = document.getElementById('compareTray');
  var trayCount = document.getElementById('compareTrayCount');
  var trayItems = document.getElementById('compareTrayItems');
  var trayBtn = document.getElementById('compareTrayBtn');
  if (!tray) return;
  var n = compareList.length;
  if (n === 0) {
    tray.classList.remove('tray-visible');
    return;
  }
  tray.classList.add('tray-visible');
  trayCount.textContent = n;
  trayBtn.textContent = lang === 'hu' ? 'Összehasonlítás (' + n + ')' : 'Compare (' + n + ')';
  trayItems.innerHTML = compareList.map(function(c) {
    return '<div class="tray-chip">'
      + '<span class="tray-chip-name">' + c.name.substring(0, 28) + (c.name.length > 28 ? '…' : '') + '</span>'
      + '<button class="tray-chip-remove" onclick="toggleCompare(' + c.id + ')" title="Eltávolítás">×</button>'
      + '</div>';
  }).join('');
}

window.syncCompareTray = syncCompareTray;

async function toggleWatch(id) {
  if (isWatched(id)) {
    watchlist = watchlist.filter(function(w) { return w.id !== id; });
    localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
    renderDeals();
    return;
  }
  var deal = DEALS.find(function(d) { return d.id === id; });
  if (!deal) return;
  var entry = Object.assign({}, deal, { addedAt: new Date().toISOString(), priceHistory: null, detailLoading: true });
  watchlist.push(entry);
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderDeals();
  if (deal.product_id) {
    var detail = await fetchProductDetail(deal.product_id);
    if (detail) {
      var idx = watchlist.findIndex(function(w){ return w.id === id; });
      if (idx !== -1) {
        if (detail.priceHistory && detail.priceHistory.length > 0) watchlist[idx].priceHistory = detail.priceHistory;
        if (detail.reviews) {
          watchlist[idx].rating = detail.reviews.rating || watchlist[idx].rating;
          watchlist[idx].reviews = detail.reviews.reviews || watchlist[idx].reviews;
          watchlist[idx].reviewSnippets = detail.reviews.review_snippets || [];
        }
        watchlist[idx].detailLoading = false;
        localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
      }
    }
  }
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
    d = d.filter(function(x) { return x.category === currentCategory; });
  }
  d = d.filter(function(x) { return x.price >= priceRangeMin && x.price <= priceRangeMax; });
  if (activeStores.length < DEALS.length) d = d.filter(function(x) { return activeStores.includes(x.store); });
  if (activeBrands.length > 0) d = d.filter(function(x) { return activeBrands.includes(x.brand); });
  if (inStockOnly) d = d.filter(function(x) { return x.inStock; });
  if (currentSort === 'discount') d.sort(function(a,b){ return b.discount - a.discount; });
  else if (currentSort === 'price-asc') d.sort(function(a,b){ return a.price - b.price; });
  else if (currentSort === 'price-desc') d.sort(function(a,b){ return b.price - a.price; });
  return d;
}

function renderStars(rating) {
  if (!rating) return '';
  var full = Math.floor(rating);
  var half = (rating - full) >= 0.4;
  var empty = 5 - full - (half ? 1 : 0);
  var s = '';
  var uid = 'hg' + Math.round(rating * 10);
  for (var i = 0; i < full; i++) s += '<svg class="star" viewBox="0 0 16 16"><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="#f59e0b"/></svg>';
  if (half) s += '<svg class="star" viewBox="0 0 16 16"><defs><linearGradient id="' + uid + '"><stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="url(#' + uid + ')"/></svg>';
  for (var j = 0; j < empty; j++) s += '<svg class="star" viewBox="0 0 16 16"><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="#d1d5db"/></svg>';
  return s;
}

function renderDeals() {
  var lang = getLang();
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
    var compared = isCompared(d.id);
    var watchLabel = lang === 'hu' ? (watched ? 'Figyelt' : 'Figyelés') : (watched ? 'Watching' : 'Watch');
    var cmpLabel = lang === 'hu' ? (compared ? '✓ Összeh.' : '+ Összeh.') : (compared ? '✓ Compare' : '+ Compare');
    var viewLabel = lang === 'hu' ? 'Megnézem' : 'View Deal';
    var stars = renderStars(d.rating);
    var reviewsHtml = (stars && d.reviews)
      ? '<div class="deal-reviews">' + stars + '<span class="deal-review-count">(' + Number(d.reviews).toLocaleString('hu-HU') + ')</span></div>'
      : '';
    return '<div class="deal-card">'
      + (d.discount > 0 ? '<span class="deal-badge">-' + d.discount + '%</span>' : '')
      + (d.img
        ? '<img class="deal-img" src="' + d.img + '" alt="' + d.name.replace(/"/g,'') + '" loading="lazy" onerror="this.style.display=\'none\'"/>'
        : '<div class="deal-img-placeholder"></div>')
      + '<div class="deal-store">' + d.store + '</div>'
      + '<div class="deal-name">' + d.name + '</div>'
      + reviewsHtml
      + '<div class="deal-pricing">'
        + (d.price > 0 ? '<span class="deal-price">' + formatHUF(d.price) + '</span>' : '')
        + (d.original > d.price ? '<span class="deal-original">' + formatHUF(d.original) + '</span>' : '')
      + '</div>'
      + '<div class="deal-actions">'
        + '<a href="' + d.url + '" target="_blank" rel="noopener noreferrer" class="btn-secondary">' + viewLabel + '</a>'
        + '<button class="btn-watch' + (watched ? ' watching' : '') + '" onclick="toggleWatch(' + d.id + ')">' + watchLabel + '</button>'
      + '</div>'
      + '<button class="btn-compare' + (compared ? ' comparing' : '') + '" onclick="toggleCompare(' + d.id + ')">' + cmpLabel + '</button>'
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
  var lang = getLang();

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
    syncCompareTray();
  }).catch(function(err) {
    console.error('[PricePulse]', err);
    if (meta) meta.textContent = lang === 'hu' ? 'Hiba a betöltés során.' : 'Could not load results.';
    document.getElementById('dealsGrid').innerHTML = '<p class="no-results">' + (lang === 'hu' ? 'A keresés nem elérhető. Állítsd be a SERPAPI_KEY értéket a Vercel-ben.' : 'Search unavailable. Make sure SERPAPI_KEY is set in Vercel.') + '</p>';
  });
});
