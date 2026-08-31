(function (global) {
  'use strict';

  var SUPABASE_HOST = 'wdghlbswlvwlmkywiibr.supabase.co';
  var PUBLIC_PREFIX = '/storage/v1/object/public/';
  var PROXY_PREFIX = '/img/';

  // 여기 적힌 것은 저장소에 미리 받아둔 파일이라 중계보다도 빠릅니다.
  var PATH_OVERRIDES = Object.freeze({
    '/storage/v1/object/public/instructor-portfolio/hero/2026/07/file-mrctrjml-wjb3nkev.jpg': '/images/managed/home-hero-file-mrctrjml-wjb3nkev.webp',
    '/storage/v1/object/public/instructor-portfolio/hero/2026/07/file-mru5xv6t-7ezfoy2j.jpg': '/images/managed/home-hero-file-mru5xv6t-7ezfoy2j.webp',
    '/storage/v1/object/public/site-assets/hero/2026/07/file-mru7t4pu-978044sn.jpg': '/images/managed/home-hero-file-mru7t4pu-978044sn.webp',
    '/storage/v1/object/public/site-assets/hero/2026/07/file-mru9rcs1-ftxh78dx.jpg': '/images/managed/home-hero-file-mru9rcs1-ftxh78dx.webp',
    '/storage/v1/object/public/site-assets/hero/2026/07/file-mrua0xpl-tur7dmwm.jpg': '/images/managed/home-hero-file-mrua0xpl-tur7dmwm.webp'
  });

  function resolve(value) {
    var raw = typeof value === 'string' ? value.trim() : '';
    if (!raw) return '';

    try {
      var url = new URL(raw, global.location.origin);
      if (url.hostname !== SUPABASE_HOST) return raw;

      var override = PATH_OVERRIDES[url.pathname];
      if (override) return override;

      // 나머지 공개 파일은 우리 도메인의 중계를 거칩니다.
      //  - 방문자 소스에 Supabase 주소가 안 남습니다
      //  - Cloudflare 가 캐시해 대신 내려주어 전송량이 줄어듭니다
      // 중계는 functions/img/[[path]].js 에 있습니다.
      if (url.pathname.indexOf(PUBLIC_PREFIX) === 0) {
        return PROXY_PREFIX + url.pathname.slice(PUBLIC_PREFIX.length) + (url.search || '');
      }

      return raw;
    } catch (error) {
      return raw;
    }
  }

  global.AiLeadersPublicMedia = {
    resolve: resolve
  };
})(window);
