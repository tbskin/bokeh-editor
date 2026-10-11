import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Edl } from "./edl";
import { probeReel, checkIntegrity, type ReelProbe } from "./verify";

const pExecFile = promisify(execFile);

export type Severity = "critical" | "important" | "minor";
export type RubricDimension =
  | "voice" | "pacing" | "footage" | "framing" | "color" | "captions" | "structure" | "integrity" | "length";

/** One problem found on a finished reel. `check` is a stable id (for closed-loop attribution);
 *  `fixHint` tells the agent what to do about it. */
export type CritiqueProblem = {
  dimension: RubricDimension;
  check: string;
  severity: Severity;
  message: string;
  fixHint?: string;
};

/** A VO transcript word (matches the shape written by video-use transcribe.py / used by buildSrtFromVo). */
export type Word = { type?: string; text?: string; start?: number; end?: number };

/** Tunable thresholds — the knobs the closed loop turns. Defaults come from the rubric spec. */
export type CritiqueConfig = {
  minClipSec: number;
  maxHoldSec: number;
  cutBeatToleranceSec: number;
  maxReelSec: number;
  leadDeadAirSec: number;
  midGapSec: number;
  targetLufs: number;
  lufsToleranceDb: number;
};

export const CRITIQUE_DEFAULTS: CritiqueConfig = {
  minClipSec: 1.2,
  maxHoldSec: 5.0,
  cutBeatToleranceSec: 0.3,
  maxReelSec: 90,
  leadDeadAirSec: 0.15,
  midGapSec: 1.0,
  targetLufs: -14,
  lufsToleranceDb: 2.0,
};

/** Sorted unique word-boundary times (each word's start and end). */
function wordBoundaries(words: Word[]): number[] {
  const s = new Set<number>();
  for (const w of words) {
    if (w.type !== "word") continue;
    if (typeof w.start === "number") s.add(w.start);
    if (typeof w.end === "number") s.add(w.end);
  }
  return [...s].sort((a, b) => a - b);
}

function nearestDist(sorted: number[], x: number): number {
  let best = Infinity;
  for (const v of sorted) best = Math.min(best, Math.abs(v - x));
  return best;
}

// Threshold comparisons tolerate 20ms of float/rounding error (below frame granularity). Without
// this, an agent cutting a range to exactly the 1.2s floor gets flagged for 1.1999999999999997s —
// seen on the first real checkpoint run.
const EPS = 0.02;

/** Pacing/structure meters computable from the EDL + VO word timings alone. Pure. */
export function checkTimeline(edl: Edl, words: Word[], cfg: CritiqueConfig): CritiqueProblem[] {
  const p: CritiqueProblem[] = [];
  const ranges = edl.ranges ?? [];

  ranges.forEach((r, i) => {
    const dur = r.end - r.start;
    if (dur < cfg.minClipSec - EPS) p.push({
      dimension: "pacing", check: "min-clip-length", severity: "important",
      message: `clip ${i} is on screen ${dur.toFixed(2)}s (< ${cfg.minClipSec}s min) — reads as a glitch`,
      fixHint: "merge with a neighbor or extend the range to at least the min-clip floor",
    });
    if (dur > cfg.maxHoldSec + EPS) p.push({
      dimension: "pacing", check: "max-hold", severity: "important",
      message: `clip ${i} holds ${dur.toFixed(2)}s (> ${cfg.maxHoldSec}s) — check it earns the length`,
      fixHint: "trim it or cut away sooner unless something in the clip is happening",
    });
  });

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i], b = ranges[j];
      if (a.source === b.source && a.start < b.end && b.start < a.end) p.push({
        dimension: "structure", check: "clip-reused", severity: "critical",
        message: `source "${a.source}" is used twice with overlapping ranges (clips ${i} and ${j})`,
        fixHint: "each source range must play once — drop or re-range one of them",
      });
    }
  }

  if (edl.total_duration_s > cfg.maxReelSec) p.push({
    dimension: "length", check: "over-max-length", severity: "critical",
    message: `reel is ${edl.total_duration_s.toFixed(1)}s (> ${cfg.maxReelSec}s cap)`,
    fixHint: "governed upstream — flag for a shorter script / re-record; do NOT chop the voice",
  });

  const bounds = wordBoundaries(words);
  if (bounds.length) {
    let acc = 0;
    for (let i = 0; i < ranges.length - 1; i++) {
      acc += ranges[i].end - ranges[i].start;
      const d = nearestDist(bounds, acc);
      if (d > cfg.cutBeatToleranceSec) p.push({
        dimension: "pacing", check: "cut-off-beat", severity: "important",
        message: `cut ${i + 1} at ${acc.toFixed(2)}s is ${d.toFixed(2)}s off the nearest voice beat`,
        fixHint: "snap the cut to the nearest word boundary that still respects the min-clip floor",
      });
    }
  }

  return p;
}

export type AudioMeasure = (path: string) => Promise<{ lufs: number; leadSilenceSec: number }>;

/** Parse integrated LUFS (ebur128) and any leading silence (silencedetect) out of ffmpeg's stderr. Pure. */
export function parseAudioMeasure(stderr: string): { lufs: number; leadSilenceSec: number } {
  const lufsMatch = [...stderr.matchAll(/I:\s*(-?\d+(?:\.\d+)?)\s*LUFS/g)].pop();
  const lufs = lufsMatch ? parseFloat(lufsMatch[1]) : -14;
  // Leading silence: a silence_start at (or ~at) 0 followed by its silence_end.
  let leadSilenceSec = 0;
  const startIdx = stderr.search(/silence_start:\s*0(?:\.0+)?\b/);
  if (startIdx >= 0) {
    const endMatch = stderr.slice(startIdx).match(/silence_end:\s*(\d+(?:\.\d+)?)/);
    if (endMatch) leadSilenceSec = parseFloat(endMatch[1]);
  }
  return { lufs, leadSilenceSec };
}

/** Default audio measurement: one ffmpeg pass (silencedetect + ebur128), both read from stderr. */
export const measureAudio: AudioMeasure = async (path) => {
  const { stderr } = await pExecFile("ffmpeg", [
    "-hide_banner", "-nostats", "-i", path,
    "-af", "silencedetect=noise=-40dB:d=0.1,ebur128", "-f", "null", "-",
  ], { maxBuffer: 16 * 1024 * 1024 }).catch((e: any) => ({ stderr: String(e?.stderr ?? "") }));
  return parseAudioMeasure(stderr);
};

function maxInterWordGap(words: Word[]): { sec: number; at: number } {
  const real = words.filter((w) => w.type === "word" && typeof w.start === "number" && typeof w.end === "number");
  let best = { sec: 0, at: 0 };
  for (let i = 1; i < real.length; i++) {
    const gap = (real[i].start as number) - (real[i - 1].end as number);
    if (gap > best.sec) best = { sec: gap, at: real[i - 1].end as number };
  }
  return best;
}

/** Voiceover-spine meters, given already-measured values. Pure. */
export function checkVoice(input: {
  reelDurationSec: number; words: Word[];
  audio: { lufs: number; leadSilenceSec: number }; cfg: CritiqueConfig;
}): CritiqueProblem[] {
  const { reelDurationSec, words, audio, cfg } = input;
  const p: CritiqueProblem[] = [];
  const real = words.filter((w) => w.type === "word" && typeof w.end === "number");
  const lastEnd = real.length ? Math.max(...real.map((w) => w.end as number)) : 0;

  if (lastEnd > 0 && reelDurationSec + 0.05 < lastEnd) p.push({
    dimension: "voice", check: "last-word-clipped", severity: "critical",
    message: `reel is ${reelDurationSec.toFixed(2)}s but the voiceover's last word ends at ${lastEnd.toFixed(2)}s — the voice is cut off`,
    fixHint: "extend the visual so video length >= voiceover length before muxing",
  });

  const gap = maxInterWordGap(words);
  if (gap.sec > cfg.midGapSec) p.push({
    dimension: "voice", check: "dead-gap-mid", severity: "important",
    message: `~${gap.sec.toFixed(2)}s of narration silence around ${gap.at.toFixed(2)}s (voiceover should be continuous)`,
    fixHint: "usually a recording artifact — flag for re-record if severe, else tighten the visual over it",
  });

  if (audio.leadSilenceSec > cfg.leadDeadAirSec) p.push({
    dimension: "voice", check: "dead-air-open", severity: "important",
    message: `reel opens with ${audio.leadSilenceSec.toFixed(2)}s of silence (should open on the first spoken word)`,
    fixHint: "trim the leading silence",
  });

  if (Math.abs(audio.lufs - cfg.targetLufs) > cfg.lufsToleranceDb) p.push({
    dimension: "voice", check: "loudness-off", severity: "important",
    message: `integrated loudness ${audio.lufs.toFixed(1)} LUFS vs target ${cfg.targetLufs} LUFS`,
    fixHint: "normalize the voiceover toward the target LUFS",
  });

  return p;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, important: 1, minor: 2 };

/** Watch a finished reel with meters only (no model). Reuses probeReel for integrity, one audio
 *  pass for loudness/lead-silence, and the pure timeline/voice checks. Deterministic + hermetic. */
export async function critiqueReel(input: {
  reelPath: string;
  edl: Edl;
  words: Word[];
  cfg?: Partial<CritiqueConfig>;
  probe?: (p: string) => Promise<ReelProbe>;
  audio?: AudioMeasure;
}): Promise<CritiqueProblem[]> {
  // The plan's pace rides in the EDL: a "long-takes" reel (complete plays, tricks, demos) is not
  // judged by quick-pace hold caps — otherwise the loop pays an agent to chop what the planner chose.
  const paceHold: Record<string, number> = { quick: 5.0, medium: 8.0, "long-takes": 15.0 };
  const paceCap = paceHold[String((input.edl.metadata as { pace?: string } | undefined)?.pace ?? "")];
  const cfg = { ...CRITIQUE_DEFAULTS, ...(paceCap ? { maxHoldSec: paceCap } : {}), ...(input.cfg ?? {}) };
  const probe = input.probe ?? probeReel;
  const audioM = input.audio ?? measureAudio;
  const info = await probe(input.reelPath);
  // File integrity comes from the shared checks in verify.ts — one source of truth.
  const problems: CritiqueProblem[] = [...checkIntegrity(info)];

  problems.push(...checkTimeline(input.edl, input.words, cfg));

  const audio = info.hasAudio ? await audioM(input.reelPath) : { lufs: cfg.targetLufs, leadSilenceSec: 0 };
  problems.push(...checkVoice({ reelDurationSec: info.durationSec, words: input.words, audio, cfg }));

  return problems.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/** Counts by severity + the ship gate (rubric decision #7: no broken/amateur remaining). */
export function summarizeCritique(problems: CritiqueProblem[]): { critical: number; important: number; minor: number; passesShipBar: boolean } {
  const by = (s: Severity) => problems.filter((p) => p.severity === s).length;
  const critical = by("critical"), important = by("important");
  return { critical, important, minor: by("minor"), passesShipBar: critical + important === 0 };
}
