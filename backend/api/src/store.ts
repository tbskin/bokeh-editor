import { appendFile, mkdir, readdir, rename, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pExecFile = promisify(execFile);

// Read OLE_DATA lazily (not a frozen module-level constant) so it can be overridden
// per-test after this module has already been imported.
export const projectDir = (id: string) => join(process.env.OLE_DATA ?? join(process.cwd(), "data"), id);

/** Create the on-disk workspace for a project whose id + ownership already live in the DB. */
export async function ensureProjectDir(id: string): Promise<void> {
  await mkdir(join(projectDir(id), "clips"), { recursive: true });
}

/** Remove a project's entire on-disk workspace (clips, vo, edit state, renders). */
export async function removeProjectDir(id: string): Promise<void> {
  await rm(projectDir(id), { recursive: true, force: true });
}

// A voiceover with (almost) nothing in it fails cryptically far downstream (silence-trim leaves a
// near-empty wav that breaks transcription). Below this, reject at upload with a human message.
const MIN_VO_SEC = 1.5;

// Internal dead air longer than this is a recording artifact (the rubric demands wall-to-wall
// voice); it gets compressed down to KEEP_SILENCE_SEC. Pauses under the threshold are rhythm.
const MAX_PAUSE_SEC = 1.2;
const KEEP_SILENCE_SEC = 0.2;

/** Silence spans (start/end seconds) inside an audio file, from ffmpeg silencedetect. */
async function silenceSpans(path: string): Promise<Array<{ start: number; end: number }>> {
  const { stderr } = await pExecFile("ffmpeg", [
    "-hide_banner", "-nostats", "-i", path,
    "-af", `silencedetect=noise=-40dB:d=${MAX_PAUSE_SEC}`, "-f", "null", "-",
  ]).catch((e: { stderr?: string }) => ({ stderr: String(e?.stderr ?? "") }));
  const spans: Array<{ start: number; end: number }> = [];
  let start: number | null = null;
  for (const line of stderr.split("\n")) {
    const s = line.match(/silence_start:\s*(-?\d+(?:\.\d+)?)/);
    const e = line.match(/silence_end:\s*(-?\d+(?:\.\d+)?)/);
    if (s) start = parseFloat(s[1]);
    if (e && start != null) { spans.push({ start, end: parseFloat(e[1]) }); start = null; }
  }
  return spans;
}

/** Transcode any uploaded audio to the canonical 16kHz mono PCM WAV the recipe expects.
 *  Leading silence is trimmed (the reel opens on the voice) and internal pauses over
 *  MAX_PAUSE_SEC are compressed to a KEEP_SILENCE_SEC beat. Runs BEFORE transcription, so
 *  captions/timeline/EDL all see the tightened track — nothing downstream needs to know. */
export async function toVoWav(inputPath: string, outPath: string) {
  await pExecFile("ffmpeg", [
    "-y", "-i", inputPath,
    // Leading-silence trim only — users tap record, then start speaking a beat later.
    "-af", "silenceremove=start_periods=1:start_duration=0.05:start_threshold=-40dB",
    "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", outPath,
  ]);

  // Compress internal pauses: cut each detected span down to the kept beat, sample-exact.
  const cuts = (await silenceSpans(outPath))
    .map((s) => ({ start: s.start + KEEP_SILENCE_SEC / 2, end: s.end - KEEP_SILENCE_SEC / 2 }))
    .filter((s) => s.end - s.start > 0.05);
  if (cuts.length) {
    const expr = cuts.map((s) => `between(t,${s.start.toFixed(3)},${s.end.toFixed(3)})`).join("+");
    const tight = `${outPath}.tight.wav`;
    await pExecFile("ffmpeg", [
      "-y", "-i", outPath,
      "-af", `aselect='not(${expr})',asetpts=N/SR/TB`,
      "-c:a", "pcm_s16le", tight,
    ]);
    await rename(tight, outPath);
  }
  const dur = await pExecFile("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", outPath,
  ]).then((r) => parseFloat(r.stdout.trim()) || 0).catch(() => 0);
  if (dur < MIN_VO_SEC) {
    await rm(outPath, { force: true });
    throw new Error("We couldn't hear a voiceover in that recording — try again, a bit closer to the mic.");
  }
}

/** Move uploaded clips into the project's clips/ dir (keep original filenames). */
export async function placeClips(id: string, files?: Record<string, Express.Multer.File[]>) {
  for (const f of files?.clips ?? []) {
    await rename(f.path, join(projectDir(id), "clips", f.originalname));
  }
}

/** Normalize the uploaded voiceover to canonical 16kHz mono vo.wav. */
export async function placeVo(id: string, files?: Record<string, Express.Multer.File[]>) {
  // No vo field at all = the phone's recording file was empty/missing and RN dropped it from the
  // form. Silently succeeding here let assemble start with no vo.wav and fail cryptically far
  // downstream (seen in prod) — refuse loudly instead.
  if (!files?.vo?.[0]) {
    throw new Error("That recording didn't come through — tap Record and read your script again.");
  }
  const upload = files.vo[0].path;
  await toVoWav(upload, join(projectDir(id), "vo.wav"));
  await rm(upload, { force: true });
  // Bug class: a stale generated take's markers surviving a fresh recording. If this project
  // previously used "Generate my voiceover", vo.meta.json (via:"tts") and the exact TTS transcript
  // are still on disk. prepareEdit's voSource() check reads vo.meta.json to decide whether to skip
  // transcription — left in place, it would read the human take as still-TTS and cut it against the
  // ABANDONED generated transcript instead of re-transcribing the words actually spoken. A recorded
  // take must erase both so the engine re-derives everything from the new vo.wav.
  await rm(join(projectDir(id), "vo.meta.json"), { force: true });
  await rm(join(projectDir(id), "edit", "transcripts", "vo.json"), { force: true });
}

/** Delete leftover multer temp files — a killed upload orphans its half-written stream target.
 *  Safe at boot (no requests in flight). Returns how many were removed. */
export async function sweepTmp(): Promise<number> {
  const tmp = join(process.env.OLE_DATA ?? join(process.cwd(), "data"), "_tmp");
  const files = await readdir(tmp).catch(() => [] as string[]);
  for (const f of files) await rm(join(tmp, f), { recursive: true, force: true }).catch(() => {});
  return files.length;
}

/** Free the bulk of an expired project (source clips, draft visual, agent traces) while keeping the
 *  reel itself playable and shareable. A project's dir mtime is its last activity; the 5GB volume
 *  fills after ~15-25 full projects, so without this the product simply stops. Returns pruned ids. */
export async function pruneExpiredSources(maxAgeDays = 14): Promise<string[]> {
  const root = process.env.OLE_DATA ?? join(process.cwd(), "data");
  const cutoff = Date.now() - maxAgeDays * 86400e3;
  const pruned: string[] = [];
  for (const id of await readdir(root).catch(() => [] as string[])) {
    if (id.startsWith("_")) continue; // _tmp etc.
    const dir = join(root, id);
    const s = await stat(dir).catch(() => null);
    if (!s?.isDirectory() || s.mtimeMs > cutoff) continue;
    const hadClips = await stat(join(dir, "clips")).then(() => true).catch(() => false);
    if (!hadClips) continue; // already pruned (or never had sources)
    await rm(join(dir, "clips"), { recursive: true, force: true }).catch(() => {});
    await rm(join(dir, "trace"), { recursive: true, force: true }).catch(() => {});
    await rm(join(dir, "edit", "visual.mp4"), { force: true }).catch(() => {});
    pruned.push(id);
  }
  return pruned;
}

/** How many agentic refines this project has burned (each is a real Codex run). Counted from the
 *  trace files so it survives restarts without any schema. */
export async function refineCount(id: string): Promise<number> {
  const files = await readdir(join(projectDir(id), "trace")).catch(() => [] as string[]);
  return files.filter((f) => f.startsWith("editor-refine-")).length;
}

/** Append-only learning signal log per project. Best-effort, never throws to the caller's flow. */
export async function recordSignal(id: string, type: string, data?: unknown): Promise<void> {
  const dir = projectDir(id);
  await mkdir(dir, { recursive: true });
  const line = JSON.stringify({ ts: Date.now(), type, data: data ?? null }) + "\n";
  await appendFile(join(dir, "signals.jsonl"), line);
}
