import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listExpiredProjectAssets, listProjectAssets, markProjectAssetsSourceDeleted, projectOwner, updateProjectAssetDerived } from "./db";
import { projectDir } from "./store";

const BUCKET = "project-media";
const pExecFile = promisify(execFile);
const storageBase = () => `${String(process.env.SUPABASE_URL ?? "").replace(/\/$/, "")}/storage/v1`;
// Hosted Supabase's modern sb_secret_ key replaces the legacy JWT-shaped service_role key. The
// fallback keeps existing/self-hosted deployments working while production migrates independently.
const serviceKey = () => process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const headers = (extra: Record<string, string> = {}) => {
  const key = serviceKey();
  // Opaque sb_secret_ values identify the server in `apikey`; Supabase's gateway translates that
  // to service_role upstream. Only the legacy JWT-shaped key belongs in Authorization.
  return key.startsWith("sb_secret_")
    ? { apikey: key, ...extra }
    : { Authorization: `Bearer ${key}`, apikey: key, ...extra };
};
const objectUrl = (path: string) =>
  `${storageBase()}/object/${BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;

export const objectStorageReady = (): boolean => !!process.env.SUPABASE_URL && !!serviceKey();

export async function fetchStoredObject(path: string, range?: string): Promise<Response | null> {
  if (!objectStorageReady()) return null;
  const response = await fetch(objectUrl(path), { headers: headers(range ? { Range: range } : {}) });
  return response.ok && response.body ? response : null;
}

/** Never trust the mobile completion callback by itself: confirm the reserved object exists and,
 * when Storage exposes its length, that it is the byte length the client reserved. */
export async function assertStoredObject(path: string, expectedSize?: number | null): Promise<void> {
  if (!objectStorageReady()) throw new Error("Project media storage is not configured.");
  // Supabase's authenticated object route intentionally has no HEAD handler. A one-byte range GET
  // confirms existence and reports the full size in Content-Range without downloading the video.
  const response = await fetch(objectUrl(path), { headers: headers({ Range: "bytes=0-0" }) });
  if (!response.ok) throw new Error("The upload has not finished in project storage yet.");
  const range = response.headers.get("content-range");
  const totalFromRange = range?.match(/\/(\d+)$/)?.[1];
  const lengthHeader = response.status === 200 ? response.headers.get("content-length") : null;
  const actualText = totalFromRange ?? lengthHeader;
  const actual = actualText == null ? null : Number(actualText);
  await response.body?.cancel().catch(() => {});
  if (expectedSize != null && expectedSize > 0 && actual != null && Number.isFinite(actual) && actual !== expectedSize) {
    throw new Error(`The stored upload is incomplete (${actual} of ${expectedSize} bytes).`);
  }
}

async function hashFile(path: string): Promise<string> {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk as Buffer);
  return hash.digest("hex");
}

async function uploadBytes(path: string, contentType: string, body: Buffer): Promise<void> {
  const response = await fetch(objectUrl(path), {
    method: "POST", headers: headers({ "Content-Type": contentType, "x-upsert": "true" }), body: new Uint8Array(body),
  });
  if (!response.ok) throw new Error(`Project media storage failed (${response.status}).`);
}

/** Download direct-uploaded sources into Railway's temporary per-job scratch directory. */
export async function materializeProjectAssets(projectId: string): Promise<number> {
  if (!objectStorageReady()) return 0;
  const assets = (await listProjectAssets(projectId)).filter((asset) => asset.ready);
  if (!assets.length) return 0;
  const clipsDir = join(projectDir(projectId), "clips");
  await mkdir(clipsDir, { recursive: true });
  let downloaded = 0;
  for (const asset of assets) {
    const safeName = basename(asset.original_name).replace(/[^a-zA-Z0-9._-]+/g, "-") || "clip.mov";
    const destination = join(clipsDir, `${asset.id}-${safeName}`);
    if (!(await stat(destination).catch(() => null))?.size) {
      const response = await fetchStoredObject(asset.storage_path);
      if (!response?.body) throw new Error(`Couldn't prepare ${asset.original_name} from project storage.`);
      await pipeline(Readable.fromWeb(response.body as never), createWriteStream(destination));
      downloaded++;
    }
    const assetHash = asset.asset_hash ?? await hashFile(destination);
    let thumbnailPath = asset.thumbnail_path ?? undefined;
    if (!thumbnailPath) {
      try {
        const thumb = join(clipsDir, `${asset.id}.thumb.jpg`);
        await pExecFile("ffmpeg", ["-y", "-ss", "0.1", "-i", destination, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "5", thumb]);
        const uid = await projectOwner(projectId);
        if (uid) {
          thumbnailPath = `${uid}/${projectId}/thumb/${asset.id}.jpg`;
          await uploadBytes(thumbnailPath, "image/jpeg", await readFile(thumb));
        }
      } catch (error) {
        console.warn(`[storage] couldn't create thumbnail for ${asset.original_name}:`, error);
      }
    }
    await updateProjectAssetDerived({ id: asset.id, projectId, assetHash, ...(thumbnailPath ? { thumbnailPath } : {}) });
  }
  return downloaded;
}

export async function uploadProjectOutput(projectId: string, slot: "current" | "previous", sourcePath: string): Promise<void> {
  if (!objectStorageReady()) return;
  const uid = await projectOwner(projectId);
  if (!uid) return;
  const response = await fetch(objectUrl(`${uid}/${projectId}/output/${slot}.mp4`), {
    method: "POST",
    headers: headers({ "Content-Type": "video/mp4", "x-upsert": "true" }),
    body: await readFile(sourcePath),
  });
  if (!response.ok) throw new Error(`Project output storage failed (${response.status}).`);
}

export async function fetchProjectOutput(projectId: string, slot: "current" | "previous" = "current", range?: string): Promise<Response | null> {
  const uid = await projectOwner(projectId);
  return uid ? fetchStoredObject(`${uid}/${projectId}/output/${slot}.mp4`, range) : null;
}

export async function deleteProjectObjects(projectId: string, uid: string): Promise<void> {
  if (!objectStorageReady()) return;
  const assets = await listProjectAssets(projectId).catch(() => []);
  const prefixes = assets.map((asset) => asset.storage_path);
  prefixes.push(...assets.flatMap((asset) => asset.thumbnail_path ? [asset.thumbnail_path] : []));
  prefixes.push(`${uid}/${projectId}/output/current.mp4`, `${uid}/${projectId}/output/previous.mp4`);
  const response = await fetch(`${storageBase()}/object/${BUCKET}`, {
    method: "DELETE",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes }),
  });
  if (!response.ok) throw new Error(`Project media deletion failed (${response.status}).`);
}

/** Storage counterpart to the local-volume sweeper: sources expire after 14 days; thumbnails and
 * outputs remain so the project thread and final reel continue to work. */
export async function pruneExpiredStoredSources(maxAgeDays = 14): Promise<number> {
  if (!objectStorageReady()) return 0;
  const assets = await listExpiredProjectAssets(new Date(Date.now() - maxAgeDays * 86400e3));
  if (!assets.length) return 0;
  const response = await fetch(`${storageBase()}/object/${BUCKET}`, {
    method: "DELETE", headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ prefixes: assets.map((asset) => asset.storage_path) }),
  });
  if (!response.ok) throw new Error(`Expired source cleanup failed (${response.status}).`);
  await markProjectAssetsSourceDeleted(assets.map((asset) => asset.id));
  return assets.length;
}
