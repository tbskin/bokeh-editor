// The one legitimate way to shorten the voiceover: cut a span out of the TIMELINE — audio and video
// together. The agent decides where (usually a dead-air span the critique flagged); this module
// executes the mechanics deterministically: cut vo.wav, shift the transcript (no re-transcription —
// exact for silence cuts), rebuild captions, shrink the EDL to the new length.
import { readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Word } from "./critique";
import type { Edl, EdlRange } from "./edl";
import { buildSrtFromVo } from "./assemble-reel";
import { ffprobeDurationSec } from "./eyes";

const pExecFile = promisify(execFile);

/** Remove [fromSec, toSec) from the words' timeline: drop words inside, clamp straddlers, shift
 *  later words left. Non-word entries pass through. Pure. */
export function shiftWords(words: Word[], fromSec: number, toSec: number): Word[] {
  const cut = toSec - fromSec;
  const out: Word[] = [];
  for (const w of words) {
    if (w.type !== "word" || typeof w.start !== "number" || typeof w.end !== "number") { out.push(w); continue; }
    if (w.end <= fromSec) { out.push(w); continue; }                    // fully before
    if (w.start >= toSec) { out.push({ ...w, start: w.start - cut, end: w.end - cut }); continue; } // fully after
    if (w.start < fromSec && w.end > fromSec && w.end <= toSec) {       // straddles the start
      out.push({ ...w, end: fromSec });
      continue;
    }
    if (w.start >= fromSec && w.start < toSec && w.end > toSec) {       // straddles the end
      out.push({ ...w, start: fromSec, end: w.end - cut });
      continue;
    }
    if (w.start < fromSec && w.end > toSec) {                           // spans the whole cut
      out.push({ ...w, end: w.end - cut });
      continue;
    }
    // fully inside the cut — dropped
  }
  return out;
}

/** Shorten the play order by `delta` seconds, taking time from the tail backwards and never leaving
 *  a range under `minSec` (drop it instead). Pure. */
export function shrinkRanges(ranges: EdlRange[], delta: number, minSec: number): EdlRange[] {
  if (delta <= 0.001) return ranges;
  const out = ranges.map((r) => ({ ...r }));
  let owe = delta;
  for (let i = out.length - 1; i >= 0 && owe > 0.001; i--) {
    const dur = out[i].end - out[i].start;
    if (dur - owe >= minSec) { out[i].end -= owe; owe = 0; break; }
    if (dur <= owe + minSec) {
      // Can't shrink to the floor and still owe — drop the whole range if that helps more.
      if (dur <= owe + 0.001) { owe -= dur; out.splice(i, 1); continue; }
      const give = dur - minSec;
      out[i].end -= give;
      owe -= give;
    }
  }
  return out;
}

/**
 * Cut [fromSec, toSec) out of the voiceover AND the cut: vo.wav loses the span (sample-exact),
 * the transcript shifts, master.srt is rebuilt, and edit/edl.json shrinks by the same amount
 * (tail-first, floors respected). Render afterwards to see it. Returns the new VO length.
 */
export async function cutVoSpan(input: { workDir: string; fromSec: number; toSec: number }): Promise<{ newVoSec: number; removedSec: number }> {
  const { workDir, fromSec, toSec } = input;
  const voPath = join(workDir, "vo.wav");
  const editDir = join(workDir, "edit");
  const voDur = await ffprobeDurationSec(voPath);
  if (!(fromSec >= 0) || !(toSec > fromSec) || toSec > voDur + 0.05) {
    throw new Error(`tighten: bad span ${fromSec}-${toSec} for a ${voDur.toFixed(2)}s voiceover`);
  }
  if (toSec - fromSec > voDur * 0.8) throw new Error("tighten: refusing to cut most of the voiceover");

  // 1. Cut the audio span.
  const tight = `${voPath}.tight.wav`;
  await pExecFile("ffmpeg", [
    "-y", "-i", voPath,
    "-af", `aselect='not(between(t,${fromSec.toFixed(3)},${toSec.toFixed(3)}))',asetpts=N/SR/TB`,
    "-c:a", "pcm_s16le", tight,
  ]);
  await rename(tight, voPath);

  // 2. Shift the transcript and rebuild captions from it.
  const trPath = join(editDir, "transcripts", "vo.json");
  const tr = JSON.parse(await readFile(trPath, "utf8")) as { words?: Word[] };
  tr.words = shiftWords(tr.words ?? [], fromSec, toSec);
  await writeFile(trPath, JSON.stringify(tr, null, 2));
  await writeFile(join(editDir, "master.srt"), buildSrtFromVo(tr.words));

  // 3. Shrink the cut to match the shorter voice.
  const edlPath = join(editDir, "edl.json");
  const edl = JSON.parse(await readFile(edlPath, "utf8")) as Edl;
  edl.ranges = shrinkRanges(edl.ranges, toSec - fromSec, 1.2);
  edl.total_duration_s = Number(edl.ranges.reduce((s, r) => s + (r.end - r.start), 0).toFixed(3));
  await writeFile(edlPath, JSON.stringify(edl, null, 2));

  const newVoSec = await ffprobeDurationSec(voPath);
  return { newVoSec, removedSec: toSec - fromSec };
}
