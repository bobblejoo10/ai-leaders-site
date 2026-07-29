-- 신청 접수 시점에 실제로 신청한 회차(일정)의 날짜/시간을 그대로 저장해 둔다.
-- 지금까지는 "행사 일자"를 신청 당시 값이 아니라, 그 강연의 "현재" 대표 일정에서
-- 다시 조회해서 보여줬기 때문에, 통합 일정(여러 회차) 강연에서 서로 다른 회차에
-- 신청한 사람들의 행사 일자가 전부 같게(=강연의 현재 대표 회차 날짜로) 보이는 문제가 있었다.

alter table public.lecture_applications
  add column if not exists event_date date,
  add column if not exists event_time text;

comment on column public.lecture_applications.event_date is
  '신청 시점에 실제로 선택된 회차의 날짜. 통합 일정 강연에서 회차별로 다를 수 있다.';
comment on column public.lecture_applications.event_time is
  '신청 시점에 실제로 선택된 회차의 시간.';
