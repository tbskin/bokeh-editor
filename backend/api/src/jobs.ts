import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureEditDocument, refineJob, reviseVoiceoverScript, runAnalyzeJob, runPlanJob, runAngleSwitch, runTalkingHeadJob, assembleReel, runAssembleLoop, renderFromEdl, measureCreatorWps, parseScriptMd, synthesizeVo, voSource } from "@ole/engine";
import { projectDir } from "./store";
import { insertProjectMessage, projectFormat, projectOwner, setProjectStatus } from "./db";
import { noteReel, noteWps, readProfile, clearVoice } from "./profiles";
import { track } from "./telemetry";
import { withEditCheckpoint } from "./checkpoints";
import { invalidateGeneratedTake, readScriptState, updateScript } from "./script-state";
import { uploadProjectOutput } from "./object-storage";

type Stage = "analyze" | "plan" | "assemble";
type Status = { state: "idle" | "running" | "done" | "error"; stage?: Stage; reelUrl?: string; error?: string; phase?: string; reply?: string; phasesDone?: string[] };

// ---- The one state contract (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md) ----
// Canonical ordered phase lists, living NEXT TO the code that emits them. The app renders these
// verbatim; it holds no copy (the old client copy drifted stale within a week).
export const STAGE_PHASES: Record<string, string[]> = {
  "prep": ["watching your footage", "writing your script"],
  "assemble:voiceover": ["transcribing your voiceover", "tightening your take", "cutting your clips",
    "adding captions", "rendering your reel", "watching your cut", "polishing the cut", "finishing up"],
  "assemble:talking_head": ["transcribing every take", "comparing repeated takes",
    "assembling the cleanest takes", "checking cut and caption correctness", "rendering your reel", "finishing up"],
};

/** Ledger advance: the phase that just ended joins phasesDone. Pure (setPhase applies it). */
export function advancePhase(s: Status, phase: string): Status {
  const phasesDone = s.phase && s.phase !== phase && !(s.phasesDone ?? []).includes(s.phase)
    ? [...(s.phasesDone ?? []), s.phase]
    : (s.phasesDone ?? []);
  return { ...s, phase, phasesDone };
}

/** The active stage's full step list with completion — a coarse poll can never skip a step. Pure. */
export function stepsFor(stage: Stage | undefined, format: string, phase: string | undefined, phasesDone: string[] = []): { name: string; done: boolean }[] | undefined {
  const list = stage === "analyze" || stage === "plan" ? STAGE_PHASES["prep"]
    : stage === "assemble" ? STAGE_PHASES[`assemble:${format}`] ?? STAGE_PHASES["assemble:voiceover"]
    : undefined;
  if (!list) return undefined;
  if (stage === "analyze" || stage === "plan") {
    return list.map((name, i) => ({ name, done: stage === "plan" && i === 0 }));
  }
  const at = phase ? list.indexOf(phase) : -1;
  return list.map((name, i) => ({ name, done: phasesDone.includes(name) || (at >= 0 && i < at) }));
}

const status = new Map<string, Status>();

// Status is write-through persisted to data/<id>/status.json so a finished reel survives a server
// restart (the phone polls /status; before this, a restart made every project read "idle" forever).
const persist = (id: string, s: Status) => {
  try {
    mkdirSync(projectDir(id), { recursive: true });
    writeFileSync(join(projectDir(id), "status.json"), JSON.stringify({ ...s, pid: process.pid }));
  } catch { /* best-effort — never fail a job over bookkeeping */ }
};
const resumeMarker = (id: string) => join(projectDir(id), "resume-attempt.json");
const setStatus = (id: string, s: Status) => {
  status.set(id, s); persist(id, s);
  if (s.state !== "running") { try { rmSync(resumeMarker(id), { force: true }); } catch { /* bookkeeping */ } }
};

/** For deploy discipline: /api/health exposes this so nothing pushes while prod is mid-job. */
export const runningJobs = (): number => [...status.values()].filter((s) => s.state === "running").length;

/** What a boot-orphaned job (killed by a deploy restart) can safely restart as, from disk truth
 *  alone. Deliberately conservative: an orphaned script revision or angle switch must NOT silently
 *  re-plan the original (script.md existing means the first prep finished — the orphan was an edit
 *  to it), and an orphaned refine must not rebuild the first cut over the creator's edits — those
 *  return null and settle as honest errors instead. */
export function orphanResumePlan(dataRoot: string, id: string, s: Status, format: string | null): "prep" | "assemble" | "finalize" | null {
  const has = (f: string) => existsSync(join(dataRoot, id, f));
  const inPhases = (name: string) => s.phase === name || (s.phasesDone ?? []).includes(name);
  if (s.stage === "analyze" || s.stage === "plan") {
    return !has("script.md") && has("prep-request.json") ? "prep" : null;
  }
  if (s.stage === "assemble") {
    if (format === "talking_head") return has("prep-request.json") ? "prep" : null;
    if (inPhases("rendering in HD")) return "finalize";                 // finalize's first phase
    if (inPhases("transcribing your voiceover")) return "assemble";     // assemble's first phase
    return null; // a refine — its message died with the process; over an existing reel this shows as a reply, not a dead card
  }
  return null;
}

async function resumeOrphan(dataRoot: string, id: string, s: Status): Promise<boolean> {
  const format = s.stage === "assemble" ? await projectFormat(id).catch(() => null) : null;
  const plan = orphanResumePlan(dataRoot, id, s, format);
  if (plan === "prep") startPrep(id, JSON.parse(readFileSync(join(dataRoot, id, "prep-request.json"), "utf8")));
  else if (plan === "assemble") startAssemble(id);
  else if (plan === "finalize") startFinalize(id);
  else return false;
  console.log(`[sweep] resumed orphaned ${s.stage} for ${id} as ${plan}`);
  return true;
}

/** Boot sweep: jobs die with the process (deploys restart it), but their persisted statuses used
 *  to keep saying "running" — the app then showed "watching footage" forever (shipped twice).
 *  Any running status written by a DEAD process is an orphan; restartable ones resume themselves
 *  (once — a marker stops crash loops), the rest become honest, retryable errors. The pid guard
 *  makes this a no-op for jobs this process actually owns. */
export async function sweepOrphanJobs(dataRoot: string, resume: (id: string, s: Status) => Promise<boolean> = (id, s) => resumeOrphan(dataRoot, id, s)): Promise<{ resumed: number; errored: number }> {
  let resumed = 0, errored = 0;
  let ids: string[] = [];
  try { ids = readdirSync(dataRoot).filter((d) => !d.startsWith("_") && !d.startsWith("lost")); } catch { return { resumed, errored }; }
  for (const id of ids) {
    try {
      const p = join(dataRoot, id, "status.json");
      const s = JSON.parse(readFileSync(p, "utf8")) as Status & { pid?: number };
      if (s.state !== "running" || s.pid === process.pid) continue;
      const marker = join(dataRoot, id, "resume-attempt.json");
      const alreadyTried = existsSync(marker);
      let ok = false;
      if (!alreadyTried) {
        writeFileSync(marker, JSON.stringify({ stage: s.stage, at: new Date().toISOString() }));
        ok = await resume(id, s).catch(() => false);
      }
      if (ok) { resumed += 1; }
      else {
        const honest: Status = {
          state: "error", stage: s.stage,
          error: "The server restarted mid-job — tap Try again to pick up where it left off.",
        };
        writeFileSync(p, JSON.stringify({ ...honest, pid: process.pid }));
        status.set(id, honest);
        rmSync(marker, { force: true });
        errored += 1;
      }
      track(`project:${id}`, "job_orphaned", { projectId: id, stage: s.stage, resumed: ok, secondDeath: alreadyTried });
    } catch { /* unreadable status — leave it */ }
  }
  return { resumed, errored };
}

// A persisted "running" from ANOTHER process is a lie — the in-memory job died with that process.
// Surface it as an interrupted error so the app can offer a retry instead of polling forever.
const readPersisted = (id: string): Status | undefined => {
  try {
    const { pid, ...s } = JSON.parse(readFileSync(join(projectDir(id), "status.json"), "utf8")) as Status & { pid?: number };
    if (s.state === "running" && pid !== process.pid) {
      return { state: "error", stage: s.stage, error: "job interrupted by a server restart — retry" };
    }
    return s;
  } catch { return undefined; }
};

export const getStatus = (id: string): Status => status.get(id) ?? readPersisted(id) ?? { state: "idle" };

/** The current output URL is a revision identity, not a request-time cache buster. Returning the
 * same URL while the output is unchanged prevents media clients from restarting playback on every
 * project-detail poll; successful assemble/refine/finalize jobs mint the next timestamped URL. */
export const currentReelUrl = (id: string): string =>
  getStatus(id).reelUrl ?? `/api/projects/${id}/reel`;

/** Forget a deleted project's in-memory status (its persisted status.json dies with the dir). */
export const clearStatus = (id: string): void => { status.delete(id); };

/** Undo restores a prior render outside normal job execution — but polling/status must reflect
 * the restored cut immediately, not the pre-undo reelUrl left over from the last completed job.
 * Persists through the same write-through status.json path as every other status change. */
export const setReelUrl = (id: string, reelUrl: string): void => {
  setStatus(id, { ...getStatus(id), reelUrl });
};

const reelUrlFor = (id: string) => `/api/projects/${id}/reel?t=${Date.now()}`;
// Live phase update from a running code job — only if it's still the running job (never clobber a
// done/error that raced in).
const setPhase = (id: string, phase: string) => {
  const s = status.get(id);
  if (s?.state === "running") setStatus(id, advancePhase(s, phase));
};

// User-facing errors are human sentences (repo rule). Our own throws are written that way; system
// errors (ENOENT, ECONNREFUSED...) leak file paths and mean nothing to a creator — those get one
// honest line while the raw error stays in logs/telemetry. Known routed codes pass through.
const HUMAN_ERROR_CODES = new Set(["script_revision_conflict", "vo_missing"]);
export function presentError(e: unknown): string {
  const code = (e as { code?: string })?.code;
  const msg = String((e as Error)?.message ?? e);
  if ((code && !HUMAN_ERROR_CODES.has(code)) || /ENOENT|EACCES|ECONN|EPIPE|errno|no such file/i.test(msg))
    return "Something broke on our side — tap Try again.";
  return msg;
}

// Job failures land in status.json for the app, but ALSO log them — railway logs is how prod
// failures get diagnosed, and a silent status write leaves nothing to read there.
const fail = (id: string, stage: Stage) => (e: unknown) => {
  console.error(`[job] ${stage} failed for ${id}:`, e);
  track(`project:${id}`, "job_failed", { projectId: id, stage, error: String(e).slice(0, 300) });
  setStatus(id, { state: "error", stage, error: presentError(e) });
  setProjectStatus(id, "error").catch(() => {});
  projectOwner(id).then((uid) => {
    if (!uid) return null;
    return insertProjectMessage({
      projectId: id, userId: uid, role: "editor", kind: "error",
      body: { text: presentError(e).slice(0, 1000) },
    });
  }).catch(() => {});
};

// The closed-loop-learning breadcrumb: every hook the writer considered (chosen + alternates), so
// hooks_generated can later be joined against reel_saved/reel_shared to learn which hooks work.
const trackHooks = (id: string) => {
  try {
    const plan = JSON.parse(readFileSync(join(projectDir(id), "plan.json"), "utf8"));
    track(`project:${id}`, "hooks_generated", {
      projectId: id, angle: plan.angle, style: plan.style,
      title: plan.title, titleAlternates: plan.titleAlternates, openerAlternates: plan.openerAlternates,
    });
  } catch { /* observing must never break the observed */ }
};

// The script gate's meter: every prep emits what the critic found and whether the draft was
// rewritten — the ledger row that shows script quality actually improving (or not) over time.
const trackScriptCritique = (id: string) => {
  try {
    const c = JSON.parse(readFileSync(join(projectDir(id), "script-critique.json"), "utf8")) as
      { failures?: { check: string }[]; rewritten?: boolean; afterFailures?: { check: string }[]; criticError?: string };
    track(`project:${id}`, "script_critiqued", {
      projectId: id, rewritten: !!c.rewritten,
      failures: (c.failures ?? []).map((f) => f.check),
      afterFailures: (c.afterFailures ?? []).map((f) => f.check),
      ...(c.criticError ? { criticError: c.criticError.slice(0, 200) } : {}),
    });
  } catch { /* observing must never break the observed */ }
};

function run(id: string, stage: Stage, work: () => Promise<unknown>, withReel = false) {
  setStatus(id, { state: "running", stage });
  work()
    .then(() =>
      setStatus(id, { state: "done", stage, ...(withReel ? { reelUrl: reelUrlFor(id) } : {}) }),
    )
    .catch(fail(id, stage));
}

/** One server-owned job that runs analyze THEN plan, so the client just uploads clips, POSTs once, and
 *  polls. The stage moves analyze -> plan; done (state=done, stage=plan) means the reel is ready to
 *  record. The whole prep survives an app reload because the server, not the client, drives it. */
/** True when analysis.json already describes exactly the clips on disk — a retry after a plan
 *  failure must not re-watch footage that hasn't changed. */
function analysisCovers(id: string): boolean {
  try {
    const a = JSON.parse(readFileSync(join(projectDir(id), "analysis.json"), "utf8")) as { clips?: { file: string }[] };
    const analyzed = new Set((a.clips ?? []).map((c) => c.file.replace(/^clips\//, "")));
    const onDisk = readdirSync(join(projectDir(id), "clips")).filter((f) => /\.(mov|mp4|m4v)$/i.test(f));
    return onDisk.length > 0 && analyzed.size === onDisk.length && onDisk.every((f) => analyzed.has(f));
  } catch { return false; }
}

export function startPrep(id: string, args: { context?: string; hasIdea: boolean; userScript?: string }) {
  const skipAnalyze = analysisCovers(id);
  setStatus(id, { state: "running", stage: skipAnalyze ? "plan" : "analyze" });
  let completedStage: Stage = "plan";
  (async () => {
    const format = await projectFormat(id);
    if (format === "talking_head") {
      completedStage = "assemble";
      setStatus(id, { state: "running", stage: "assemble", phase: "transcribing every take" });
      const result = await runTalkingHeadJob({ workDir: projectDir(id), context: args.context, onPhase: (p) => setPhase(id, p) });
      const uid = await projectOwner(id);
      if (uid) {
        track(uid, "talking_head_candidates_found", { projectId: id, count: result.candidates.length, groups: result.groups.length });
        const selected = new Set(result.plan.selectedCandidateIds);
        for (const candidate of result.candidates) track(uid, selected.has(candidate.id) ? "talking_head_take_selected" : "talking_head_take_rejected", {
          projectId: id, candidateId: candidate.id, source: candidate.source, issues: candidate.issues,
        });
        await insertProjectMessage({
          projectId: id, userId: uid, role: "editor", kind: "direction", clientId: "initial-direction",
          body: { text: result.plan.storyline, takeGroups: result.plan.takeGroups, compromises: result.plan.compromises },
        });
        await insertProjectMessage({
          projectId: id, userId: uid, role: "editor", kind: "reel", clientId: "initial-reel",
          body: { reelUrl: reelUrlFor(id), summary: "I compared the repeated attempts, removed the bad takes and false starts, and assembled the strongest complete first cut." },
        });
      }
      await uploadProjectOutput(id, "current", join(projectDir(id), "edit", "final.mp4"));
      await setProjectStatus(id, "ready");
      return;
    }
    if (skipAnalyze) {
      console.log(`[prep] ${id}: analysis already covers these clips — resuming at plan`);
    } else {
      await runAnalyzeJob({ workDir: projectDir(id), context: args.context });
    }
    setStatus(id, { state: "running", stage: "plan" });
    const prof = await projectOwner(id).then((uid) => (uid ? readProfile(uid) : null)).catch(() => null);
    await runPlanJob({
      workDir: projectDir(id), hasIdea: args.hasIdea, context: args.context, userScript: args.userScript,
      creatorWps: prof?.wps, recentReels: prof?.recentReels?.slice(0, 5).map(({ angle, title, opener }) => ({ angle, title, opener })),
    });
    await invalidateGeneratedTake(projectDir(id));
    trackHooks(id);
    trackScriptCritique(id);
    const uid = await projectOwner(id);
    if (uid) {
      const plan = JSON.parse(readFileSync(join(projectDir(id), "plan.json"), "utf8")) as { angle?: string; title?: string };
      const script = parseScriptMd(readFileSync(join(projectDir(id), "script.md"), "utf8")).script;
      await insertProjectMessage({
        projectId: id, userId: uid, role: "editor", kind: "direction", clientId: "initial-direction",
        body: { text: plan.angle ?? plan.title ?? "A first direction based on your footage." },
      });
      await insertProjectMessage({
        projectId: id, userId: uid, role: "editor", kind: "script", clientId: "initial-script",
        body: { script, revision: (await readScriptState(projectDir(id))).revision },
      });
    }
    await setProjectStatus(id, "awaiting_voice");
  })()
    .then(() => setStatus(id, { state: "done", stage: completedStage, ...(completedStage === "assemble" ? { reelUrl: reelUrlFor(id) } : {}) }))
    .catch((e) => fail(id, completedStage)(e));
}

export function startAnalyze(id: string, context?: string) {
  run(id, "analyze", () => runAnalyzeJob({ workDir: projectDir(id), context }));
}
export function startPlan(id: string, args: { hasIdea: boolean; context?: string; userScript?: string }) {
  run(id, "plan", async () => {
    const prof = await projectOwner(id).then((uid) => (uid ? readProfile(uid) : null)).catch(() => null);
    return runPlanJob({
      workDir: projectDir(id), ...args,
      creatorWps: prof?.wps, recentReels: prof?.recentReels?.slice(0, 5).map(({ angle, title, opener }) => ({ angle, title, opener })),
    }).then(async (r) => { await invalidateGeneratedTake(projectDir(id)); trackHooks(id); return r; });
  });
}

/** Fast angle switch: script-only rewrite for a chosen alternate (sequence and pace stay). */
export function startAngleSwitch(id: string, angle: string) {
  run(id, "plan", () => runAngleSwitch({ workDir: projectDir(id), angle }).then(async (r) => {
    await invalidateGeneratedTake(projectDir(id));
    trackHooks(id);
    return r;
  }));
}

const GEN_CAP_PER_DAY = 5;

// Cap state lives per project, per UTC day — a fresh day resets it, and it's never shared across
// projects (a creator generating for reel A shouldn't burn reel B's budget).
function readGenCount(id: string): { day: string; count: number } {
  const today = new Date().toISOString().slice(0, 10); // UTC day
  try {
    const j = JSON.parse(readFileSync(join(projectDir(id), "vo.gen-count.json"), "utf8"));
    if (j.day === today) return { day: today, count: j.count };
  } catch { /* fresh */ }
  return { day: today, count: 0 };
}

function writeGenCount(id: string, st: { day: string; count: number }): void {
  writeFileSync(join(projectDir(id), "vo.gen-count.json"), JSON.stringify(st));
}

/** Synthesize the current script into this project's vo slot. Throws human sentences. The cap is
 *  CHECKED before synthesis and only WRITTEN after synthesizeVo resolves — a failed generation
 *  (upstream error, vanished voice) must never burn a slot the creator never actually got. */
async function generateVo(args: { id: string; voiceId: string; apiKey: string; expectedRevision?: string; synth?: typeof synthesizeVo }): Promise<{ voSec: number; chars: number; scriptRevision: string }> {
  const st = readGenCount(args.id);
  if (st.count >= GEN_CAP_PER_DAY) {
    throw new Error("You've made enough versions for today — record it yourself or come back tomorrow.");
  }
  let md: string;
  try {
    md = readFileSync(join(projectDir(args.id), "script.md"), "utf8");
  } catch {
    throw new Error("This reel doesn't have a script yet — prep it first.");
  }
  const state = await readScriptState(projectDir(args.id));
  if (args.expectedRevision && state.revision !== args.expectedRevision) {
    const e = new Error("The script changed before the voiceover was generated. Reload it and try again.") as Error & { code?: string };
    e.code = "script_revision_conflict";
    throw e;
  }
  const { script } = parseScriptMd(md);
  const { voSec, chars } = await (args.synth ?? synthesizeVo)({
    workDir: projectDir(args.id), script, voiceId: args.voiceId, apiKey: args.apiKey, scriptRevision: state.revision,
  });
  writeGenCount(args.id, { day: st.day, count: st.count + 1 });
  return { voSec, chars, scriptRevision: state.revision };
}
export { generateVo as generateVoForTest };

/** Route-facing wrapper: profile + key checks, upstream-vanished recovery, telemetry. `synth` is a
 *  test seam only — the route never passes it, so production always goes through synthesizeVo. */
export async function startGenerateVo(id: string, uid: string, opts: { expectedRevision?: string; synth?: typeof synthesizeVo } = {}): Promise<{ voSec: number; chars: number; scriptRevision: string }> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Generated voiceovers aren't available right now.");
  const voiceId = readProfile(uid).voiceId;
  if (!voiceId) throw new Error("Set up your voice first — it takes about a minute.");
  const regen = readGenCount(id).count; // pre-increment count: 0 for the first generation today
  try {
    const out = await generateVo({ id, voiceId, apiKey, expectedRevision: opts.expectedRevision, synth: opts.synth });
    track(uid, "vo_generated", { projectId: id, voSec: out.voSec, chars: out.chars, regen, via: "tts" });
    return out;
  } catch (e) {
    if (String(e).includes("voice_not_found")) {
      clearVoice(uid);
      throw new Error("Your voice needs setting up again — it takes about a minute.");
    }
    throw e;
  }
}

/** The first cut: deterministic draft, judged; the Codex loop polishes only when the draft fails
 *  the ship bar. OLE_ASSEMBLE_LOOP=0 is the kill-switch back to the plain deterministic render. */
export function startAssemble(id: string) {
  setStatus(id, { state: "running", stage: "assemble", phase: "transcribing your voiceover" });
  const job = process.env.OLE_ASSEMBLE_LOOP === "0"
    ? assembleReel({ workDir: projectDir(id), quality: "draft", onPhase: (p) => setPhase(id, p) })
    : runAssembleLoop({ workDir: projectDir(id), onPhase: (p) => setPhase(id, p) });
  job.then(async () => {
    await uploadProjectOutput(id, "current", join(projectDir(id), "edit", "final.mp4"));
    await setProjectStatus(id, "ready");
    setStatus(id, { state: "done", stage: "assemble", reelUrl: reelUrlFor(id) });
    const uid = await projectOwner(id);
    if (uid) await insertProjectMessage({
      projectId: id, userId: uid, role: "editor", kind: "reel", clientId: "initial-reel",
      body: { reelUrl: reelUrlFor(id), summary: "Your first cut is ready. Ask for any change in the conversation." },
    }).catch((e) => console.warn(`[messages] couldn't persist initial reel for ${id}:`, e));
  })
     .catch(fail(id, "assemble"));
  // Closed loop (account level): this take teaches us the creator's real speaking pace, so the NEXT
  // script is written for how they actually talk. Never blocks or fails the reel.
  job.then(async () => {
    const uid = await projectOwner(id);
    if (!uid) return;
    // A cloned-voice take runs at the TTS engine's pace, not the creator's — folding it into the
    // wps average would corrupt the very thing this loop measures. Only recorded takes teach it.
    if ((await voSource(projectDir(id))) !== "tts") {
      const m = await measureCreatorWps(projectDir(id));
      if (m) {
        const p = noteWps(uid, m.wps);
        console.log(`[learn] creator ${uid.slice(0, 8)}: ${m.wps} wps this take -> profile ${p.wps} wps over ${p.wpsSamples} take(s)`);
      }
    }
    // ...and remember WHAT they made — the next script reads this so no two reels re-tread.
    try {
      const plan = JSON.parse(readFileSync(join(projectDir(id), "plan.json"), "utf8")) as { angle?: string; title?: string };
      const opener = parseScriptMd(readFileSync(join(projectDir(id), "script.md"), "utf8")).script.split(/(?<=[.!?])\s/)[0] ?? "";
      noteReel(uid, { angle: plan.angle, title: plan.title, opener });
    } catch { /* a reel without a plan teaches nothing */ }
  }).catch(() => {});
}

/** "Render in HD": re-render the EXISTING cut (edit/edl.json) at 1080p — preserves every edit the
 *  loop or refine made (the old assembleReel call rebuilt the EDL from plan.json, stomping them). */
export function startFinalize(id: string) {
  setStatus(id, { state: "running", stage: "assemble", phase: "rendering in HD" });
  renderFromEdl({ workDir: projectDir(id), quality: "preview", onPhase: (p) => setPhase(id, p) })
    .then(async () => {
      await uploadProjectOutput(id, "current", join(projectDir(id), "edit", "final.mp4"));
      await setProjectStatus(id, "ready");
      setStatus(id, { state: "done", stage: "assemble", reelUrl: reelUrlFor(id) });
    })
    .catch(fail(id, "assemble"));
}

/** Refine stays agentic — it's an open-ended edit ("tighten the intro", "beach clip first").
 *  The agent's closing summary rides along in status as `reply` — the editor's side of the chat. */
export function startRefine(id: string, message: string, uid?: string) {
  setStatus(id, { state: "running", stage: "assemble" });
  (async () => {
    try {
      const editResult = await withEditCheckpoint(projectDir(id), async () => {
        await ensureEditDocument(projectDir(id), await projectFormat(id));
        const result = await refineJob({ workDir: projectDir(id), message });
        if (!result.unsupported) {
          await uploadProjectOutput(id, "previous", join(projectDir(id), ".ole-checkpoints", "pending", "edit", "final.mp4"));
          await uploadProjectOutput(id, "current", join(projectDir(id), "edit", "final.mp4"));
        }
        return result;
      }, { commitWhen: (result) => !result.unsupported });
      const { reply } = editResult;
      const text = reply ?? (editResult.unsupported ? "That edit isn't supported yet." : "That change is ready.");
      if (editResult.unsupported) {
        if (uid) await insertProjectMessage({ projectId: id, userId: uid, role: "editor", kind: "text", body: { text } });
        track(uid ?? `project:${id}`, "unsupported_edit", { projectId: id, request: message.slice(0, 200) });
        await setProjectStatus(id, "ready");
        setStatus(id, { state: "done", stage: "assemble", reelUrl: reelUrlFor(id), reply: text });
        return;
      }
      if (uid) await insertProjectMessage({ projectId: id, userId: uid, role: "editor", kind: "text", body: { text } });
      track(uid ?? `project:${id}`, "edit_applied", { projectId: id });
      await setProjectStatus(id, "ready");
      setStatus(id, { state: "done", stage: "assemble", reelUrl: reelUrlFor(id), reply: text });
    } catch (e) {
      const text = String((e as Error)?.message ?? e);
      track(uid ?? `project:${id}`, "edit_failed", { projectId: id, error: text.slice(0, 300) });
      fail(id, "assemble")(e);
    }
  })().catch(fail(id, "assemble"));
}

export function startScriptRevision(id: string, message: string, uid: string) {
  setStatus(id, { state: "running", stage: "plan", phase: "revising your script" });
  (async () => {
    const before = await readScriptState(projectDir(id));
    const revised = await reviseVoiceoverScript({ workDir: projectDir(id), message });
    const saved = await updateScript({ workDir: projectDir(id), script: revised.script, expectedRevision: before.revision });
    await insertProjectMessage({ projectId: id, userId: uid, role: "editor", kind: "script", body: { script: revised.script, revision: saved.revision } });
    await insertProjectMessage({ projectId: id, userId: uid, role: "editor", kind: "text", body: { text: revised.summary } });
    setStatus(id, { state: "done", stage: "plan", reply: revised.summary });
  })().catch(fail(id, "plan"));
}
