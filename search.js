// PricePulse HU — search.js

var DEALS = [];
var watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');
var currentCategory = 'all';
var currentSort = 'discount';

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
    html += '<div class="deal-card skeleton-card">' +
      '<div class="skel skel-img"></div>' +
      '<div class="skel skel-line short"></div>' +
      '<div class="skel skel-line"></div>' +
      '<div class="skel skel-line medium"></div>' +
      '<div class="skel skel-actions"></div>' +
    '</div>';
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
    return {
      id: 5000 + i,
      name: item.title || 'Product',
      store: item.source || 'Store',
      category: mapCat(typeStr),
      price: price,
      original: original,
      discount: discount,
      img: item.thumbnail || '',
      url: url
    };
  }).filter(function(d) { return d.name && d.price > 0; });
}

function mapCat(s) {
  if (typeof s !== 'string') s = '';
  s = s.toLowerCase();
  if (s.includes('ora') || s.includes('watch') || s.includes('karora') || s.includes('chrono') || s.includes('timepiece')) return 'watches';
  if (s.includes('skincare') || s.includes('arcapo') || s.includes('serum') || s.includes('moisturizer') || s.includes('cerave') || s.includes('ordinary') || s.includes('borapo') || s.includes('toner') || s.includes('cleanser')) return 'skincare';
  if (s.includes('parfum') || s.includes('perfume') || s.includes('fragrance') || s.includes('makeup') || s.includes('smink') || s.includes('lipstick') || s.includes('foundation') || s.includes('szepseg') || s.includes('illatszer') || s.includes('nailpolish')) return 'beauty';
  if (s.includes('cipo') || s.includes('shoe') || s.includes('ruha') || s.includes('jacket') || s.includes('clothes') || s.includes('fashion') || s.includes('divat') || s.includes('polo') || s.includes('nadrag') || s.includes('dress') || s.includes('sneaker')) return 'fashion';
  if (s.includes('sport') || s.includes('fitness') || s.includes('gym') || s.includes('kerekpar') || s.includes('bike') || s.includes('futo') || s.includes('edzo')) return 'sports';
  if (s.includes('butor') || s.includes('furniture') || s.includes('otthon') || s.includes('lampa') || s.includes('szonyeg') || s.includes('konyha') || s.includes('home decor')) return 'home';
  if (s.includes('laptop') || s.includes('notebook') || s.includes('phone') || s.includes('telefon') || s.includes('tv') || s.includes('tablet') || s.includes('headphone') || s.includes('gaming') || s.includes('console') || s.includes('electronics')) return 'electronics';
  return 'all';
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
  document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  renderDeals();
}

function sortDeals() {
  currentSort = document.getElementById('sortSelect').value;
  renderDeals();
}

function filteredDeals() {
  var d = DEALS.slice();
  if (currentCategory !== 'all') {
    d = d.filter(function(x) { return x.category === currentCategory || x.category === 'all'; });
  }
  if (currentSort === 'discount') d.sort(function(a,b){ return b.discount - a.discount; });
  else if (currentSort === 'price-asc') d.sort(function(a,b){ return a.price - b.price; });
  else if (currentSort === 'price-desc') d.sort(function(a,b){ return b.price - a.price; });
  return d;
}

function renderDeals() {
  var grid = document.getElementById('dealsGrid');
  var deals = filteredDeals();
  if (!deals.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;padding:40px 0;">No results found for this filter. Try "All" or a different search.</p>';
    return;
  }
  grid.innerHTML = deals.map(function(d) {
    var watched = isWatched(d.id);
    return '<div class="deal-card">' +
      (d.discount > 0 ? '<span class="deal-badge">-' + d.discount + '%</span>' : '') +
      (d.img
        ? '<img class="deal-img" src="' + d.img + '" alt="' + d.name.replace(/"/g, '') + '" loading="lazy" onerror="this.style.display=\'none\'" />'
        : '<div class="deal-img-placeholder"></div>') +
      '<div class="deal-store">' + d.store + '</div>' +
      '<div class="deal-name">' + d.name + '</div>' +
      '<div class="deal-pricing">' +
        (d.price > 0 ? '<span class="deal-price">' + formatHUF(d.price) + '</span>' : '') +
        (d.original > d.price ? '<span class="deal-original">' + formatHUF(d.original) + '</span>' : '') +
      '</div>' +
      '<div class="deal-actions">' +
        '<a href="' + d.url + '" target="_blank" rel="noopener noreferrer" class="btn-secondary">View Deal</a>' +
        '<button class="btn-watch' + (watched ? ' watching' : '') + '" onclick="toggleWatch(' + d.id + ')">' + (watched ? 'Watching' : 'Watch') + '</button>' +
      '</div>' +
    '</div>';
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
  var toolbar = document.getElementById('resultsToolbar');

  if (input) input.value = q;
  if (!q) {
    document.getElementById('dealsGrid').innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;padding:40px 0;">Enter a search term above.</p>';
    return;
  }

  meta.textContent = 'Searching for "' + q + '"...';
  showSkeletons(8);

  fetchDeals(q).then(function(results) {
    DEALS = results;
    meta.textContent = DEALS.length + ' results for "' + q + '"';
    toolbar.style.display = 'flex';
    renderDeals();
  }).catch(function(err) {
    console.error('[PricePulse]', err);
    meta.textContent = 'Could not load results.';
    document.getElementById('dealsGrid').innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;grid-column:1/-1;padding:40px 0;">Search unavailable. Make sure SERPAPI_KEY is set in Vercel.</p>';
  });
});
