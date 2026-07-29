-- 강연 "통합 일정"(같은 강연을 여러 지역/날짜 회차로 묶어서 하나의 신청페이지에서
-- 드롭다운으로 고르게 하는 기능)을 위한 준비 단계.
-- 기존 강연은 전부 group_id가 비어있는(null) 상태로 유지되며, 지금까지와 완전히 동일하게 동작한다.
-- 특정 강연들을 묶고 싶을 때만 관리자가 같은 group_id 값을 넣어주면 된다.

alter table public.courses
  add column if not exists group_id text,
  add column if not exists is_primary boolean not null default true;

comment on column public.courses.group_id is
  '통합 일정으로 묶을 강연들에 공통으로 부여하는 값. null이면 단독 강연.';
comment on column public.courses.is_primary is
  '같은 group_id 안에서 제목/이미지/가격/안내문 등 공통 정보의 기준이 되는 대표 강연 여부.';

create index if not exists courses_group_id_idx on public.courses (group_id);

-- 같은 그룹 안에 대표(is_primary = true)가 두 개 이상 생기는 걸 DB 차원에서 막는다.
drop index if exists courses_group_primary_uidx;
create unique index courses_group_primary_uidx
  on public.courses (group_id)
  where is_primary and group_id is not null;
