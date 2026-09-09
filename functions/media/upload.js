/**
 * 홈페이지 · 강사지원 첨부 파일 받는 창구
 *
 *   POST /media/upload
 *   X-Media-Ext  : pdf | doc | docx | ppt | pptx
 *   Content-Type : 그 형식에 맞는 것
 *   본문         : 파일 그대로
 *
 *   답 : { "ok": true, "key": "applications/2026/09/file-....pdf",
 *          "url": "https://kedp-admin-console.pages.dev/img/instructor-portfolio/applications/..." }
 *
 * 로그인 없이 쓰는 창구입니다. 지원 폼에서 부릅니다.
 * 그래서 다음을 코드로 막습니다.
 *   - 저장 위치를 부르는 쪽이 못 정합니다. 서버가 applications/연도/월/무작위이름 으로 정합니다
 *     (그래서 남의 파일을 덮어쓰거나 다른 폴더에 넣을 수 없습니다)
 *   - 형식은 문서 5가지만
 *   - 크기는 10MB 까지
 *   - 우리 홈페이지에서 온 요청만 (Origin 확인)
 *
 * 이 제한들은 지금 Supabase 에 걸려 있는 것과 같은 수준입니다.
 * MEDIA 바인딩이 없으면 503 을 돌려주고, 부르는 쪽이 Supabase 로 되돌아갑니다.
 */

const BUCKET_ROOT = 'instructor-portfolio';
const FOLDER = 'applications';
const MAX_BYTES = 10 * 1024 * 1024;

// 관리자 페이지 주소. 구글 시트에 적히는 링크가 여기를 가리킵니다.
// 나중에 관리자 전용 도메인이 생기면 이 한 줄만 바꾸면 됩니다.
const ADMIN_ORIGIN = 'https://kedp-admin-console.pages.dev';

const TYPES = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation']
};

const ALLOWED_ORIGINS = [
  'https://newaileaders.co.kr',
  'https://www.newaileaders.co.kr',
  'https://ai-leaders-site.pages.dev'
];

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

function randomName() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  let tail = '';
  for (let i = 0; i < bytes.length; i += 1) tail += bytes[i].toString(36).padStart(2, '0');
  return 'file-' + Date.now().toString(36) + '-' + tail;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const bucket = env && env.MEDIA ? env.MEDIA : null;
  if (!bucket) return json({ ok: false, error: 'R2 저장소가 연결되어 있지 않습니다.' }, 503);

  const origin = request.headers.get('Origin') || '';
  if (origin && ALLOWED_ORIGINS.indexOf(origin) < 0) {
    return json({ ok: false, error: '허용되지 않은 요청입니다.' }, 403);
  }

  const ext = String(request.headers.get('X-Media-Ext') || '').trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(TYPES, ext)) {
    return json({ ok: false, error: 'PDF, DOC, DOCX, PPT, PPTX 파일만 첨부할 수 있습니다.' }, 415);
  }

  const type = String(request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (TYPES[ext].indexOf(type) < 0) {
    return json({ ok: false, error: '파일 형식이 확장자와 맞지 않습니다.' }, 415);
  }

  if (Number(request.headers.get('Content-Length') || 0) > MAX_BYTES) {
    return json({ ok: false, error: '10MB를 초과하는 파일은 첨부할 수 없습니다. 링크로 제출해 주세요.' }, 413);
  }

  let body;
  try {
    body = await request.arrayBuffer();
  } catch (error) {
    return json({ ok: false, error: '파일을 받지 못했습니다.' }, 400);
  }
  if (!body.byteLength) return json({ ok: false, error: '빈 파일입니다.' }, 400);
  if (body.byteLength > MAX_BYTES) {
    return json({ ok: false, error: '10MB를 초과하는 파일은 첨부할 수 없습니다. 링크로 제출해 주세요.' }, 413);
  }

  const now = new Date();
  const path = [
    FOLDER,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    randomName() + '.' + ext
  ].join('/');

  try {
    await bucket.put(BUCKET_ROOT + '/' + path, body, { httpMetadata: { contentType: type } });
  } catch (error) {
    return json({ ok: false, error: '저장소에 넣지 못했습니다.' }, 502);
  }

  return json({
    ok: true,
    key: path,
    url: ADMIN_ORIGIN + '/img/' + BUCKET_ROOT + '/' + path,
    bytes: body.byteLength
  });
}
