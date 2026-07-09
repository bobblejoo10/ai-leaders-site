-- AI Leaders initial Supabase schema
-- Note: admin authentication is not wired yet, so policies below remain intentionally permissive.

create table if not exists public.courses (
  id text primary key,
  type text not null check (type in ('free', 'paid')),
  status text not null default 'open' check (status in ('open', 'closed', 'hidden')),
  title text not null,
  category text,
  region text,
  location text,
  address text,
  event_date date,
  event_time text,
  apply_start_at date,
  apply_end_at date,
  instructor text,
  thumb_img text,
  detail_img text,
  applicant_count integer not null default 0,
  price integer not null default 0,
  price_orig integer not null default 0,
  payment_account_preset text,
  payment_bank text,
  payment_account text,
  payment_holder text,
  badges text[] not null default '{}',
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lecture_applications (
  id text primary key,
  course_id text references public.courses(id) on delete set null,
  course_title text,
  course_type text not null check (course_type in ('free', 'paid')),
  name text,
  phone text,
  email text,
  age text,
  payment_method text,
  payment_bank text,
  payment_account text,
  payment_holder text,
  payment_account_label text,
  depositor_name text,
  cash_receipt_requested boolean not null default false,
  message text,
  source text,
  applicant_count_adjusted boolean not null default true,
  submitted_at timestamptz not null default now()
);

create table if not exists public.corporate_inquiries (
  id text primary key,
  company text,
  name text,
  phone text,
  email text,
  headcount text,
  preferred_date text,
  location text,
  region text,
  preferred_instructor text,
  level text,
  topics jsonb not null default '[]'::jsonb,
  message text,
  source text,
  submitted_at timestamptz not null default now()
);

create table if not exists public.instructor_applications (
  id text primary key,
  name text,
  phone text,
  email text,
  region text,
  career text,
  mode text,
  fields jsonb not null default '[]'::jsonb,
  portfolio text,
  portfolio_file_path text,
  portfolio_file_name text,
  portfolio_file_type text,
  portfolio_file_size bigint not null default 0,
  portfolio_file_uploaded_at timestamptz,
  portfolio_file_public_url text,
  intro text,
  source text,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_courses_type_status on public.courses(type, status);
create index if not exists idx_courses_event_date on public.courses(event_date);
create index if not exists idx_lecture_applications_submitted_at on public.lecture_applications(submitted_at desc);
create index if not exists idx_corporate_inquiries_submitted_at on public.corporate_inquiries(submitted_at desc);
create index if not exists idx_instructor_applications_submitted_at on public.instructor_applications(submitted_at desc);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.courses to anon, authenticated;
grant select, insert, update, delete on table public.lecture_applications to anon, authenticated;
grant select, insert, update, delete on table public.corporate_inquiries to anon, authenticated;
grant select, insert, update, delete on table public.instructor_applications to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_courses_set_updated_at on public.courses;
create trigger trg_courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

alter table public.courses enable row level security;
alter table public.lecture_applications enable row level security;
alter table public.corporate_inquiries enable row level security;
alter table public.instructor_applications enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_select_public') then
    create policy courses_select_public on public.courses for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_insert_public') then
    create policy courses_insert_public on public.courses for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_update_public') then
    create policy courses_update_public on public.courses for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'courses_delete_public') then
    create policy courses_delete_public on public.courses for delete to anon, authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lecture_applications' and policyname = 'lecture_applications_select_public') then
    create policy lecture_applications_select_public on public.lecture_applications for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lecture_applications' and policyname = 'lecture_applications_insert_public') then
    create policy lecture_applications_insert_public on public.lecture_applications for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lecture_applications' and policyname = 'lecture_applications_update_public') then
    create policy lecture_applications_update_public on public.lecture_applications for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'lecture_applications' and policyname = 'lecture_applications_delete_public') then
    create policy lecture_applications_delete_public on public.lecture_applications for delete to anon, authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'corporate_inquiries' and policyname = 'corporate_inquiries_select_public') then
    create policy corporate_inquiries_select_public on public.corporate_inquiries for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'corporate_inquiries' and policyname = 'corporate_inquiries_insert_public') then
    create policy corporate_inquiries_insert_public on public.corporate_inquiries for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'corporate_inquiries' and policyname = 'corporate_inquiries_update_public') then
    create policy corporate_inquiries_update_public on public.corporate_inquiries for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'corporate_inquiries' and policyname = 'corporate_inquiries_delete_public') then
    create policy corporate_inquiries_delete_public on public.corporate_inquiries for delete to anon, authenticated using (true);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'instructor_applications' and policyname = 'instructor_applications_select_public') then
    create policy instructor_applications_select_public on public.instructor_applications for select to anon, authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'instructor_applications' and policyname = 'instructor_applications_insert_public') then
    create policy instructor_applications_insert_public on public.instructor_applications for insert to anon, authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'instructor_applications' and policyname = 'instructor_applications_update_public') then
    create policy instructor_applications_update_public on public.instructor_applications for update to anon, authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'instructor_applications' and policyname = 'instructor_applications_delete_public') then
    create policy instructor_applications_delete_public on public.instructor_applications for delete to anon, authenticated using (true);
  end if;
end
$$;

insert into storage.buckets (id, name, public)
values ('instructor-portfolio', 'instructor-portfolio', true)
on conflict (id) do update set public = excluded.public;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_select_instructor_portfolio') then
    create policy storage_select_instructor_portfolio on storage.objects for select to anon, authenticated using (bucket_id = 'instructor-portfolio');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_insert_instructor_portfolio') then
    create policy storage_insert_instructor_portfolio on storage.objects for insert to anon, authenticated with check (bucket_id = 'instructor-portfolio');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_update_instructor_portfolio') then
    create policy storage_update_instructor_portfolio on storage.objects for update to anon, authenticated using (bucket_id = 'instructor-portfolio') with check (bucket_id = 'instructor-portfolio');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'storage_delete_instructor_portfolio') then
    create policy storage_delete_instructor_portfolio on storage.objects for delete to anon, authenticated using (bucket_id = 'instructor-portfolio');
  end if;
end
$$;

insert into public.courses (id, type, status, title, category, region, location, address, event_date, event_time, apply_start_at, apply_end_at, instructor, thumb_img, detail_img, applicant_count, price, price_orig, payment_account_preset, payment_bank, payment_account, payment_holder, badges, summary)
values
  ('free-chatgpt-intro', 'free', 'open', '[강남] 제미나이 완벽 실무 활용법', '제미나이', null, '강남', 'AI리더스협회 강남 교육장', '2026-07-03', '10:00 - 13:00', '2026-06-01', '2026-07-03', 'AI리더스협회', '../images/제미나이썸네일.jpg', '../images/제미나이상세.jpg', 11, 0, 0, null, null, null, null, ARRAY['무료', '인기']::text[], '제미나이를 업무에 바로 적용하는 입문 실습 강연입니다.'),
  ('free-claude-report', 'free', 'open', '[서초] 클로드 실전 활용법', '클로드', null, '서초', 'AI리더스협회 서초 교육장', '2026-07-05', '19:00 - 21:00', '2026-06-01', '2026-07-05', 'AI리더스협회', '../images/클로드썸네일.jpg', '../images/클로드상세.jpg', 7, 0, 0, null, null, null, null, ARRAY['무료']::text[], '클로드를 활용해 문서와 보고서 작업을 빠르게 처리하는 강연입니다.'),
  ('free-canva-sns', 'free', 'open', '[종로] 제미나이 완벽 실무 활용법', '제미나이', null, '종로', 'AI리더스협회 종로 교육장', '2026-07-07', '14:00 - 16:30', '2026-06-01', '2026-07-07', 'AI리더스협회', '../images/ai종합썸네일.jpg', '../images/제미나이상세.jpg', 12, 0, 0, null, null, null, null, ARRAY['무료', '마감임박']::text[], 'AI 활용 흐름을 짧은 시간 안에 경험하는 현장형 무료 강연입니다.'),
  ('free-chatgpt-songpa', 'free', 'open', '[송파] 제미나이 완벽 실무 활용법', '제미나이', null, '송파', 'AI리더스협회 송파 교육장', '2026-07-10', '14:00 - 16:30', '2026-06-01', '2026-07-10', 'AI리더스협회', '../images/제미나이썸네일.jpg', '../images/제미나이상세.jpg', 9, 0, 0, null, null, null, null, ARRAY['무료']::text[], '제미나이를 실무 문서와 검색 업무에 적용하는 무료 강연입니다.'),
  ('free-gemini-adv', 'free', 'open', '[마포] 제미나이 완벽 실무 활용법', '제미나이', null, '마포', 'AI리더스협회 마포 교육장', '2026-07-15', '14:00 - 16:30', '2026-06-01', '2026-07-15', 'AI리더스협회', '../images/제미나이썸네일.jpg', '../images/제미나이상세2.jpg', 6, 0, 0, null, null, null, null, ARRAY['무료']::text[], 'AI 입문자가 따라오기 쉬운 제미나이 실무 활용 강연입니다.'),
  ('free-claude-adv', 'free', 'open', '[영등포] 클로드 실전 활용법', '클로드', null, '영등포', 'AI리더스협회 영등포 교육장', '2026-07-19', '19:00 - 21:00', '2026-06-01', '2026-07-19', 'AI리더스협회', '../images/클로드썸네일.jpg', '../images/클로드상세.jpg', 4, 0, 0, null, null, null, null, ARRAY['무료']::text[], '클로드의 문서 이해 능력을 실습으로 익히는 무료 강연입니다.'),
  ('free-ai-adv', 'free', 'open', '[용산] 제미나이 완벽 실무 활용법', '제미나이', null, '용산', 'AI리더스협회 용산 교육장', '2026-07-23', '14:00 - 16:30', '2026-06-01', '2026-07-23', 'AI리더스협회', '../images/ai종합썸네일.jpg', '../images/제미나이상세.jpg', 1, 0, 0, null, null, null, null, ARRAY['무료']::text[], '기초부터 실전까지 AI 활용 흐름을 익히는 무료 강연입니다.'),
  ('paid-prompt-master', 'paid', 'closed', 'AI 왕초보 탈출 원데이 클래스', 'AI 입문', null, '영등포', 'AI리더스협회 영등포 교육장', '2026-06-13', '10:00 - 16:00', '2026-05-01', '2026-06-12', 'AI리더스협회', '../images/유료강연_직사각형썸네일_선착순마감.jpg', '../images/유료강연상세.png', 8, 300000, 380000, 'lee', '국민은행', '503202-01-218260', '이이슬', ARRAY['유료', '조기마감']::text[], 'AI를 처음 시작하는 분을 위한 하루 집중 실습 강연입니다.'),
  ('paid-ai-marketing', 'paid', 'open', 'AI 왕초보 탈출 원데이 클래스', 'AI 입문', null, '영등포', 'AI리더스협회 영등포 교육장', '2026-07-18', '10:00 - 16:00', '2026-06-15', '2026-07-17', 'AI리더스협회', '../images/유료강연_직사각형썸네일.jpg', '../images/유료강연상세.png', 6, 300000, 380000, 'lee', '국민은행', '503202-01-218260', '이이슬', ARRAY['유료', '인기']::text[], '업무에 바로 쓰는 AI 기초를 하루 동안 집중 실습합니다.'),
  ('paid-claude-biz', 'paid', 'open', 'AI 왕초보 탈출 원데이 클래스', 'AI 입문', null, '영등포', 'AI리더스협회 영등포 교육장', '2026-08-22', '10:00 - 16:00', '2026-07-01', '2026-08-21', 'AI리더스협회', '../images/유료강연_직사각형썸네일.jpg', '../images/유료강연상세.png', 5, 300000, 380000, 'lee', '국민은행', '503202-01-218260', '이이슬', ARRAY['유료']::text[], 'AI 입문자가 하루 만에 핵심 도구 사용법을 익히는 강연입니다.')
on conflict (id) do update set
  type = excluded.type,
  status = excluded.status,
  title = excluded.title,
  category = excluded.category,
  region = excluded.region,
  location = excluded.location,
  address = excluded.address,
  event_date = excluded.event_date,
  event_time = excluded.event_time,
  apply_start_at = excluded.apply_start_at,
  apply_end_at = excluded.apply_end_at,
  instructor = excluded.instructor,
  thumb_img = excluded.thumb_img,
  detail_img = excluded.detail_img,
  applicant_count = excluded.applicant_count,
  price = excluded.price,
  price_orig = excluded.price_orig,
  payment_account_preset = excluded.payment_account_preset,
  payment_bank = excluded.payment_bank,
  payment_account = excluded.payment_account,
  payment_holder = excluded.payment_holder,
  badges = excluded.badges,
  summary = excluded.summary,
  updated_at = now();
