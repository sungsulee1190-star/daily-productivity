alter table public.todos
  add column if not exists memo text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists clip text not null default 'work',
  add column if not exists completed_at timestamptz,
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists kanban_status text not null default 'backlog';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'todos_clip_check'
  ) then
    alter table public.todos
      add constraint todos_clip_check
      check (clip in ('work', 'personal'))
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'todos_kanban_status_check'
  ) then
    alter table public.todos
      add constraint todos_kanban_status_check
      check (kanban_status in ('backlog', 'inprogress', 'done', 'hold'))
      not valid;
  end if;
end $$;

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
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
