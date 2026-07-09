-- Final backend fix for file uploads and instructor application deletion.
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

insert into storage.buckets (id, name, public, file_size_limit)
values ('instructor-portfolio', 'instructor-portfolio', true, 104857600)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists storage_select_instructor_portfolio on storage.objects;
drop policy if exists storage_insert_instructor_portfolio on storage.objects;
drop policy if exists storage_update_instructor_portfolio on storage.objects;
drop policy if exists storage_delete_instructor_portfolio on storage.objects;

create policy storage_select_instructor_portfolio
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'instructor-portfolio');

create policy storage_insert_instructor_portfolio
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'instructor-portfolio');

create policy storage_update_instructor_portfolio
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'instructor-portfolio')
with check (bucket_id = 'instructor-portfolio');

create policy storage_delete_instructor_portfolio
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'instructor-portfolio');
