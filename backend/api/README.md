# backend/api

Control-plane **module** of the backend service (not a separate deployment): auth, format-aware
projects, persistent project conversations, private resumable assets, job ownership/status,
transactional edit checkpoints, and one-step undo. New media uses Supabase Storage's direct TUS
endpoint; the local-volume adapter remains for existing projects and automated tests.

Apply `migrations/001_projects.sql`, then `migrations/002_formats_messages_assets.sql`. Production
private-object materialization/output retention uses the modern `SUPABASE_SECRET_KEY` (with
`SUPABASE_SERVICE_ROLE_KEY` accepted only as a legacy fallback); clients receive only their normal
user JWT and Storage RLS confines every object to its user-id folder.

See `../README.md` and `../../docs/CODEMAP.md`.
