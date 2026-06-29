-- ============================================================
--  JADA — Stock de lait maternel (à coller dans Supabase → SQL Editor → Run)
--  Réserves de lait exprimé : volume, lieu de conservation, péremption.
-- ============================================================

create table if not exists milk_stock (
  id uuid primary key,
  expressed_at timestamptz not null,   -- date d'expression (tire-lait)
  volume_ml int not null,              -- volume restant dans ce lot
  storage text not null default 'congel', -- 'frigo' | 'congel'
  status text not null default 'dispo',   -- 'dispo' | 'fini' | 'jete'
  used_at timestamptz,
  note text,
  created_by text,
  created_at timestamptz default now()
);

alter table milk_stock enable row level security;
create policy "famille" on milk_stock for all to authenticated using (true) with check (true);

-- Synchro temps réel
alter publication supabase_realtime add table milk_stock;
