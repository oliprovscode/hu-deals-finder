// PricePulse HU — app.js (homepage: watchlist only)

var watchlist = JSON.parse(localStorage.getItem('pricepulse_watchlist') || '[]');

function formatHUF(n) {
  return Number(n).toLocaleString('hu-HU') + ' Ft';
}

function removeFromWatchlist(id) {
  watchlist = watchlist.filter(function(w) { return w.id !== id; });
  localStorage.setItem('pricepulse_watchlist', JSON.stringify(watchlist));
  renderWatchlist();
}

function renderWatchlist() {
  var grid = document.getElementById('watchlistGrid');
  var count = document.getElementById('watchlistCount');
  if (!grid) return;
  count.textContent = watchlist.length + (watchlist.length === 1 ? ' item' : ' items');
  if (!watchlist.length) {
    grid.innerHTML = '<div class="watchlist-empty"><p>Your watchlist is empty. Search for a product and click Watch to start tracking.</p></div>';
    return;
  }
  grid.innerHTML = watchlist.map(function(w) {
    return '<div class="watchlist-card">' +
      '<button class="wl-remove" onclick="removeFromWatchlist(' + w.id + ')" title="Remove">&#10005;</button>' +
      '<div class="wl-store">' + w.store + '</div>' +
      '<div class="wl-name">' + w.name + '</div>' +
      '<div>' +
        '<span class="wl-price">' + formatHUF(w.price) + '</span>' +
        (w.original > w.price ? ' <span class="wl-original">' + formatHUF(w.original) + '</span>' : '') +
        (w.discount > 0 ? ' <span class="wl-discount">-' + w.discount + '%</span>' : '') +
      '</div>' +
      '<div class="wl-alert">Tracking - will update on price change</div>' +
      '<a href="' + w.url + '" target="_blank" rel="noopener" class="btn-secondary" style="margin-top:4px">View Deal</a>' +
    '</div>';
  }).join('');
}

document.addEventListener('DOMContentLoaded', function() {
  renderWatchlist();
});
