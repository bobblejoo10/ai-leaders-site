-- AI Leaders content-management extension
-- Admin login is intentionally excluded for now, so these policies mirror the current permissive project setup.

alter table public.courses
  add column if not exists application_notice jsonb not null default '{}'::jsonb;

create table if not exists public.site_banners (
  id text primary key,
  placement text not null default 'home_hero',
  title text,
  subtitle text,
  eyebrow text,
  desktop_image text,
  mobile_image text,
  video_url text,
  primary_label text,
  primary_url text,
  secondary_label text,
  secondary_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.instructors (
  id text primary key,
  slug text not null unique,
  name text not null,
  role text,
  label text,
  photo text,
  landing_summary text,
  about_summary text,
  career_items jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_options (
  id text primary key,
  option_group text not null,
  label text not null,
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_banners_placement_order on public.site_banners(placement, is_active, sort_order);
create index if not exists idx_instructors_order on public.instructors(is_active, sort_order);
create index if not exists idx_form_options_group_order on public.form_options(option_group, is_active, sort_order);

grant select, insert, update, delete on table public.site_banners to anon, authenticated;
grant select, insert, update, delete on table public.instructors to anon, authenticated;
grant select, insert, update, delete on table public.form_options to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as '
begin
  new.updated_at = now();
  return new;
end;
';

drop trigger if exists trg_site_banners_set_updated_at on public.site_banners;
create trigger trg_site_banners_set_updated_at
before update on public.site_banners
for each row
execute function public.set_updated_at();

drop trigger if exists trg_instructors_set_updated_at on public.instructors;
create trigger trg_instructors_set_updated_at
before update on public.instructors
for each row
execute function public.set_updated_at();

drop trigger if exists trg_form_options_set_updated_at on public.form_options;
create trigger trg_form_options_set_updated_at
before update on public.form_options
for each row
execute function public.set_updated_at();

alter table public.site_banners enable row level security;
alter table public.instructors enable row level security;
alter table public.form_options enable row level security;

drop policy if exists site_banners_select_public on public.site_banners;
create policy site_banners_select_public on public.site_banners for select to anon, authenticated using (true);
drop policy if exists site_banners_insert_public on public.site_banners;
create policy site_banners_insert_public on public.site_banners for insert to anon, authenticated with check (true);
drop policy if exists site_banners_update_public on public.site_banners;
create policy site_banners_update_public on public.site_banners for update to anon, authenticated using (true) with check (true);
drop policy if exists site_banners_delete_public on public.site_banners;
create policy site_banners_delete_public on public.site_banners for delete to anon, authenticated using (true);

drop policy if exists instructors_select_public on public.instructors;
create policy instructors_select_public on public.instructors for select to anon, authenticated using (true);
drop policy if exists instructors_insert_public on public.instructors;
create policy instructors_insert_public on public.instructors for insert to anon, authenticated with check (true);
drop policy if exists instructors_update_public on public.instructors;
create policy instructors_update_public on public.instructors for update to anon, authenticated using (true) with check (true);
drop policy if exists instructors_delete_public on public.instructors;
create policy instructors_delete_public on public.instructors for delete to anon, authenticated using (true);

drop policy if exists form_options_select_public on public.form_options;
create policy form_options_select_public on public.form_options for select to anon, authenticated using (true);
drop policy if exists form_options_insert_public on public.form_options;
create policy form_options_insert_public on public.form_options for insert to anon, authenticated with check (true);
drop policy if exists form_options_update_public on public.form_options;
create policy form_options_update_public on public.form_options for update to anon, authenticated using (true) with check (true);
drop policy if exists form_options_delete_public on public.form_options;
create policy form_options_delete_public on public.form_options for delete to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists storage_select_site_assets on storage.objects;
create policy storage_select_site_assets on storage.objects for select to anon, authenticated using (bucket_id = 'site-assets');
drop policy if exists storage_insert_site_assets on storage.objects;
create policy storage_insert_site_assets on storage.objects for insert to anon, authenticated with check (bucket_id = 'site-assets');
drop policy if exists storage_update_site_assets on storage.objects;
create policy storage_update_site_assets on storage.objects for update to anon, authenticated using (bucket_id = 'site-assets') with check (bucket_id = 'site-assets');
drop policy if exists storage_delete_site_assets on storage.objects;
create policy storage_delete_site_assets on storage.objects for delete to anon, authenticated using (bucket_id = 'site-assets');

insert into public.site_banners (id, placement, title, subtitle, primary_label, primary_url, secondary_label, secondary_url, sort_order, is_active)
values
  ('home-hero-default', 'home_hero', 'AI로 세상을 리드한다!', '미래를 준비하는 사람들을 위한 실전 AI 클래스', '무료 특강 신청', 'course-free.html', '유료 특강 신청', 'course-paid.html', 1, true)
on conflict (id) do update set
  placement = excluded.placement,
  title = excluded.title,
  subtitle = excluded.subtitle,
  primary_label = excluded.primary_label,
  primary_url = excluded.primary_url,
  secondary_label = excluded.secondary_label,
  secondary_url = excluded.secondary_url,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.instructors (id, slug, name, role, label, photo, landing_summary, about_summary, career_items, sort_order, is_active)
values
  (
    'aion',
    'aion',
    '아이온',
    'AI 대표강사',
    '대표 강사',
    '../images/아이온강사.png.jpg',
    '생성형 AI 이미지, 영상, 숏폼 제작까지 직접 결과물을 만들며 배우는 실무형 교육을 진행합니다.',
    'AI 도구를 처음 접하는 분들도 직접 결과물을 만들 수 있도록 이미지·영상·콘텐츠 제작 실습을 중심으로 강의합니다.',
    '["現 디어데이클래스 AI 대표강사","前 글로벌AI교육협회 전문강사 및 AI 강사 자격 보유","ChatGPT·Midjourney 등 생성형 AI 실무 교육 다수 진행","AI 이미지·영상 제작 및 숏폼 콘텐츠 제작 강의 운영","AI 활용 SNS 마케팅 및 콘텐츠 크리에이터 교육 진행","RED DOT·DYSON·SPARK 디자인 어워즈 수상 경력 보유"]'::jsonb,
    1,
    true
  ),
  (
    'moon',
    'moon',
    '문건우',
    'AI 브랜드·콘텐츠 전략 강사',
    '대표 강사',
    '../images/AI문건우_7.png',
    '브랜드 디렉터 경험을 바탕으로 생성형 AI를 활용한 브랜드 메시지, 콘텐츠 전략, 마케팅 문안 실습을 이끕니다.',
    'AI 도구로 브랜드 메시지와 콘텐츠 전략을 빠르게 설계하는 실무 강의를 진행하며, 브랜드 디렉터로 쌓은 전략 기획 경험을 함께 전달합니다.',
    '["現 AI리더스협회 AI 브랜드·콘텐츠 전략 강사","現 브랜드 마케팅 컴퍼니 ‘탈론’ 대표 / 브랜드 디렉터","ChatGPT·생성형 AI 기반 브랜드 메시지 및 콘텐츠 기획 교육 진행","AI 활용 SNS·유튜브 콘텐츠 전략 및 마케팅 문안 실습 강의","국내 주요 기업·브랜드 마케팅 컨설팅 및 브랜드 프로젝트 수행","네이버 인플루언서 코치 및 이미지메이킹 어드바이저 경력","구독자 6만 명 이상 글로벌 채널 운영 경험","SUNY Albany Business Administration / Marketing 전공","American MENSA 정회원"]'::jsonb,
    2,
    true
  )
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  role = excluded.role,
  label = excluded.label,
  photo = excluded.photo,
  landing_summary = excluded.landing_summary,
  about_summary = excluded.about_summary,
  career_items = excluded.career_items,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.form_options (id, option_group, label, value, sort_order, is_active)
values
  ('corporate-region-seoul', 'corporate_region', '서울특별시', '서울특별시', 1, true),
  ('corporate-region-busan', 'corporate_region', '부산광역시', '부산광역시', 2, true),
  ('corporate-region-daegu', 'corporate_region', '대구광역시', '대구광역시', 3, true),
  ('corporate-region-incheon', 'corporate_region', '인천광역시', '인천광역시', 4, true),
  ('corporate-region-gwangju', 'corporate_region', '광주광역시', '광주광역시', 5, true),
  ('corporate-region-daejeon', 'corporate_region', '대전광역시', '대전광역시', 6, true),
  ('corporate-region-ulsan', 'corporate_region', '울산광역시', '울산광역시', 7, true),
  ('corporate-region-sejong', 'corporate_region', '세종특별자치시', '세종특별자치시', 8, true),
  ('corporate-region-gyeonggi', 'corporate_region', '경기도', '경기도', 9, true),
  ('corporate-region-gangwon', 'corporate_region', '강원특별자치도', '강원특별자치도', 10, true),
  ('corporate-region-chungbuk', 'corporate_region', '충청북도', '충청북도', 11, true),
  ('corporate-region-chungnam', 'corporate_region', '충청남도', '충청남도', 12, true),
  ('corporate-region-jeonbuk', 'corporate_region', '전북특별자치도', '전북특별자치도', 13, true),
  ('corporate-region-jeonnam', 'corporate_region', '전라남도', '전라남도', 14, true),
  ('corporate-region-gyeongbuk', 'corporate_region', '경상북도', '경상북도', 15, true),
  ('corporate-region-gyeongnam', 'corporate_region', '경상남도', '경상남도', 16, true),
  ('corporate-region-jeju', 'corporate_region', '제주특별자치도', '제주특별자치도', 17, true),
  ('corporate-instructor-aion', 'corporate_preferred_instructor', '아이온 강사', '아이온 강사', 1, true),
  ('corporate-instructor-moon', 'corporate_preferred_instructor', '문건우 강사', '문건우 강사', 2, true),
  ('corporate-instructor-any', 'corporate_preferred_instructor', '상관없음', '상관없음', 3, true),
  ('corporate-level-new', 'corporate_level', '전혀 모름 (완전 입문)', '전혀 모름 (완전 입문)', 1, true),
  ('corporate-level-basic', 'corporate_level', '용어는 아는 정도', '용어는 아는 정도', 2, true),
  ('corporate-level-used', 'corporate_level', '가끔 써봄', '가끔 써봄', 3, true),
  ('corporate-level-active', 'corporate_level', '어느 정도 활용 중', '어느 정도 활용 중', 4, true),
  ('instructor-region-metro', 'instructor_region', '수도권 (서울·경기·인천)', '수도권 (서울·경기·인천)', 1, true),
  ('instructor-region-chungcheong', 'instructor_region', '충청권', '충청권', 2, true),
  ('instructor-region-yeongnam', 'instructor_region', '영남권', '영남권', 3, true),
  ('instructor-region-honam', 'instructor_region', '호남권', '호남권', 4, true),
  ('instructor-region-gangwon-jeju', 'instructor_region', '강원·제주', '강원·제주', 5, true),
  ('instructor-region-online', 'instructor_region', '온라인 전용', '온라인 전용', 6, true),
  ('instructor-region-all', 'instructor_region', '전국 가능', '전국 가능', 7, true),
  ('instructor-career-none', 'instructor_career', '없음 (현장 실무 경험 위주)', '없음 (현장 실무 경험 위주)', 1, true),
  ('instructor-career-under-1', 'instructor_career', '1년 미만', '1년 미만', 2, true),
  ('instructor-career-1-3', 'instructor_career', '1–3년', '1–3년', 3, true),
  ('instructor-career-3-5', 'instructor_career', '3–5년', '3–5년', 4, true),
  ('instructor-career-over-5', 'instructor_career', '5년 이상', '5년 이상', 5, true),
  ('instructor-mode-offline', 'instructor_mode', '오프라인', '오프라인', 1, true),
  ('instructor-mode-online', 'instructor_mode', '온라인 라이브', '온라인 라이브', 2, true),
  ('instructor-mode-both', 'instructor_mode', '둘 다 가능', '둘 다 가능', 3, true),
  ('instructor-field-chatgpt', 'instructor_field', 'ChatGPT 실무', 'chatgpt', 1, true),
  ('instructor-field-claude', 'instructor_field', 'Claude 활용', 'claude', 2, true),
  ('instructor-field-gemini', 'instructor_field', 'Gemini', 'gemini', 3, true),
  ('instructor-field-marketing', 'instructor_field', 'AI 마케팅', 'marketing', 4, true),
  ('instructor-field-auto', 'instructor_field', '업무 자동화', 'auto', 5, true),
  ('instructor-field-image', 'instructor_field', 'AI 이미지·영상', 'image', 6, true),
  ('instructor-field-data', 'instructor_field', '데이터 분석', 'data', 7, true),
  ('instructor-field-dev', 'instructor_field', '개발·코딩', 'dev', 8, true),
  ('instructor-field-etc', 'instructor_field', '기타', 'etc', 9, true)
on conflict (id) do update set
  option_group = excluded.option_group,
  label = excluded.label,
  value = excluded.value,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;
