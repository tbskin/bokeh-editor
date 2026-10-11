import { createHash } from "node:crypto";
import { createReadStream, existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Runtime } from "./runtime";
import { editorRuntime } from "./runtime";
import { runVideoUse } from "./video-use";
import { validateEdl, type Edl } from "./edl";
import { fromV1 as editDocumentFromV1 } from "./edit-document";
import { toV1 as editDocumentToV1, validateEditDocument, type EditDocument } from "./edit-document";
import { renderDocumentOverlays } from "./motion-graphics";
import { verifyReel } from "./verify";
import { mixDocumentSfxIntoVideo } from "./assemble-reel";

const pExecFile = promisify(execFile);
const VIDEO = /\.(mov|mp4|m4v|mkv|avi)$/i;
const TERMINAL = /[.!?]["')\]]?$/;
const STOP = new Set("a an and are as at be but by for from i if in is it my of on or so that the this to was we were with you your".split(" "));

export type TakeIssue = "false_start" | "abandoned_sentence" | "verbal_mistake" | "repeated_attempt" | "long_dead_air" | "poor_audio" | "poor_visual";
export type TakeCandidate = {
  id: string; source: string; startSec: number; endSec: number; transcript: string; semanticBeat: string; issues: TakeIssue[];
  /** Non-speech moments Scribe located inside this take, retained so a useful laugh is not silently lost. */
  preservedEvents?: string[];
  /** The speech boundary before padding; used by tests and future take swaps. */
  wordStartSec?: number;
  wordEndSec?: number;
};
export type TakeGroup = {
  semanticBeat: string; candidates: TakeCandidate[]; selectedCandidateId: string; rejectionReasons: Record<string, string>;
};
export type TalkingHeadPlan = {
  storyline: string;
  selectedCandidateIds: string[];
  takeGroups: Array<{ semanticBeat: string; candidateIds: string[]; selectedCandidateId: string; rejectionReasons: Record<string, string> }>;
  compromises: string[];
};

type ScribeWord = { type?: string; text?: string; start?: number; end?: number; speaker_id?: string };
type Transcript = { words?: ScribeWord[] };

const normTokens = (text: string) => text.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter((token) => token && !STOP.has(token));
const rawTokens = (text: string) => text.toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter(Boolean);
const similarity = (a: string, b: string): number => {
  const aa = new Set(normTokens(a)); const bb = new Set(normTokens(b));
  const union = new Set([...aa, ...bb]);
  return union.size ? [...aa].filter((token) => bb.has(token)).length / union.size : 0;
};
const repeatedOpening = (a: string, b: string): boolean => {
  const aa = rawTokens(a); const bb = rawTokens(b);
  const shortest = Math.min(aa.length, bb.length, 6);
  if (shortest < 3) return false;
  let common = 0;
  while (common < shortest && aa[common] === bb[common]) common++;
  return common >= 3 && common / shortest >= 0.75;
};
const candidateId = (source: string, start: number, end: number) =>
  createHash("sha1").update(`${source}:${start.toFixed(3)}:${end.toFixed(3)}`).digest("hex").slice(0, 12);

/** Sentence/silence candidate segmentation. Every edge is derived from a real Scribe word. */
export function segmentTakeCandidates(source: string, transcript: Transcript): TakeCandidate[] {
  const timed = (transcript.words ?? []).filter((word) => word.text?.trim() && word.start != null && word.end != null);
  const words = timed.filter((word) => word.type === "word") as Required<Pick<ScribeWord, "text" | "start" | "end">>[];
  const events = timed.filter((word) => word.type === "audio_event") as Required<Pick<ScribeWord, "text" | "start" | "end">>[];
  const candidates: TakeCandidate[] = [];
  let current: typeof words = [];
  const flush = () => {
    if (!current.length) return;
    const firstWord = current[0];
    const lastWord = current[current.length - 1];
    const keptEvents = events.filter((event) => event.start >= firstWord.start - 0.15 && event.start <= lastWord.end + 0.45);
    const text = [...current.map((word) => ({ ...word, event: false })), ...keptEvents.map((event) => ({ ...event, event: true }))]
      .sort((a, b) => a.start - b.start)
      .map((item) => item.event ? `(${item.text.trim().replace(/^\(|\)$/g, "")})` : item.text.trim())
      .join(" ").replace(/\s+([,.!?])/g, "$1");
    const tokens = normTokens(text);
    const issues: TakeIssue[] = [];
    if (tokens.length <= 5 && !TERMINAL.test(text)) issues.push("false_start");
    if (!TERMINAL.test(text) && tokens.length < 14) issues.push("abandoned_sentence");
    if (/\b(sorry|i mean|no wait|let me start|start again|scratch that|actually,? no)\b/i.test(text)) issues.push("verbal_mistake");
    const maxInternalGap = current.slice(1).reduce((largest, word, index) => Math.max(largest, word.start - current[index].end), 0);
    if (maxInternalGap >= 0.5) issues.push("long_dead_air");
    const plain = current.map((word) => word.text.toLowerCase().replace(/[^a-z0-9']/g, "")).filter(Boolean);
    if (plain.some((word, index) => index > 0 && word === plain[index - 1]) && !issues.includes("verbal_mistake")) issues.push("verbal_mistake");
    const startSec = Math.max(0, firstWord.start - 0.08);
    const eventEnd = keptEvents.reduce((latest, event) => Math.max(latest, event.end), lastWord.end);
    const endSec = eventEnd + 0.12;
    candidates.push({
      id: candidateId(source, startSec, endSec), source, startSec: Number(startSec.toFixed(3)), endSec: Number(endSec.toFixed(3)),
      transcript: text, semanticBeat: tokens.slice(0, 10).join(" ") || text.slice(0, 80), issues,
      preservedEvents: keptEvents.map((event) => event.text.trim().replace(/^\(|\)$/g, "")),
      wordStartSec: firstWord.start,
      wordEndSec: lastWord.end,
    });
    current = [];
  };
  for (const word of words) {
    const previous = current[current.length - 1];
    if (previous && (word.start - previous.end >= 0.75 || TERMINAL.test(previous.text))) flush();
    current.push(word);
  }
  flush();
  return candidates;
}

const candidateScore = (candidate: TakeCandidate): number => {
  const terminal = TERMINAL.test(candidate.transcript) ? 4 : 0;
  const issuePenalty = candidate.issues.filter((issue) => issue !== "repeated_attempt").length * 5;
  const words = Math.min(4, normTokens(candidate.transcript).length / 5);
  return terminal + words - issuePenalty;
};

/** Deterministic first-pass grouping; the planner can merge semantically equivalent restatements. */
export function groupCandidateTakes(candidates: TakeCandidate[]): TakeGroup[] {
  const groups: TakeGroup[] = [];
  for (const candidate of candidates) {
    const prefix = normTokens(candidate.transcript).slice(0, 4).join(" ");
    let group = groups.find((item) => similarity(item.candidates[0].transcript, candidate.transcript) >= 0.55
      || repeatedOpening(item.candidates[0].transcript, candidate.transcript)
      || (!!prefix && normTokens(item.candidates[0].transcript).slice(0, 4).join(" ") === prefix));
    if (!group) {
      group = { semanticBeat: candidate.semanticBeat, candidates: [], selectedCandidateId: candidate.id, rejectionReasons: {} };
      groups.push(group);
    }
    group.candidates.push(candidate);
  }
  for (const group of groups) {
    if (group.candidates.length > 1) for (const candidate of group.candidates) if (!candidate.issues.includes("repeated_attempt")) candidate.issues.push("repeated_attempt");
    const selected = [...group.candidates].sort((a, b) => candidateScore(b) - candidateScore(a))[0];
    group.selectedCandidateId = selected.id;
    group.rejectionReasons = Object.fromEntries(group.candidates.filter((candidate) => candidate.id !== selected.id).map((candidate) => [candidate.id, candidate.issues.length ? `Rejected: ${candidate.issues.join(", ")}.` : "A cleaner or more complete equivalent was available."]));
  }
  return groups;
}

async function fileHash(path: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolvePromise, reject) => {
    const stream = createReadStream(path);
    stream.on("data", (chunk) => hash.update(chunk)); stream.on("end", resolvePromise); stream.on("error", reject);
  });
  return hash.digest("hex");
}

async function transcribeSources(workDir: string, sources: string[]): Promise<void> {
  const editDir = join(workDir, "edit");
  const transcriptsDir = join(editDir, "transcripts");
  const hashDir = join(transcriptsDir, "by-hash");
  await mkdir(hashDir, { recursive: true });
  for (const source of sources) {
    const stem = basename(source, extname(source));
    const transcript = join(transcriptsDir, `${stem}.json`);
    const hashed = join(hashDir, `${await fileHash(source)}.json`);
    if (!existsSync(transcript) && existsSync(hashed)) await copyFile(hashed, transcript);
    if (!existsSync(transcript)) await runVideoUse(["transcribe.py", source, "--edit-dir", editDir], workDir);
    if (!existsSync(hashed)) await copyFile(transcript, hashed);
  }
  await runVideoUse(["pack_transcripts.py", "--edit-dir", editDir], workDir);
}

const selectionCompromise = (plan: TalkingHeadPlan, pattern: RegExp) => plan.compromises.some((item) => pattern.test(item));

/** Deterministic semantic/cut gate. A model proposes the story; this prevents it from shipping a
 * superseded take, duplicate meaning, incomplete speech, or untracked alternatives. */
export function validateTalkingHeadPlan(plan: TalkingHeadPlan, candidates: TakeCandidate[], groups = groupCandidateTakes(candidates)): void {
  if (!plan.storyline?.trim()) throw new Error("talking head: planner returned no storyline");
  if (!Array.isArray(plan.selectedCandidateIds) || !plan.selectedCandidateIds.length) throw new Error("talking head: planner selected no takes");
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  let total = 0;
  const seen = new Set<string>();
  for (const id of plan.selectedCandidateIds) {
    const candidate = byId.get(id);
    if (!candidate) throw new Error(`talking head: unknown candidate ${id}`);
    if (seen.has(id)) throw new Error(`talking head: duplicate candidate ${id}`);
    seen.add(id); total += candidate.endSec - candidate.startSec;
  }
  if (total > 60.01) throw new Error(`talking head: first cut is ${total.toFixed(1)}s, over the 60s maximum`);
  const selected = plan.selectedCandidateIds.map((id) => byId.get(id)!);
  const intentionalRepeat = selectionCompromise(plan, /intentional|rhetorical|repetition/i);
  for (let index = 0; index < selected.length; index++) {
    const candidate = selected[index];
    if (!TERMINAL.test(candidate.transcript) && !selectionCompromise(plan, /incomplete|no clean|compromise/i))
      throw new Error(`talking head: selected take ${candidate.id} is an incomplete sentence`);
    for (const other of selected.slice(index + 1)) {
      if (similarity(candidate.transcript, other.transcript) >= 0.72 && !intentionalRepeat)
        throw new Error(`talking head: selected takes ${candidate.id} and ${other.id} repeat the same meaning`);
    }
  }
  const fatal = new Set<TakeIssue>(["false_start", "abandoned_sentence", "verbal_mistake", "poor_audio", "poor_visual"]);
  for (const group of groups.filter((item) => item.candidates.length > 1)) {
    const selectedInGroup = group.candidates.filter((candidate) => seen.has(candidate.id));
    if (selectedInGroup.length > 1 && !intentionalRepeat)
      throw new Error(`talking head: repeated versions of “${group.semanticBeat}” were selected`);
    if (selectedInGroup.length === 1) {
      const choice = selectedInGroup[0];
      const cleaner = group.candidates.find((candidate) => !candidate.issues.some((issue) => fatal.has(issue)));
      if (choice.issues.some((issue) => fatal.has(issue)) && cleaner && cleaner.id !== choice.id)
        throw new Error(`talking head: selected ${choice.id} even though cleaner equivalent ${cleaner.id} exists`);
    }
    const recorded = plan.takeGroups.find((item) => item.candidateIds.some((id) => group.candidates.some((candidate) => candidate.id === id)));
    if (!recorded || group.candidates.some((candidate) => !recorded.candidateIds.includes(candidate.id)))
      throw new Error(`talking head: alternatives for “${group.semanticBeat}” were not retained`);
    if (selectedInGroup.length === 1 && recorded.selectedCandidateId !== selectedInGroup[0].id)
      throw new Error(`talking head: retained choice for “${group.semanticBeat}” does not match the cut`);
    for (const candidate of group.candidates) {
      if (candidate.id !== recorded.selectedCandidateId && !recorded.rejectionReasons[candidate.id])
        throw new Error(`talking head: rejection reason missing for ${candidate.id}`);
    }
  }
  const viableTotal = groups.reduce((sum, group) => {
    const viable = group.candidates.filter((candidate) => !candidate.issues.some((issue) => fatal.has(issue))).sort((a, b) => candidateScore(b) - candidateScore(a))[0];
    return sum + (viable ? viable.endSec - viable.startSec : 0);
  }, 0);
  if (total < 30 && viableTotal >= 30 && !selectionCompromise(plan, /short|under 30|concise/i))
    throw new Error(`talking head: ${total.toFixed(1)}s cut is short despite enough clean material`);
}

export function buildTalkingHeadEdl(plan: TalkingHeadPlan, candidates: TakeCandidate[], sourcePaths: Record<string, string>): Edl {
  validateTalkingHeadPlan(plan, candidates);
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));
  const ranges = plan.selectedCandidateIds.map((id) => {
    const candidate = byId.get(id)!;
    return { source: candidate.source, start: candidate.startSec, end: candidate.endSec, beat: candidate.semanticBeat, quote: candidate.transcript };
  });
  const total = ranges.reduce((sum, range) => sum + range.end - range.start, 0);
  const edl = {
    version: 1, sources: sourcePaths, ranges,
    grade: "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
    overlays: [], subtitles: "master.srt", total_duration_s: Number(total.toFixed(3)),
    metadata: { format: "talking_head", storyline: plan.storyline, takeGroups: plan.takeGroups, compromises: plan.compromises },
  } as Edl;
  validateEdl(edl);
  return edl;
}

async function planTalkingHead(input: { workDir: string; context?: string; candidates: TakeCandidate[]; groups: TakeGroup[]; runtime: Runtime }): Promise<TalkingHeadPlan> {
  const editDir = join(input.workDir, "edit");
  const planPath = join(editDir, "talking-head.plan.json");
  await writeFile(join(editDir, "talking-head.candidates.json"), JSON.stringify({ candidates: input.candidates, groups: input.groups }, null, 2));
  await input.runtime.run({
    cwd: input.workDir,
    task: "takes",
    traceFile: join(input.workDir, "trace", `editor-talking-head-${Date.now()}.jsonl`),
    reasoningEffort: "high",
    instruction: `Create the first cut of a talking-head reel. Submission already authorizes the cut: do not ask a question or wait for confirmation.\n\nRead edit/takes_packed.md and edit/talking-head.candidates.json. Inspect the candidate midpoint frames in edit/take-frames/ when choosing between takes; reject unusable framing, but do not punish ordinary natural movement. Creator context: ${JSON.stringify(input.context ?? "Find the best reel.")}\n\nChoose the strongest coherent 30–45 second hook/body/conclusion story (shorter is allowed only when the material does not support 30 seconds; absolute maximum 60). Compare every repeated attempt, including across files. Do not assume the last take is best. Select the cleanest complete delivery; reject false starts, abandoned sentences, verbal mistakes, dead air, unusable audio/framing, and superseded attempts. Preserve useful laughs and other preservedEvents, natural pauses, expressive delivery, and intentional rhetorical repetition. Never combine fragments in a way that changes what the creator said. If no clean version exists, choose the strongest complete attempt and record the compromise.\n\nWrite ONLY valid JSON to edit/talking-head.plan.json with this shape: {"storyline":"...","selectedCandidateIds":["..."],"takeGroups":[{"semanticBeat":"...","candidateIds":["..."],"selectedCandidateId":"...","rejectionReasons":{"candidate-id":"reason"}}],"compromises":["..."]}. Candidate IDs must come from the candidate file and selectedCandidateIds is playback order. Every repeated-attempt group must retain all alternatives and a reason for every rejected candidate. Do not edit any source or other file.`,
  });
  const plan = JSON.parse(await readFile(planPath, "utf8")) as TalkingHeadPlan;
  validateTalkingHeadPlan(plan, input.candidates, input.groups);
  return plan;
}

async function prepareCandidatePreviews(workDir: string, candidates: TakeCandidate[], sourcePaths: Record<string, string>): Promise<void> {
  const previewDir = join(workDir, "edit", "take-frames");
  await mkdir(previewDir, { recursive: true });
  for (const [sourceKey, source] of Object.entries(sourcePaths)) {
    const related = candidates.filter((candidate) => candidate.source === sourceKey);
    try {
      const probe = JSON.parse((await pExecFile("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", source])).stdout) as {
        streams?: Array<{ codec_type?: string; width?: number; height?: number }>;
        format?: { duration?: string };
      };
      const audio = probe.streams?.some((stream) => stream.codec_type === "audio");
      const video = probe.streams?.find((stream) => stream.codec_type === "video");
      const duration = Number(probe.format?.duration);
      for (const candidate of related) {
        if (!audio && !candidate.issues.includes("poor_audio")) candidate.issues.push("poor_audio");
        if (!video || (video.width ?? 0) < 240 || (video.height ?? 0) < 240) {
          if (!candidate.issues.includes("poor_visual")) candidate.issues.push("poor_visual");
        }
        if (Number.isFinite(duration)) candidate.endSec = Number(Math.min(candidate.endSec, duration).toFixed(3));
      }
    } catch {
      for (const candidate of related) if (!candidate.issues.includes("poor_visual")) candidate.issues.push("poor_visual");
    }
  }
  for (const candidate of candidates) {
    const source = sourcePaths[candidate.source];
    const frame = join(previewDir, `${candidate.id}.jpg`);
    try {
      await pExecFile("ffmpeg", ["-y", "-ss", String((candidate.startSec + candidate.endSec) / 2), "-i", source, "-frames:v", "1", "-vf", "scale=360:-2", "-q:v", "5", frame]);
    } catch {
      if (!candidate.issues.includes("poor_visual")) candidate.issues.push("poor_visual");
    }
  }
}

export async function runTalkingHeadJob(input: {
  workDir: string; context?: string; runtime?: Runtime; onPhase?: (phase: string) => void;
}): Promise<{ reelPath: string; plan: TalkingHeadPlan; candidates: TakeCandidate[]; groups: TakeGroup[] }> {
  const phase = input.onPhase ?? (() => {});
  const clipsDir = join(input.workDir, "clips");
  const files = (await readdir(clipsDir)).filter((file) => VIDEO.test(file)).map((file) => resolve(clipsDir, file));
  if (!files.length) throw new Error("talking head: no recordings found");
  phase("transcribing every take");
  await mkdir(join(input.workDir, "edit"), { recursive: true });
  await mkdir(join(input.workDir, "trace"), { recursive: true });
  await transcribeSources(input.workDir, files);
  const sourcePaths: Record<string, string> = {};
  const candidates: TakeCandidate[] = [];
  for (const file of files) {
    const stem = basename(file, extname(file));
    sourcePaths[stem] = file;
    const transcript = JSON.parse(await readFile(join(input.workDir, "edit", "transcripts", `${stem}.json`), "utf8")) as Transcript;
    candidates.push(...segmentTakeCandidates(stem, transcript));
  }
  if (!candidates.length) throw new Error("I couldn't find usable speech in those recordings.");
  const groups = groupCandidateTakes(candidates);
  await prepareCandidatePreviews(input.workDir, candidates, sourcePaths);
  phase("comparing repeated takes");
  const plan = await planTalkingHead({ workDir: input.workDir, context: input.context, candidates, groups, runtime: input.runtime ?? editorRuntime });
  const edl = buildTalkingHeadEdl(plan, candidates, sourcePaths);
  const editDir = join(input.workDir, "edit");
  await writeFile(join(editDir, "edl.json"), JSON.stringify(edl, null, 2));
  await writeFile(join(editDir, "edl.base.json"), JSON.stringify(edl, null, 2));
  await writeFile(join(editDir, "document.v2.json"), JSON.stringify(editDocumentFromV1(edl, "talking_head"), null, 2));
  await writeFile(join(editDir, "project.md"), `## Talking-head first cut\n\n**Storyline:** ${plan.storyline}\n\n**Compromises:** ${plan.compromises.join("; ") || "None"}\n`);
  phase("assembling the cleanest takes");
  const reelPath = join(editDir, "final.mp4");
  await runVideoUse(["render.py", join(editDir, "edl.json"), "-o", reelPath, "--draft", "--build-subtitles"], input.workDir);
  phase("checking cut and caption correctness");
  const critical = (await verifyReel(reelPath, { expectedDurationSec: edl.total_duration_s })).filter((problem) => problem.severity === "critical");
  if (critical.length) throw new Error(`talking head: reel failed verification — ${critical.map((problem) => problem.message).join("; ")}`);
  return { reelPath, plan, candidates, groups };
}

export async function renderTalkingHeadFromEdl(input: { workDir: string; quality?: "draft" | "preview" | "final" }): Promise<{ reelPath: string; durationSec: number }> {
  const editDir = join(input.workDir, "edit");
  const document = JSON.parse(await readFile(join(editDir, "document.v2.json"), "utf8")) as EditDocument;
  validateEditDocument(document);
  if (document.format !== "talking_head") throw new Error("talking head: wrong edit document format");
  const [w, h] = input.quality === "draft" ? [720, 1280] : [1080, 1920];
  const edl = editDocumentToV1(document, `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`);
  edl.overlays = await renderDocumentOverlays(input.workDir, document);
  await writeFile(join(editDir, "edl.json"), JSON.stringify(edl, null, 2));
  const reelPath = join(editDir, "final.mp4");
  const flag = input.quality === "draft" ? "--draft" : input.quality === "preview" ? "--preview" : null;
  await runVideoUse(["render.py", join(editDir, "edl.json"), "-o", reelPath, ...(flag ? [flag] : []), "--build-subtitles"], input.workDir);
  if (document.audio.sfx.length) {
    const mixed = join(editDir, "final.sfx.mp4");
    if (await mixDocumentSfxIntoVideo({ source: reelPath, destination: mixed, durationSec: edl.total_duration_s, sfx: document.audio.sfx })) await rename(mixed, reelPath);
  }
  const critical = (await verifyReel(reelPath, { expectedDurationSec: edl.total_duration_s })).filter((problem) => problem.severity === "critical");
  if (critical.length) throw new Error(`talking head: reel failed verification — ${critical.map((problem) => problem.message).join("; ")}`);
  return { reelPath, durationSec: edl.total_duration_s };
}
