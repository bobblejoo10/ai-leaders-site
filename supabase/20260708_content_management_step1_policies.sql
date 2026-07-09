-- Step 1: grants, RLS policies, and the public site-assets bucket.
-- Paste only this file into the Supabase SQL Editor and run it first.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.site_banners to anon, authenticated;
grant select, insert, update, delete on table public.instructors to anon, authenticated;
grant select, insert, update, delete on table public.form_options to anon, authenticated;

alter table public.site_banners enable row level security;
alter table public.instructors enable row level security;
alter table public.form_options enable row level security;

drop policy if exists site_banners_select_public on public.site_banners;
drop policy if exists site_banners_insert_public on public.site_banners;
drop policy if exists site_banners_update_public on public.site_banners;
drop policy if exists site_banners_delete_public on public.site_banners;

create policy site_banners_select_public
on public.site_banners
for select
to anon, authenticated
using (true);

create policy site_banners_insert_public
on public.site_banners
for insert
to anon, authenticated
with check (true);

create policy site_banners_update_public
on public.site_banners
for update
to anon, authenticated
using (true)
with check (true);

create policy site_banners_delete_public
on public.site_banners
for delete
to anon, authenticated
using (true);

drop policy if exists instructors_select_public on public.instructors;
drop policy if exists instructors_insert_public on public.instructors;
drop policy if exists instructors_update_public on public.instructors;
drop policy if exists instructors_delete_public on public.instructors;

create policy instructors_select_public
on public.instructors
for select
to anon, authenticated
using (true);

create policy instructors_insert_public
on public.instructors
for insert
to anon, authenticated
with check (true);

create policy instructors_update_public
on public.instructors
for update
to anon, authenticated
using (true)
with check (true);

create policy instructors_delete_public
on public.instructors
for delete
to anon, authenticated
using (true);

drop policy if exists form_options_select_public on public.form_options;
drop policy if exists form_options_insert_public on public.form_options;
drop policy if exists form_options_update_public on public.form_options;
drop policy if exists form_options_delete_public on public.form_options;

create policy form_options_select_public
on public.form_options
for select
to anon, authenticated
using (true);

create policy form_options_insert_public
on public.form_options
for insert
to anon, authenticated
with check (true);

create policy form_options_update_public
on public.form_options
for update
to anon, authenticated
using (true)
with check (true);

create policy form_options_delete_public
on public.form_options
for delete
to anon, authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists storage_select_site_assets on storage.objects;
drop policy if exists storage_insert_site_assets on storage.objects;
drop policy if exists storage_update_site_assets on storage.objects;
drop policy if exists storage_delete_site_assets on storage.objects;

create policy storage_select_site_assets
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-assets');

create policy storage_insert_site_assets
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'site-assets');

create policy storage_update_site_assets
on storage.objects
for update
to anon, authenticated
using (bucket_id = 'site-assets')
with check (bucket_id = 'site-assets');

create policy storage_delete_site_assets
on storage.objects
for delete
to anon, authenticated
using (bucket_id = 'site-assets');

select 'content_management_step1_policies_ok' as status;
