// PricePulse HU — app.js (homepage: watchlist)

var watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');

var MONTH_NAMES_HU = ['Jan','Feb','Már','Apr','Máj','Jún','Júl','Aug','Sze','Okt','Nov','Dec'];
var MONTH_NAMES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatHUF(n) {
  return Number(n).toLocaleString('hu-HU') + ' Ft';
}

function getLang() {
  return localStorage.getItem('pp_lang') || 'hu';
}

// Generate simulated 12-month price history seeded from product id + price
// Stores real add-price as the most recent month; the rest are plausible variations
function generatePriceHistory(item) {
  var now = new Date();
  var history = [];
  var seed = item.id * 7 + Math.floor(item.price);
  var base = item.original > item.price ? item.original : item.price;

  // If we already have stored history, return it
  if (item.priceHistory && item.priceHistory.length === 12) return item.priceHistory;

  // Pseudo-random walk seeded deterministically
  function seededRand(s) {
    var x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  var price = base;
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var r = seededRand(seed + i * 13);
    // vary ±15% around base
    price = base * (0.88 + r * 0.24);
    // clamp to reasonable range
    price = Math.max(base * 0.75, Math.min(base * 1.25, price));
    // snap current month to actual price
    if (i === 0) price = item.price;
    history.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      price: Math.round(price / 100) * 100
    });
  }
  return history;
}

function buildSparkline(history, currentPrice) {
  var W = 260, H = 80, PAD = 6;
  var prices = history.map(function(h) { return h.price; });
  var minP = Math.min.apply(null, prices);
  var maxP = Math.max.apply(null, prices);
  var range = maxP - minP || 1;
  var lang = getLang();
  var months = lang === 'hu' ? MONTH_NAMES_HU : MONTH_NAMES_EN;
  var n = history.length;

  // Build polyline points
  var points = history.map(function(h, i) {
    var x = PAD + (i / (n - 1)) * (W - PAD * 2);
    var y = H - PAD - ((h.price - minP) / range) * (H - PAD * 2 - 14);
    return { x: x, y: y, price: h.price, month: h.month, year: h.year };
  });

  var polyline = points.map(function(p) { return p.x + ',' + p.y; }).join(' ');

  // Fill area under line
  var areaPath = 'M ' + points[0].x + ',' + points[0].y
    + ' ' + points.map(function(p){ return 'L ' + p.x + ',' + p.y; }).join(' ')
    + ' L ' + points[n-1].x + ',' + (H - PAD)
    + ' L ' + points[0].x + ',' + (H - PAD) + ' Z';

  // Last point (current price)
  var last = points[n - 1];
  var trend = prices[n-1] < prices[0] ? 'down' : prices[n-1] > prices[0] ? 'up' : 'flat';
  var lineColor = trend === 'down' ? '#16a34a' : trend === 'up' ? '#dc2626' : '#1a56db';
  var fillColor = trend === 'down' ? 'rgba(22,163,74,0.08)' : trend === 'up' ? 'rgba(220,38,38,0.08)' : 'rgba(26,86,219,0.08)';

  // X-axis month labels: show first, mid, last
  var labelIdxs = [0, Math.floor(n/2), n-1];
  var xLabels = labelIdxs.map(function(i) {
    var p = points[i];
    var h = history[i];
    return '<text x="' + p.x + '" y="' + (H - 1) + '" text-anchor="middle" font-size="9" fill="#9ca3af">' + months[h.month] + '</text>';
  }).join('');

  // Tooltip dots
  var dots = points.map(function(p, i) {
    var isLast = i === n - 1;
    return '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + (isLast ? 4 : 2.5) + '"'
      + ' fill="' + (isLast ? lineColor : 'white') + '"'
      + ' stroke="' + lineColor + '" stroke-width="1.5"'
      + ' class="spark-dot"'
      + '><title>' + months[p.month] + ' ' + p.year + ': ' + formatHUF(p.price) + '</title></circle>';
  }).join('');

  // Min / max labels
  var minIdx = prices.indexOf(minP);
  var maxIdx = prices.indexOf(maxP);
  var minLabel = '<text x="' + points[minIdx].x + '" y="' + (points[minIdx].y + 11) + '" text-anchor="middle" font-size="8.5" fill="#16a34a" font-weight="600">' + formatHUF(minP) + '</text>';
  var maxLabel = '<text x="' + points[maxIdx].x + '" y="' + (points[maxIdx].y - 5) + '" text-anchor="middle" font-size="8.5" fill="#dc2626" font-weight="600">' + formatHUF(maxP) + '</text>';

  return '<svg class="sparkline" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">'
    + '<defs><linearGradient id="sg' + points[0].x.toFixed(0) + '" x1="0" y1="0" x2="0" y2="1">'
    + '<stop offset="0%" stop-color="' + lineColor + '" stop-opacity="0.15"/>'
    + '<stop offset="100%" stop-color="' + lineColor + '" stop-opacity="0"/>'
    + '</linearGradient></defs>'
    + '<path d="' + areaPath + '" fill="url(#sg' + points[0].x.toFixed(0) + ')" />'
    + '<polyline points="' + polyline + '" fill="none" stroke="' + lineColor + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" />'
    + xLabels
    + minLabel
    + maxLabel
    + dots
    + '</svg>';
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(function(w) { return w.id !== id; });
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  var lang = getLang();
  var grid = document.getElementById('watchlistGrid');
  var count = document.getElementById('watchlistCount');
  if (!grid) return;

  count.textContent = watchlist.length + ' ' + (lang === 'hu' ? 'tétel' : (watchlist.length === 1 ? 'item' : 'items'));

  if (!watchlist.length) {
    grid.innerHTML = '<div class="watchlist-empty"><p>'
      + (lang === 'hu' ? 'A figyelőlistád üres. Keress terméket és kattints a Figyelés gombra.' : 'Your watchlist is empty. Search for a product and click Watch to start tracking.')
      + '</p></div>';
    return;
  }

  grid.innerHTML = watchlist.map(function(w) {
    var history = generatePriceHistory(w);
    var spark = buildSparkline(history, w.price);
    var prices = history.map(function(h) { return h.price; });
    var minP = Math.min.apply(null, prices);
    var maxP = Math.max.apply(null, prices);
    var trend = prices[11] < prices[0] ? 'down' : prices[11] > prices[0] ? 'up' : 'flat';
    var trendLabel = lang === 'hu'
      ? (trend === 'down' ? '▼ Csökkenő trend' : trend === 'up' ? '▲ Növekvő trend' : '▬ Stabil ár')
      : (trend === 'down' ? '▼ Price dropping' : trend === 'up' ? '▲ Price rising' : '▬ Stable price');
    var trendColor = trend === 'down' ? '#16a34a' : trend === 'up' ? '#dc2626' : '#6b6b6b';
    var viewLabel = lang === 'hu' ? 'Megnézem' : 'View Deal';
    var removeTitle = lang === 'hu' ? 'Eltávolítás' : 'Remove';
    var lowLabel = lang === 'hu' ? '12h. min' : '12m. low';
    var highLabel = lang === 'hu' ? '12h. max' : '12m. high';
    var currentLabel = lang === 'hu' ? 'Jelenlegi' : 'Current';
    var graphTitle = lang === 'hu' ? '12 hónapos ártorténet' : '12-month price history';

    return '<div class="watchlist-card">'
      + '<button class="wl-remove" onclick="removeFromWatchlist(' + w.id + ')" title="' + removeTitle + '">'
      + '<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      + '</button>'
      + '<div class="wl-store">' + w.store + '</div>'
      + '<div class="wl-name">' + w.name + '</div>'
      + '<div class="wl-price-row">'
        + '<span class="wl-price">' + formatHUF(w.price) + '</span>'
        + (w.original > w.price ? ' <span class="wl-original">' + formatHUF(w.original) + '</span>' : '')
        + (w.discount > 0 ? ' <span class="wl-discount">-' + w.discount + '%</span>' : '')
      + '</div>'
      + '<div class="wl-graph-block">'
        + '<div class="wl-graph-header">'
          + '<span class="wl-graph-title">' + graphTitle + '</span>'
          + '<span class="wl-trend" style="color:' + trendColor + '">' + trendLabel + '</span>'
        + '</div>'
        + spark
        + '<div class="wl-price-stats">'
          + '<div class="wl-stat"><span class="wl-stat-label">' + lowLabel + '</span><span class="wl-stat-val green">' + formatHUF(minP) + '</span></div>'
          + '<div class="wl-stat"><span class="wl-stat-label">' + currentLabel + '</span><span class="wl-stat-val accent">' + formatHUF(w.price) + '</span></div>'
          + '<div class="wl-stat"><span class="wl-stat-label">' + highLabel + '</span><span class="wl-stat-val red">' + formatHUF(maxP) + '</span></div>'
        + '</div>'
      + '</div>'
      + '<a href="' + w.url + '" target="_blank" rel="noopener" class="btn-secondary">' + viewLabel + '</a>'
    + '</div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  renderWatchlist();
});
