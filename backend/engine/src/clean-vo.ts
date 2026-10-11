// A recorded take is never assumed perfect. Between transcription and the cut, this module removes
// what a human editor removes first: dead air (collapsed to a tight beat, hard cut) and bad takes
// (a re-read line — keep the LAST attempt; people re-read until they're happy). It is deliberately
// modular — audio + word timings in, cut spans out — because talking-head reels will run the same
// cleaner with script-aware take selection later. Downstream code never knows cleaning happened:
// vo.wav is shorter, the transcript is shifted (sample-exact via shiftWords), that's all.
import { copyFile, readFile, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Word } from "./critique";
import { shiftWords } from "./tighten";
import { ffprobeDurationSec } from "./eyes";

const pExecFile = promisify(execFile);

export type VoCut = { from: number; to: number; reason: "silence" | "retake" };

export const VO_CLEAN = {
  // Measured on a real founder take (2026-07-17): four pauses of 0.54-0.90s all survived a 0.9s
  // bar and the verdict was "the voice was not trimmed to the parts that actually have audio".
  // Vlog-core pacing wants pauses CUT, not curated.
  maxGapSec: 0.6,       // a mid-speech pause longer than this is dead air
  keepGapSec: 0.2,      // what a collapsed pause leaves behind — a hard cut, not a robotic zero
  trailGapSec: 0.6,     // silence tolerated after the last word before we trim the tail
  minRepeatTokens: 4,   // shortest identical word-run that reads as a re-take, not a figure of speech
  retakeWindowSec: 20,  // a re-take restarts within this long of the first attempt
  // Safety valves. Silence cuts sit between words so they can never remove speech — no cap. Retake
  // cuts DO remove spoken words; if they'd take more than this fraction of the recording, the
  // detector is probably chasing a transcription hallucination loop — keep the take untouched.
  maxRetakeFraction: 0.75,
  minKeepSec: 3,        // never clean a take below this length
};

const norm = (t: string | undefined) => (t ?? "").toLowerCase().replace(/[^a-z0-9']/g, "");

/** Real words only, in time order. */
function realWords(words: Word[]): (Word & { start: number; end: number })[] {
  return words
    .filter((w): w is Word & { start: number; end: number } =>
      w.type === "word" && typeof w.start === "number" && typeof w.end === "number" && !!norm(w.text))
    .sort((a, b) => a.start - b.start);
}

/**
 * Decide what to cut from a take, from word timings alone. Pure.
 * - silence: gaps > maxGapSec collapse to keepGapSec (plus a trailing-silence trim);
 * - retake: an identical run of >= minRepeatTokens words re-starting within retakeWindowSec means
 *   the first attempt (and the flub after it) goes, the last attempt stays.
 * Overlapping spans merge; the safety valve returns [] rather than gutting a take.
 */
export function planVoCuts(words: Word[], voDuration: number, opts: Partial<typeof VO_CLEAN> = {}): VoCut[] {
  const cfg = { ...VO_CLEAN, ...opts };
  const ws = realWords(words);
  if (ws.length < 2) return [];

  const spans: VoCut[] = [];

  // Re-takes first (their spans usually contain a silence too — merging favors the bigger reason).
  const tokens = ws.map((w) => norm(w.text));
  let scanFrom = 0;
  for (let j = cfg.minRepeatTokens; j <= tokens.length - cfg.minRepeatTokens; j++) {
    if (j < scanFrom) continue;
    for (let i = Math.max(scanFrom, 0); i + cfg.minRepeatTokens <= j; i++) {
      if (ws[j].start - ws[i].start > cfg.retakeWindowSec) continue;
      let k = 0;
      while (j + k < tokens.length && tokens[i + k] === tokens[j + k] && i + k < j) k++;
      if (k >= cfg.minRepeatTokens) {
        // Cut the first attempt: from just before its first word to just before the re-start.
        spans.push({ from: Math.max(0, ws[i].start - 0.05), to: Math.max(0, ws[j].start - 0.05), reason: "retake" });
        scanFrom = j; // resume after the kept take's start; a third attempt matches against this one
        break;
      }
    }
  }

  // Dead air between words.
  for (let i = 0; i < ws.length - 1; i++) {
    const gap = ws[i + 1].start - ws[i].end;
    if (gap > cfg.maxGapSec) {
      const pad = cfg.keepGapSec / 2;
      spans.push({ from: ws[i].end + pad, to: ws[i + 1].start - pad, reason: "silence" });
    }
  }
  // Silence after the last word (the fumble for the stop button).
  const tail = voDuration - ws[ws.length - 1].end;
  if (tail > cfg.trailGapSec) {
    spans.push({ from: ws[ws.length - 1].end + cfg.trailGapSec, to: voDuration, reason: "silence" });
  }

  // Merge overlaps (retakes win the reason label), keep time order.
  spans.sort((a, b) => a.from - b.from);
  const merged: VoCut[] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s.from <= last.to + 0.1) {
      last.to = Math.max(last.to, s.to);
      if (s.reason === "retake") last.reason = "retake";
    } else merged.push({ ...s });
  }

  const removed = merged.reduce((a, s) => a + (s.to - s.from), 0);
  const retakeRemoved = merged.filter((s) => s.reason === "retake").reduce((a, s) => a + (s.to - s.from), 0);
  if (removed <= 0.05) return [];
  if (retakeRemoved > voDuration * cfg.maxRetakeFraction) return []; // hallucination-loop guard
  if (voDuration - removed < cfg.minKeepSec) return []; // don't clean a take down to a stub
  return merged;
}

/** Remove the spans from a wav in one pass (sample-exact, same aselect mechanics as tighten). */
export async function applyVoCuts(voPath: string, spans: VoCut[]): Promise<void> {
  if (!spans.length) return;
  const cond = spans.map((s) => `between(t,${s.from.toFixed(3)},${s.to.toFixed(3)})`).join("+");
  const tmp = `${voPath}.clean.wav`;
  await pExecFile("ffmpeg", [
    "-y", "-i", voPath,
    "-af", `aselect='not(${cond})',asetpts=N/SR/TB`,
    "-c:a", "pcm_s16le", tmp,
  ]);
  await rename(tmp, voPath);
}

/** Shift word timings through the cuts (last span first so earlier coordinates stay valid). Pure. */
export function shiftWordsThroughCuts(words: Word[], spans: VoCut[]): Word[] {
  let out = words;
  for (const s of [...spans].sort((a, b) => b.from - a.from)) out = shiftWords(out, s.from, s.to);
  return out;
}

/**
 * Clean the project's recorded take in place: plan cuts from the transcript, cut vo.wav (the
 * pristine recording survives as vo.original.wav), shift transcripts/vo.json to match. Callers keep
 * using vo.wav + the transcript exactly as before. Returns what was removed, for the log line.
 */
export async function cleanVo(workDir: string): Promise<{ removedSec: number; cuts: VoCut[] }> {
  const voPath = join(workDir, "vo.wav");
  const trPath = join(workDir, "edit", "transcripts", "vo.json");
  const tr = JSON.parse(await readFile(trPath, "utf8")) as { words?: Word[] };
  const voDuration = await ffprobeDurationSec(voPath);
  const cuts = planVoCuts(tr.words ?? [], voDuration);
  if (!cuts.length) return { removedSec: 0, cuts };

  const original = join(workDir, "vo.original.wav");
  if (!existsSync(original)) await copyFile(voPath, original);
  await applyVoCuts(voPath, cuts);
  tr.words = shiftWordsThroughCuts(tr.words ?? [], cuts);
  await writeFile(trPath, JSON.stringify(tr, null, 2));

  const removedSec = Number(cuts.reduce((a, s) => a + (s.to - s.from), 0).toFixed(3));
  console.log(`[clean-vo] removed ${removedSec.toFixed(1)}s (${cuts.map((c) => c.reason).join(", ")})`);
  return { removedSec, cuts };
}
