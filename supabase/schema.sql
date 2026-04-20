create extension if not exists pgcrypto;

create table if not exists pets (
  id text primary key,
  name text not null,
  breed text not null,
  species text not null check (species in ('dog', 'cat', 'other')),
  age text not null,
  gender text not null check (gender in ('male', 'female')),
  weight text not null,
  size text not null,
  "coatLength" text not null,
  description text not null,
  tags jsonb not null default '[]'::jsonb,
  "mainImage" text not null,
  gallery jsonb not null default '[]'::jsonb,
  location text not null,
  distance text not null,
  urgent boolean not null default false,
  coordinates jsonb not null
);

create table if not exists profiles (
  user_id text primary key,
  name text not null,
  bio text not null,
  email text not null,
  avatar text not null,
  notifications jsonb not null,
  preferences jsonb not null
);

create table if not exists favorites (
  user_id text not null,
  pet_id text not null references pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  pet_id text not null references pets(id) on delete cascade,
  user_id text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  housing_type text not null,
  fenced_yard boolean not null,
  pet_experience text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table pets enable row level security;
alter table profiles enable row level security;
alter table favorites enable row level security;
alter table applications enable row level security;

drop policy if exists "service role full access pets" on pets;
drop policy if exists "service role full access profiles" on profiles;
drop policy if exists "service role full access favorites" on favorites;
drop policy if exists "service role full access applications" on applications;

create policy "service role full access pets" on pets for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access profiles" on profiles for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access favorites" on favorites for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy "service role full access applications" on applications for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
