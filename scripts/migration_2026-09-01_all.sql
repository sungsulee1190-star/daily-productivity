-- ============================================================================
-- 통합 마이그레이션 — 2026-09-01 크로스 디바이스 동기화
-- Supabase Dashboard > SQL Editor 에 전체 붙여넣고 Run.
-- 모두 "if not exists" / "drop ... if exists" 로 작성되어 여러 번 실행해도 안전.
-- (기존 3개 파일을 하나로 합침: todo_extended_fields + links_tracker + tracker_dates)
-- ============================================================================

-- 1) todos 확장 컬럼 -----------------------------------------------------------
alter table public.todos
  add column if not exists memo text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists clip text not null default 'work',
  add column if not exists completed_at timestamptz,
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists kanban_status text not null default 'backlog';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'todos_clip_check') then
    alter table public.todos
      add constraint todos_clip_check check (clip in ('work', 'personal')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'todos_kanban_status_check') then
    alter table public.todos
      add constraint todos_kanban_status_check
      check (kanban_status in ('backlog', 'inprogress', 'done', 'hold')) not valid;
  end if;
end $$;

-- 2) routines 테이블 ---------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  type text not null check (type in ('daily', 'weekly', 'monthly')),
  checked_weeks text[] not null default '{}',
  checked_months text[] not null default '{}',
  checked_days text[] not null default '{}',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.routines enable row level security;
drop policy if exists "Users can manage own routines" on public.routines;
create policy "Users can manage own routines" on public.routines
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) links 테이블 ----------------------------------------------------------
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  emoji text not null default '🔗',
  created_at timestamptz default now()
);
alter table public.links enable row level security;
drop policy if exists "Users can manage own links" on public.links;
create policy "Users can manage own links" on public.links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 4) tracker_sessions 테이블 (+ 기간 컬럼) --------------------------------
create table if not exists public.tracker_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  month text not null,
  items jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.tracker_sessions
  add column if not exists start_date text,
  add column if not exists end_date text;
alter table public.tracker_sessions enable row level security;
drop policy if exists "Users can manage own tracker sessions" on public.tracker_sessions;
create policy "Users can manage own tracker sessions" on public.tracker_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 5) 확인용 ---------------------------------------------------------------
-- 실행 후 아래로 테이블/컬럼 존재 확인:
--   select table_name, column_name from information_schema.columns
--   where table_schema = 'public'
--     and table_name in ('todos','routines','links','tracker_sessions')
--   order by table_name, ordinal_position;
