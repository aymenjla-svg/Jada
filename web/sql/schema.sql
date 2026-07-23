-- ============================================================
--  JADA — schéma de la base (à coller dans Supabase → SQL Editor)
--  Voir SETUP_WEB.md pour le pas-à-pas.
-- ============================================================

create table if not exists children (
  id uuid primary key,
  name text not null,
  birth_date timestamptz not null,
  birth_weight_g int,
  birth_height_mm int,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key,
  type text not null,                 -- feeding | hydration | diaper
  timestamp timestamptz not null,
  created_by text not null,           -- maman | papa | tata
  note text,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

create table if not exists measurements (
  id uuid primary key,
  timestamp timestamptz not null,
  created_by text not null,
  weight_g int,
  height_mm int,
  head_mm int,
  created_at timestamptz default now()
);

create table if not exists vaccines (
  id uuid primary key,
  name text not null,
  months int not null,
  detail text,
  due_date timestamptz,
  done_date timestamptz
);

create table if not exists appointments (
  id uuid primary key,
  title text not null,
  practitioner text,
  location text,
  notes text,
  date timestamptz not null
);

create table if not exists medical_entries (
  id uuid primary key,
  title text not null,
  date timestamptz not null,
  summary text
);

-- ------------------------------------------------------------
--  Sécurité : seuls les comptes connectés (vous deux) ont accès.
-- ------------------------------------------------------------
alter table children        enable row level security;
alter table events          enable row level security;
alter table measurements    enable row level security;
alter table vaccines        enable row level security;
alter table appointments    enable row level security;
alter table medical_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array['children','events','measurements','vaccines','appointments','medical_entries']
  loop
    execute format(
      'create policy "famille" on %I for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Synchro temps réel
alter publication supabase_realtime add table children, events, measurements, vaccines, appointments, medical_entries;
