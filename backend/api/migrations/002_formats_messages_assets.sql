-- Two-format, persistent-conversation foundation. Existing projects stay voiceover projects.

alter table public.projects
  add column if not exists format text not null default 'voiceover';

do $$ begin
  alter table public.projects
    add constraint projects_format_check check (format in ('voiceover', 'talking_head'));
exception when duplicate_object then null;
end $$;

create table if not exists public.project_messages (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  client_id  text,
  role       text not null check (role in ('user', 'editor')),
  kind       text not null check (kind in ('material', 'direction', 'script', 'voice', 'text', 'reel', 'error')),
  body       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (project_id, client_id)
);

create index if not exists project_messages_project_created_idx
  on public.project_messages (project_id, created_at, id);

create table if not exists public.project_assets (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null unique,
  original_name text not null,
  mime_type     text not null,
  size_bytes    bigint,
  duration_sec  double precision,
  asset_hash    text,
  thumbnail_path text,
  source_deleted_at timestamptz,
  ready         boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists project_assets_project_idx on public.project_assets (project_id, created_at);

-- Keep the migration safe when an early development copy of this table already exists.
alter table public.project_assets add column if not exists asset_hash text;
alter table public.project_assets add column if not exists thumbnail_path text;
alter table public.project_assets add column if not exists source_deleted_at timestamptz;

alter table public.project_messages enable row level security;
alter table public.project_assets enable row level security;

drop policy if exists "own project messages" on public.project_messages;
create policy "own project messages" on public.project_messages
  for all
  using (auth.uid() = user_id and exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (auth.uid() = user_id and exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));

drop policy if exists "own project assets" on public.project_assets;
create policy "own project assets" on public.project_assets
  for all
  using (auth.uid() = user_id and exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ))
  with check (auth.uid() = user_id and exists (
    select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()
  ));

-- Private bucket objects are stored at <uid>/<project-id>/... . The service role used by the API
-- bypasses these policies; the mobile app's JWT is restricted to its own first path component.
insert into storage.buckets (id, name, public)
values ('project-media', 'project-media', false)
on conflict (id) do update set public = false;

drop policy if exists "own project media insert" on storage.objects;
create policy "own project media insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-media'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.projects p
      where p.user_id = (select auth.uid())
        and p.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "own project media select" on storage.objects;
create policy "own project media select" on storage.objects for select to authenticated
  using (
    bucket_id = 'project-media'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.projects p
      where p.user_id = (select auth.uid())
        and p.id::text = (storage.foldername(name))[2]
    )
  );

drop policy if exists "own project media delete" on storage.objects;
create policy "own project media delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-media'
    and owner_id = (select auth.uid()::text)
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and exists (
      select 1 from public.projects p
      where p.user_id = (select auth.uid())
        and p.id::text = (storage.foldername(name))[2]
    )
  );
