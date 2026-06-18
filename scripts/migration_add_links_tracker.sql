-- Migration: Add links and tracker_sessions tables for cross-device sync
-- Run this in Supabase Dashboard > SQL Editor

-- 1. links table
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  url text not null,
  emoji text not null default '🔗',
  created_at timestamptz default now()
);

alter table public.links enable row level security;

create policy "Users can manage own links"
  on public.links for all
  using (auth.uid() = user_id);

-- 2. tracker_sessions table
create table if not exists public.tracker_sessions (
  id uuid primary key,
  user_id uuid references auth.users not null,
  name text not null,
  month text not null,
  items jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tracker_sessions enable row level security;

create policy "Users can manage own tracker sessions"
  on public.tracker_sessions for all
  using (auth.uid() = user_id);
