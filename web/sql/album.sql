-- ============================================================
--  JADA — Album photo (à coller dans Supabase → SQL Editor → Run)
--  Crée la table des photos + un stockage privé « photos »
--  accessible uniquement à vos comptes.
-- ============================================================

create table if not exists daily_photos (
  id uuid primary key,
  day date not null,
  path text,                 -- chemin dans le stockage (mode synchro)
  data text,                 -- base64 (secours mode local)
  caption text,
  featured boolean default true,
  created_by text,
  created_at timestamptz default now()
);

alter table daily_photos enable row level security;
create policy "famille" on daily_photos for all to authenticated using (true) with check (true);
alter publication supabase_realtime add table daily_photos;

-- Stockage privé des images
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy "photos_select" on storage.objects
  for select to authenticated using (bucket_id = 'photos');
create policy "photos_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "photos_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos');
