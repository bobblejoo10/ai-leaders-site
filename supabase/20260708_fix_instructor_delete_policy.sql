-- Fix DELETE access for instructor application rows and remove the temporary test row.
-- Run this in the logged-in Supabase project's SQL Editor.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.instructor_applications to anon, authenticated;

alter table public.instructor_applications enable row level security;

drop policy if exists instructor_applications_delete_public on public.instructor_applications;
drop policy if exists allow_public_delete_instructor_applications on public.instructor_applications;

create policy allow_public_delete_instructor_applications
on public.instructor_applications
for delete
to anon, authenticated
using (true);

delete from public.instructor_applications
where id = 'test-policy-row';
