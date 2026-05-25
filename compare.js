// PricePulse HU — compare.js

var compareList = JSON.parse(localStorage.getItem('pp_compare') || '[]');
var MAX_COMPARE = 4;

function getLang() { return localStorage.getItem('pp_lang') || 'hu'; }

function formatHUF(n) {
  return Number(n).toLocaleString('hu-HU') + ' Ft';
}

function renderStars(rating) {
  if (!rating) return '–';
  var full = Math.floor(rating);
  var half = (rating - full) >= 0.4;
  var empty = 5 - full - (half ? 1 : 0);
  var s = '';
  for (var i = 0; i < full; i++) s += '<svg class="star" viewBox="0 0 16 16"><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="#f59e0b"/></svg>';
  if (half) s += '<svg class="star" viewBox="0 0 16 16"><defs><linearGradient id="hg"><stop offset="50%" stop-color="#f59e0b"/><stop offset="50%" stop-color="#d1d5db"/></linearGradient></defs><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="url(#hg)"/></svg>';
  for (var j = 0; j < empty; j++) s += '<svg class="star" viewBox="0 0 16 16"><path d="M8 1l2.06 4.18L15 6.18l-3.5 3.41.83 4.82L8 12.1l-4.33 2.31.83-4.82L1 6.18l4.94-.99z" fill="#d1d5db"/></svg>';
  return '<span class="cmp-stars">' + s + '</span> <span class="cmp-rating-num">' + rating.toFixed(1) + '</span>';
}

function removeFromCompare(id) {
  compareList = compareList.filter(function(p) { return p.id !== id; });
  localStorage.setItem('pp_compare', JSON.stringify(compareList));
  renderCompare();
  // also sync tray on parent page if opened in same tab
  if (typeof window.syncCompareTray === 'function') window.syncCompareTray();
}

function renderCompare() {
  var lang = getLang();
  var items = compareList;

  // i18n
  document.getElementById('compareTitle').textContent = lang === 'hu' ? 'Termékek összehasonlítása' : 'Product Comparison';
  document.getElementById('compareSubtitle').textContent = lang === 'hu' ? 'Legfeljebb 4 termék hasonlítható össze egyszerre.' : 'Compare up to 4 products side by side.';
  document.getElementById('backBtn').textContent = lang === 'hu' ? '← Vissza' : '← Back';
  document.getElementById('compareEmptyMsg').textContent = lang === 'hu' ? 'Nincs összehasonlítandó termék. Menj vissza a kereséshez és adj hozzá termékeket.' : 'No products to compare. Go back to search and add products.';
  document.getElementById('compareEmptyLink').textContent = lang === 'hu' ? 'Keresés' : 'Search';

  if (!items.length) {
    document.getElementById('compareEmpty').style.display = 'block';
    document.getElementById('compareContent').style.display = 'none';
    return;
  }
  document.getElementById('compareEmpty').style.display = 'none';
  document.getElementById('compareContent').style.display = 'block';

  var n = items.length;
  var prices = items.map(function(p) { return p.price; });
  var minPrice = Math.min.apply(null, prices);
  var maxPrice = Math.max.apply(null, prices);
  var ratings = items.map(function(p) { return p.rating || 0; });
  var maxRating = Math.max.apply(null, ratings);

  // IMAGE ROW
  var imgHtml = '<div class="cmp-col cmp-col-label"></div>';
  items.forEach(function(p) {
    imgHtml += '<div class="cmp-col cmp-col-item">'
      + '<button class="cmp-remove" onclick="removeFromCompare(' + p.id + ')" title="' + (lang === 'hu' ? 'Eltávolítás' : 'Remove') + '">'
      + '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>'
      + '</button>'
      + (p.img ? '<img class="cmp-img" src="' + p.img + '" alt="' + p.name.replace(/"/g,'') + '" loading="lazy" onerror="this.style.display=\'none\'">' : '<div class="cmp-img-placeholder"></div>')
      + '<div class="cmp-item-name">' + p.name + '</div>'
      + '<div class="cmp-item-store">' + p.store + '</div>'
      + '<a href="' + p.url + '" target="_blank" rel="noopener" class="btn-primary cmp-buy-btn">' + (lang === 'hu' ? 'Megveszem' : 'Buy') + '</a>'
      + '</div>';
  });
  document.getElementById('cmpImages').innerHTML = imgHtml;

  // TABLE ROWS
  var rows = [
    {
      label: lang === 'hu' ? 'Jelenlegi ár' : 'Current price',
      render: function(p) {
        var isBest = p.price === minPrice && n > 1;
        var isWorst = p.price === maxPrice && n > 1 && minPrice !== maxPrice;
        return '<span class="cmp-val' + (isBest ? ' cmp-best' : isWorst ? ' cmp-worst' : '') + '">' + formatHUF(p.price) + (isBest ? ' <span class="cmp-badge-best">' + (lang === 'hu' ? 'Legjobb' : 'Best') + '</span>' : '') + '</span>';
      }
    },
    {
      label: lang === 'hu' ? 'Eredeti ár' : 'Original price',
      render: function(p) {
        return p.original && p.original > p.price ? '<span class="cmp-orig">' + formatHUF(p.original) + '</span>' : '<span class="cmp-muted">–</span>';
      }
    },
    {
      label: lang === 'hu' ? 'Kedvezmény' : 'Discount',
      render: function(p) {
        return p.discount > 0 ? '<span class="cmp-discount">-' + p.discount + '%</span>' : '<span class="cmp-muted">–</span>';
      }
    },
    {
      label: lang === 'hu' ? 'Értékelés' : 'Rating',
      render: function(p) {
        var isBest = p.rating && p.rating === maxRating && n > 1;
        return '<span class="' + (isBest ? 'cmp-best' : '') + '">' + renderStars(p.rating) + (p.reviews ? ' <span class="cmp-muted">(' + Number(p.reviews).toLocaleString('hu-HU') + ')</span>' : '') + '</span>';
      }
    },
    {
      label: lang === 'hu' ? 'Bolt' : 'Store',
      render: function(p) { return '<span class="cmp-val">' + p.store + '</span>'; }
    },
    {
      label: lang === 'hu' ? 'Márka' : 'Brand',
      render: function(p) { return '<span class="cmp-val">' + (p.brand || '–') + '</span>'; }
    },
    {
      label: lang === 'hu' ? 'Kategória' : 'Category',
      render: function(p) {
        var cats = { electronics: lang==='hu'?'Elektronika':'Electronics', watches: lang==='hu'?'Órák':'Watches', skincare: lang==='hu'?'Bőrápolás':'Skincare', beauty: lang==='hu'?'Szépség':'Beauty', fashion: lang==='hu'?'Divat':'Fashion', sports: lang==='hu'?'Sport':'Sports', home: lang==='hu'?'Otthon':'Home', other: lang==='hu'?'Egyéb':'Other' };
        return '<span class="cmp-val">' + (cats[p.category] || p.category || '–') + '</span>';
      }
    },
    {
      label: lang === 'hu' ? 'Raktáron' : 'In stock',
      render: function(p) {
        return p.inStock
          ? '<span class="cmp-instock">✓ ' + (lang === 'hu' ? 'Igen' : 'Yes') + '</span>'
          : '<span class="cmp-outofstock">✗ ' + (lang === 'hu' ? 'Nem' : 'No') + '</span>';
      }
    }
  ];

  var tableHtml = rows.map(function(row) {
    var cells = '<div class="cmp-col cmp-col-label"><span class="cmp-row-label">' + row.label + '</span></div>';
    items.forEach(function(p) {
      cells += '<div class="cmp-col cmp-col-item">' + row.render(p) + '</div>';
    });
    return '<div class="cmp-row">' + cells + '</div>';
  }).join('');

  document.getElementById('cmpTable').innerHTML = tableHtml;
}

document.addEventListener('DOMContentLoaded', function() {
  compareList = JSON.parse(localStorage.getItem('pp_compare') || '[]');
  renderCompare();

  // language sync
  var langBtn = document.getElementById('langBtn');
  var lang = getLang();
  if (langBtn) langBtn.textContent = lang === 'hu' ? 'EN' : 'HU';
});

function toggleLang() {
  var lang = getLang();
  var next = lang === 'hu' ? 'en' : 'hu';
  localStorage.setItem('pp_lang', next);
  document.getElementById('langBtn').textContent = next === 'hu' ? 'EN' : 'HU';
  renderCompare();
}
