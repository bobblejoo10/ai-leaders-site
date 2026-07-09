-- Step 2: default hero banner and instructor content.
-- Run this after Step 1 succeeds.

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

select 'content_management_step2_seed_banners_instructors_ok' as status;
