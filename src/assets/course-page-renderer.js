(function (global) {
  'use strict';

  function store() {
    return global.CourseStore;
  }

  function typeLabel(type) {
    return type === 'paid' ? '유료' : '무료';
  }

  function titleWithLocation(title, location) {
    var text = String(title || '').trim();
    var place = String(location || '').trim();
    // 관리자가 강연명에 이미 대괄호로 지역 표시를 직접 입력했으면 그대로 존중하고 덮어쓰지 않는다.
    if (/^\[[^\]]+\]/.test(text)) return text;
    if (!place) return text;
    if (!text) return '[' + place + ']';
    return '[' + place + '] ' + text;
  }

  function displayTitle(course) {
    return titleWithLocation(course.title, course.location);
  }

  function toDate(value) {
    if (!value) return null;
    var match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }

  function courseMonthKey(course) {
    var d = toDate(course && course.eventDate);
    if (!d) return '';
    return String(d.getMonth() + 1); // 연도 무시, 월(1~12)만
  }

  function daysUntil(value) {
    var target = toDate(value);
    if (!target) return null;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / 86400000);
  }

  function deadlineDate(course) {
    var courseStore = store();
    if (courseStore && typeof courseStore.applicationDeadline === 'function') {
      return courseStore.applicationDeadline(course);
    }

    var date = toDate(course.eventDate);
    if (!date) return null;
    var times = String(course.eventTime || '').match(/\d{1,2}:\d{2}/g);
    if (!times || !times.length) {
      date.setHours(23, 59, 59, 999);
      return date;
    }
    var endTime = times[times.length - 1].split(':');
    date.setHours(Number(endTime[0]), Number(endTime[1]), 0, 0);
    return date;
  }

  function isPeriodExpired(course) {
    var deadline = deadlineDate(course);
    if (course.status === 'closed') return true;
    if (!deadline) return false;
    return new Date() > deadline;
  }

  function closedOverlayMarkup(course) {
    if (!isPeriodExpired(course)) return '';
    return '<img class="course-closed-overlay" src="/images/course-closed-overlay.png" alt="" aria-hidden="true" width="1080" height="1080" loading="lazy" decoding="async"/>';
  }

  function sortByRemainingPeriod(a, b) {
    var aExpired = isPeriodExpired(a);
    var bExpired = isPeriodExpired(b);
    if (aExpired !== bExpired) return aExpired ? 1 : -1;

    var aDeadline = deadlineDate(a);
    var bDeadline = deadlineDate(b);
    if (aDeadline && bDeadline && aDeadline.getTime() !== bDeadline.getTime()) {
      if (aExpired && bExpired) return bDeadline - aDeadline;
      return aDeadline - bDeadline;
    }
    if (aDeadline && !bDeadline) return -1;
    if (!aDeadline && bDeadline) return 1;

    return String(a.title || '').localeCompare(String(b.title || ''), 'ko');
  }

  function statusText(course) {
    var dday = daysUntil(course.eventDate);
    if (course.status === 'closed') return '모집 마감';
    if (course.status === 'draft') return '준비 중';
    if (course.status === 'hidden') return '비공개';
    if (isPeriodExpired(course)) return '진행 완료';
    if (dday == null) return '모집중';
    if (dday === 0) return 'D-DAY';
    return 'D-' + dday;
  }

  function shortDate(value) {
    var date = toDate(value);
    if (!date) return '-';
    return (date.getMonth() + 1) + '월 ' + date.getDate() + '일';
  }

  function scheduleText(course) {
    var date = shortDate(course.eventDate);
    var time = String(course.eventTime || '').trim();
    if (date === '-') return time || '-';
    return time ? date + ' · ' + time : date;
  }

  function freeFilterKey(course) {
    var text = [course.category, course.title].join(' ');
    if (/클로드|Claude/i.test(text)) return 'claude';
    if (/종합|Canva|캔바|AI/i.test(text) && !/제미나이|Gemini/i.test(text)) return 'canva';
    return 'chatgpt';
  }

  function paidFilterKey(course) {
    var text = [course.category, course.title].join(' ');
    if (/마케팅|콘텐츠|광고/i.test(text)) return 'marketing';
    if (/자동화|n8n|노코드/i.test(text)) return 'auto';
    return 'basic';
  }

  function filterKey(course) {
    return course.type === 'paid' ? paidFilterKey(course) : freeFilterKey(course);
  }

  function regionKey(course) {
    var s = store();
    if (s && typeof s.inferRegion === 'function') return s.inferRegion(course);
    var raw = String(course.region || course.location || course.address || '').trim();
    if (!raw) return '';
    var map = {
      '강남': '서울',
      '서초': '서울',
      '종로': '서울',
      '송파': '서울',
      '마포': '서울',
      '영등포': '서울',
      '용산': '서울',
      '서울': '서울',
      '경기': '경기',
      '인천': '인천',
      '부산': '부산',
      '대구': '대구',
      '광주': '광주',
      '대전': '대전',
      '울산': '울산',
      '세종': '세종',
      '강원': '강원',
      '충북': '충북',
      '충남': '충남',
      '전북': '전북',
      '전남': '전남',
      '경북': '경북',
      '경남': '경남',
      '제주': '제주'
    };
    if (map[raw]) return map[raw];
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key) && raw.indexOf(key) !== -1) {
        return map[key];
      }
    }
    return raw;
  }

  function priceMarkup(course) {
    if (course.type !== 'paid') return '';
    var price = Number(course.price || 0);
    var orig = Number(course.priceOrig || 0);
    var discount = orig > price && price > 0 ? Math.round((1 - price / orig) * 100) : 0;
    return ''
      + '<div class="c-price" style="margin-bottom:14px;">'
      + (discount ? '<span><span class="disc-pct" style="color:#ef1f1f;font-weight:700;font-size:12px;">' + discount + '%</span>&nbsp;<span class="orig">' + orig.toLocaleString('ko-KR') + '원</span></span>' : '')
      + '<span class="final" style="font-size:18px;">' + (price ? price.toLocaleString('ko-KR') + '원' : '무료') + '</span>'
      + '</div>';
  }

  function instructorMarkup(course) {
    var names = [];
    if (Array.isArray(course.sessions) && course.sessions.length) {
      var seen = {};
      course.sessions.forEach(function (session) {
        var sessionName = String(session && session.instructor || '').trim();
        if (sessionName && !seen[sessionName]) {
          seen[sessionName] = true;
          names.push(sessionName);
        }
      });
    }
    if (!names.length) {
      var single = String(course.instructor || '').trim();
      if (single) names.push(single);
    }
    if (!names.length) return '';
    // "아이온"이 포함돼 있으면 항상 맨 앞에 나오게 한다.
    names.sort(function (a, b) {
      if (a === '아이온' && b !== '아이온') return -1;
      if (b === '아이온' && a !== '아이온') return 1;
      return 0;
    });
    var label = names.map(function (name) {
      return /강사$/.test(name) ? name : name + ' 강사';
    }).join(', ');
    return '<p class="cc-instructor">' + store().escapeHtml(label) + '</p>';
  }

  function remainingMarkup(course, remaining) {
    return '';
  }

  function badgesMarkup(course) {
    var s = store();
    var badges = Array.isArray(course.badges) ? course.badges : [];
    var items = badges.map(function (badge) {
      return String(badge || '').trim();
    }).filter(Boolean);
    if (!items.length) return '';
    return '<div class="cc-tags">' + items.map(function (badge) {
      return '<span>' + s.escapeHtml(badge) + '</span>';
    }).join('') + '</div>';
  }

  function lowSeatsBadge(course, remaining) {
    return !isPeriodExpired(course) && remaining > 0 && remaining <= 10
      ? '<span class="cc-deadline-badge">마감 임박</span>'
      : '';
  }

  function cardMarkup(course, index) {
    var s = store();
    var remaining = s.remainingSeats(course);
    var status = statusText(course);
    var muted = /마감|완료|비공개/.test(status) ? ' style="color:#555;"' : '';
    var title = displayTitle(course);
    var thumb = typeof s.courseThumbnail === 'function' ? s.courseThumbnail(course) : (course.thumbImg || '/images/logo-ink.png');
    var loading = index < 6 ? 'eager' : 'lazy';
    var fallbackCode = global.AiLeadersUtils && global.AiLeadersUtils.stablePublicCode
      ? global.AiLeadersUtils.stablePublicCode(course.id)
      : course.id;
    var href = typeof s.courseDetailUrl === 'function'
      ? s.courseDetailUrl(course)
      : '/course/?c=' + encodeURIComponent(fallbackCode);
    return ''
      + '<article class="card" data-cat="' + s.escapeHtml(filterKey(course)) + '" data-region="' + s.escapeHtml(regionKey(course)) + '" data-event-date="' + s.escapeHtml(course.eventDate || '') + '">'
      + '<a href="' + s.escapeHtml(href) + '" class="card-link">'
      + '<div class="course-thumb" style="background:#e8f1ff;">'
      + lowSeatsBadge(course, remaining)
      + '<img src="' + s.escapeHtml(thumb) + '" alt="' + s.escapeHtml(title || '강연 이미지') + '" width="720" height="720" loading="' + loading + '" decoding="async"/>'
      + closedOverlayMarkup(course)
      + '</div>'
      + '<div class="course-body">'
      + '<h3>' + s.escapeHtml(title || '강연명 미정') + '</h3>'
      + instructorMarkup(course)
      + remainingMarkup(course, remaining)
      + '<p class="cc-price"' + muted + '>' + status + '</p>'
      + priceMarkup(course)
      + badgesMarkup(course)
      + '</div>'
      + '</a>'
      + '</article>';
  }

  function loadingMarkup() {
    return '<div id="emptyMsg" style="display:block;grid-column:1/-1;text-align:center;padding:80px 0;color:#8a95a3;font-size:18px;font-weight:600;">데이터를 불러오는 중입니다.</div>';
  }

  function unavailableMarkup() {
    return '<div id="emptyMsg" style="display:block;grid-column:1/-1;text-align:center;padding:80px 0;color:#8a95a3;font-size:18px;font-weight:600;">데이터를 불러올 수 없습니다.</div>';
  }

  var pagedState = null;
  var resizeBound = false;
  var resizeTimer = null;
  var storeSubscribed = false;
  var lastGridId = '';
  var lastGridHtml = '';
  var lastPagerHtml = '';
  var lastViewportWidth = null;

  // grid.innerHTML 을 다시 쓰면 안에 있던 <img> 가 전부 파괴되고 새로 만들어진다.
  // 브라우저가 이미지를 다시 디코딩하는 한두 프레임 동안 .course-thumb 의 배경색
  // (#e8f1ff) 이 그대로 드러나서 썸네일이 깜빡이는 것처럼 보인다.
  // 그래서 만들어진 HTML 이 직전과 완전히 같으면 DOM 을 아예 건드리지 않는다.
  // (D-day·마감 임박 같은 시간 의존 문구까지 문자열에 포함되므로, 표시가 바뀌어야
  //  하는 상황에서는 문자열이 달라져 정상적으로 다시 그려진다.)
  function applyGridHtml(grid, html) {
    if (lastGridId === grid.id && lastGridHtml === html) return false;
    grid.innerHTML = html;
    lastGridId = grid.id;
    lastGridHtml = html;
    return true;
  }

  function pageSize() {
    var isMobile = global.matchMedia && global.matchMedia('(max-width:540px)').matches;
    if (isMobile) return (pagedState && pagedState.mobilePageSize) || 4;
    return 9;
  }

  function allCoursesForState() {
    if (!pagedState || !store()) return [];
    return store().getCourses()
      .filter(function (course) { return course.type === pagedState.type && course.status !== 'hidden'; })
      .sort(sortByRemainingPeriod);
  }

  function filteredCourses() {
    var currentFilter = pagedState && pagedState.filter ? pagedState.filter : 'all';
    var currentRegion = pagedState && pagedState.region ? pagedState.region : 'all';
    var locationQuery = pagedState && pagedState.locationQuery ? pagedState.locationQuery : '';
    var currentMonth = pagedState && pagedState.month ? pagedState.month : '';
    return allCoursesForState().filter(function (course) {
      var matchesFilter = currentFilter === 'all' || filterKey(course) === currentFilter;
      var matchesRegion = currentRegion === 'all' || regionKey(course) === currentRegion;
      var matchesLocation = !locationQuery || String(course.location || '').indexOf(locationQuery) !== -1;
      // 날짜(eventDate) 없는 강연은 courseMonthKey가 ''이라 특정 월 선택 시 제외되고 '전체'에서만 노출됨
      var matchesMonth = !currentMonth || courseMonthKey(course) === currentMonth;
      return matchesFilter && matchesRegion && matchesLocation && matchesMonth;
    });
  }

  function ensurePager(grid) {
    var id = grid.id + 'Pager';
    var pager = document.getElementById(id);
    if (!pager) {
      pager = document.createElement('div');
      pager.id = id;
      pager.className = 'course-pager';
      grid.insertAdjacentElement('afterend', pager);
    }
    return pager;
  }

  function renderPager(grid, totalPages) {
    var pager = ensurePager(grid);
    if (totalPages <= 1) {
      pager.innerHTML = '';
      pager.style.display = 'none';
      lastPagerHtml = '';
      return;
    }
    var pagerHtml = ''
      + '<button class="course-page-btn" type="button" data-course-page-prev aria-label="이전 페이지">&lsaquo;</button>'
      + '<span class="course-page-count">' + (pagedState.page + 1) + ' / ' + totalPages + '</span>'
      + '<button class="course-page-btn" type="button" data-course-page-next aria-label="다음 페이지">&rsaquo;</button>';
    pager.style.display = '';
    // 내용이 같으면 버튼을 다시 만들지 않는다. 다시 만들면 사용자가 누르는 중이던
    // 버튼과 리스너가 교체되어 탭이 무시될 수 있다.
    if (lastPagerHtml === pagerHtml) return;
    lastPagerHtml = pagerHtml;
    pager.innerHTML = pagerHtml;
    var prev = pager.querySelector('[data-course-page-prev]');
    var next = pager.querySelector('[data-course-page-next]');
    prev.disabled = pagedState.page <= 0;
    next.disabled = pagedState.page >= totalPages - 1;
    prev.addEventListener('click', function () {
      if (pagedState.page <= 0) return;
      pagedState.page -= 1;
      renderCurrentPage(true);
    });
    next.addEventListener('click', function () {
      if (pagedState.page >= totalPages - 1) return;
      pagedState.page += 1;
      renderCurrentPage(true);
    });
  }

  function updateFilterButtons() {
    if (!pagedState) return;
    Array.prototype.forEach.call(document.querySelectorAll('.filter-btn'), function (button) {
      var onclick = button.getAttribute('onclick') || '';
      var active = onclick.indexOf("'" + pagedState.filter + "'") !== -1
        || onclick.indexOf('"' + pagedState.filter + '"') !== -1;
      button.classList.toggle('active', active);
    });
  }

  function updateRegionFilter() {
    if (!pagedState) return;
    var region = pagedState.region || 'all';
    var label = document.getElementById('regionDdLabel');
    if (label) label.textContent = region === 'all' ? '지역' : region;
    Array.prototype.forEach.call(document.querySelectorAll('.dd-opt'), function (button) {
      button.classList.toggle('active', button.getAttribute('data-region') === region);
    });
  }

  function scrollToFirstCard(grid) {
    var firstCard = grid.querySelector('article');
    var target = firstCard || grid;
    if (!target || !global.scrollTo) return;
    var nav = document.querySelector('.nav');
    var navHeight = nav ? nav.getBoundingClientRect().height : 0;
    var offset = Math.max(navHeight + 18, 86);
    var top = target.getBoundingClientRect().top + global.pageYOffset - offset;
    global.scrollTo({
      top: Math.max(0, top),
      behavior: 'auto'
    });
  }

  function scheduleScrollToFirstCard(grid) {
    if (global.requestAnimationFrame) {
      global.requestAnimationFrame(function () {
        global.requestAnimationFrame(function () {
          scrollToFirstCard(grid);
        });
      });
    } else {
      global.setTimeout(function () {
        scrollToFirstCard(grid);
      }, 0);
    }
    global.setTimeout(function () {
      scrollToFirstCard(grid);
    }, 120);
  }

  function renderCurrentPage(shouldScroll) {
    if (!store() || !pagedState) return;
    var grid = document.getElementById(pagedState.gridId);
    if (!grid) return;
    if (store().hasError && store().hasError()) {
      applyGridHtml(grid, unavailableMarkup());
      renderPager(grid, 0);
      return;
    }
    if (store().hasLoaded && !store().hasLoaded()) {
      applyGridHtml(grid, loadingMarkup());
      renderPager(grid, 0);
      return;
    }
    var list = filteredCourses();
    var size = pageSize();
    var totalPages = Math.max(1, Math.ceil(list.length / size));
    pagedState.page = Math.min(Math.max(pagedState.page, 0), totalPages - 1);
    var start = pagedState.page * size;
    var pageItems = list.slice(start, start + size);
    applyGridHtml(grid, '<div id="emptyMsg" style="display:' + (list.length ? 'none' : 'block') + ';grid-column:1/-1;text-align:center;padding:80px 0;color:#8a95a3;font-size:18px;font-weight:600;">강연 준비 중입니다</div>'
      + pageItems.map(cardMarkup).join(''));
    renderPager(grid, list.length ? totalPages : 0);
    updateFilterButtons();
    updateRegionFilter();
    if (shouldScroll) scheduleScrollToFirstCard(grid);
  }

  function bindResize() {
    if (resizeBound) return;
    resizeBound = true;
    lastViewportWidth = global.innerWidth;
    global.addEventListener('resize', function () {
      // 모바일 브라우저는 스크롤 중 주소창이 접히거나 펴질 때마다 resize 를 발생시킨다.
      // pageSize() 는 (max-width:540px) 가로 조건만 보므로 세로 높이 변화로는 결과가
      // 달라지지 않는다. 그런데도 다시 그리면 썸네일이 깜빡이므로 가로폭이 실제로
      // 바뀐 경우(기기 회전, 창 크기 조절)에만 재렌더한다.
      if (global.innerWidth === lastViewportWidth) return;
      lastViewportWidth = global.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        renderCurrentPage();
      }, 120);
    });
  }

  function renderPaged(options) {
    if (!store()) return;
    var grid = document.getElementById(options.gridId || 'courseGrid');
    if (!grid) return;
    if (!storeSubscribed && typeof store().subscribe === 'function') {
      store().subscribe(function () {
        renderCurrentPage();
      });
      storeSubscribed = true;
    }
    pagedState = {
      type: options.type,
      gridId: options.gridId || 'courseGrid',
      mobilePageSize: options.mobilePageSize,
      filter: 'all',
      region: 'all',
      page: 0
    };
    // 새로 초기화할 때는 직전 렌더 기록을 비워 첫 렌더가 반드시 수행되도록 한다.
    lastGridId = '';
    lastGridHtml = '';
    lastPagerHtml = '';
    bindResize();
    renderCurrentPage();
    if (typeof store().ready === 'function') {
      store().ready().catch(function () {
        renderCurrentPage();
      });
    }
  }

  function filterRegionPaged(region, button) {
    if (!pagedState) return;
    pagedState.region = region || 'all';
    pagedState.locationQuery = '';
    pagedState.page = 0;
    if (button) {
      Array.prototype.forEach.call(document.querySelectorAll('.dd-opt'), function (btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    }
    var dd = document.getElementById('regionDd');
    if (dd) dd.classList.remove('open');
    renderCurrentPage();
  }

  function searchLocationPaged(text) {
    if (!pagedState) return;
    pagedState.locationQuery = String(text || '').trim();
    pagedState.page = 0;
    renderCurrentPage();
  }

  function selectLocationPaged(text) {
    if (!pagedState) return;
    pagedState.region = 'all';
    pagedState.locationQuery = String(text || '').trim();
    pagedState.page = 0;
    renderCurrentPage();
  }

  function filterPaged(category, button) {
    if (!pagedState) return;
    pagedState.filter = category || 'all';
    pagedState.page = 0;
    if (button) {
      Array.prototype.forEach.call(document.querySelectorAll('.filter-btn'), function (btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    }
    renderCurrentPage();
  }

  function filterByMonthPaged(value) {
    if (!pagedState) return;
    pagedState.month = String(value || '');
    pagedState.page = 0;
    renderCurrentPage();
  }

  // 뒤로가기(bfcache) 복원 시 검색+월 필터를 한 번에 해제하고 전체를 다시 렌더 (재렌더 1회)
  function resetSearchAndMonthPaged() {
    if (!pagedState) return;
    pagedState.locationQuery = '';
    pagedState.month = '';
    pagedState.page = 0;
    renderCurrentPage();
  }

  // 실제 강연이 잡힌 달만 오름차순으로 (연도 포함). [{ key:'2026-08', label:'2026년 8월' }, ...]
  function availableMonthsPaged() {
    var seen = {};
    var list = [];
    allCoursesForState().forEach(function (course) {
      var key = courseMonthKey(course);
      if (!key || seen[key]) return;
      seen[key] = true;
      list.push({ key: key, label: key + '월' });
    });
    list.sort(function (a, b) { return Number(a.key) - Number(b.key); });
    return list;
  }

  function render(options) {
    renderPaged(options);
  }

  global.CoursePageRenderer = { render: renderPaged, filter: filterPaged, filterRegion: filterRegionPaged, searchLocation: searchLocationPaged, selectLocation: selectLocationPaged, filterByMonth: filterByMonthPaged, getAvailableMonths: availableMonthsPaged, resetSearchAndMonth: resetSearchAndMonthPaged };
})(window);
