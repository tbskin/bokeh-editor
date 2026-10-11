import { Pool } from "pg";

export type ReelFormat = "voiceover" | "talking_head";
export type MessageRole = "user" | "editor";
export type MessageKind = "material" | "direction" | "script" | "voice" | "text" | "reel" | "error";

export type ProjectMessageRow = {
  id: string;
  project_id: string;
  user_id: string;
  client_id: string | null;
  role: MessageRole;
  kind: MessageKind;
  body: Record<string, unknown>;
  created_at: string;
};

export type ProjectAssetRow = {
  id: string;
  project_id: string;
  user_id: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size_bytes: number | null;
  duration_sec: number | null;
  asset_hash: string | null;
  thumbnail_path: string | null;
  source_deleted_at: string | null;
  ready: boolean;
  created_at: string;
};

// Supabase requires SSL. The direct connection (db.<ref>.supabase.co:5432) is IPv6-only; if Railway
// can't reach it, switch DATABASE_URL to the Supabase pooler string (…pooler.supabase.com:6543).
let poolInstance: Pool | null = null;
function pool(): Pool {
  if (poolInstance) return poolInstance;
  // server.ts loads the optional local .env after ESM imports have been evaluated, so connection
  // configuration must be read lazily. Railway's injected environment is available either way.
  poolInstance = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: { rejectUnauthorized: false } });
  // Per pg docs: idle clients surface socket errors as pool-level 'error' EVENTS (not promise
  // rejections) — without a listener, one dropped connection crashes the process.
  poolInstance.on("error", (e) => console.warn(`[db] pool error: ${String(e).slice(0, 200)}`));
  return poolInstance;
}

/** DB reachability probe for the health check (verifies the container can reach Supabase). */
export async function pingDb(): Promise<void> {
  await pool().query("select 1");
}

export async function insertProject(userId: string, title?: string, format: ReelFormat = "voiceover"): Promise<string> {
  const { rows } = await pool().query<{ id: string }>(
    "insert into projects (user_id, title, format) values ($1, $2, $3) returning id",
    [userId, title ?? null, format],
  );
  return rows[0].id;
}

export async function projectOwner(id: string): Promise<string | null> {
  const { rows } = await pool().query<{ user_id: string }>("select user_id from projects where id = $1", [id]);
  return rows[0]?.user_id ?? null;
}

export async function listUserProjects(userId: string): Promise<Array<{ id: string; title: string | null; status: string; format: ReelFormat; created_at: string }>> {
  const { rows } = await pool().query(
    "select id, title, status, format, created_at from projects where user_id = $1 order by created_at desc",
    [userId],
  );
  return rows;
}

export async function getProject(id: string): Promise<{ id: string; user_id: string; title: string | null; status: string; format: ReelFormat; created_at: string } | null> {
  const { rows } = await pool().query(
    "select id, user_id, title, status, format, created_at from projects where id = $1",
    [id],
  );
  return rows[0] ?? null;
}

export async function projectFormat(id: string): Promise<ReelFormat> {
  const p = await getProject(id);
  return p?.format ?? "voiceover";
}

export async function insertProjectMessage(input: {
  projectId: string;
  userId: string;
  role: MessageRole;
  kind: MessageKind;
  body: Record<string, unknown>;
  clientId?: string;
}): Promise<ProjectMessageRow> {
  const { rows } = await pool().query<ProjectMessageRow>(
    `insert into project_messages (project_id, user_id, client_id, role, kind, body)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     on conflict (project_id, client_id) do update set client_id = excluded.client_id
     returning *`,
    [input.projectId, input.userId, input.clientId ?? null, input.role, input.kind, JSON.stringify(input.body)],
  );
  return rows[0];
}

export async function findProjectMessageByClientId(projectId: string, clientId: string): Promise<ProjectMessageRow | null> {
  const { rows } = await pool().query<ProjectMessageRow>(
    "select * from project_messages where project_id = $1 and client_id = $2 limit 1",
    [projectId, clientId],
  );
  return rows[0] ?? null;
}

export async function listProjectMessages(projectId: string): Promise<ProjectMessageRow[]> {
  const { rows } = await pool().query<ProjectMessageRow>(
    "select * from project_messages where project_id = $1 order by created_at asc, id asc",
    [projectId],
  );
  return rows;
}

export async function createProjectAsset(input: {
  projectId: string;
  userId: string;
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
}): Promise<ProjectAssetRow> {
  const { rows } = await pool().query<ProjectAssetRow>(
    // $1/$2 must deduce ONE type each: uuid at every site, cast to text only where concatenated
    // (bare $1 in both a uuid column and a text || chain is Postgres error 42P08).
    `with asset_id as (select gen_random_uuid() as id)
     insert into project_assets (id, project_id, user_id, storage_path, original_name, mime_type, size_bytes)
     select id, $1::uuid, $2::uuid, $2::uuid::text || '/' || $1::uuid::text || '/source/' || id::text, $3, $4, $5 from asset_id
     returning *`,
    [input.projectId, input.userId, input.originalName, input.mimeType, input.sizeBytes ?? null],
  );
  return rows[0];
}

export async function completeProjectAsset(input: { id: string; projectId: string; durationSec?: number }): Promise<ProjectAssetRow | null> {
  const { rows } = await pool().query<ProjectAssetRow>(
    "update project_assets set ready = true, duration_sec = coalesce($1, duration_sec) where id = $2 and project_id = $3 returning *",
    [input.durationSec ?? null, input.id, input.projectId],
  );
  return rows[0] ?? null;
}

export async function updateProjectAssetDerived(input: { id: string; projectId: string; assetHash: string; thumbnailPath?: string }): Promise<void> {
  await pool().query(
    "update project_assets set asset_hash = $1, thumbnail_path = coalesce($2, thumbnail_path) where id = $3 and project_id = $4",
    [input.assetHash, input.thumbnailPath ?? null, input.id, input.projectId],
  );
}

export async function listProjectAssets(projectId: string): Promise<ProjectAssetRow[]> {
  const { rows } = await pool().query<ProjectAssetRow>(
    "select * from project_assets where project_id = $1 order by created_at asc",
    [projectId],
  );
  return rows;
}

export async function listExpiredProjectAssets(cutoff: Date): Promise<ProjectAssetRow[]> {
  const { rows } = await pool().query<ProjectAssetRow>(
    "select * from project_assets where ready = true and source_deleted_at is null and created_at < $1",
    [cutoff],
  );
  return rows;
}

export async function markProjectAssetsSourceDeleted(ids: string[]): Promise<void> {
  if (!ids.length) return;
  await pool().query("update project_assets set ready = false, source_deleted_at = now() where id = any($1::uuid[])", [ids]);
}

export async function countProjectsSince(userId: string, since: Date): Promise<number> {
  const { rows } = await pool().query<{ n: number }>(
    "select count(*)::int as n from projects where user_id = $1 and created_at >= $2",
    [userId, since],
  );
  return rows[0].n;
}

export async function setProjectStatus(id: string, status: string): Promise<void> {
  await pool().query("update projects set status = $1 where id = $2", [status, id]);
}

export async function deleteProject(id: string): Promise<void> {
  await pool().query("delete from projects where id = $1", [id]);
}
