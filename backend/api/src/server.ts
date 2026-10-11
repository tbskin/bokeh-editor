import express from "express";
import multer from "multer";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { Readable } from "node:stream";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { statfs } from "node:fs/promises";
import { ensureProjectDir, projectDir, removeProjectDir, placeClips, placeVo, recordSignal, sweepTmp, pruneExpiredSources, refineCount } from "./store";
import { startAssemble, startFinalize, startRefine, startScriptRevision, startAnalyze, startPlan, startPrep, startAngleSwitch, startGenerateVo, getStatus, currentReelUrl, clearStatus, setReelUrl, stepsFor, sweepOrphanJobs, runningJobs } from "./jobs";
import { requireAuth, requireOwner, overQuota, userId } from "./auth";
import { createUploads } from "./uploads";
import { createVoiceRoutes } from "./voice";
import { track } from "./telemetry";
import {
  completeProjectAsset, createProjectAsset, findProjectMessageByClientId, getProject, insertProject, insertProjectMessage,
  listProjectAssets, listProjectMessages, listUserProjects, deleteProject, pingDb, type ReelFormat,
  setProjectStatus,
} from "./db";
import { readProfile } from "./profiles";
import { parseScriptMd } from "@ole/engine";
import { assertGeneratedTakeMatchesScript, readScriptState, updateScript } from "./script-state";
import { canUndoEdit, withUndoCheckpoint } from "./checkpoints";
import { assertStoredObject, deleteProjectObjects, fetchProjectOutput, fetchStoredObject, materializeProjectAssets, objectStorageReady, pruneExpiredStoredSources, uploadProjectOutput } from "./object-storage";

try {
  process.loadEnvFile(join(import.meta.dirname, "..", "..", "..", ".env"));
} catch {
  /* .env optional */
}

const DATA = process.env.OLE_DATA ?? join(process.cwd(), "data");
mkdirSync(join(DATA, "_tmp"), { recursive: true });
// Bounded uploads. 600MB/file was too low — real 4K iPhone clips blow past it (a first TestFlight
// upload 413'd at ~600MB mid-stream). 3GB/file covers long 4K/ProRes clips; 15 files covers a maxed
// picker. The real fix is downscaling on the device before upload (a 4K clip → ~1/10th the bytes);
// this just stops the false rejection. OLE_MAX_UPLOAD_MB overrides.
const MAX_UPLOAD_BYTES = Number(process.env.OLE_MAX_UPLOAD_MB ?? 3072) * 1024 * 1024;
const upload = multer({ dest: join(DATA, "_tmp"), limits: { fileSize: MAX_UPLOAD_BYTES, files: 15 } });

// Resumable clip uploads (tus) — the app PATCHes chunks and resumes from the last confirmed byte.
const uploads = createUploads({ dataDir: DATA });

// Housekeeping: clear orphaned upload temp files + stale resumable partials at boot, and free
// expired project sources (keeping reels playable) at boot + every 6h. The 5GB volume otherwise
// fills after ~15-25 projects.
sweepTmp().then((n) => n && console.log(`[sweep] removed ${n} orphaned upload temp file(s)`)).catch(() => {});
const prune = () => {
  pruneExpiredSources().then((ids) => ids.length && console.log(`[sweep] pruned sources of ${ids.length} expired project(s)`)).catch(() => {});
  pruneExpiredStoredSources().then((count) => count && console.log(`[sweep] pruned ${count} expired object-storage source(s)`)).catch(() => {});
  uploads.sweepPartials().then((n) => n && console.log(`[sweep] purged ${n} stale resumable upload partial(s)`)).catch(() => {});
};
// Restart recovery, boot-only: jobs a dead process left "running" resume themselves or become
// honest retryable errors — a deploy can cost minutes of re-work but never a stranded reel.
sweepOrphanJobs(DATA)
  .then(({ resumed, errored }) => (resumed || errored) && console.log(`[sweep] restart recovery: resumed ${resumed} job(s), marked ${errored} as retryable`))
  .catch(() => {});
prune();
setInterval(prune, 6 * 3600e3).unref();

const app = express();
// Dynamic API responses must never be cached. Express's default ETag makes the
// status body 304 once it stabilizes; React Native's fetch then sends
// If-None-Match, gets a 304, and the client treats non-2xx as an error — so
// status polling hangs forever. Turn ETag off app-wide.
app.disable("etag");
app.use(express.json());

// Request log — see exactly what the phone hits and the outcome.
app.use((req, res, next) => {
  const t = Date.now();
  // Media requests from older builds may carry a JWT query parameter. Never copy query strings into
  // Railway logs (new builds use Authorization headers for media too).
  res.on("finish", () => console.log(`${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - t}ms)`));
  next();
});

app.use("/", express.static(join(import.meta.dirname, "..", "public")));

// tus resumable uploads: creation (POST /api/uploads) + per-upload HEAD/PATCH/DELETE. The tus
// server does its own auth (JWT) + ownership checks via hooks in uploads.ts.
app.all("/api/uploads", uploads.handler);
app.all("/api/uploads/*", uploads.handler);

// Last-resort safety net: never let one bad request take down the dev server.
process.on("unhandledRejection", (e) => console.error("[unhandledRejection]", e));
process.on("uncaughtException", (e) => console.error("[uncaughtException]", e));

// Wrap async handlers so a thrown error returns 500 instead of crashing the process.
const wrap =
  (fn: (req: express.Request, res: express.Response) => Promise<unknown>) =>
  (req: express.Request, res: express.Response) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      console.error(e);
      if (!res.headersSent) res.status(500).json({ error: String((e as { message?: string })?.message ?? e) });
    });

// Unauthenticated health check — process up, DB reachable, and how full the volume is.
app.get("/api/health", wrap(async (_req, res) => {
  const disk = await statfs(DATA).then((s) => ({
    freeMB: Math.round((s.bavail * s.bsize) / 1e6),
    totalMB: Math.round((s.blocks * s.bsize) / 1e6),
  })).catch(() => null);
  try {
    await pingDb();
    res.json({ ok: true, db: true, disk, jobs: runningJobs() });
  } catch (e) {
    res.status(500).json({ ok: false, db: false, disk, error: String((e as { message?: string })?.message ?? e) });
  }
}));

const storageTusEndpoint = (): string | null => {
  if (!objectStorageReady()) return null;
  if (process.env.SUPABASE_STORAGE_TUS_URL) return process.env.SUPABASE_STORAGE_TUS_URL;
  try {
    const ref = new URL(process.env.SUPABASE_URL ?? "").hostname.split(".")[0];
    return ref ? `https://${ref}.storage.supabase.co/storage/v1/upload/resumable` : null;
  } catch { return null; }
};
const enabledFormats = (): ReelFormat[] => process.env.OLE_TALKING_HEAD === "0"
  ? ["voiceover"]
  : ["voiceover", "talking_head"];

// Read before creating a project so old builds can keep using the API-hosted upload adapter while
// new builds opt into direct private-object uploads only when the deployment is configured for it.
// Supabase's plan-level per-file cap (Free = 50MB). Files over this route through the legacy
// Railway upload instead; raise OLE_DIRECT_MEDIA_MAX_MB after a plan upgrade — no app rebuild.
const DIRECT_MEDIA_MAX_BYTES = () => Number(process.env.OLE_DIRECT_MEDIA_MAX_MB ?? 50) * 1024 * 1024;

app.get("/api/capabilities", (_req, res) => res.json({
  formats: enabledFormats(),
  generatedVoice: !!process.env.ELEVENLABS_API_KEY,
  motionGraphics: process.env.OLE_HYPERFRAMES !== "0",
  directProjectMedia: !!storageTusEndpoint(),
  directMediaMaxBytes: DIRECT_MEDIA_MAX_BYTES(),
}));

// Everything under /api/projects requires a signed-in user (attaches req.userId).
app.use("/api/projects", requireAuth());

// The creator's cloned-voice setup/delete — same gate, its own router.
app.use("/api/voice", requireAuth(), createVoiceRoutes());

// Create a reel: enforce the daily quota, record ownership in the DB, make the workspace.
app.post("/api/projects", wrap(async (req, res) => {
  if (await overQuota(userId(req))) {
    track(userId(req), "quota_hit", { limit: "daily_reels" });
    return res.status(429).json({ error: "You've hit today's limit of 5 reels — try again tomorrow." });
  }
  const requested = req.body?.format ?? "voiceover";
  if (requested !== "voiceover" && requested !== "talking_head")
    return res.status(400).json({ error: "Choose voiceover or talking head." });
  const format = requested as ReelFormat;
  if (!enabledFormats().includes(format))
    return res.status(503).json({ error: "Talking-head reels aren't enabled on this build yet." });
  const id = await insertProject(userId(req), req.body?.title ? String(req.body.title) : undefined, format);
  await ensureProjectDir(id);
  track(userId(req), "project_created", { projectId: id, format });
  track(userId(req), "project_format_selected", { projectId: id, format });
  res.json({ id, format, dir: projectDir(id) });
}));

// The signed-in user's reels, newest first (server-backed — follows the account, survives reinstall).
app.get("/api/projects", wrap(async (req, res) => {
  const projects = await listUserProjects(userId(req));
  res.json(projects.map((project) => ({
    ...project,
    lifecycle: lifecycleFor(project.id, project.format, project.status),
    cover: existsSync(join(projectDir(project.id), "edit", "cover.jpg")) ? `/api/projects/${project.id}/cover` : null,
  })));
}));

// Ownership guard for every project-scoped route below.
app.use("/api/projects/:id", requireOwner());

// One job at a time per project: a double-tapped refine (or a refine during an assemble) would race
// two processes over the same edl.json and bill two agent runs. Status/reel/script stay readable.
const requireIdle: express.RequestHandler = (req, res, next) => {
  if (getStatus(req.params.id).state === "running")
    return res.status(409).json({ error: "Still working on this reel — give it a moment and try again." });
  next();
};
for (const route of ["prep", "analyze", "plan", "angle", "assemble", "finalize", "refine", "generate-vo"]) {
  app.use(`/api/projects/:id/${route}`, requireIdle);
}

type Lifecycle = "uploading" | "preparing" | "awaiting_voice" | "rendering" | "ready" | "editing" | "error";
function lifecycleFor(id: string, format: ReelFormat, persistedStatus?: string): Lifecycle {
  const s = getStatus(id);
  // An error while a finished reel exists keeps the reel: the failure surfaces as the editor's
  // reply in the conversation, never as a dead screen over a watchable reel.
  if (s.state === "error") return existsSync(join(projectDir(id), "edit", "final.mp4")) ? "ready" : "error";
  if (s.state === "running") {
    if (s.stage === "analyze" || s.stage === "plan") return "preparing";
    return existsSync(join(projectDir(id), "edit", "final.mp4")) ? "editing" : "rendering";
  }
  if (existsSync(join(projectDir(id), "edit", "final.mp4"))) return "ready";
  if (persistedStatus === "error") return "error";
  if (persistedStatus === "ready") return "ready";
  if (persistedStatus === "awaiting_voice" && format === "voiceover") return "awaiting_voice";
  if (format === "voiceover" && existsSync(join(projectDir(id), "script.md"))) return "awaiting_voice";
  // Materialized clips alone don't mean work is happening: direct-to-storage uploads land clips
  // before any prep is requested, and a phone that dies pre-/prep leaves them orphaned. Only a
  // persisted prep request makes "preparing" honest — otherwise this project is still waiting on
  // the creator's device (a crashed phone once polled a phantom "preparing" forever here).
  if (existsSync(join(projectDir(id), "clips"))) {
    return existsSync(join(projectDir(id), "prep-request.json")) ? "preparing" : "uploading";
  }
  return "uploading";
}

app.get("/api/projects/:id", wrap(async (req, res) => {
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "not found" });
  const lifecycle = lifecycleFor(req.params.id, project.format, project.status);
  const script = await readScriptState(projectDir(req.params.id)).catch(() => null);
  res.set("Cache-Control", "no-store");
  res.json({
    id: project.id, title: project.title, format: project.format, lifecycle,
    currentReel: lifecycle === "ready" || lifecycle === "editing" ? currentReelUrl(project.id) : null,
    cover: existsSync(join(projectDir(project.id), "edit", "cover.jpg")) ? `/api/projects/${project.id}/cover` : null,
    canUndo: await canUndoEdit(projectDir(project.id)),
    voice: project.format === "voiceover" ? {
      canGenerate: !!process.env.ELEVENLABS_API_KEY && !!readProfile(userId(req)).voiceId,
      generatedTake: script?.generatedTake ?? null,
    } : null,
    script: script ? { text: script.script, revision: script.revision } : null,
  });
}));

app.get("/api/projects/:id/messages", wrap(async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await listProjectMessages(req.params.id));
}));

app.post("/api/projects/:id/messages", wrap(async (req, res) => {
  if (getStatus(req.params.id).state === "running")
    return res.status(409).json({ error: "Still working on this reel — give it a moment and try again." });
  const text = String(req.body?.text ?? "").trim().slice(0, 4000);
  const clientId = String(req.body?.clientId ?? "").trim().slice(0, 200);
  if (!text || !clientId) return res.status(400).json({ error: "A message and clientId are required." });
  const existing = await findProjectMessageByClientId(req.params.id, clientId);
  if (existing) return res.json(existing); // response retry: never launch the same edit twice
  const project = await getProject(req.params.id);
  if (!project) return res.status(404).json({ error: "not found" });
  const message = await insertProjectMessage({
    projectId: project.id, userId: userId(req), role: "user", kind: "text", clientId, body: { text },
  });
  track(userId(req), "project_message_sent", { projectId: project.id, format: project.format });
  const lifecycle = lifecycleFor(project.id, project.format, project.status);
  if (lifecycle === "ready") {
    if (!(await ensureProjectClips(req.params.id))) {
      await insertProjectMessage({ projectId: project.id, userId: userId(req), role: "editor", kind: "error", body: { text: "This reel's source clips have expired, so I can't make another edit. You can still watch and share it." } });
      return res.status(410).json({ error: "This reel's source clips have expired — you can still watch and share it as is." });
    }
    if ((await refineCount(req.params.id)) >= REFINE_LIMIT) {
      await insertProjectMessage({ projectId: project.id, userId: userId(req), role: "editor", kind: "error", body: { text: "This reel has reached its edit limit. The current reel is unchanged." } });
      return res.status(429).json({ error: "You've hit the edit limit for this reel — create a new one to keep going." });
    }
    startRefine(req.params.id, text, userId(req));
    return res.status(202).json(message);
  }
  if (lifecycle === "awaiting_voice" && project.format === "voiceover") {
    startScriptRevision(project.id, text, userId(req));
    return res.status(202).json(message);
  }
  return res.status(409).json({ error: "This project is still preparing. Your message was saved and will remain in the conversation." });
}));

app.post("/api/projects/:id/undo", requireIdle, wrap(async (req, res) => {
  await withUndoCheckpoint(projectDir(req.params.id), () =>
    uploadProjectOutput(req.params.id, "current", join(projectDir(req.params.id), "edit", "final.mp4")));
  const reelUrl = `/api/projects/${req.params.id}/reel?t=${Date.now()}`;
  await setProjectStatus(req.params.id, "ready");
  setReelUrl(req.params.id, reelUrl); // undone cut must serve immediately, not the pre-undo URL
  track(userId(req), "edit_undone", { projectId: req.params.id });
  await insertProjectMessage({
    projectId: req.params.id, userId: userId(req), role: "editor", kind: "text",
    body: { text: "Undid the last change." },
  });
  res.json({ ok: true, reelUrl, canUndo: false });
}));

app.get("/api/projects/:id/assets", wrap(async (req, res) => {
  res.json(await listProjectAssets(req.params.id));
}));

app.post("/api/projects/:id/assets", wrap(async (req, res) => {
  const endpoint = storageTusEndpoint();
  if (!endpoint) return res.status(503).json({ error: "Direct project-media uploads are not configured." });
  const originalName = String(req.body?.filename ?? "clip.mov").slice(0, 300);
  const mimeType = String(req.body?.mimeType ?? "video/quicktime").slice(0, 120);
  const sizeBytes = Number(req.body?.sizeBytes);
  if (!mimeType.startsWith("video/")) return res.status(400).json({ error: "Project sources must be video files." });
  if (Number.isFinite(sizeBytes) && (sizeBytes <= 0 || sizeBytes > MAX_UPLOAD_BYTES))
    return res.status(413).json({ error: `That video is over the ${Math.round(MAX_UPLOAD_BYTES / 1024 ** 3)}GB upload limit.` });
  if (Number.isFinite(sizeBytes) && sizeBytes > DIRECT_MEDIA_MAX_BYTES())
    return res.status(413).json({ error: "That clip is too big for direct storage — it'll upload the standard way." });
  const asset = await createProjectAsset({
    projectId: req.params.id, userId: userId(req), originalName, mimeType,
    ...(Number.isFinite(sizeBytes) && sizeBytes >= 0 ? { sizeBytes } : {}),
  });
  res.json({ asset, upload: { endpoint, bucketName: "project-media", objectName: asset.storage_path, chunkSize: 6 * 1024 * 1024 } });
}));

app.post("/api/projects/:id/assets/:assetId/complete", wrap(async (req, res) => {
  const durationSec = Number(req.body?.durationSec);
  const reserved = (await listProjectAssets(req.params.id)).find((item) => item.id === req.params.assetId);
  if (!reserved) return res.status(404).json({ error: "asset not found" });
  try {
    await assertStoredObject(reserved.storage_path, reserved.size_bytes == null ? null : Number(reserved.size_bytes));
  } catch (error) {
    return res.status(409).json({ error: String((error as Error)?.message ?? error) });
  }
  const asset = await completeProjectAsset({
    id: req.params.assetId, projectId: req.params.id,
    ...(Number.isFinite(durationSec) && durationSec >= 0 ? { durationSec } : {}),
  });
  if (!asset) return res.status(404).json({ error: "asset not found" });
  res.json(asset);
}));

app.get("/api/projects/:id/assets/:assetId/thumbnail", wrap(async (req, res) => {
  const asset = (await listProjectAssets(req.params.id)).find((item) => item.id === req.params.assetId);
  if (!asset?.thumbnail_path) return res.status(404).json({ error: "thumbnail not ready" });
  const stored = await fetchStoredObject(asset.thumbnail_path);
  if (!stored?.body) return res.status(404).json({ error: "thumbnail not found" });
  res.set("Content-Type", "image/jpeg");
  res.set("Cache-Control", "private, max-age=86400");
  Readable.fromWeb(stored.body as never).pipe(res);
}));

app.post("/api/projects/:id/clips", upload.fields([{ name: "clips" }]), wrap(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  // Log the size too — it's how we see whether on-device compression actually ran (300MB of 4K
  // arriving as 30MB means yes; gigabytes means the compressor silently fell back).
  const mb = ((files?.clips ?? []).reduce((a, f) => a + (f.size ?? 0), 0) / 1e6).toFixed(1);
  console.log(`[clips] project ${req.params.id}: received ${files?.clips?.length ?? 0} file(s), ${mb}MB`);
  await placeClips(req.params.id, files);
  track(userId(req), "clips_uploaded", { projectId: req.params.id, count: files?.clips?.length ?? 0,
    bytes: (files?.clips ?? []).reduce((a, f) => a + (f.size ?? 0), 0) });
  res.json({ ok: true });
}));

// Prep on a clip-less project burns two model calls to discover there's no footage (seen in prod:
// an upload died mid-flight, the retry skipped re-uploading, and Plan failed cryptically). Refuse
// fast with a message the app can show verbatim.
const hasClips = async (id: string) =>
  (await readdir(join(projectDir(id), "clips")).catch(() => [])).length > 0;

/** New projects keep sources in private object storage. Recreate job scratch after a restart before
 * any operation that needs the immutable source files. */
const ensureProjectClips = async (id: string): Promise<boolean> => {
  if (await hasClips(id)) return true;
  await materializeProjectAssets(id);
  return hasClips(id);
};

// The creator's free-text context about their footage. Older app builds send it as `topic`.
const ctxOf = (req: express.Request): string | undefined => {
  const c = req.body.context ?? req.body.topic;
  return c ? String(c).slice(0, 4000) : undefined;
};

app.post("/api/projects/:id/prep", wrap(async (req, res) => {
  if (!(await ensureProjectClips(req.params.id)))
    return res.status(400).json({ error: "Your clips never finished uploading. Start a new reel and add them again." });
  const filenames = await readdir(join(projectDir(req.params.id), "clips"));
  const assets = await listProjectAssets(req.params.id);
  await insertProjectMessage({
    projectId: req.params.id, userId: userId(req), role: "user", kind: "material", clientId: "initial-material",
    body: {
      attachments: assets.length
        ? assets.map((asset) => ({
          id: asset.id, filename: asset.original_name, mimeType: asset.mime_type,
          ...(asset.thumbnail_path ? { thumbnailUri: `/api/projects/${req.params.id}/assets/${asset.id}/thumbnail` } : {}),
        }))
        : filenames.map((filename) => ({ filename })),
      ...(ctxOf(req) ? { text: ctxOf(req) } : {}),
    },
  });
  track(userId(req), "prep_started", { projectId: req.params.id });
  const prepArgs = {
    hasIdea: !!req.body.hasIdea,
    context: ctxOf(req),
    userScript: req.body.script ? String(req.body.script).slice(0, 4000) : undefined,
  };
  // Persisted so boot-time restart recovery can replay this prep without the phone's help.
  await writeFile(join(projectDir(req.params.id), "prep-request.json"), JSON.stringify(prepArgs)).catch(() => {});
  startPrep(req.params.id, prepArgs);
  res.json({ ok: true });
}));

app.post("/api/projects/:id/analyze", wrap(async (req, res) => {
  if (!(await ensureProjectClips(req.params.id)))
    return res.status(400).json({ error: "Your clips never finished uploading. Start a new reel and add them again." });
  startAnalyze(req.params.id, ctxOf(req));
  res.json({ ok: true });
}));

app.post("/api/projects/:id/plan", (req, res) => {
  startPlan(req.params.id, {
    hasIdea: !!req.body.hasIdea,
    context: ctxOf(req),
    userScript: req.body.script ? String(req.body.script).slice(0, 4000) : undefined,
  });
  res.json({ ok: true });
});

// Switch to one of plan.json's angleAlternates: a fast script-only rewrite (the storyboard stays).
app.post("/api/projects/:id/angle", wrap(async (req, res) => {
  const angle = String(req.body.angle ?? "").trim();
  if (!angle) return res.status(400).json({ error: "Pick an angle first." });
  const plan = await readFile(join(projectDir(req.params.id), "plan.json"), "utf8").then(JSON.parse).catch(() => null);
  if (!plan) return res.status(400).json({ error: "This reel doesn't have a script yet — prep it first." });
  track(userId(req), "angle_switched", { projectId: req.params.id, from: plan.angle, to: angle });
  startAngleSwitch(req.params.id, angle);
  res.json({ ok: true });
}));

app.get("/api/projects/:id/script", wrap(async (req, res) => {
  const state = await readScriptState(projectDir(req.params.id)).catch(() => null);
  if (state == null) return res.status(404).json({ error: "no script yet" });
  // The record screen's "different angle" sheet feeds off the alternates planned up front.
  const plan = await readFile(join(projectDir(req.params.id), "plan.json"), "utf8").then(JSON.parse).catch(() => ({}));
  res.json({
    angle: state.angle, targetSeconds: state.targetSeconds, script: state.script, title: plan.title,
    angleAlternates: plan.angleAlternates ?? [], dropped: plan.dropped ?? [],
    canGenerateVo: !!process.env.ELEVENLABS_API_KEY && !!readProfile(userId(req)).voiceId,
    scriptRevision: state.revision,
    generatedTake: state.generatedTake ?? null,
  });
}));

app.patch("/api/projects/:id/script", requireIdle, wrap(async (req, res) => {
  const script = String(req.body?.script ?? "").slice(0, 8000);
  const expectedRevision = String(req.body?.expectedRevision ?? "");
  if (!expectedRevision) return res.status(400).json({ error: "expectedRevision is required." });
  try {
    const result = await updateScript({ workDir: projectDir(req.params.id), script, expectedRevision });
    await insertProjectMessage({
      projectId: req.params.id, userId: userId(req), role: "editor", kind: "script",
      body: { script: script.trim(), revision: result.revision },
    });
    res.json({ scriptRevision: result.revision, generatedTake: null, invalidatedGeneratedTake: result.invalidatedGeneratedTake });
  } catch (e) {
    if ((e as Error & { code?: string }).code === "script_revision_conflict")
      return res.status(409).json({ error: (e as Error).message, code: "script_revision_conflict" });
    throw e;
  }
}));

app.post("/api/projects/:id/vo", upload.fields([{ name: "vo", maxCount: 1 }]), wrap(async (req, res) => {
  try {
    await placeVo(req.params.id, req.files as Record<string, Express.Multer.File[]>);
  } catch (e) {
    // Bad/silent recordings are the caller's to fix — surface the message, don't 500.
    return res.status(400).json({ error: String((e as Error)?.message ?? e) });
  }
  await insertProjectMessage({
    projectId: req.params.id, userId: userId(req), role: "user", kind: "voice", body: { mode: "recorded" },
  });
  res.json({ ok: true });
}));

// Generate the voiceover from the current script in the creator's cloned voice — the alternative to
// recording it. Missing key answers fast (503) before the profile/synth work even starts.
app.post("/api/projects/:id/generate-vo", wrap(async (req, res) => {
  if (!process.env.ELEVENLABS_API_KEY)
    return res.status(503).json({ error: "Generated voiceovers aren't available right now." });
  const out = await startGenerateVo(req.params.id, userId(req), {
    expectedRevision: req.body?.expectedRevision ? String(req.body.expectedRevision) : undefined,
  });
  await insertProjectMessage({
    projectId: req.params.id, userId: userId(req), role: "editor", kind: "voice",
    body: { mode: "cloned", durationSec: out.voSec, revision: out.scriptRevision },
  });
  res.json(out);
}));

// The generated take, streamable for the record screen's preview player (owner-gated by mount).
app.get("/api/projects/:id/vo", wrap(async (req, res) => {
  const p = join(projectDir(req.params.id), "vo.wav");
  if (!existsSync(p)) return res.status(404).json({ error: "No voiceover yet." });
  res.sendFile(p);
}));

// The reel is built around the voiceover (length, captions, cut timing all derive from it), so
// assemble without vo.wav can only fail — cryptically, deep in transcribe (seen in prod when an
// empty recording upload was dropped). Refuse fast with a message the app shows verbatim.
app.post("/api/projects/:id/assemble", wrap(async (req, res) => {
  if (!existsSync(join(projectDir(req.params.id), "vo.wav")))
    // code lets the app route back to the record screen instead of a dead-end error state.
    return res.status(400).json({ error: "Record your voiceover first — the reel is built around it.", code: "vo_missing" });
  try {
    await assertGeneratedTakeMatchesScript(projectDir(req.params.id));
  } catch (e) {
    return res.status(409).json({ error: (e as Error).message, code: (e as Error & { code?: string }).code });
  }
  track(userId(req), "assemble_started", { projectId: req.params.id });
  startAssemble(req.params.id);
  res.json({ ok: true });
}));

// "Render in HD" — re-render the same cut at 1080p once the user is happy with the draft.
app.post("/api/projects/:id/finalize", wrap(async (req, res) => {
  if (!(await ensureProjectClips(req.params.id)))
    return res.status(410).json({ error: "This reel's source clips have expired — you can still watch and share it as is." });
  track(userId(req), "hd_render_started", { projectId: req.params.id });
  startFinalize(req.params.id);
  res.json({ ok: true });
}));

// Each refine is a real agent run: capped per reel, and impossible once sources have been pruned.
const REFINE_LIMIT = 10;
app.post("/api/projects/:id/refine", wrap(async (req, res) => {
  if (!(await ensureProjectClips(req.params.id)))
    return res.status(410).json({ error: "This reel's source clips have expired — you can still watch and share it as is." });
  if ((await refineCount(req.params.id)) >= REFINE_LIMIT)
    return res.status(429).json({ error: "You've hit the edit limit for this reel — create a new one to keep going." });
  startRefine(req.params.id, String(req.body.message ?? ""));
  res.json({ ok: true });
}));

// THE status source (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md).
// Serves the one contract {lifecycle, phase, steps, error, canRetry, reelUrl}; the pre-contract
// fields (state/stage/reply) ride along for exactly one build generation, then die.
app.get("/api/projects/:id/status", wrap(async (req, res) => {
  res.set("Cache-Control", "no-store");
  const s = getStatus(req.params.id);
  const project = await getProject(req.params.id);
  const format = project?.format ?? "voiceover";
  const lifecycle = lifecycleFor(req.params.id, format, project?.status);
  const phase = s.state === "running" ? s.phase : undefined;
  res.json({
    ...s, // deprecated legacy fields (state/stage/reply) — remove after the next build is verified
    phase,
    lifecycle,
    steps: stepsFor(s.stage, format, phase, s.phasesDone),
    error: lifecycle === "error" ? (s.error ?? "Something went wrong — try again.") : undefined,
    canRetry: lifecycle === "error" ? true : undefined,
    reply: s.reply ?? (lifecycle === "ready" && s.state === "error" ? s.error : undefined),
    reelUrl: lifecycle === "ready" || lifecycle === "editing" ? currentReelUrl(req.params.id) : s.reelUrl,
  });
}));

app.post("/api/projects/:id/signal", (req, res) => {
  const signalType = String(req.body.type ?? "unknown");
  recordSignal(req.params.id, signalType, req.body.data).catch((e) => console.warn("[signal]", e));
  track(userId(req), `reel_${signalType}`, { projectId: req.params.id, ...(req.body?.data && typeof req.body.data === "object" ? req.body.data : {}) });
  res.json({ ok: true });
});

app.get("/api/projects/:id/reel", wrap(async (req, res) => {
  const local = join(projectDir(req.params.id), "edit", "final.mp4");
  if (existsSync(local)) return res.sendFile(local);
  const stored = await fetchProjectOutput(req.params.id, "current", req.header("range"));
  if (!stored?.body) return res.status(404).json({ error: "reel not found" });
  res.status(stored.status);
  res.set("Content-Type", "video/mp4");
  for (const name of ["content-range", "content-length", "accept-ranges"]) {
    const value = stored.headers.get(name);
    if (value) res.set(name, value);
  }
  Readable.fromWeb(stored.body as never).pipe(res);
}));

// The reel's cover photo — the title-card first frame, extracted at render time.
app.get("/api/projects/:id/cover", (req, res) =>
  res.sendFile(join(projectDir(req.params.id), "edit", "cover.jpg")),
);

// Delete a reel: DB row first (ownership/list truth), then the on-disk workspace. Refused while a
// job is running — yanking files out from under a live render/refine leaves zombie processes.
app.delete("/api/projects/:id", requireIdle, wrap(async (req, res) => {
  await deleteProjectObjects(req.params.id, userId(req));
  await deleteProject(req.params.id);
  await removeProjectDir(req.params.id);
  clearStatus(req.params.id);
  track(userId(req), "project_deleted", { projectId: req.params.id });
  res.json({ ok: true });
}));

// Convert upload-limit violations into human messages (multer throws before our handlers run);
// everything else unexpected still becomes a JSON 500 instead of a crash.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    const limitGb = Math.round((MAX_UPLOAD_BYTES / 1024 ** 3) * 10) / 10;
    const msg = err.code === "LIMIT_FILE_SIZE"
      ? `That video is too large — clips up to ${limitGb}GB each work. Trim it in Photos and try again.`
      : err.code === "LIMIT_FILE_COUNT"
        ? "That's more clips than one reel can take — pick up to 12."
        : `Upload rejected (${err.code}).`;
    // Name the cause in the logs — a mid-stream 413 severs the connection before the client can
    // read this message, so railway logs are where the diagnosis happens.
    console.warn(`[upload] rejected: ${err.code}${err.field ? ` (field ${err.field})` : ""}`);
    track("server", "upload_rejected", { code: err.code });
    return res.status(413).json({ error: msg });
  }
  console.error("[express]", err);
  if (!res.headersSent) res.status(500).json({ error: String((err as { message?: string })?.message ?? err) });
});

const port = Number(process.env.PORT ?? 8787);
const server = app.listen(port, () => console.log(`Bokeh — local API on http://localhost:${port}`));
// Node kills any request whose body takes >5min by default (requestTimeout=300s). A clip upload on
// a slow connection can legitimately run longer — Node severed those sockets mid-stream and the
// user saw a bare 502 from the edge (observed twice on TestFlight). 30min is plenty and still bounded.
server.requestTimeout = 30 * 60 * 1000;
