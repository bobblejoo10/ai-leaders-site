(function (global) {
  'use strict';

  var ADMIN_ACCESS_PATH = '/admin-dashboard/';
  var ATTRIBUTION_STORAGE_KEY = 'aiLeadersAttributionContext';
  var COMPLETION_STORAGE_KEY = 'aiLeadersLastApplication';
  var ATTRIBUTION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  var ATTRIBUTION_QUERY_KEYS = [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'gclid', 'gbraid', 'wbraid', 'dclid', 'fbclid', 'msclkid', 'ttclid'
  ];

  function storageRead(storage, key) {
    if (!storage) return { available: false, value: null };
    try {
      return { available: true, value: storage.getItem(key) };
    } catch (error) {
      return { available: false, value: null };
    }
  }

  function storageWrite(storage, key, value) {
    if (!storage) return false;
    try {
      storage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function safeAttributionValue(value) {
    var text = String(value || '').trim();
    if (!text || text.length > 200 || /[\u0000-\u001f\u007f]/.test(text)) return '';
    return text;
  }

  function parseAttributionRecord(raw) {
    if (!raw) return {};
    try {
      var record = JSON.parse(raw);
      if (!record || typeof record !== 'object') return {};
      var capturedAt = Number(record.capturedAt || 0);
      if (capturedAt && Date.now() - capturedAt > ATTRIBUTION_MAX_AGE_MS) return {};
      return record;
    } catch (error) {
      return {};
    }
  }

  function captureAttributionContext() {
    var sessionStore = null;
    var localStore = null;
    try { sessionStore = global.sessionStorage; } catch (error) {}
    try { localStore = global.localStorage; } catch (error) {}
    var sessionRecord = storageRead(sessionStore, ATTRIBUTION_STORAGE_KEY);
    var localRecord = storageRead(localStore, ATTRIBUTION_STORAGE_KEY);
    var context = Object.assign({}, parseAttributionRecord(localRecord.value), parseAttributionRecord(sessionRecord.value));
    var params = new URLSearchParams(global.location.search || '');
    var changed = false;

    ATTRIBUTION_QUERY_KEYS.forEach(function (key) {
      var value = safeAttributionValue(params.get(key));
      if (value && !context[key]) {
        context[key] = value;
        changed = true;
      }
    });

    if (!context.referrerOrigin && document.referrer) {
      try {
        var referrerUrl = new URL(document.referrer);
        if (referrerUrl.origin !== global.location.origin) {
          context.referrerOrigin = safeAttributionValue(referrerUrl.origin);
          changed = true;
        }
      } catch (error) {}
    }

    if (!context.capturedAt && Object.keys(context).length) {
      context.capturedAt = Date.now();
      changed = true;
    }
    if (changed) {
      var serialized = JSON.stringify(context);
      storageWrite(sessionStore, ATTRIBUTION_STORAGE_KEY, serialized);
      storageWrite(localStore, ATTRIBUTION_STORAGE_KEY, serialized);
    }
    return context;
  }

  function readCompletionPayload() {
    var sessionStore = null;
    var localStore = null;
    try { sessionStore = global.sessionStorage; } catch (error) {}
    try { localStore = global.localStorage; } catch (error) {}
    var sessionRecord = storageRead(sessionStore, COMPLETION_STORAGE_KEY);
    var localRecord = storageRead(localStore, COMPLETION_STORAGE_KEY);
    var raw = sessionRecord.value || localRecord.value;
    if (!raw) return null;
    try {
      var payload = JSON.parse(raw);
      return payload && typeof payload === 'object' ? payload : null;
    } catch (error) {
      return null;
    }
  }

  function saveCompletionPayload(payload) {
    var serialized = JSON.stringify(payload || {});
    var sessionStore = null;
    var localStore = null;
    try { sessionStore = global.sessionStorage; } catch (error) {}
    try { localStore = global.localStorage; } catch (error) {}
    var saved = false;
    saved = storageWrite(sessionStore, COMPLETION_STORAGE_KEY, serialized) || saved;
    saved = storageWrite(localStore, COMPLETION_STORAGE_KEY, serialized) || saved;
    return saved;
  }

  function buildCompletionUrl(payload) {
    var params = new URLSearchParams();
    ['applicationId', 'courseId', 'courseCode', 'courseTitle', 'courseType'].forEach(function (key) {
      var value = safeAttributionValue(payload && payload[key]);
      if (value) params.set(key, value);
    });
    var query = params.toString();
    return '/application-complete/' + (query ? '?' + query : '');
  }

  function ensureGoogleTagManager() {
    // GTM is installed in the public HTML head snippets.
  }

  function ensureGoogleTag() {
    ensureGoogleTagManager();
  }

  var NAV_HTML = ''
    + '<nav class="nav" id="nav">'
    + '  <div class="container">'
    + '    <a class="brand" href="/" aria-label="AI 리더스 협회 홈">'
    + '      <img class="logo logo-white" src="/images/logo-white.png" alt="AI 리더스 협회"/>'
    + '      <img class="logo logo-ink" src="/images/logo-ink.png" alt="AI 리더스 협회"/>'
    + '    </a>'
    + '    <div class="menu" role="navigation" aria-label="주요 메뉴">'
    + '      <a class="nav-link" data-nav-key="about" href="/about/">소개</a>'
    + '      <div class="nav-item" data-nav-key="courses">'
    + '        <a class="nav-link" href="/course-free/">전체 강연<svg class="ar" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>'
    + '        <div class="dropdown">'
    + '          <a href="/course-free/">무료 강연</a>'
    + '          <a href="/course-paid/">유료 강연</a>'
    + '          <a href="/course-corporate/">기업 강연</a>'
    + '        </div>'
    + '      </div>'
    + '      <a class="nav-link" data-nav-key="reviews" href="/reviews/">강연 후기</a>'
    + '      <a class="nav-link" data-nav-key="faq" href="/faq/">FAQ</a>'
    + '      <div class="nav-item" data-nav-key="contact">'
    + '        <a class="nav-link" href="/corporate/">문의·지원<svg class="ar" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></a>'
    + '        <div class="dropdown">'
    + '          <a href="/corporate/">출강 문의</a>'
    + '          <a href="/instructor-apply/">강사 지원</a>'
    + '        </div>'
    + '      </div>'
    + '    </div>'
    + '    <div class="nav-cta"><a class="btn" href="/corporate/">출강 문의</a></div>'
    + '    <button class="hamb" id="hamb" aria-label="메뉴 열기" aria-expanded="false">'
    + '      <svg fill="none" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>'
    + '    </button>'
    + '  </div>'
    + '</nav>';

  var FOOTER_HTML = ''
    + '<footer class="footer site-footer">'
    + '  <div class="container">'
    + '    <div class="ft-wrap">'
    + '      <div class="ft-left">'
    + '        <div class="ft-logo"><img class="logo" src="/images/logo-ink.png" alt="AI 리더스 협회"/></div>'
    + '        <div class="ft-social">'
    + '          <a href="#" class="sbtn" aria-label="카카오톡"><b>TALK</b></a>'
    + '          <a href="https://www.youtube.com/@AI%EB%A6%AC%EB%8D%94%EC%8A%A4%ED%98%91%ED%9A%8C" target="_blank" rel="noopener" class="sbtn" aria-label="유튜브"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.77-1.77C19.27 5 12 5 12 5s-7.27 0-8.83.53A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.77 1.77C4.73 19 12 19 12 19s7.27 0 8.83-.53A2.5 2.5 0 0 0 22.6 16.7C23 15.2 23 12 23 12zM9.8 15.3V8.7l6.2 3.3-6.2 3.3z"/></svg></a>'
    + '          <a href="https://www.instagram.com/ai_leaders_/" target="_blank" rel="noopener" class="sbtn" aria-label="인스타그램"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none"/></svg></a>'
    + '          <a href="https://cafe.naver.com/newaileaders" target="_blank" rel="noopener" class="sbtn" aria-label="네이버 카페 새 창에서 열기"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5.5" fill="currentColor"/><g transform="translate(6.666667 6.666667) scale(.4444444)"><path fill="#ffffff" d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845Z"/></g></svg></a>'
    + '        </div>'
    + '      </div>'
    + '      <div class="ft-right">'
    + '        <p class="ft-biz">AI리더스협회<span class="bar">|</span>주소 : 영등포구 선유로70 우리벤처타운2<span class="bar">|</span>대표 : 김영주<span class="bar">|</span>사업자등록번호 : 352-88-01460<span class="bar">|</span>TEL : 070-8806-6892</p>'
    + '        <p class="ft-copy">COPYRIGHT ⓒ AI리더스협회 ALL RIGHTS RESERVED</p>'
    + '        <p class="ft-links">'
    + '          <a href="/admin-dashboard/" data-admin-access>관리자 페이지</a>'
    + "          <a href=\"#privacyModal\" onclick=\"if(window.openLegal){openLegal('privacyModal');} return false;\">개인정보처리방침</a>"
    + "          <a href=\"#termsModal\" onclick=\"if(window.openLegal){openLegal('termsModal');} return false;\">이용약관</a>"
    + '        </p>'
    + '      </div>'
    + '    </div>'
    + '  </div>'
    + '</footer>';

  function openAdminAccess(event) {
    if (event) event.preventDefault();
    global.location.assign(ADMIN_ACCESS_PATH);
  }

  function bindAdminAccessLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-admin-access]'), function (link) {
      if (link.getAttribute('data-admin-access-bound') === 'true') return;
      link.setAttribute('data-admin-access-bound', 'true');
      link.addEventListener('click', openAdminAccess);
    });
  }

  function ensureAdminAccessUi() {
    bindAdminAccessLinks();
  }

  function currentRoute() {
    var path = global.location.pathname.toLowerCase().replace(/\/+$/, '');
    var route = (path.split('/').pop() || 'index').replace(/\.html$/, '');
    return route || 'index';
  }

  function activeKey() {
    var route = currentRoute();
    if (route === 'about' || route === 'instructor') return 'about';
    if (/^course-/.test(route) || route === 'course-detail') return 'courses';
    if (route === 'reviews') return 'reviews';
    if (route === 'faq') return 'faq';
    if (route === 'corporate' || route === 'instructor-apply') return 'contact';
    return '';
  }

  function markActiveNav() {
    var nav = document.getElementById('nav');
    var key = activeKey();
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll('.nav-link.active'), function (link) {
      link.classList.remove('active');
    });
    if (!key) return;
    var target = nav.querySelector('[data-nav-key="' + key + '"]');
    if (!target) return;
    var link = target.classList.contains('nav-link') ? target : target.querySelector('.nav-link');
    if (link) link.classList.add('active');
  }

  function renderNav() {
    var mount = document.querySelector('[data-site-nav]');
    if (!mount || document.getElementById('nav')) {
      markActiveNav();
      return;
    }
    mount.outerHTML = NAV_HTML;
    markActiveNav();
  }

  function renderFooter() {
    var mount = document.querySelector('[data-site-footer]');
    if (!mount || document.querySelector('footer.site-footer')) return;
    mount.outerHTML = FOOTER_HTML;
  }

  function renderAll() {
    ensureGoogleTagManager();
    captureAttributionContext();
    renderNav();
    renderFooter();
    ensureAdminAccessUi();
  }

  global.AiLeadersLayout = {
    renderNav: renderNav,
    renderFooter: renderFooter,
    ensureGoogleTagManager: ensureGoogleTagManager,
    ensureGoogleTag: ensureGoogleTag,
    renderAll: renderAll,
    getAttributionContext: captureAttributionContext,
    readCompletionPayload: readCompletionPayload,
    saveCompletionPayload: saveCompletionPayload,
    buildCompletionUrl: buildCompletionUrl,
    markActiveNav: markActiveNav,
    openAdminAccess: openAdminAccess
  };

  renderAll();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderAll);
  }
})(window);
