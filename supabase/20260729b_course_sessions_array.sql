-- 강연 "통합 일정"을 group_id로 여러 row를 묶는 대신, 강연 1건 안에
-- 회차(sessions) 배열을 내장하는 방식으로 재설계한다.
-- 이전 마이그레이션(20260729_course_schedule_groups.sql)에서 추가했던
-- group_id / is_primary는 실제로 사용되지 않았으므로 정리한다.

drop index if exists courses_group_primary_uidx;
drop index if exists courses_group_id_idx;

alter table public.courses
  drop column if exists group_id,
  drop column if exists is_primary;

alter table public.courses
  add column if not exists sessions jsonb not null default '[]'::jsonb;

comment on column public.courses.sessions is
  '통합 일정용 회차 배열. 비어있으면(기본값) 강연 자체의 지역/날짜/시간/강사/상태 필드를 그대로
   사용하는 단독 강연이다. 값이 있으면 각 항목이 {id, region, location, address, eventDate,
   eventTime, instructor, status, applicantCount} 형태의 회차이며(강사도 회차마다 다를 수 있음),
   공개 페이지에서 드롭다운으로 노출된다.';
