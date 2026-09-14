(function (global) {
  'use strict';

  // 후기를 site_reviews 표에서 그립니다. 두 곳을 함께 맡습니다.
  //   첫 화면  #reviews  (세 줄로 흐르는 카드)      placement = home
  //   후기 페이지 #reviewGrid (거르기 + 쪽 넘기기)   placement = page
  //
  // 예전에는 두 곳 모두 HTML 에 카드가 박혀 있었고, 거르기 단추도
  // free/paid 라는 값이 코드에 박혀 있었습니다. 이제 후기 종류는
  // 관리자 [홈페이지 관리 > 후기 > 후기 종류] 에서 옵니다.
  //
  // 바뀐 점 하나 — [전체] 를 눌렀을 때의 차례입니다. 예전에는 유료·무료를
  // 2:1 로 번갈아 섞었는데, 이제는 관리자에서 끌어다 놓은 차례 그대로 나옵니다.

  var DESKTOP_PER_PAGE = 6;
  var MOBILE_PER_PAGE = 3;
  var HOME_COLUMNS = 3;

  var STAR_HOME = '<svg fill="#FFB800" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z"></path></svg>';
  var STAR_PAGE = '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  var STAR_PAGE_EMPTY = '<svg class="empty" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  var store = global.SiteContentStore;
  var media = global.AiLeadersPublicMedia || global.DeardayPublicMedia;
  var utils = global.AiLeadersSupabase || {};
  var esc = utils.escapeHtml || function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  function assetUrl(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return '';
    return media && typeof media.resolve === 'function' ? media.resolve(raw) : raw;
  }

  function photoOn() {
    var settings = store.getReviewSettings();
    return !!(settings && settings.photoEnabled);
  }

  function initial(name) {
    var text = String(name || '').trim();
    return text ? text.charAt(0) : '·';
  }

  /* ── 첫 화면 ─────────────────────────────────────────── */
  function homeCard(item) {
    var stars = '';
    for (var i = 0; i < item.rating; i++) stars += STAR_HOME;
    var image = photoOn() && item.imageUrl
      ? '<div class="review-img"><img alt="' + esc(item.authorName) + ' 후기 이미지" src="' + esc(assetUrl(item.imageUrl))
        + '" loading="lazy" decoding="async" style="width:100%;height:180px;object-fit:cover;border-radius:0;display:block;margin-bottom:12px;"></div>'
      : '';
    return '<div class="review">'
      + '<div class="who-row"><span class="av">' + esc(initial(item.authorName)) + '</span>'
      + '<div class="who"><b>' + esc(item.authorName) + '</b><span>' + esc(item.authorIntro) + '</span></div></div>'
      + '<div class="stars">' + stars + '</div>'
      + '<div class="q">' + esc(item.body) + '</div>'
      + image
      + '</div>';
  }

  function renderHome() {
    var wrap = document.querySelector('#reviews .reviews-wrap');
    if (!wrap) return;
    var items = store.getReviews('home');
    var columns = [];
    for (var c = 0; c < HOME_COLUMNS; c++) columns.push([]);
    items.forEach(function (item, index) { columns[index % HOME_COLUMNS].push(item); });
    wrap.innerHTML = columns.map(function (list) {
      return '<div class="reviews-col"><div class="reviews-track">'
        + list.map(homeCard).join('') + '</div></div>';
    }).join('');
  }

  /* ── 후기 페이지 ─────────────────────────────────────── */
  function pageCard(item) {
    var stars = '';
    for (var i = 1; i <= 5; i++) stars += (i <= item.rating ? STAR_PAGE : STAR_PAGE_EMPTY);
    var text = (item.bodyLead ? '<strong>' + esc(item.bodyLead) + '</strong> ' : '') + esc(item.body);
    var image = photoOn() && item.imageUrl
      ? '<div class="rv-img"><img src="' + esc(assetUrl(item.imageUrl)) + '" alt="' + esc(item.authorName)
        + ' 후기 이미지" loading="lazy" style="width:100%;border-radius:12px;display:block;margin:12px 0;"></div>'
      : '';
    return '<article class="rv-card" data-cat="' + esc(item.category) + '">'
      + (item.category ? '<div><span class="rv-course-tag">' + esc(item.category) + '</span></div>' : '')
      + '<div class="rv-stars">' + stars + '</div>'
      + '<p class="rv-text">' + text + '</p>'
      + image
      + '<div class="rv-author"><div class="rv-avatar">' + esc(initial(item.authorName)) + '</div>'
      + '<div><div class="rv-name">' + esc(item.authorName) + '</div>'
      + '<div class="rv-meta">' + esc(item.authorContext) + '</div></div></div>'
      + '</article>';
  }

  function renderPage() {
    var grid = document.getElementById('reviewGrid');
    if (!grid) return;
    var filters = document.querySelector('.filters');
    var items = store.getReviews('page');
    grid.innerHTML = items.map(pageCard).join('');

    if (filters) {
      var cats = store.getReviewCategories();
      filters.innerHTML = '<button class="filter-btn active" type="button" data-cat="all">전체</button>'
        + cats.map(function (cat) {
            return '<button class="filter-btn" type="button" data-cat="' + esc(cat.value) + '">' + esc(cat.label) + '</button>';
          }).join('');
    }

    var query = global.matchMedia ? global.matchMedia('(max-width: 900px)') : null;
    var currentFilter = 'all';
    var currentPage = 1;

    function perPage() { return query && query.matches ? MOBILE_PER_PAGE : DESKTOP_PER_PAGE; }

    // [전체] 는 관리자에서 끌어다 놓은 차례 그대로입니다.
    function filtered() {
      var all = [].slice.call(grid.querySelectorAll('article'));
      if (currentFilter === 'all') return all;
      return all.filter(function (card) { return card.dataset.cat === currentFilter; });
    }

    function scrollToFirst() {
      var first = [].slice.call(grid.querySelectorAll('article')).filter(function (card) {
        return card.style.display !== 'none';
      })[0] || grid;
      var nav = document.querySelector('nav');
      var offset = (nav ? nav.offsetHeight : 0) + 16;
      var top = first.getBoundingClientRect().top + global.pageYOffset - offset;
      global.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    function paint(shouldScroll) {
      var all = [].slice.call(grid.querySelectorAll('article'));
      var list = filtered();
      var size = perPage();
      var pages = Math.ceil(list.length / size);
      if (currentPage > pages) currentPage = pages || 1;
      var start = (currentPage - 1) * size;
      all.forEach(function (card) { card.style.display = 'none'; });
      list.slice(start, start + size).forEach(function (card) { card.style.display = 'flex'; });
      paintPagination(pages);
      if (shouldScroll && !(query && query.matches)) {
        global.requestAnimationFrame(function () { global.requestAnimationFrame(scrollToFirst); });
      }
    }

    function pageButton(label, disabled, onClick) {
      var button = document.createElement('button');
      button.className = 'rv-page-btn arrow';
      button.innerHTML = label;
      button.disabled = disabled;
      button.onclick = onClick;
      return button;
    }

    function paintPagination(pages) {
      var box = document.getElementById('reviewPagination');
      if (!box) return;
      box.innerHTML = '';
      if (pages <= 1) return;
      box.appendChild(pageButton('&#8249;', currentPage === 1, function () {
        if (currentPage > 1) { currentPage--; paint(true); }
      }));
      for (var i = 1; i <= pages; i++) {
        (function (n) {
          var button = document.createElement('button');
          button.className = 'rv-page-btn' + (n === currentPage ? ' dot-active' : '');
          var dot = document.createElement('span');
          dot.className = 'rv-dot';
          button.appendChild(dot);
          button.onclick = function () { currentPage = n; paint(true); };
          box.appendChild(button);
        })(i);
      }
      box.appendChild(pageButton('&#8250;', currentPage === pages, function () {
        if (currentPage < pages) { currentPage++; paint(true); }
      }));
    }

    if (filters) {
      filters.addEventListener('click', function (event) {
        var button = event.target.closest ? event.target.closest('.filter-btn') : null;
        if (!button) return;
        [].forEach.call(filters.querySelectorAll('.filter-btn'), function (other) { other.classList.remove('active'); });
        button.classList.add('active');
        currentFilter = button.dataset.cat;
        currentPage = 1;
        paint(true);
      });
    }
    if (query) {
      var onResize = function () { currentPage = 1; paint(false); };
      if (query.addEventListener) query.addEventListener('change', onResize);
      else if (query.addListener) query.addListener(onResize);
    }
    paint(false);
  }

  /* ── 메뉴 이름 ───────────────────────────────────────── */
  function renderMenuLabel() {
    var settings = store.getReviewSettings();
    var label = settings && settings.label;
    if (!label) return;   // 비어 있으면 페이지에 적힌 이름을 그대로 둡니다
    [].forEach.call(document.querySelectorAll('[data-nav-key="reviews"], .mt-drawer-link[href="/reviews/"]'), function (link) {
      link.textContent = label;
    });
  }

  function start() {
    if (!store || typeof store.ready !== 'function') return;
    store.ready().then(function () {
      renderMenuLabel();
      renderHome();
      renderPage();
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
