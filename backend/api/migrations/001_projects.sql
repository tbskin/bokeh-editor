-- Bokeh — projects table (ownership of reels). Run once in Supabase (SQL editor or via the
-- connection string). Idempotent-ish: safe to re-run the policy/index guards.

create table if not exists public.projects (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text,
  status     text not null default 'created',
  created_at timestamptz not null default now()
);

create index if not exists projects_user_id_idx on public.projects (user_id);

-- Defense-in-depth. All data access goes through our API with a privileged connection, but RLS
-- guarantees that even a client using the publishable key could only ever read its own rows.
alter table public.projects enable row level security;

drop policy if exists "own projects" on public.projects;
create policy "own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
