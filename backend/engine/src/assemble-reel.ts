import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { type Edl, validateEdl } from "./edl";
import { fromV1 as editDocumentFromV1, toV1 as editDocumentToV1, validateEditDocument, type EditDocument } from "./edit-document";
import { renderDocumentOverlays } from "./motion-graphics";
import { verifyReel } from "./verify";
import { type Word, CRITIQUE_DEFAULTS } from "./critique";
import { cleanVo } from "./clean-vo";
import { toolCommands } from "./tools";
import { voSource } from "./tts-vo";

const pExecFile = promisify(execFile);

// video-use is VENDORED in this repo (backend/vendor/video-use) so local and prod run the exact
// same render pipeline — see backend/vendor/video-use/VENDORED.md. Override with OLE_VIDEO_USE_DIR
// only for experiments against a different checkout.
const VIDEO_USE_DIR = process.env.OLE_VIDEO_USE_DIR ?? fileURLToPath(new URL("../../vendor/video-use", import.meta.url));

export type Quality = "draft" | "preview" | "final";
export type PlanSeg = { file: string; start: number; end: number; note?: string; hold?: boolean; sfx?: string; anchor?: string };
export type TimelineSeg = { file: string; start: number; end: number; note?: string; hold?: boolean; sfx?: string; anchor?: string };
export type DroppedClip = { file: string; reason: string };

const MIN_SEG = 0.3;   // never emit a sub-clip shorter than this
const ANCHOR_LEAD = 0.15; // an anchored clip cuts in slightly before its words

/** Normalize a token for transcript matching. */
const tokNorm = (t: string | undefined) => (t ?? "").toLowerCase().replace(/[^a-z0-9']/g, "");

/**
 * Find where an anchor phrase (words from the script) is SPOKEN in the transcript: slide a window
 * over the real words, score positional token equality, accept the best window ≥ 60%. Searches from
 * `fromSec` first (anchors resolve in speech order) and falls back to the whole take. Pure.
 * Returns the start time of the matched window, or undefined (line edited out / ad-libbed away).
 */
export function matchAnchor(anchor: string, words: Word[], fromSec = 0): number | undefined {
  const aTok = anchor.split(/\s+/).map(tokNorm).filter(Boolean).slice(0, 8);
  if (aTok.length === 0) return undefined;
  const real = words.filter((w) => w.type === "word" && typeof w.start === "number" && tokNorm(w.text));
  const scan = (from: number): number | undefined => {
    let best: { score: number; at: number } | undefined;
    for (let s = 0; s + aTok.length <= real.length; s++) {
      if ((real[s].start as number) < from) continue;
      let hit = 0;
      for (let k = 0; k < aTok.length; k++) if (tokNorm(real[s + k].text) === aTok[k]) hit++;
      const score = hit / aTok.length;
      if (score >= 0.6 && (!best || score > best.score)) best = { score, at: real[s].start as number };
      if (best && best.score === 1) break; // earliest perfect match wins
    }
    return best?.at;
  };
  return scan(fromSec) ?? (fromSec > 0 ? scan(0) : undefined);
}

/**
 * Fit the planned sequence to the recorded voiceover — deterministically, and with two contracts:
 *
 * 1. EVERY planned clip appears (the creator picked them): a short read shrinks all cuts toward the
 *    floor instead of amputating the tail; a clip is dropped ONLY when the voice physically can't
 *    fit it at the floor, and every drop is returned with its reason.
 * 2. WORDS DRIVE PICTURES: a sequence entry with an `anchor` (the script words it sits under) cuts
 *    in when those words are SPOKEN — matched against the real transcript, so an edited/ad-libbed
 *    read still lands. Transcript order wins over plan order; un-anchored clips fill the gaps
 *    between anchors in their planned order. An anchor that no longer exists in the take simply
 *    degrades the clip to un-anchored filler.
 *
 * If footage falls short of the voice we grow cuts into unused source, then hold the final frame
 * (`holdTail`) as a last resort. Pure + exported so the math is unit-tested without ffmpeg.
 */
export function computeTimeline(
  sequence: PlanSeg[],
  voDuration: number,
  clipDurations: Record<string, number>,
  opts: { words?: Word[]; floorSec?: number } = {},
): { segments: TimelineSeg[]; holdTail: number; dropped: DroppedClip[] } {
  const dropped: DroppedClip[] = [];
  const floor = Math.max(MIN_SEG, opts.floorSec ?? 1.2);

  // 1. Clamp every planned range to the clip's real duration; drop clips we couldn't measure.
  const natural: TimelineSeg[] = [];
  for (const s of sequence) {
    const dur = clipDurations[s.file];
    if (dur == null || dur <= 0) { dropped.push({ file: s.file, reason: "missing or unreadable" }); continue; }
    const start = Math.max(0, Math.min(s.start, Math.max(0, dur - MIN_SEG)));
    let end = Math.min(s.end, dur);
    if (end - start < MIN_SEG) end = Math.min(dur, start + MIN_SEG);
    if (end - start < MIN_SEG) { dropped.push({ file: s.file, reason: "too short to use" }); continue; }
    natural.push({ file: s.file, start, end, note: s.note, ...(s.hold ? { hold: true } : {}), ...(s.sfx ? { sfx: s.sfx } : {}), ...(s.anchor ? { anchor: s.anchor } : {}) });
  }
  if (natural.length === 0) return { segments: [], holdTail: 0, dropped };

  const D = voDuration > 0 ? voDuration : natural.reduce((a, s) => a + (s.end - s.start), 0);

  // 2. Resolve anchors against the spoken take (in speech order — search forward from the last hit).
  const anchorAt = new Map<TimelineSeg, number>();
  let cursor = 0;
  for (const s of natural) {
    if (!s.anchor || !opts.words?.length) continue;
    const at = matchAnchor(s.anchor, opts.words, cursor);
    if (at != null) { anchorAt.set(s, at); cursor = at; }
  }

  // 3. Group into regions: each anchored seg starts a region and carries the un-anchored clips that
  //    follow it in plan order; a leading un-anchored run forms a front region. Regions play in
  //    TRANSCRIPT order — the take, not the draft, is the story's spine.
  type Region = { anchorSec?: number; segs: TimelineSeg[] };
  const regions: Region[] = [];
  for (const s of natural) {
    if (anchorAt.has(s)) regions.push({ anchorSec: anchorAt.get(s), segs: [s] });
    else if (regions.length === 0) regions.push({ segs: [s] });
    else regions[regions.length - 1].segs.push(s);
  }
  const front = regions.length && regions[0].anchorSec == null ? [regions.shift()!] : [];
  regions.sort((a, b) => (a.anchorSec ?? 0) - (b.anchorSec ?? 0));
  const ordered = [...front, ...regions];

  // 4. Region boundaries: each anchored region starts at its words (minus a breath of lead), pushed
  //    later only when earlier clips need their floor, pulled earlier only so later clips still fit.
  const counts = ordered.map((r) => r.segs.length);
  const suffixFloor = counts.map((_, i) => counts.slice(i).reduce((a, c) => a + c * floor, 0));
  const bounds: number[] = [];
  let prev = 0;
  for (let i = 0; i < ordered.length; i++) {
    let t = 0;
    if (i > 0) {
      const want = ordered[i].anchorSec != null ? Math.max(0, ordered[i].anchorSec! - ANCHOR_LEAD) : prev;
      t = Math.max(want, prev + floor);            // the previous region keeps at least one cut
      t = Math.min(t, Math.max(prev + floor, D - suffixFloor[i])); // leave room for everything after
    }
    bounds.push(t);
    prev = t;
  }
  bounds.push(D);

  // 4.5 Filler migration. A region whose span exceeds what its clips can physically play borrows
  //     un-anchored, un-held b-roll from the nearest region with surplus source — BEFORE anything
  //     freezes. (Shipped bug this fixes: one thin stretch put 5.27s of frozen bridge at the end of
  //     a reel while the voice kept going, and desynced every anchor after it.) A borrowed clip
  //     plays after the region's anchored head, so anchor cut-ins never move. Plan order bends;
  //     a frozen frame is worse.
  const capOf = (s: TimelineSeg) => Math.max(MIN_SEG, (clipDurations[s.file] ?? s.end) - s.start);
  const capacityOf = (r: Region) => r.segs.reduce((a, s) => a + capOf(s), 0);
  for (let guard = 0; guard < natural.length; guard++) {
    const needy = ordered.findIndex((r, i) => bounds[i + 1] - bounds[i] > capacityOf(r) + 0.05);
    if (needy < 0) break;
    let best = -1, bestDist = Infinity;
    for (let j = 0; j < ordered.length; j++) {
      if (j === needy || ordered[j].segs.length < 2) continue;
      const hasFiller = ordered[j].segs.some((s) => !s.anchor && !s.hold);
      const surplus = capacityOf(ordered[j]) - (bounds[j + 1] - bounds[j]);
      if (hasFiller && surplus > floor && Math.abs(j - needy) < bestDist) { best = j; bestDist = Math.abs(j - needy); }
    }
    if (best < 0) break; // no one can help — the residual becomes an honest freeze tail below
    const donor = ordered[best];
    const fillers = donor.segs.filter((s) => !s.anchor && !s.hold);
    const moved = fillers.sort((a, b) => capOf(b) - capOf(a))[0];
    donor.segs.splice(donor.segs.indexOf(moved), 1);
    ordered[needy].segs.push(moved);
  }

  // 5. Fill each region's span: proportional to the planned durations, floored, capped by unused
  //    source. When a span can't hold every clip at the floor, un-anchored/un-held clips drop
  //    shortest-first — disclosed, never silent. Held clips keep their planned length where possible.
  const out: TimelineSeg[] = [];
  let deficit = 0;
  for (let i = 0; i < ordered.length; i++) {
    let segs = ordered[i].segs.map((s) => ({ ...s }));
    const span = bounds[i + 1] - bounds[i];
    while (segs.length > 1 && span < segs.length * floor - POLISH_EPS) {
      // Anchored and held clips are protected; among the rest, lose the least footage first.
      const droppable = segs.filter((s) => !s.hold && !s.anchor);
      const victim = droppable.length
        ? droppable.sort((a, b) => (a.end - a.start) - (b.end - b.start))[0]
        : segs[segs.length - 1];
      segs.splice(segs.indexOf(victim), 1);
      dropped.push({ file: victim.file, reason: "the voiceover is too short to fit every clip" });
    }
    const naturals = segs.map((s) => (s.hold ? Math.max(s.end - s.start, floor) : Math.max(s.end - s.start, MIN_SEG)));
    const totalNat = naturals.reduce((a, b) => a + b, 0);
    // Proportional target, floored; holds aim for their full planned length.
    let durs = segs.map((s, j) => {
      const share = (naturals[j] / totalNat) * span;
      return s.hold ? Math.min(naturals[j], span) : Math.max(floor, share);
    });
    // Re-balance to the exact span: shave the largest non-hold cuts, or grow into unused source.
    const cap = (j: number) => Math.max(MIN_SEG, (clipDurations[segs[j].file] ?? segs[j].end) - segs[j].start);
    durs = durs.map((d, j) => Math.min(d, cap(j)));
    for (let guard = 0; guard < 200; guard++) {
      const total = durs.reduce((a, b) => a + b, 0);
      const diff = span - total;
      if (Math.abs(diff) <= 0.01) break;
      if (diff > 0) {
        const room = segs.map((_, j) => cap(j) - durs[j]);
        const totalRoom = room.reduce((a, b) => a + b, 0);
        if (totalRoom <= 0.01) { deficit += diff; break; } // footage exhausted → freeze tail later
        segs.forEach((_, j) => { durs[j] += Math.min(room[j], diff * (room[j] / totalRoom)); });
      } else {
        const give = segs.map((s, j) => (s.hold ? 0 : Math.max(0, durs[j] - floor)));
        const totalGive = give.reduce((a, b) => a + b, 0);
        if (totalGive <= 0.01) {
          // Even holds must yield before we overrun the voice.
          const holdGive = segs.map((_, j) => Math.max(0, durs[j] - floor));
          const t2 = holdGive.reduce((a, b) => a + b, 0);
          if (t2 <= 0.01) break;
          segs.forEach((_, j) => { durs[j] += Math.max(-holdGive[j], diff * (holdGive[j] / t2)); });
          break;
        }
        segs.forEach((_, j) => { durs[j] += Math.max(-give[j], diff * (give[j] / totalGive)); });
      }
    }
    segs.forEach((s, j) => { s.end = s.start + durs[j]; out.push(s); });
  }

  return { segments: out, holdTail: Math.max(0, Number(deficit.toFixed(3))), dropped };
}

// ---------------------------------------------------------------------------
// The polish pass: make the deterministic draft respect the quality rubric BY
// CONSTRUCTION (min-clip floor, max-hold cap, cuts on word boundaries), so the
// agent loop's ship bar fails only on taste (eyes) problems — the deterministic
// generator must never manufacture problems we then pay Codex to fix.
// ---------------------------------------------------------------------------

const POLISH_EPS = 0.005;

/** The source window segment i may occupy without hitting clip edges or other uses of its file. */
function sourceBounds(segs: TimelineSeg[], i: number, clipDurations: Record<string, number>): { lo: number; hi: number } {
  const s = segs[i];
  let lo = 0;
  let hi = clipDurations[s.file] ?? s.end;
  for (let j = 0; j < segs.length; j++) {
    if (j === i || segs[j].file !== s.file) continue;
    const o = segs[j];
    if (o.end <= s.start + POLISH_EPS) lo = Math.max(lo, o.end);
    if (o.start >= s.end - POLISH_EPS) hi = Math.min(hi, o.start);
  }
  return { lo, hi };
}

function headroom(segs: TimelineSeg[], i: number, clipDurations: Record<string, number>): number {
  const b = sourceBounds(segs, i, clipDurations);
  return Math.max(0, b.hi - segs[i].end) + Math.max(0, segs[i].start - b.lo);
}

/** Extend segment i by up to `amount` (end forward first, then start backward). Returns the gain. */
function grow(segs: TimelineSeg[], i: number, amount: number, clipDurations: Record<string, number>): number {
  const b = sourceBounds(segs, i, clipDurations);
  let gained = 0;
  const fwd = Math.min(amount, Math.max(0, b.hi - segs[i].end));
  if (fwd > 0) { segs[i].end += fwd; gained += fwd; }
  const back = Math.min(amount - gained, Math.max(0, segs[i].start - b.lo));
  if (back > 0) { segs[i].start -= back; gained += back; }
  return gained;
}

/** Shorten segment i's tail by up to `amount`, never below `floorSec`. Returns the take. */
function shrinkEnd(segs: TimelineSeg[], i: number, amount: number, floorSec: number): number {
  const dur = segs[i].end - segs[i].start;
  const take = Math.min(amount, Math.max(0, dur - floorSec));
  segs[i].end -= take;
  return take;
}

/**
 * Enforce the rubric's timeline meters on a fitted cut, deterministically:
 * 1. every segment >= the min-clip floor (grow into unused source, else drop the segment);
 * 2. no segment past the max-hold cap when other clips have headroom (hold beats freeze otherwise);
 * 3. cuts snapped to the nearest VO word boundary within a small window, floors respected.
 * Total duration is preserved wherever the footage allows. Pure.
 */
export function polishTimeline(
  segments: TimelineSeg[],
  opts: {
    clipDurations: Record<string, number>;
    words?: Word[];
    minSec?: number;
    maxSec?: number;
    beatTolSec?: number;
    snapWindowSec?: number;
  },
): TimelineSeg[] {
  const minSec = opts.minSec ?? CRITIQUE_DEFAULTS.minClipSec;
  const maxSec = opts.maxSec ?? CRITIQUE_DEFAULTS.maxHoldSec;
  const beatTol = opts.beatTolSec ?? CRITIQUE_DEFAULTS.cutBeatToleranceSec;
  const snapWin = opts.snapWindowSec ?? 0.6;
  const durations = opts.clipDurations;
  const segs = segments.map((s) => ({ ...s }));
  const dur = (i: number) => segs[i].end - segs[i].start;

  // Pass 1 — the floor. Grow a short segment into its own unused source (taking the time back from
  // the longest segments), or drop it and hand its screen time to whoever has headroom.
  for (let i = segs.length - 1; i >= 0; i--) {
    const need = minSec - dur(i);
    if (need <= POLISH_EPS) continue;
    if (headroom(segs, i, durations) >= need - POLISH_EPS) {
      const gained = grow(segs, i, need, durations);
      let owe = gained;
      const donors = segs.map((_, j) => j).filter((j) => j !== i && dur(j) > minSec + POLISH_EPS)
        .sort((a, b) => dur(b) - dur(a));
      for (const j of donors) {
        if (owe <= POLISH_EPS) break;
        owe -= shrinkEnd(segs, j, owe, minSec);
      }
      // Donors exhausted: tolerate the small excess — the mux trims video at the VO end anyway.
    } else {
      const orphaned = dur(i);
      segs.splice(i, 1);
      let owe = orphaned;
      const receivers = segs.map((_, j) => j)
        .sort((a, b) => Math.abs(a - i) - Math.abs(b - i)); // nearest neighbors first
      for (const j of receivers) {
        if (owe <= POLISH_EPS) break;
        owe -= grow(segs, j, owe, durations);
      }
      // Footage exhausted: any remainder becomes a freeze tail at mux (last resort).
    }
  }

  // Pass 2 — the cap. Move excess hold time into clips that still have unused source.
  // Planner-held moments are exempt: "hold" means play it out, whatever the reel's pace.
  const byLongest = () => segs.map((_, j) => j).sort((a, b) => dur(b) - dur(a));
  for (const i of byLongest()) {
    if (segs[i].hold) continue;
    let excess = dur(i) - maxSec;
    if (excess <= POLISH_EPS) continue;
    const receivers = segs.map((_, j) => j)
      .filter((j) => j !== i && dur(j) < maxSec - POLISH_EPS)
      .sort((a, b) => headroom(segs, b, durations) - headroom(segs, a, durations));
    for (const j of receivers) {
      if (excess <= POLISH_EPS) break;
      const capacity = Math.min(headroom(segs, j, durations), maxSec - dur(j));
      if (capacity <= POLISH_EPS) continue;
      const moved = grow(segs, j, Math.min(excess, capacity), durations);
      shrinkEnd(segs, i, moved, minSec);
      excess -= moved;
    }
    // No receivers: the long hold stays — a real moment beats a frozen frame; the meter flags it.
  }

  // Pass 3 — the beat. Nudge each cut onto the nearest word boundary when it's off by more than
  // the tolerance but within the snap window; the following segment absorbs the shift at its head
  // so every later cut stays put and the total is exact.
  const boundaries = [...new Set((opts.words ?? [])
    .filter((w) => w.type === "word")
    .flatMap((w) => [w.start, w.end])
    .filter((t): t is number => typeof t === "number"))].sort((a, b) => a - b);
  if (boundaries.length && segs.length > 1) {
    let cum = 0;
    for (let k = 0; k < segs.length - 1; k++) {
      cum += dur(k);
      if (segs[k].hold || segs[k + 1].hold) continue; // a held moment's edges are the planner's
      let best = cum, bestDist = Infinity;
      for (const b of boundaries) if (Math.abs(b - cum) < bestDist) { bestDist = Math.abs(b - cum); best = b; }
      const delta = best - cum;
      if (Math.abs(delta) <= beatTol + POLISH_EPS || Math.abs(delta) > snapWin) continue;
      if (delta > 0) {
        const sb = sourceBounds(segs, k, durations);
        if (segs[k].end + delta > sb.hi + POLISH_EPS) continue;
        if (dur(k + 1) - delta < minSec - POLISH_EPS) continue;
        segs[k].end += delta;
        segs[k + 1].start += delta;
      } else {
        const d = -delta;
        const nb = sourceBounds(segs, k + 1, durations);
        if (dur(k) - d < minSec - POLISH_EPS) continue;
        if (segs[k + 1].start - d < nb.lo - POLISH_EPS) continue;
        segs[k].end -= d;
        segs[k + 1].start -= d;
      }
      cum = best;
    }
  }

  return segs;
}

// Pacing: the PLAN decides how fast this reel cuts (plan.json "pace", chosen by the model that
// watched the footage — b-roll cuts quick; complete actions play out); this code executes
// that decision. Any take longer than the pace's beat length is split into jump-cut beats: same
// clip, a slice of source skipped between beats so each cut is visible. Beats sum EXACTLY to the
// take they replace (skips come from unused source, never played time), so the VO fit is
// untouched; polishTimeline then snaps the new cuts onto word boundaries. A sequence entry with
// "hold": true is never split or capped — the planner marked it as a moment that must play out.
export type Pace = "quick" | "medium" | "long-takes";
export const PACE_BEATS: Record<Pace, { maxBeatSec: number; maxHoldSec: number }> = {
  quick: { maxBeatSec: 2.2, maxHoldSec: 5.0 },
  medium: { maxBeatSec: 3.2, maxHoldSec: 6.5 },
  "long-takes": { maxBeatSec: Infinity, maxHoldSec: 15.0 },
};
export const paceOf = (v: unknown): Pace => (v === "medium" || v === "long-takes" ? v : "quick");
export const PACE = { skipSec: 0.4, minSkipSec: 0.15 };

/** Split long takes into visible jump-cut beats. Pure; total played duration is preserved. */
export function paceTimeline(
  segments: TimelineSeg[],
  clipDurations: Record<string, number>,
  opts: { maxBeatSec?: number; skipSec?: number; minSkipSec?: number; minSec?: number } = {},
): TimelineSeg[] {
  const maxBeat = opts.maxBeatSec ?? PACE_BEATS.quick.maxBeatSec;
  const skip = opts.skipSec ?? PACE.skipSec;
  const minSkip = opts.minSkipSec ?? PACE.minSkipSec;
  const minSec = opts.minSec ?? CRITIQUE_DEFAULTS.minClipSec;

  const out: TimelineSeg[] = [];
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (s.hold) { out.push({ ...s }); continue; } // the planner marked this moment: play it out
    const dur = s.end - s.start;
    // How many beats can this take support without dropping under the rubric's clip floor?
    let n = Math.ceil(dur / maxBeat);
    while (n > 1 && dur / n < minSec) n--;
    if (n <= 1) { out.push({ ...s }); continue; }

    // Skips displace into unused source AFTER the take (clip end or the next use of this file),
    // so played time is preserved. No headroom = no fake cuts — a contiguous split is invisible.
    const { hi } = sourceBounds(segments, i, clipDurations);
    const beatLen = dur / n;
    const gap = Math.min(skip, (hi - s.start - dur) / (n - 1));
    if (gap < minSkip) { out.push({ ...s }); continue; }

    for (let k = 0; k < n; k++) {
      const start = s.start + k * (beatLen + gap);
      // The clip's SFX fires on the CUT IN, so it rides the first beat only — not every beat.
      out.push({ file: s.file, start, end: start + beatLen, note: s.note, ...(k === 0 && s.sfx ? { sfx: s.sfx } : {}) });
    }
  }
  return out;
}

/** The full deterministic fit: computeTimeline (fill the VO) + paceTimeline (beats at the plan's
 *  pace) + polishTimeline (respect the rubric, hold caps scaled to that pace). What prepareEdit
 *  uses; the freeze tail is recomputed after polishing. */
export function fitTimeline(
  sequence: PlanSeg[],
  voDuration: number,
  clipDurations: Record<string, number>,
  words: Word[] = [],
  pace: Pace = "quick",
): { segments: TimelineSeg[]; holdTail: number; dropped: DroppedClip[] } {
  const { segments, dropped } = computeTimeline(sequence, voDuration, clipDurations, { words, floorSec: CRITIQUE_DEFAULTS.minClipSec });
  if (segments.length === 0) return { segments, holdTail: 0, dropped };
  const budget = PACE_BEATS[pace];
  const paced = paceTimeline(segments, clipDurations, { maxBeatSec: budget.maxBeatSec });
  const polished = polishTimeline(paced, { clipDurations, words, maxSec: budget.maxHoldSec });
  const total = polished.reduce((a, s) => a + (s.end - s.start), 0);
  return { segments: polished, holdTail: holdTailFor(voDuration, total), dropped };
}

/** The 9:16 fit/crop filter. It rides in the EDL `grade` slot (render.py has no vertical option) and
 *  is NOT a color grade — it just normalizes mixed-orientation clips to one vertical size so the
 *  lossless concat works. Sized to the quality tier so draft actually stays 720p. */
function verticalFilter(quality: Quality): string {
  const [w, h] = quality === "draft" ? [720, 1280] : [1080, 1920];
  return `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;
}

/** Freeze-frame needed to cover the VO when footage falls short. Sub-50ms deficits are rounding noise. */
export function holdTailFor(voDuration: number, edlTotalSec: number): number {
  const deficit = voDuration - edlTotalSec;
  return deficit > 0.05 ? Number(deficit.toFixed(3)) : 0;
}

/** Re-target an EDL's geometry filter (and quality metadata) without mutating it — the same cut
 *  renders as a 720p draft or a 1080p HD pass. */
export function regrade(edl: Edl, quality: Quality): Edl {
  return { ...edl, grade: verticalFilter(quality), metadata: { ...(edl.metadata ?? {}), quality } };
}

/** Written into the project workDir at prepare time — the standing context for any agent that runs
 *  here (the assembly loop, refine). Replaces the stale planner-era AGENTS.md in old projects. */
const ASSEMBLY_AGENTS_MD = `# Reel edit workspace

This directory holds one voiceover reel in progress. The recorded voiceover (vo.wav) is the master
audio and is never hand-edited — the only sanctioned change is cutting a span out of the whole
timeline (voice + captions + cut together) via the tighten tool you are given. The cut lives in
edit/edl.json (ranges of source clips, played in order); plan.json holds the full pool of usable
clip ranges. Captions (edit/master.srt) come from the voiceover and are re-applied by the render —
do not edit them. The on-screen title hook (first ~3s) and the background music are DECISIONS in
plan.json — change the title wording ("title"), its animation ("titleStyle": clean|pop|rise|wipe),
the music ("music": upbeat|chill|cinematic|hype|cute|none), or the ending ("ending": hold|cut — breathe after the last word vs end on it) there. Sound effects are per-range: set
"sfx" (whoosh|riser|pop|click) on a range in edit/edl.json to fire a one-shot on the cut into
it. The render regenerates the title card (edit/title.ass) and re-mixes music + sfx from those
fields; never hand-edit edit/title.ass. Renders are done by the render tool you are given, never by
hand-written ffmpeg.
`;

function buildEdl(segments: TimelineSeg[], workDir: string, quality: Quality): Edl {
  const sources: Record<string, string> = {};
  const keyFor = new Map<string, string>();
  const ranges = segments.map((s) => {
    let key = keyFor.get(s.file);
    if (!key) {
      key = `clip_${String(keyFor.size).padStart(2, "0")}`;
      keyFor.set(s.file, key);
      sources[key] = resolve(join(workDir, s.file));
    }
    return { source: key, start: s.start, end: s.end, beat: s.note ?? "", note: s.note ?? "", ...(s.sfx ? { sfx: s.sfx } : {}) };
  });
  const total = segments.reduce((a, s) => a + (s.end - s.start), 0);
  return {
    version: 1,
    sources,
    ranges,
    // Color grade OFF — this filter is geometry only (keeps the creator's original look).
    grade: verticalFilter(quality),
    overlays: [],
    subtitles: "master.srt",
    total_duration_s: Number(total.toFixed(3)),
    metadata: { color_grade: "none; render.py applies HDR->SDR tonemap only when required", quality },
  };
}

// The on-screen title (text hook): animates in over the first moment, holds, then fades before it
// could fight the captions. The cover photo is pulled from COVER_AT_SEC (below), NOT frame 0, so an
// entrance animation never leaves the cover half-drawn.
export const TITLE_SECONDS = 2.8;
// When to grab the cover frame: after every preset's entrance settles (slowest is the typewriter at
// ~0.9s) and before the fade-out (TITLE_SECONDS - 0.25). Early enough that the cover is the hook,
// late enough that it's fully drawn for every animation.
export const COVER_AT_SEC = 1.1;

// The title animation presets — the Plan agent picks one by the footage's aesthetic. Each value is
// the ASS override block prepended to the title text; \an8 keeps the anchor top-center so \move
// coordinates are predictable. All are native libass (no new render pipeline) and all show the FULL
// title through the hold, so the cover frame is clean.
export type TitleStyle = "clean" | "pop" | "rise" | "wipe";
const TITLE_ANIM: Record<TitleStyle, string> = {
  // Gentle fade in and out — the calm default.
  clean: "\\fad(200,250)",
  // Scale-bounce entrance: overshoot to 108% then settle — energetic footage.
  pop: "\\fad(100,180)\\fscx60\\fscy60\\t(0,160,\\fscx108\\fscy108)\\t(160,280,\\fscx100\\fscy100)",
  // Slides up ~70px into place while fading — editorial, understated motion.
  rise: "\\an8\\move(540,370,540,300,0,320)\\fad(220,220)",
  // True per-char typewriter — built in buildTitleAss (each char alpha-pops in turn, outline and
  // all, so it types like a person; the keystroke SFX rides the same window). This placeholder is
  // never used for "wipe" but keeps the preset table total.
  wipe: "\\fad(0,140)",
};

// The typewriter's full type-on time; COVER_AT_SEC waits for it so the cover is never half-typed.
export const TYPE_ON_SECONDS = 0.9;
/** Per-char type-on: each character alpha-pops at its slot (20ms pop), spaces as hard spaces so
 *  libass never collapses a mid-tag run. Pure. */
function typewriterEvents(text: string): string {
  const chars = [...text];
  const step = Math.min(0.05, TYPE_ON_SECONDS / Math.max(1, chars.length));
  // Spaces keep their timing slot (typing rhythm) but stay PLAIN — no tag — so libass can still
  // line-wrap a long title at them (it never wraps at \h).
  return chars.map((c, i) => {
    if (c === " ") return " ";
    const t1 = Math.round(i * step * 1000);
    return `{\\alpha&HFF&\\t(${t1},${t1 + 20},\\alpha&H00&)}${c}`;
  }).join("");
}
export const TITLE_STYLES = Object.keys(TITLE_ANIM) as TitleStyle[];

/** ASS time (H:MM:SS.cc). */
function assTime(sec: number): string {
  const cs = Math.max(0, Math.round(sec * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const r = cs % 100;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${h}:${p(m)}:${p(s)}.${p(r)}`;
}

// Bundled title font (captions keep the system Montserrat stack). Anton was the founder's pick
// from a contact sheet rendered on real footage; it ships in assets/fonts and is passed to libass
// via fontsdir, so prod needs no font install.
const FONTS_DIR = fileURLToPath(new URL("../assets/fonts", import.meta.url));

/**
 * The title card as a self-styled ASS file (libass scales PlayRes to any render size, so one file
 * serves draft and HD). Top-center with a MarginV that clears the platform UI row, while captions
 * own the bottom third — no collision.
 */
export function buildTitleAss(title: string, style: TitleStyle = "clean"): string {
  const text = title.replace(/[{}\\]/g, "").replace(/\s+/g, " ").trim();
  const anim = TITLE_ANIM[style] ?? TITLE_ANIM.clean;
  const line = style === "wipe"
    ? `{\\an8\\be2\\fad(0,140)}${typewriterEvents(text)}`
    : `{\\be2${anim}}${text}`;
  return [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 0",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV",
    // Modest stroke, zero shadow, soft blurred edge (\be2 on every line below) — a quiet halo
    // instead of a border. The thick 5px stroke + drop shadow shipped once: "looks cheap AF".
    // Picked from 3 rendered candidates on real bright-sky footage (hairline washed out).
    "Style: Title,Anton,100,&H00FFFFFF,&H00000000,&H00000000,0,1,2,0,8,80,80,300",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Text",
    `Dialogue: 0,${assTime(0)},${assTime(TITLE_SECONDS)},Title,${line}`,
    "",
  ].join("\n");
}

/** Escape a path for use inside the ffmpeg subtitles filter (same rule render.py uses). */
const subPath = (p: string) => p.replace(/:/g, "\\:").replace(/'/g, "\\'");

/** Write (or clear) edit/title.ass from the CURRENT plan.json, so title text/style is refine-able:
 *  an agent edits plan.json `title`/`titleStyle` and re-renders, and the card regenerates here.
 *  Empty/absent title => no card. The .ass is a DERIVED artifact; the decision lives in plan.json. */
export async function syncTitleCard(editDir: string, plan: { title?: unknown; titleStyle?: unknown }): Promise<void> {
  const title = typeof plan.title === "string" ? plan.title.trim() : "";
  const p = join(editDir, "title.ass");
  if (title) await writeFile(p, buildTitleAss(title, plan.titleStyle as TitleStyle));
  else await rm(p, { force: true });
}

function srtTime(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
}

/** Build the caption SRT straight from the VO transcript. The voiceover is the master audio mapped
 *  from t=0, so a word's VO time IS its output time — no per-segment offset math needed. 2-3 word
 *  UPPERCASE chunks, broken on punctuation, applied last by render.py. */
export function buildSrtFromVo(words: Word[]): string {
  const PUNCT = new Set([".", ",", "!", "?", ";", ":"]);
  const real = words.filter((w) => w.type === "word" && typeof w.start === "number" && typeof w.end === "number");
  const chunks: Word[][] = [];
  let cur: Word[] = [];
  for (const w of real) {
    const t = (w.text ?? "").trim();
    if (!t) continue;
    cur.push(w);
    const endsPunct = PUNCT.has(t[t.length - 1]);
    if (cur.length >= 3 || endsPunct) { chunks.push(cur); cur = []; }
  }
  if (cur.length) chunks.push(cur);

  const lines: string[] = [];
  chunks.forEach((chunk, i) => {
    const a = chunk[0].start ?? 0;
    let b = chunk[chunk.length - 1].end ?? a + 0.4;
    if (b <= a) b = a + 0.4;
    const text = chunk.map((w) => (w.text ?? "").trim()).join(" ").replace(/\s+/g, " ").replace(/[.,;:]+$/, "").toUpperCase();
    lines.push(String(i + 1), `${srtTime(a)} --> ${srtTime(b)}`, text, "");
  });
  return lines.join("\n");
}

async function ffprobeDuration(path: string): Promise<number> {
  const { stdout } = await pExecFile("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", path,
  ]);
  return parseFloat(stdout.trim());
}

function runVideoUse(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  const helper = join(VIDEO_USE_DIR, "helpers", args[0]);
  return pExecFile("uv", ["run", "--project", VIDEO_USE_DIR, "python", helper, ...args.slice(1)], {
    cwd,
    env: { ...process.env, UV_CACHE_DIR: process.env.UV_CACHE_DIR ?? "/tmp/video-use-uv-cache" },
    maxBuffer: 64 * 1024 * 1024,
  });
}

function projectMd(plan: { angle?: string; style?: string }, voDuration: number, segCount: number, holdTail: number, renderCmd: string): string {
  const fill = holdTail > 0.05 ? `held the final frame ${holdTail.toFixed(2)}s to reach the voiceover length` : "fit footage to the voiceover length";
  return `## Session 1 - deterministic assemble

**Strategy:** Built a 9:16 voiceover reel directly from plan.json.sequence (no re-selecting or re-ordering), matching the reel to the ${voDuration.toFixed(2)}s voiceover.
**Decisions:** Played ${segCount} planned sub-clip(s) once each in order; ${fill}. Color grade off (edl.json "grade" is a vertical fit/crop, NOT a color grade); render.py handles HDR->SDR and burns captions last.
**Angle:** ${plan.angle ?? ""} (${plan.style ?? ""}).

**HOW TO RE-RENDER THIS REEL (any edit, any agent):**
1. The cut is edit/edl.json — ranges of source clips, in play order. Edit ranges only.
2. Re-render EVERYTHING (visual cut + captions + voiceover master audio + loudness normalization)
   with this ONE command: \`${renderCmd} --draft\`  (use \`--preview\` for HD).
   Never hand-write ffmpeg or run render.py directly — the tool owns the render pipeline.
3. Never edit vo.wav, edit/master.srt, or edit/title.ass (captions come from the VO timeline; the
   reel opens on the first spoken word; the title hook is composited before captions and its first frame is the
   cover photo).
4. The current quality judgment is edit/critique.json (per-problem severity + fixHint).

**Outstanding:** SFX / animated overlays intentionally skipped for the captions+title MVP.
`;
}

// Normalize the VO to the social loudness target (rubric: ~-14 LUFS integrated, peak-safe). Raw
// phone recordings measured ~-24 LUFS on the first real checkpoint — an EDL edit can't fix that,
// so it's deterministic code here, not an agent problem. Dynamic gain only; word timings unchanged.
const VO_LOUDNORM = "loudnorm=I=-14:TP=-1.5:LRA=11";
// Phone-mic cleanup ahead of the loudness master: cut sub-voice rumble (traffic, handling) and a
// gentle broadband denoise. Env-tunable; set OLE_VO_VOICE_CHAIN= (empty) to bypass.
const VO_VOICE = process.env.OLE_VO_VOICE_CHAIN ?? "highpass=f=75,afftdn=nf=-25";
const VO_MASTER = VO_VOICE ? `${VO_VOICE},${VO_LOUDNORM}` : VO_LOUDNORM;

// The music library lives beside the engine (assets/music/<mood>.mp3 + music.json manifest). Tracks
// must be supplied by the installer under an appropriate license; missing files render VO-only.
const musicDir = () => process.env.OLE_MUSIC_DIR || fileURLToPath(new URL("../assets/music", import.meta.url));
// Base bed level BEFORE ducking. Under a near-continuous voiceover the sidechain keeps it mostly
// out of the way; the bed only surfaces in the gaps. Deliberately low — a bed, not a duet.
const MUSIC_BED_GAIN = Number(process.env.OLE_MUSIC_BED_GAIN ?? 0.45);
// The duck aims for ~4dB of reduction under speech — the bed reads as ONE height with a gentle
// breath in the gaps. The old settings ducked ~9dB and the founder heard it as "the music gets
// loud when I stop talking". Env-tunable so taste passes never need a code deploy.
const DUCK_THRESHOLD = Number(process.env.OLE_MUSIC_DUCK_THRESHOLD ?? 0.05);
const DUCK_RATIO = Number(process.env.OLE_MUSIC_DUCK_RATIO ?? 2);

/** Map a plan music mood to an on-disk track, or undefined (VO-only). Never throws: a missing
 *  manifest, unknown mood, or absent file all mean "no music" — music must never fail a render. */
export async function resolveMusicPath(mood: string | null | undefined): Promise<string | undefined> {
  if (!mood || mood === "none") return undefined;
  try {
    const manifest = JSON.parse(await readFile(join(musicDir(), "music.json"), "utf8")) as { mood: string; file: string }[];
    const entry = manifest.find((m) => m.mood === mood);
    if (!entry) return undefined;
    const p = join(musicDir(), entry.file);
    return existsSync(p) ? p : undefined;
  } catch { return undefined; }
}

/** The ducking mix: VO stays the master (loudnorm'd), the bed rides under it and sidechain-compresses
 *  down whenever the voice is present, with gentle fades. `normalize=0` on amix is load-bearing —
 *  the default would halve the VO to average the two inputs. Output label `[voaud]` so SFX can layer
 *  on top afterward; `musIdx` is the music input's position (2 by convention). */
function envelopeFilter(audio: EditDocument["audio"] | undefined, target: "voice" | "music" | "source"): string {
  return (audio?.envelopes ?? []).filter((envelope) => envelope.target === target).map((envelope) => {
    const gain = 10 ** (envelope.gainDb / 20);
    return `volume=${gain.toFixed(6)}:enable='between(t,${envelope.startSec.toFixed(3)},${envelope.endSec.toFixed(3)})'`;
  }).join(",");
}

function musicAudioGraph(voDuration: number, musIdx = 2, audio?: EditDocument["audio"]): string[] {
  const fadeOut = Math.max(0, voDuration - 0.6);
  const voiceEnvelope = envelopeFilter(audio, "voice");
  const musicEnvelope = envelopeFilter(audio, "music");
  return [
    `[1:a]${VO_MASTER}${voiceEnvelope ? `,${voiceEnvelope}` : ""},asplit=2[vomain][vokey]`,
    `[${musIdx}:a]volume=${MUSIC_BED_GAIN}${musicEnvelope ? `,${musicEnvelope}` : ""},afade=t=in:st=0:d=0.6,afade=t=out:st=${fadeOut.toFixed(2)}:d=0.6[bed]`,
    `[bed][vokey]sidechaincompress=threshold=${DUCK_THRESHOLD}:ratio=${DUCK_RATIO}:attack=20:release=500[ducked]`,
    `[vomain][ducked]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[voaud]`,
  ];
}

// -- Sound effects ----------------------------------------------------------
// Content-aware one-shots the Plan tags on beats, plus a title-entrance sound from the title style.
// Library beside the engine (assets/sfx/<name>.wav + sfx.json); a name with no file is skipped.
const sfxDir = () => process.env.OLE_SFX_DIR || fileURLToPath(new URL("../assets/sfx", import.meta.url));
// Restraint knobs — enforced deterministically so a reel is never busy no matter how eagerly the
// model tags: at least this far apart, and no more than ~1 per SEC_PER_SFX (hard-capped).
const SFX = { minGapSec: 1.5, secPerSfx: 5, hardCap: 8 };
// The title's entrance sound follows its animation. "clean" gets none — a quiet title wants quiet.
const TITLE_ENTRANCE_SFX: Record<TitleStyle, string | null> = { clean: null, pop: "pop", rise: "whoosh", wipe: "typewriter" };

export type SfxEvent = { at: number; name: string };
// The manifest carries ARTISTIC offsets (dB relative to the target), never absolute levels — the
// mix normalizes each file by its MEASURED peak, so a quiet source file can't make a sound vanish.
// capFrom "tail" keeps the END of a capped sound (a riser's build peaks there; the head is silence).
type SfxManifest = { name: string; file: string; offsetDb?: number; maxSec?: number; capFrom?: "head" | "tail" }[];
export type ResolvedSfx = { path: string; at: number; offsetDb: number; maxSec?: number; capFrom?: "head" | "tail" };

// Every one-shot lands at this true peak (before its artistic offset): loud enough to read over a
// -14 LUFS voiceover + bed, tame enough that the mix limiter (0.97) barely works.
const SFX_TARGET_PEAK_DB = Number(process.env.OLE_SFX_TARGET_PEAK_DB ?? -3);

/** Parse ffmpeg volumedetect output ("max_volume: -6.0 dB"). Exported for tests. */
export function parseMaxVolumeDb(stderr: string): number | undefined {
  const m = /max_volume:\s*(-?\d+(?:\.\d+)?)\s*dB/.exec(stderr);
  return m ? Number(m[1]) : undefined;
}

// Peak per file, measured once per process (the library is a handful of static assets).
const peakCache = new Map<string, number | undefined>();
async function measurePeakDb(path: string): Promise<number | undefined> {
  if (peakCache.has(path)) return peakCache.get(path);
  let peak: number | undefined;
  try {
    const { stderr } = await pExecFile("ffmpeg", ["-i", path, "-af", "volumedetect", "-f", "null", "-"], { maxBuffer: 16 * 1024 * 1024 });
    peak = parseMaxVolumeDb(stderr);
  } catch { peak = undefined; } // unmeasurable → treated as already-at-target (offset-only)
  peakCache.set(path, peak);
  return peak;
}

/** name → resolved entry if the sound file exists, else undefined (silently skipped, like music). */
async function resolveSfx(name: string, manifest: SfxManifest): Promise<{ path: string; offsetDb: number; maxSec?: number; capFrom?: "head" | "tail" } | undefined> {
  const e = manifest.find((m) => m.name === name);
  if (!e) return undefined;
  const p = join(sfxDir(), e.file);
  return existsSync(p) ? { path: p, offsetDb: e.offsetDb ?? 0, maxSec: e.maxSec, capFrom: e.capFrom } : undefined;
}
const loadSfxManifest = async (): Promise<SfxManifest> => {
  try { return JSON.parse(await readFile(join(sfxDir(), "sfx.json"), "utf8")); } catch { return []; }
};

/** Where each SFX fires: the title-entrance sound at t=0 (if any), plus each range's `sfx` on the
 *  cut into it (cumulative output time). An SFX on the very first range is dropped — the title
 *  entrance owns the open. Pure; reads the CURRENT cut, so a refine that reorders moves the sounds. */
export function sfxEventsFor(ranges: { start: number; end: number; sfx?: string }[], titleEntrance: string | null): SfxEvent[] {
  const events: SfxEvent[] = [];
  if (titleEntrance) events.push({ at: 0, name: titleEntrance });
  let cum = 0;
  for (const [index, r] of ranges.entries()) {
    const transition = (r as { transitionIn?: { kind?: string; durationSec?: number } }).transitionIn;
    if (index > 0 && transition?.kind === "crossfade") cum -= transition.durationSec ?? 0.25;
    if (r.sfx && cum > 0.05) events.push({ at: Number(cum.toFixed(3)), name: r.sfx });
    cum += r.end - r.start;
  }
  return events;
}

/** The density cap: keep events in time order, each at least `minGapSec` after the last kept one, up
 *  to ~1 per `secPerSfx` (hard-capped). The title-entrance sits at t=0 so it's always the first kept. */
export function capSfxEvents<T extends { at: number }>(events: T[], reelSec: number, opts?: Partial<typeof SFX>): T[] {
  const minGap = opts?.minGapSec ?? SFX.minGapSec;
  const maxN = Math.min(opts?.hardCap ?? SFX.hardCap, Math.max(1, Math.round(reelSec / (opts?.secPerSfx ?? SFX.secPerSfx))));
  const kept: T[] = [];
  let lastAt = -Infinity;
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    if (kept.length && e.at - lastAt < minGap) continue;
    kept.push(e); lastAt = e.at;
    if (kept.length >= maxN) break;
  }
  return kept;
}

/** Resolve an EDL's SFX (title entrance + per-range tags) to a mixable, density-capped set of
 *  one-shots. Missing files drop out first so they don't waste a cap slot; empty when no sound
 *  files exist yet (the whole feature is inert until assets land, exactly like music). */
export async function resolveSfxForRender(
  ranges: { start: number; end: number; sfx?: string }[], titleStyle: TitleStyle | undefined,
  hasTitle: boolean, reelSec: number, documentSfx?: Array<{ name: string; atSec: number; gainDb?: number }>,
): Promise<ResolvedSfx[]> {
  const entrance = hasTitle && titleStyle ? TITLE_ENTRANCE_SFX[titleStyle] : null;
  const manifest = await loadSfxManifest();
  const resolved: ResolvedSfx[] = [];
  const events: Array<{ at: number; name: string; gainDb?: number }> = documentSfx?.length
    ? [...(entrance ? [{ at: 0, name: entrance }] : []), ...documentSfx.map((event) => ({ at: event.atSec, name: event.name, gainDb: event.gainDb }))]
    : sfxEventsFor(ranges, entrance);
  for (const e of events) {
    const r = await resolveSfx(e.name, manifest);
    if (r) resolved.push({ path: r.path, at: e.at, offsetDb: r.offsetDb + (e.gainDb ?? 0), maxSec: r.maxSec, capFrom: r.capFrom });
  }
  return capSfxEvents(resolved, reelSec);
}

/** Add document-timed one-shots to an already-normalized source-audio reel (talking-head path). */
export async function mixDocumentSfxIntoVideo(input: {
  source: string; destination: string; durationSec: number; sfx: EditDocument["audio"]["sfx"];
}): Promise<boolean> {
  const sfx = await resolveSfxForRender([], undefined, false, input.durationSec, input.sfx);
  if (!sfx.length) return false;
  const inputs = ["-i", input.source];
  const filters: string[] = [];
  const labels: string[] = [];
  for (const [index, sound] of sfx.entries()) {
    inputs.push("-i", sound.path);
    const peak = await measurePeakDb(sound.path);
    const gainDb = SFX_TARGET_PEAK_DB + sound.offsetDb - (peak ?? SFX_TARGET_PEAK_DB);
    const ms = Math.max(0, Math.round(sound.at * 1000));
    let cap = "";
    if (sound.maxSec && sound.maxSec > 0) {
      if (sound.capFrom === "tail") {
        const duration = await ffprobeDuration(sound.path).catch(() => 0);
        const from = Math.max(0, duration - sound.maxSec);
        cap = `atrim=${from.toFixed(3)}:${duration.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,`;
      } else cap = `atrim=0:${sound.maxSec},afade=t=out:st=${Math.max(0, sound.maxSec - 0.1).toFixed(2)}:d=0.1,`;
    }
    filters.push(`[${index + 1}:a]aresample=48000,${cap}adelay=${ms}:all=1,volume=${gainDb.toFixed(1)}dB[sfx${index}]`);
    labels.push(`[sfx${index}]`);
  }
  filters.push(`[0:a]${labels.join("")}amix=inputs=${1 + sfx.length}:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.97[a]`);
  await pExecFile("ffmpeg", [
    "-y", ...inputs, "-filter_complex", filters.join(";"), "-map", "0:v:0", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", input.destination,
  ], { maxBuffer: 64 * 1024 * 1024 });
  return true;
}

async function muxVo(
  visual: string, vo: string, out: string, holdTail: number,
  opts?: { titleAss?: string; quality?: Quality; musicPath?: string; voDuration?: number; sfx?: ResolvedSfx[]; audioPadSec?: number; audio?: EditDocument["audio"] },
): Promise<void> {
  // Burning the title (freeze tail / ducking music / layering SFX) forces a re-encode; match the tier.
  const enc = opts?.quality === "draft"
    ? ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "24", "-pix_fmt", "yuv420p"]
    : ["-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p"];
  const title = opts?.titleAss ? `subtitles='${subPath(opts.titleAss)}':fontsdir='${subPath(FONTS_DIR)}'` : "";
  const hasMusic = !!opts?.musicPath;
  const sfx = opts?.sfx ?? [];
  const audioPad = opts?.audioPadSec ?? 0;
  const padding = holdTail > 0.05 || audioPad > 0.05;
  const voiceEnvelope = envelopeFilter(opts?.audio, "voice");

  // Simple path: nothing that needs a filtergraph. Video copied unless a title needs burning.
  if (!hasMusic && !sfx.length && !padding) {
    await pExecFile("ffmpeg", [
      "-y", "-i", visual, "-i", vo,
      "-map", "0:v:0", "-map", "1:a:0",
      "-af", `${VO_MASTER}${voiceEnvelope ? `,${voiceEnvelope}` : ""}`,
      ...(title ? ["-vf", title, ...enc] : ["-c:v", "copy"]),
      "-c:a", "aac", "-shortest", out,
    ], { maxBuffer: 64 * 1024 * 1024 });
    return;
  }

  // filter_complex path: freeze-tail / title / music / SFX. Video is filtered only when it must be
  // (tpad and/or title); otherwise it's stream-copied while the audio graph does the work.
  const vParts: string[] = [];
  if (padding) vParts.push(`tpad=stop_mode=clone:stop_duration=${holdTail.toFixed(3)}`);
  if (title) vParts.push(title);
  const fc: string[] = [];
  let vmap: string;
  if (vParts.length) { fc.push(`[0:v]${vParts.join(",")}[v]`); vmap = "[v]"; }
  else vmap = "0:v";

  // Voice (+ ducked music) → [voaud]. Input indices: visual=0, vo=1, music=2 (if any), SFX after.
  const inputs = ["-i", visual, "-i", vo];
  if (hasMusic) {
    inputs.push("-stream_loop", "-1", "-i", opts!.musicPath!); // loop the bed to reel length
    fc.push(...musicAudioGraph(opts?.voDuration ?? 0, 2, opts?.audio));
  } else {
    fc.push(`[1:a]${VO_MASTER}${voiceEnvelope ? `,${voiceEnvelope}` : ""}[voaud]`);
  }

  // SFX one-shots layer over [voaud], each delayed to its beat; a limiter catches any summed peaks.
  let amap = "[voaud]";
  if (sfx.length) {
    const sfxStart = hasMusic ? 3 : 2;
    const labels: string[] = [];
    for (const [i, s] of sfx.entries()) {
      inputs.push("-i", s.path);
      const ms = Math.max(0, Math.round(s.at * 1000));
      // Normalize by the file's MEASURED peak so every one-shot lands at the same true level; the
      // manifest offset is an artistic trim on top. An unmeasurable file plays at offset only.
      const peak = await measurePeakDb(s.path);
      const gainDb = SFX_TARGET_PEAK_DB + s.offsetDb - (peak ?? SFX_TARGET_PEAK_DB);
      // Cap long sounds to a tight hit. "head" keeps the attack (keystrokes); "tail" keeps the END
      // (a riser's build peaks at its climax — its head is near-silence and used to be all we played).
      let cap = "";
      if (s.maxSec && s.maxSec > 0) {
        if (s.capFrom === "tail") {
          const dur = await ffprobeDuration(s.path).catch(() => 0);
          const from = Math.max(0, dur - s.maxSec);
          cap = `atrim=${from.toFixed(3)}:${dur.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,`;
        } else {
          cap = `atrim=0:${s.maxSec},afade=t=out:st=${Math.max(0, s.maxSec - 0.1).toFixed(2)}:d=0.1,`;
        }
      }
      fc.push(`[${sfxStart + i}:a]aresample=48000,${cap}adelay=${ms}:all=1,volume=${gainDb.toFixed(1)}dB[sfx${i}]`);
      labels.push(`[sfx${i}]`);
    }
    fc.push(`[voaud]${labels.join("")}amix=inputs=${1 + sfx.length}:duration=first:dropout_transition=0:normalize=0[amixed]`);
    fc.push(`[amixed]alimiter=limit=0.97[a]`);
    amap = "[a]";
  }

  if (audioPad > 0.05) {
    fc.push(`${amap}apad=pad_dur=${audioPad.toFixed(3)}[afin]`);
    amap = "[afin]";
  }
  await pExecFile("ffmpeg", [
    "-y", ...inputs,
    "-filter_complex", fc.join(";"),
    "-map", vmap, "-map", amap,
    ...(vmap === "0:v" ? ["-c:v", "copy"] : enc),
    "-c:a", "aac", "-shortest", out,
  ], { maxBuffer: 64 * 1024 * 1024 });
}

// -- Creator learning signals -------------------------------------------------
// The recorded take is ground truth about the CREATOR, not just this reel. Words-per-second from
// the cleaned take feeds the per-user profile, which the next plan uses instead of assuming 2.3.
/** Sanity-bounded words/sec (real speech sits ~1.5-6; outside that = bad transcript, learn nothing). Pure. */
export function computeWps(wordCount: number, voSec: number): number | null {
  if (!(wordCount > 5) || !(voSec > 2)) return null;
  const wps = wordCount / voSec;
  return wps >= 1 && wps <= 8 ? Number(wps.toFixed(2)) : null;
}

/** Measure the creator's speaking pace from this project's cleaned take. Null when unmeasurable. */
export async function measureCreatorWps(workDir: string): Promise<{ wps: number; words: number; sec: number } | null> {
  try {
    const tr = JSON.parse(await readFile(join(workDir, "edit", "transcripts", "vo.json"), "utf8")) as { words?: Word[] };
    const words = (tr.words ?? []).filter((w) => w.type === "word" && (w.text ?? "").trim()).length;
    const sec = await ffprobeDuration(join(workDir, "vo.wav"));
    const wps = computeWps(words, sec);
    return wps ? { wps, words, sec: Number(sec.toFixed(2)) } : null;
  } catch { return null; }
}

/**
 * Deterministic pre-work for a cut: transcribe the VO, fit the planned sequence to its length, and
 * write the edit state (edl.json + an untouched edl.base.json fallback copy, master.srt, project.md,
 * and the workspace AGENTS.md). Everything an agent — or renderFromEdl — needs to work here.
 */
export async function prepareEdit(input: {
  workDir: string;
  quality?: Quality;
  onPhase?: (phase: string) => void;
  transcribe?: (workDir: string, editDir: string) => Promise<void>; // injectable for tests
}): Promise<{ voDuration: number; words: Word[] }> {
  const quality = input.quality ?? "draft";
  const phase = input.onPhase ?? (() => {});
  const editDir = join(input.workDir, "edit");
  await mkdir(editDir, { recursive: true });

  // 1. Word timings. A generated (TTS) take arrives with EXACT timestamps from synthesis — no
  //    Whisper, and nothing for the take-cleaner to do. A recorded take is transcribed and cleaned.
  const source = await voSource(input.workDir);
  if (source === "recorded") {
    // Transcribe the voiceover (word timings for captions; cached by transcribe.py).
    phase("transcribing your voiceover");
    const transcribe = input.transcribe ??
      (async (wd: string, ed: string) => { await runVideoUse(["transcribe.py", join(wd, "vo.wav"), "--edit-dir", ed], wd); });
    await transcribe(input.workDir, editDir);

    // A take is never assumed perfect: collapse dead air, cut re-read lines (the last attempt
    // stays), keep the pristine recording as vo.original.wav. The transcript shifts with the cuts,
    // so everything downstream just sees a tighter take. VO length is measured AFTER cleaning.
    phase("tightening your take");
    await cleanVo(input.workDir);
  }
  const tr = JSON.parse(await readFile(join(editDir, "transcripts", "vo.json"), "utf8"));
  const voDuration = await ffprobeDuration(join(input.workDir, "vo.wav"));

  // 2. Read the storyboard (Plan already chose which clips, in what order).
  const plan = JSON.parse(await readFile(join(input.workDir, "plan.json"), "utf8"));
  const sequence: PlanSeg[] = Array.isArray(plan.sequence) ? plan.sequence : [];

  // The on-screen title (text hook) rides as a self-styled ASS card, burned at mux, regenerated from
  // plan.json here and again at every render (so a refine to the title/style takes effect).
  await syncTitleCard(editDir, plan);

  // 3. Measure each distinct clip, then fit the sequence to the VO length.
  const clipDurations: Record<string, number> = {};
  for (const f of new Set(sequence.map((s) => s.file))) {
    const p = resolve(join(input.workDir, f));
    if (existsSync(p)) {
      try { clipDurations[f] = await ffprobeDuration(p); } catch { /* skip unmeasurable clip */ }
    }
  }
  const pace = paceOf(plan.pace);
  const { segments, holdTail, dropped } = fitTimeline(sequence, voDuration, clipDurations, (tr.words ?? []) as Word[], pace);
  if (segments.length === 0) throw new Error("assemble: no usable clips in plan.json");
  for (const d of dropped) console.warn(`[assemble] dropped ${d.file}: ${d.reason}`);

  // 4. Write the edit state: EDL (+ base fallback copy), captions, breadcrumbs, agent context.
  phase("cutting your clips");
  const edl = buildEdl(segments, input.workDir, quality);
  // The critic reads pace from the EDL so a "long-takes" reel isn't judged by quick-pace hold caps.
  // Fit-time drops ride along so the app can tell the creator which clips didn't make it, and why.
  edl.metadata = { ...(edl.metadata ?? {}), pace, ...(dropped.length ? { dropped } : {}) };
  validateEdl(edl); // fail loudly on a malformed cut before we spend a render
  await writeFile(join(editDir, "edl.json"), JSON.stringify(edl, null, 2));
  await writeFile(join(editDir, "edl.base.json"), JSON.stringify(edl, null, 2)); // untouched fallback copy
  await writeFile(join(editDir, "document.v2.json"), JSON.stringify(editDocumentFromV1(edl, "voiceover"), null, 2));
  phase("adding captions");
  await writeFile(join(editDir, "master.srt"), buildSrtFromVo(tr.words ?? []));
  await writeFile(join(editDir, "project.md"), projectMd(plan, voDuration, segments.length, holdTail, toolCommands().render));
  // Replace any stale planner-era AGENTS.md so agents running here (loop, refine) get edit context.
  await writeFile(join(input.workDir, "AGENTS.md"), ASSEMBLY_AGENTS_MD);

  return { voDuration, words: (tr.words ?? []) as Word[] };
}

/**
 * Render whatever edit/edl.json currently says — at any quality. The geometry filter is re-targeted
 * to the requested quality (so one cut renders as a 720p draft or a 1080p HD pass), and the
 * freeze-tail is recomputed from the CURRENT EDL, staying correct after agent edits.
 */
export async function renderFromEdl(input: {
  workDir: string;
  quality?: Quality;
  onPhase?: (phase: string) => void;
}): Promise<{ reelPath: string; voDuration: number }> {
  const quality = input.quality ?? "draft";
  const phase = input.onPhase ?? (() => {});
  const editDir = join(input.workDir, "edit");

  const currentEdl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8")) as Edl;
  let edl = regrade(currentEdl, quality);
  const document = await readFile(join(editDir, "document.v2.json"), "utf8").then(JSON.parse).catch(() => null) as EditDocument | null;
  if (document) {
    validateEditDocument(document);
    const converted = editDocumentToV1(document, edl.grade);
    // v2 owns the shared primitives, but v1 still carries planner/quality breadcrumbs used by the
    // critic and renderer. Converting must not silently discard those fields.
    converted.metadata = { ...(currentEdl.metadata ?? {}), ...(converted.metadata ?? {}) };
    edl = converted;
    edl.overlays = await renderDocumentOverlays(input.workDir, document);
  }
  // The title is a visual overlay, so it must be burned before captions. Previously muxVo applied
  // title.ass after render.py had already burned subtitles, violating the subtitles-last contract.
  const plan = await readFile(join(input.workDir, "plan.json"), "utf8").then(JSON.parse).catch(() => ({}));
  await syncTitleCard(editDir, plan);
  const titleAss = join(editDir, "title.ass");
  const hasTitle = existsSync(titleAss);
  const { titleAss: _staleTitle, titleFontsDir: _staleFonts, ...metadata } = edl.metadata ?? {};
  edl.metadata = {
    ...metadata,
    ...(hasTitle ? { titleAss: "title.ass", titleFontsDir: FONTS_DIR } : {}),
  };
  validateEdl(edl);
  await writeFile(join(editDir, "edl.json"), JSON.stringify(edl, null, 2));

  const voDuration = await ffprobeDuration(join(input.workDir, "vo.wav"));
  // total_duration_s already subtracts crossfade overlaps. Summing raw source ranges would make a
  // crossfaded visual shorter than the VO and could let -shortest cut off the last spoken words.
  const edlTotal = edl.total_duration_s;

  // Render the visual cut with captions (skip loudnorm — the clip audio is discarded at mux).
  phase("rendering your reel");
  const visual = join(editDir, "visual.mp4");
  await runVideoUse(["render.py", join(editDir, "edl.json"), "-o", visual, `--${quality}`, "--no-loudnorm"], input.workDir);

  // Lay the voiceover as master audio → final.mp4 and duck the planned music bed under the voice so
  // every render path — assemble loop, refine, HD finalize — keeps the hook and the bed.
  phase("finishing up");
  const reelPath = join(editDir, "final.mp4");
  // Music and title entrance SFX also resolve from the CURRENT plan on every render.
  const musicPath = await resolveMusicPath(plan.music);
  // SFX resolved from the CURRENT EDL ranges (title entrance + per-cut tags), density-capped — so a
  // refine that reordered clips keeps the sounds in sync, and a missing sound file is just skipped.
  const documentAudio = edl.metadata?.audio as EditDocument["audio"] | undefined;
  const sfx = await resolveSfxForRender(edl.ranges, plan.titleStyle as TitleStyle, hasTitle, voDuration, documentAudio?.sfx);
  // The ending is a plan.json decision: "hold" lets the payoff shot breathe ~1s past the last word
  // (video freeze + padded audio); "cut" (the default) ends the reel with the voice — loop-friendly.
  const endingHold = plan.ending === "hold" ? 1.0 : 0;
  await muxVo(visual, join(input.workDir, "vo.wav"), reelPath, holdTailFor(voDuration, edlTotal) + endingHold, {
    quality, musicPath, voDuration, sfx, audioPadSec: endingHold,
    audio: documentAudio,
  });

  const critical = (await verifyReel(reelPath, { expectedDurationSec: voDuration + endingHold }))
    .filter((problem) => problem.severity === "critical");
  if (critical.length) throw new Error(`render: reel failed verification — ${critical.map((problem) => problem.message).join("; ")}`);

  // Cover photo = the reel with its title fully shown. Pulled from COVER_AT_SEC (not frame 0) so an
  // animated title's entrance never leaves the cover half-drawn; -ss past a short reel just grabs the
  // last frame. A missing cover must never fail a finished reel.
  try {
    await pExecFile("ffmpeg", ["-y", "-ss", String(COVER_AT_SEC), "-i", reelPath, "-frames:v", "1", "-q:v", "2", join(editDir, "cover.jpg")], { maxBuffer: 16 * 1024 * 1024 });
  } catch (e) {
    console.warn(`[assemble] cover extraction failed: ${String(e).slice(0, 200)}`);
  }
  return { reelPath, voDuration };
}

/**
 * Deterministic voiceover assemble — the fixed pipeline the agent used to reason through, as code.
 * `workDir` must contain clips/, vo.wav, and plan.json. Writes edit/final.mp4 plus edit/edl.json and
 * edit/project.md so the (still-agentic) refine step keeps working.
 */
export async function assembleReel(input: {
  workDir: string;
  quality?: Quality;
  onPhase?: (phase: string) => void;
}): Promise<{ reelPath: string }> {
  const { voDuration } = await prepareEdit(input);
  const { reelPath } = await renderFromEdl(input);

  // Deterministic sanity check on the finished reel — no model call, just ffprobe. Warnings are
  // logged; critical problems (no video/audio, not vertical) fail the assemble loudly.
  const problems = await verifyReel(reelPath, { expectedDurationSec: voDuration });
  const critical = problems.filter((p) => p.severity === "critical");
  for (const w of problems.filter((p) => p.severity === "warn")) console.warn(`[assemble] verify warning: ${w.message}`);
  if (critical.length) throw new Error(`assemble: reel failed verification — ${critical.map((p) => p.message).join("; ")}`);

  return { reelPath };
}
