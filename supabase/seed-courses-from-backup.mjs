import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const CONFIG = {
  url: 'https://wdghlbswlvwlmkywiibr.supabase.co',
  publishableKey: 'sb_publishable_J4Cc9bBwxTtmqf9qSxle-g_K_r1vdFT'
};

const REGION_MAP = {
  강남: '서울',
  서초: '서울',
  종로: '서울',
  송파: '서울',
  마포: '서울',
  영등포: '서울',
  용산: '서울',
  서울: '서울',
  경기: '경기',
  인천: '인천',
  부산: '부산',
  대구: '대구',
  광주: '광주',
  대전: '대전',
  울산: '울산',
  세종: '세종',
  강원: '강원',
  충북: '충북',
  충남: '충남',
  전북: '전북',
  전남: '전남',
  경북: '경북',
  경남: '경남',
  제주: '제주'
};

function inferRegion(course) {
  const raw = String(course.region || course.location || course.address || '').trim();
  if (!raw) return null;
  if (REGION_MAP[raw]) return REGION_MAP[raw];
  for (const [key, value] of Object.entries(REGION_MAP)) {
    if (raw.includes(key)) return value;
  }
  return null;
}

function paymentPreset(course) {
  const bank = String(course.paymentBank || '').trim();
  const account = String(course.paymentAccount || '').trim();
  const holder = String(course.paymentHolder || '').trim();
  if (bank === '국민은행' && account === '503202-01-218260' && holder === '이이슬') return 'lee';
  if (bank === '농축협' && account === '356-1345-1984-93' && holder === '문건우') return 'moon';
  return null;
}

function toRow(course) {
  return {
    id: course.id,
    type: course.type === 'paid' ? 'paid' : 'free',
    status: course.status || 'open',
    title: course.title || '',
    category: course.category || null,
    region: inferRegion(course),
    location: course.location || null,
    address: course.address || null,
    event_date: course.eventDate || null,
    event_time: course.eventTime || null,
    apply_start_at: course.applyStartAt || null,
    apply_end_at: course.applyEndAt || null,
    instructor: course.instructor || null,
    thumb_img: course.thumbImg || null,
    detail_img: course.detailImg || null,
    applicant_count: Number.isFinite(Number(course.applicantCount)) ? Number(course.applicantCount) : 0,
    price: Number.isFinite(Number(course.price)) ? Number(course.price) : 0,
    price_orig: Number.isFinite(Number(course.priceOrig)) ? Number(course.priceOrig) : 0,
    payment_account_preset: paymentPreset(course),
    payment_bank: course.paymentBank || null,
    payment_account: course.paymentAccount || null,
    payment_holder: course.paymentHolder || null,
    badges: Array.isArray(course.badges) ? course.badges : [],
    summary: course.summary || null
  };
}

global.window = {};
require('../backup/20260708_133552_before_disable_fallback_courses/courses-store.js');

const defaults = Array.isArray(global.window?.CourseStore?.defaults)
  ? global.window.CourseStore.defaults
  : [];

const rows = defaults.map(toRow);

if (!rows.length) {
  throw new Error('백업 강연 데이터를 찾지 못했습니다.');
}

const response = await fetch(`${CONFIG.url}/rest/v1/courses?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: CONFIG.publishableKey,
    Authorization: `Bearer ${CONFIG.publishableKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=representation',
    'Content-Profile': 'public'
  },
  body: JSON.stringify(rows)
});

const text = await response.text();
if (!response.ok) {
  throw new Error(`seed failed: ${response.status} ${text}`);
}

console.log(JSON.stringify({
  inserted: rows.length,
  responseCount: JSON.parse(text).length
}, null, 2));
