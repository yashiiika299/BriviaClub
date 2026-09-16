-- Run this once in Supabase SQL Editor for an existing database.
-- This is safe for an existing table: it only adds missing columns.
create table if not exists public.profiles (
  id text primary key,
  name text default 'New Member',
  full_name text default 'New Member',
  email text,
  phone text,
  city text,
  state text,
  experience text,
  skills text[] default '{}',
  looking_for text[] default '{}',
  photo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists full_name text default 'New Member';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists experience text;
alter table public.profiles add column if not exists skills text[];
alter table public.profiles add column if not exists looking_for text[];
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

notify pgrst, 'reload schema';

-- Legacy credentials table retained for compatibility; the app no longer stores passwords here.
create table if not exists public.profile_credentials (
  user_id text primary key,
  email text not null default '',
  login_password text not null,
  updated_at timestamptz not null default now()
);

alter table public.profile_credentials enable row level security;
drop policy if exists "Members can view their own login credential" on public.profile_credentials;
drop policy if exists "Members can save their own login credential" on public.profile_credentials;
drop policy if exists "Members can update their own login credential" on public.profile_credentials;

-- Enable live INSERT events for the chat table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'brivia_messages'
  ) then
    alter publication supabase_realtime add table public.brivia_messages;
  end if;
end $$;
