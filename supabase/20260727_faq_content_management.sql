-- FAQ 콘텐츠 관리 확장
-- 관리자 화면(사이트 콘텐츠 관리 > FAQ 탭)에서 FAQ 질문/답변을 수정할 수 있도록
-- site_faqs 테이블을 추가한다. 보안 정책은 site_banners 와 동일하게
-- 공개 조회 + 직원(owner/design/marketing/technical) 쓰기 구조를 따른다.
--
-- 선행 조건: 20260719_secure_staff_access.sql (private.has_staff_role, staff_members) 이 먼저 적용되어 있어야 한다.

create table if not exists public.site_faqs (
  id text primary key,
  category text not null default 'apply',
  question text not null,
  answer text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_site_faqs_category_order on public.site_faqs(category, is_active, sort_order);

-- updated_at 자동 갱신 트리거 (set_updated_at 함수는 20260708 마이그레이션에서 생성됨)
drop trigger if exists trg_site_faqs_set_updated_at on public.site_faqs;
create trigger trg_site_faqs_set_updated_at
before update on public.site_faqs
for each row
execute function public.set_updated_at();

-- 행 수준 보안: 공개 조회, 직원만 쓰기
alter table public.site_faqs enable row level security;

revoke all on table public.site_faqs from anon, authenticated;
grant select on table public.site_faqs to anon, authenticated;
grant insert, update, delete on table public.site_faqs to authenticated;

drop policy if exists site_faqs_select_public on public.site_faqs;
create policy site_faqs_select_public
on public.site_faqs for select to anon, authenticated
using (true);

drop policy if exists site_faqs_insert_staff on public.site_faqs;
create policy site_faqs_insert_staff
on public.site_faqs for insert to authenticated
with check ((select private.has_staff_role(array['owner', 'design', 'marketing', 'technical'])));

drop policy if exists site_faqs_update_staff on public.site_faqs;
create policy site_faqs_update_staff
on public.site_faqs for update to authenticated
using ((select private.has_staff_role(array['owner', 'design', 'marketing', 'technical'])))
with check ((select private.has_staff_role(array['owner', 'design', 'marketing', 'technical'])));

drop policy if exists site_faqs_delete_staff on public.site_faqs;
create policy site_faqs_delete_staff
on public.site_faqs for delete to authenticated
using ((select private.has_staff_role(array['owner', 'design', 'marketing', 'technical'])));

-- 현재 FAQ 페이지에 있던 질문/답변을 초기 데이터로 이전한다.
-- 이미 같은 id 가 있으면(관리자가 수정한 경우) 건드리지 않는다.
insert into public.site_faqs (id, category, question, answer, sort_order, is_active) values
  ('faq-apply-1', 'apply', 'AI를 처음 접해도 수강할 수 있나요?', '네, 가능합니다. AI를 처음 배우는 분들도 이해할 수 있도록 쉬운 설명과 실전 예시 중심으로 강연이 진행됩니다.', 1, true),
  ('faq-apply-2', 'apply', '강연 신청은 어떻게 하나요?', '각 강연 상세 페이지에서 신청하실 수 있습니다. 신청 후 안내 문자를 통해 일정, 장소, 준비사항 등을 확인하실 수 있습니다.', 2, true),
  ('faq-apply-3', 'apply', '무료 강연과 유료 강연의 차이는 무엇인가요?', '무료 강연은 AI 입문과 기본 활용 중심으로 진행되며, 유료 강연은 실무 적용, 업무 자동화, 콘텐츠 제작 등 보다 깊이 있는 활용법을 다룹니다.', 3, true),
  ('faq-lecture-1', 'lecture', '강연은 온라인인가요, 오프라인인가요?', '모든 강연은 오프라인으로 진행됩니다. 지정된 강연장에 직접 방문하셔야 하며, 자세한 장소와 일정은 각 강연 상세 페이지에서 확인하실 수 있습니다.', 1, true),
  ('faq-lecture-2', 'lecture', '강연에서는 어떤 내용을 배우나요?', 'ChatGPT, Gemini, Claude 등 생성형 AI 활용법부터 문서 작성, 콘텐츠 제작, 업무 효율화, 마케팅 활용까지 실생활과 업무에 바로 적용할 수 있는 내용을 배웁니다.', 2, true),
  ('faq-lecture-3', 'lecture', '강연 자료나 복습 자료도 제공되나요?', '강연에 따라 자료 제공 여부가 다를 수 있습니다. 일부 강연에서는 실습 자료, 프롬프트 예시, 복습용 콘텐츠가 함께 제공됩니다.', 3, true),
  ('faq-lecture-4', 'lecture', '강연 취소는 어떻게 하나요?', '홈페이지 하단 우측 챗봇 [참석 취소 안내]를 참고해 주세요.', 4, true),
  ('faq-lecture-5', 'lecture', '강연장 내 음식물 반입이 가능한가요?', '뚜껑이 있는 물을 제외한 음료는 반입할 수 없습니다.', 5, true),
  ('faq-pay-1', 'pay', '유료 강연 결제는 어떻게 하나요?', '유료 강연은 해당 강연 페이지에서 결제하실 수 있으며, 결제 완료 후 수강 안내가 순차적으로 발송됩니다.', 1, true),
  ('faq-pay-2', 'pay', '환불 규정은 어떻게 되나요?', '환불 가능 여부와 기준은 강연별 규정에 따라 다를 수 있습니다. 자세한 내용은 신청 페이지 내 환불 안내를 확인해 주세요.', 2, true),
  ('faq-biz-1', 'biz', '기업이나 기관 단위 교육도 가능한가요?', '네, 가능합니다. 기업, 공공기관, 단체, 학교 등 대상과 목적에 맞춘 맞춤형 AI 교육을 진행할 수 있습니다.', 1, true),
  ('faq-biz-2', 'biz', '출강 문의는 어떻게 하나요?', '출강 문의 페이지를 통해 교육 대상, 희망 일정, 장소, 주제 등을 남겨주시면 담당자가 확인 후 안내드립니다.', 2, true),
  ('faq-biz-3', 'biz', '교육 내용은 맞춤 구성할 수 있나요?', '네, 가능합니다. 조직의 업무 환경과 교육 목적에 맞춰 AI 입문, 실무 활용, 업무 자동화, 마케팅, 콘텐츠 제작 등 다양한 주제로 구성할 수 있습니다.', 3, true)
on conflict (id) do nothing;
