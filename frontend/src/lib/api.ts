import { joinUrl } from "./url";
import { currentToken } from "./auth";
import type { ClipFile, ProjectLifecycle, ProjectMessage, ProjectStatus, ReelFormat, ScriptResult, VoFile } from "./types";

/** Merge the current access token into request headers. Every /api/projects call is authenticated. */
async function authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const t = await currentToken();
  return { ...(extra ?? {}), ...(t ? { Authorization: `Bearer ${t}` } : {}) };
}

/** Throw the server's own error message when it sent one (quota text, "clips never uploaded", ...);
 *  fall back to a labeled status code. The UI shows these verbatim. A machine-readable `code`
 *  (e.g. "vo_missing") rides along so callers can route recovery instead of dead-ending. */
async function raise(r: Response, label: string): Promise<never> {
  const body = await r.json().catch(() => null);
  const msg = typeof body?.error === "string" ? body.error : null;
  const err = new Error(msg || `${label} failed: ${r.status}`) as Error & { code?: string; status?: number };
  if (typeof body?.code === "string") err.code = body.code;
  err.status = r.status;
  throw err;
}

export async function capabilities(base: string): Promise<{
  formats: ReelFormat[]; generatedVoice: boolean; motionGraphics: boolean; directProjectMedia: boolean;
  directMediaMaxBytes?: number;
}> {
  const r = await fetch(joinUrl(base, "/api/capabilities"), { cache: "no-store" });
  if (!r.ok) await raise(r, "capabilities");
  return r.json();
}

export async function createProject(base: string, input: { format?: ReelFormat; title?: string } = {}): Promise<{ id: string; format: ReelFormat; dir: string }> {
  const r = await fetch(joinUrl(base, "/api/projects"), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify(input),
  });
  if (!r.ok) await raise(r, "createProject");
  return r.json();
}

export type ServerProject = { id: string; title: string | null; status: string; format: ReelFormat; lifecycle: ProjectLifecycle; cover: string | null; created_at: string };
export async function listProjects(base: string): Promise<ServerProject[]> {
  const r = await fetch(joinUrl(base, "/api/projects"), { headers: await authHeaders(), cache: "no-store" });
  if (!r.ok) await raise(r, "listProjects");
  return r.json();
}

export async function deleteProject(base: string, id: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}`), { method: "DELETE", headers: await authHeaders() });
  if (!r.ok) await raise(r, "deleteProject");
}

export type ProjectDetail = {
  id: string; title: string | null; format: ReelFormat; lifecycle: ProjectLifecycle;
  currentReel: string | null; cover: string | null; canUndo: boolean;
  voice: { canGenerate: boolean; generatedTake?: { durationSec?: number; revision?: string } | null } | null;
  script: { text: string; revision: string } | null;
};

export async function getProjectDetail(base: string, id: string): Promise<ProjectDetail> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}`), { headers: await authHeaders(), cache: "no-store" });
  if (!r.ok) await raise(r, "project");
  return r.json();
}

export async function getProjectMessages(base: string, id: string): Promise<ProjectMessage[]> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/messages`), { headers: await authHeaders(), cache: "no-store" });
  if (!r.ok) await raise(r, "messages");
  return r.json();
}

export async function sendProjectMessage(base: string, id: string, text: string, clientId: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/messages`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify({ text, clientId }),
  });
  if (!r.ok) await raise(r, "message");
}

export async function undoProjectEdit(base: string, id: string): Promise<{ reelUrl: string; canUndo: false }> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/undo`), { method: "POST", headers: await authHeaders() });
  if (!r.ok) await raise(r, "undo");
  return r.json();
}

export async function reserveProjectAsset(base: string, id: string, clip: ClipFile, sizeBytes?: number): Promise<{
  asset: { id: string };
  upload: { endpoint: string; bucketName: string; objectName: string; chunkSize: number };
}> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/assets`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ filename: clip.name, mimeType: clip.type, sizeBytes }),
  });
  if (!r.ok) await raise(r, "reserveAsset");
  return r.json();
}

export async function completeProjectAsset(base: string, id: string, assetId: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/assets/${assetId}/complete`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: "{}",
  });
  if (!r.ok) await raise(r, "completeAsset");
}

function xhrUpload(url: string, form: FormData, token: string | null, onProgress?: (f: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    // Use e.total instead of e.lengthComputable: React Native's iOS multipart uploads often report
    // lengthComputable=false even when the total is known, which would suppress every progress update.
    if (onProgress) xhr.upload.onprogress = (e) => { if (e.total > 0) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `upload failed: ${xhr.status}`;
      try { const b = JSON.parse(xhr.responseText); if (typeof b?.error === "string") msg = b.error; } catch { /* keep fallback */ }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("Upload didn't go through — check your connection and try again."));
    xhr.send(form as any);
  });
}

export async function uploadVo(base: string, id: string, vo: VoFile, onProgress?: (f: number) => void) {
  const form = new FormData();
  form.append("vo", { uri: vo.uri, name: vo.name, type: vo.type } as any);
  return xhrUpload(joinUrl(base, `/api/projects/${id}/vo`), form, await currentToken(), onProgress);
}

// Whether this creator has a cloned voice set up. Never throws — any failure just means "no voice
// yet," so the record screen's generate branch quietly falls back to the teleprompter.
export async function voiceStatus(base: string): Promise<{ hasVoice: boolean }> {
  const r = await fetch(joinUrl(base, "/api/voice"), { headers: await authHeaders() });
  if (!r.ok) return { hasVoice: false };
  return r.json();
}

export async function voiceSetup(base: string, sample: VoFile): Promise<void> {
  const form = new FormData();
  form.append("sample", { uri: sample.uri, name: sample.name, type: sample.type } as any);
  return xhrUpload(joinUrl(base, "/api/voice/setup"), form, await currentToken());
}

export async function deleteVoice(base: string): Promise<void> {
  const r = await fetch(joinUrl(base, "/api/voice"), { method: "DELETE", headers: await authHeaders() });
  if (!r.ok) await raise(r, "deleteVoice");
}

// Synthesize the current script in the creator's cloned voice — the alternative to recording it.
export async function generateVo(base: string, id: string, expectedRevision?: string): Promise<{ voSec: number; scriptRevision: string }> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/generate-vo`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify({ expectedRevision }),
  });
  if (!r.ok) await raise(r, "generateVo");
  return r.json();
}

export async function saveScript(base: string, id: string, script: string, expectedRevision: string): Promise<{ scriptRevision: string }> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/script`), {
    method: "PATCH", headers: await authHeaders({ "content-type": "application/json" }),
    body: JSON.stringify({ script, expectedRevision }),
  });
  if (!r.ok) await raise(r, "saveScript");
  return r.json();
}

export async function generatePlan(base: string, id: string, args: { hasIdea: boolean; context?: string }): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/plan`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify(args),
  });
  if (!r.ok) await raise(r, "plan");
}

// One server-side prep job: analyze then plan. The client just POSTs this and polls status.
export async function startPrepJob(base: string, id: string, args: { hasIdea: boolean; context?: string; script?: string }): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/prep`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify(args),
  });
  if (!r.ok) await raise(r, "prep");
}

/** Fast script-only rewrite for one of the plan's angle alternates (storyboard stays). */
export async function switchAngle(base: string, id: string, angle: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/angle`), {
    method: "POST", headers: await authHeaders({ "content-type": "application/json" }), body: JSON.stringify({ angle }),
  });
  if (!r.ok) await raise(r, "angle");
}

export async function getScript(base: string, id: string): Promise<ScriptResult> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/script`), { headers: await authHeaders() });
  if (!r.ok) await raise(r, "getScript");
  return r.json();
}

export async function startAssemble(base: string, id: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/assemble`), { method: "POST", headers: await authHeaders() });
  if (!r.ok) await raise(r, "assemble");
}

// Re-render the current cut at 1080p. Same deterministic pipeline, higher quality.
export async function finalize(base: string, id: string): Promise<void> {
  const r = await fetch(joinUrl(base, `/api/projects/${id}/finalize`), { method: "POST", headers: await authHeaders() });
  if (!r.ok) await raise(r, "finalize");
}

export async function getStatus(base: string, id: string): Promise<ProjectStatus> {
  // no-store: never let the platform HTTP cache serve a 304 for a poll — a 304 has
  // no body and would be treated as an error, hanging the poll loop.
  const r = await fetch(joinUrl(base, `/api/projects/${id}/status`), { headers: await authHeaders(), cache: "no-store" });
  if (!r.ok) await raise(r, "status");
  return r.json();
}

// Best-effort learning-signal capture. Never blocks or breaks the UI — errors are swallowed.
export function sendSignal(base: string, id: string, type: string, data?: unknown): void {
  authHeaders({ "content-type": "application/json" })
    .then((headers) => fetch(joinUrl(base, `/api/projects/${id}/signal`), { method: "POST", headers, body: JSON.stringify({ type, data }) }))
    .catch(() => {}); // best-effort; never block the UI
}
