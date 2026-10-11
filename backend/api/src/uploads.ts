import { Server as TusServer, type Upload } from "@tus/server";
import { FileStore } from "@tus/file-store";
import { mkdir, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, join } from "node:path";
import type { RequestHandler } from "express";
import { verifySupabaseToken, type Verify } from "./auth";
import { projectOwner } from "./db";
import { projectDir } from "./store";
import { track } from "./telemetry";

// Resumable clip uploads (tus protocol). Big files over cell die mid-flight; the old monolithic
// multipart POST restarted them from byte zero. Here the client PATCHes ~10MB chunks against an
// upload URL; a dropped connection resumes from the server's last confirmed offset (HEAD), so a
// retry — or an app relaunch — continues instead of restarting. Partials live in data/_tus and are
// swept when stale; a finished upload is MOVED into the project's clips/ dir, exactly where the
// multipart route puts files (nothing downstream changes).
//
// The multipart /clips route stays for older app builds and the (small) voiceover upload.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLIP_EXT = /\.(mov|mp4|m4v)$/i;
const PARTIAL_TTL_MS = 24 * 3600e3; // resume window; older partials are abandoned uploads

type Owner = (id: string) => Promise<string | null>;

/** Build the tus server + express handler. Verify/owner are injectable for tests. */
export function createUploads(opts: { dataDir: string; verify?: Verify; owner?: Owner }) {
  const verify = opts.verify ?? verifySupabaseToken;
  const owner = opts.owner ?? projectOwner;
  const tusDir = join(opts.dataDir, "_tus");

  const reject = (status: number, message: string) => ({ status_code: status, body: `${message}\n` });

  // Hooks get a web-standard Request. The verified user id is re-derived where needed (JWKS keys
  // are cached after the first fetch, so this is local crypto, not a network call per hook).
  const uidFrom = async (req: Request): Promise<string> => {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw reject(401, "sign in to upload");
    try {
      return (await verify(token)).sub;
    } catch {
      throw reject(401, "sign in again to keep uploading");
    }
  };

  const tus = new TusServer({
    path: "/api/uploads",
    datastore: new FileStore({ directory: tusDir, expirationPeriodInMilliseconds: PARTIAL_TTL_MS }),
    // Railway terminates TLS at its proxy; without this the Location URL on create says http://.
    respectForwardedHeaders: true,
    async onIncomingRequest(req) {
      await uidFrom(req); // reject unauthenticated traffic before any byte is stored
    },
    async onUploadCreate(req, upload) {
      const meta = upload.metadata ?? {};
      const projectId = String(meta.projectId ?? "");
      const filename = basename(String(meta.filename ?? ""));
      if (!UUID.test(projectId)) throw reject(400, "bad projectId");
      if (!filename || !CLIP_EXT.test(filename)) throw reject(400, "clips must be .mov, .mp4, or .m4v");
      const o = await owner(projectId);
      if (!o) throw reject(404, "project not found");
      if (o !== (await uidFrom(req))) throw reject(403, "not yours");
      return { metadata: { ...meta, projectId, filename } };
    },
    async onUploadFinish(req, upload: Upload) {
      const projectId = String(upload.metadata?.projectId);
      const clipsDir = join(projectDir(projectId), "clips");
      await mkdir(clipsDir, { recursive: true });
      // Collisions keep both files — a re-pick of the same camera-roll asset must not clobber.
      let dest = join(clipsDir, String(upload.metadata?.filename));
      if (existsSync(dest)) dest = join(clipsDir, `${Date.now()}-${String(upload.metadata?.filename)}`);
      await rename(join(tusDir, upload.id), dest);
      await rm(join(tusDir, `${upload.id}.json`), { force: true }); // the store's bookkeeping twin
      console.log(`[tus] project ${projectId}: finished ${basename(dest)} (${((upload.size ?? 0) / 1e6).toFixed(1)}MB)`);
      const uid = await uidFrom(req).catch(() => `project:${projectId}`);
      track(uid, "clips_uploaded", { projectId, count: 1, bytes: upload.size ?? 0, via: "tus" });
      return {};
    },
  });

  const handler: RequestHandler = (req, res) => { void tus.handle(req, res); };
  /** Purge partials past the resume window (wired into the API's boot + interval housekeeping). */
  const sweepPartials = async (): Promise<number> => {
    try { return await tus.cleanUpExpiredUploads(); } catch { return 0; }
  };
  return { handler, sweepPartials, tusDir };
}
