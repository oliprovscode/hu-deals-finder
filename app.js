// ---- MOCK DATA (replace with real API calls) ----
const DEALS = [
  { id: 1, name: "Samsung Galaxy S24 128GB", store: "eMAG.hu", category: "phones", price: 149990, original: 179990, discount: 17, img: "https://via.placeholder.com/280x140?text=Galaxy+S24", url: "https://www.emag.hu" },
  { id: 2, name: "Apple MacBook Air M2 13\"", store: "Alza.hu", category: "laptops", price: 449900, original: 519900, discount: 13, img: "https://via.placeholder.com/280x140?text=MacBook+Air", url: "https://www.alza.hu" },
  { id: 3, name: "Sony WH-1000XM5 Headphones", store: "MediaMarkt.hu", category: "audio", price: 89900, original: 119900, discount: 25, img: "https://via.placeholder.com/280x140?text=Sony+XM5", url: "https://www.mediamarkt.hu" },
  { id: 4, name: "LG OLED55C3 55\" 4K TV", store: "Extreme Digital", category: "tvs", price: 389000, original: 499000, discount: 22, img: "https://via.placeholder.com/280x140?text=LG+OLED", url: "https://www.extremedigital.hu" },
  { id: 5, name: "PlayStation 5 Slim", store: "eMAG.hu", category: "gaming", price: 159900, original: 189900, discount: 16, img: "https://via.placeholder.com/280x140?text=PS5+Slim", url: "https://www.emag.hu" },
  { id: 6, name: "Apple iPhone 15 Pro 256GB", store: "iStyle.hu", category: "phones", price: 429900, original: 469900, discount: 9, img: "https://via.placeholder.com/280x140?text=iPhone+15+Pro", url: "https://www.istyle.hu" },
  { id: 7, name: "Lenovo IdeaPad 5 Pro 16\"", store: "Alza.hu", category: "laptops", price: 199900, original: 249900, discount: 20, img: "https://via.placeholder.com/280x140?text=IdeaPad+5", url: "https://www.alza.hu" },
  { id: 8, name: "Bosch WAV28E90BY Washing Machine", store: "Euronics.hu", category: "appliances", price: 179900, original: 229900, discount: 22, img: "https://via.placeholder.com/280x140?text=Bosch+WM", url: "https://www.euronics.hu" },
  { id: 9, name: "JBL Charge 5 Bluetooth Speaker", store: "MediaMarkt.hu", category: "audio", price: 29990, original: 44990, discount: 33, img: "https://via.placeholder.com/280x140?text=JBL+Charge+5", url: "https://www.mediamarkt.hu" },
  { id: 10, name: "Xbox Series X Console", store: "Extreme Digital", category: "gaming", price: 169900, original: 199900, discount: 15, img: "https://via.placeholder.com/280x140?text=Xbox+Series+X", url: "https://www.extremedigital.hu" },
  { id: 11, name: "Samsung 65\" QLED 4K Q80C", store: "eMAG.hu", category: "tvs", price: 279900, original: 359900, discount: 22, img: "https://via.placeholder.com/280x140?text=Samsung+QLED", url: "https://www.emag.hu" },
  { id: 12, name: "Dyson V15 Detect Vacuum", store: "Alza.hu", category: "appliances", price: 199900, original: 249900, discount: 20, img: "https://via.placeholder.com/280x140?text=Dyson+V15", url: "https://www.alza.hu" },
];

let watchlist = JSON.parse(localStorage.getItem('hu_watchlist') || '[]');
let currentCategory = 'all';
let currentSort = 'discount';
let searchQuery = '';

function formatHUF(n) {
  return n.toLocaleString('hu-HU') + ' Ft';
}

function filteredDeals() {
  let d = [...DEALS];
  if (currentCategory !== 'all') d = d.filter(x => x.category === currentCategory);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    d = d.filter(x => x.name.toLowerCase().includes(q) || x.store.toLowerCase().includes(q));
  }
  if (currentSort === 'discount') d.sort((a, b) => b.discount - a.discount);
  if (currentSort === 'price-asc') d.sort((a, b) => a.price - b.price);
  if (currentSort === 'price-desc') d.sort((a, b) => b.price - a.price);
  return d;
}

function isWatched(id) {
  return watchlist.some(w => w.id === id);
}

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
      <span class="deal-badge">-${d.discount}%</span>
      <img class="deal-img" src="${d.img}" alt="${d.name}" loading="lazy" />
      <div class="deal-store">${d.store}</div>
      <div class="deal-name">${d.name}</div>
      <div class="deal-pricing">
        <span class="deal-price">${formatHUF(d.price)}</span>
        <span class="deal-original">${formatHUF(d.original)}</span>
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
    grid.innerHTML = `
      <div class="watchlist-empty" id="watchlistEmpty">
        <div class="empty-icon">📋</div>
        <p>Your watchlist is empty.<br>Click "Watch" on any deal to start tracking.</p>
      </div>`;
    return;
  }
  grid.innerHTML = watchlist.map(w => `
    <div class="watchlist-card">
      <button class="wl-remove" onclick="removeFromWatchlist(${w.id})" title="Remove">✕</button>
      <div class="wl-store">${w.store}</div>
      <div class="wl-name">${w.name}</div>
      <div>
        <span class="wl-price">${formatHUF(w.price)}</span>
        <span class="wl-original">${formatHUF(w.original)}</span>
        <span class="wl-discount">-${w.discount}%</span>
      </div>
      <div class="wl-alert">✓ Tracking — will alert on price drop</div>
    </div>
  `).join('');
}

function searchDeals() {
  searchQuery = document.getElementById('searchInput').value.trim();
  renderDeals();
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

// Allow Enter key in search
document.addEventListener('DOMContentLoaded', () => {
  const inp = document.getElementById('searchInput');
  if (inp) inp.addEventListener('keydown', e => { if (e.key === 'Enter') searchDeals(); });
  renderDeals();
  renderWatchlist();
});
