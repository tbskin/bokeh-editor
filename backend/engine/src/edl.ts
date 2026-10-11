export interface EdlRange {
  source: string;      // key into Edl.sources
  start: number;       // seconds, inclusive
  end: number;         // seconds, exclusive; must be > start
  beat?: string;       // human note for this range (also used as `note`)
  note?: string;
  sfx?: string;        // optional one-shot fired on the CUT INTO this range (name in sfx.json)
  transform?: { scale: number; x: number; y: number };
  split?: { source: string; sourceStartSec: number; side: "left" | "right" };
  transitionIn?: { kind: "cut" | "fade" | "crossfade"; durationSec?: number };
}

export interface Edl {
  version: number;
  sources: Record<string, string>; // key -> absolute clip path
  ranges: EdlRange[];              // play order; each range used once
  grade: string;                  // geometry/vertical fit filter (NOT color grade)
  overlays: unknown[];            // reserved for Phase 2 (transitions/overlays/SFX)
  subtitles?: string;             // e.g. "master.srt", resolved relative to edit/
  total_duration_s: number;
  metadata?: Record<string, unknown>;
}

/** Throw a descriptive error if the EDL can't be rendered as-is. Cheap, deterministic. */
export function validateEdl(edl: Edl): void {
  if (!edl || typeof edl.version !== "number") throw new Error("edl: missing version");
  if (!edl.sources || Object.keys(edl.sources).length === 0) throw new Error("edl: no sources");
  if (!Array.isArray(edl.ranges) || edl.ranges.length === 0) throw new Error("edl: ranges is empty");
  for (const [i, r] of edl.ranges.entries()) {
    if (!(r.source in edl.sources)) throw new Error(`edl: range ${i} source "${r.source}" not in sources`);
    if (!(r.end > r.start)) throw new Error(`edl: range ${i} end (${r.end}) must be > start (${r.start})`);
  }
}
