import { describe, it, expect } from "vitest";
import {
  checkTimeline, checkVoice, parseAudioMeasure, critiqueReel, summarizeCritique, CRITIQUE_DEFAULTS, type Word,
} from "../src/critique";
import type { Edl } from "../src/edl";
import type { ReelProbe } from "../src/verify";

const edl = (ranges: { source: string; start: number; end: number }[], total?: number): Edl => ({
  version: 1,
  sources: Object.fromEntries([...new Set(ranges.map((r) => r.source))].map((s) => [s, `/x/${s}.mp4`])),
  ranges: ranges.map((r) => ({ ...r, beat: "", note: "" })),
  grade: "",
  overlays: [],
  total_duration_s: total ?? ranges.reduce((a, r) => a + (r.end - r.start), 0),
});
const word = (start: number, end: number): Word => ({ type: "word", text: "x", start, end });

describe("checkTimeline", () => {
  it("passes a clean cut with no problems", () => {
    // two 3s clips, cut at 3.0s lands exactly on a word boundary at 3.0
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]),
      [word(0, 2.9), word(3.0, 5.8)], CRITIQUE_DEFAULTS);
    expect(p).toEqual([]);
  });
  it("flags a clip shorter than the min-clip floor as important", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 0.5 }, { source: "b", start: 0, end: 3 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "min-clip-length" && x.severity === "important")).toBe(true);
  });
  it("does NOT flag a clip at exactly the floor despite float error", () => {
    // 2.30 − 1.10 = 1.1999999999999997 — the real-checkpoint case: the agent cut exactly 1.2s
    const p = checkTimeline(edl([{ source: "a", start: 1.10, end: 2.30 }, { source: "b", start: 0, end: 3 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "min-clip-length")).toBe(false);
  });
  it("does NOT flag a hold at exactly the max despite float error", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0.1, end: 5.1 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "max-hold")).toBe(false);
  });
  it("flags a clip held past the max-hold as important", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 8 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "max-hold" && x.severity === "important")).toBe(true);
  });
  it("flags an overlapping reuse of the same source as critical", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }, { source: "a", start: 2, end: 5 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "clip-reused" && x.severity === "critical")).toBe(true);
  });
  it("does NOT flag the same source used at non-overlapping ranges", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }, { source: "a", start: 3, end: 6 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "clip-reused")).toBe(false);
  });
  it("flags a reel over the length cap as critical", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }], 95), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "over-max-length" && x.severity === "critical")).toBe(true);
  });
  it("flags a cut that lands off the nearest voice beat as important", () => {
    // cut at 3.0s; nearest word boundary is 2.5 or 3.7 → 0.5s off > 0.30 tolerance
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]),
      [word(0, 2.5), word(3.7, 5.8)], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "cut-off-beat" && x.severity === "important")).toBe(true);
  });
  it("skips the beat check when there are no words", () => {
    const p = checkTimeline(edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]), [], CRITIQUE_DEFAULTS);
    expect(p.some((x) => x.check === "cut-off-beat")).toBe(false);
  });
});

describe("checkVoice", () => {
  const base = { words: [word(0, 2.9), word(3.0, 5.8)], audio: { lufs: -14, leadSilenceSec: 0 }, cfg: CRITIQUE_DEFAULTS };
  it("passes a clean reel", () => {
    expect(checkVoice({ reelDurationSec: 6.0, ...base })).toEqual([]);
  });
  it("flags a reel shorter than the last spoken word as critical", () => {
    const p = checkVoice({ reelDurationSec: 5.0, ...base }); // last word ends 5.8
    expect(p.some((x) => x.check === "last-word-clipped" && x.severity === "critical")).toBe(true);
  });
  it("flags a mid-narration silence gap as important", () => {
    const p = checkVoice({ reelDurationSec: 10, words: [word(0, 2), word(4, 6)], audio: { lufs: -14, leadSilenceSec: 0 }, cfg: CRITIQUE_DEFAULTS });
    expect(p.some((x) => x.check === "dead-gap-mid" && x.severity === "important")).toBe(true);
  });
  it("flags leading dead air as important", () => {
    const p = checkVoice({ reelDurationSec: 6, ...base, audio: { lufs: -14, leadSilenceSec: 0.4 } });
    expect(p.some((x) => x.check === "dead-air-open")).toBe(true);
  });
  it("flags off-target loudness as important", () => {
    const p = checkVoice({ reelDurationSec: 6, ...base, audio: { lufs: -22, leadSilenceSec: 0 } });
    expect(p.some((x) => x.check === "loudness-off")).toBe(true);
  });
});

describe("parseAudioMeasure", () => {
  it("parses integrated loudness and leading silence from ffmpeg stderr", () => {
    const stderr = [
      "[silencedetect @ 0x1] silence_start: 0",
      "[silencedetect @ 0x1] silence_end: 0.42 | silence_duration: 0.42",
      "[Parsed_ebur128 @ 0x2] Summary:",
      "  Integrated loudness:",
      "    I:         -16.3 LUFS",
    ].join("\n");
    const m = parseAudioMeasure(stderr);
    expect(m.lufs).toBeCloseTo(-16.3, 1);
    expect(m.leadSilenceSec).toBeCloseTo(0.42, 2);
  });
  it("returns 0 lead silence when the reel opens on sound", () => {
    const m = parseAudioMeasure("    I:         -14.0 LUFS");
    expect(m.leadSilenceSec).toBe(0);
    expect(m.lufs).toBeCloseTo(-14, 1);
  });
});

const okProbe: ReelProbe = { hasVideo: true, hasAudio: true, width: 1080, height: 1920, colorTransfer: "bt709", durationSec: 6.0 };

describe("critiqueReel", () => {
  const goodEdl = edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]);
  const goodWords = [word(0, 2.9), word(3.0, 5.8)];
  const goodAudio = async () => ({ lufs: -14, leadSilenceSec: 0 });

  it("returns no problems for a clean reel", async () => {
    const p = await critiqueReel({ reelPath: "/x.mp4", edl: goodEdl, words: goodWords,
      probe: async () => okProbe, audio: goodAudio });
    expect(p).toEqual([]);
  });

  it("reports a critical for a non-vertical reel", async () => {
    const p = await critiqueReel({ reelPath: "/x.mp4", edl: goodEdl, words: goodWords,
      probe: async () => ({ ...okProbe, width: 1920, height: 1080 }), audio: goodAudio });
    expect(p.some((x) => x.check === "not-vertical" && x.severity === "critical")).toBe(true);
  });

  it("reports a critical for an un-tonemapped HDR reel", async () => {
    const p = await critiqueReel({ reelPath: "/x.mp4", edl: goodEdl, words: goodWords,
      probe: async () => ({ ...okProbe, colorTransfer: "smpte2084" }), audio: goodAudio });
    expect(p.some((x) => x.check === "hdr-not-tonemapped" && x.severity === "critical")).toBe(true);
  });

  it("composes timeline + voice problems and sorts critical first", async () => {
    // short clip (important) + HDR (critical) → critical must sort ahead of important
    const p = await critiqueReel({ reelPath: "/x.mp4",
      edl: edl([{ source: "a", start: 0, end: 0.5 }, { source: "b", start: 0, end: 3 }]),
      words: goodWords, probe: async () => ({ ...okProbe, colorTransfer: "arib-std-b67" }), audio: goodAudio });
    expect(p[0].severity).toBe("critical");
    expect(p.some((x) => x.check === "min-clip-length")).toBe(true);
  });

  it("skips the audio measurement when the reel has no audio", async () => {
    let called = false;
    const p = await critiqueReel({ reelPath: "/x.mp4", edl: goodEdl, words: goodWords,
      probe: async () => ({ ...okProbe, hasAudio: false }),
      audio: async () => { called = true; return { lufs: -14, leadSilenceSec: 0 }; } });
    expect(called).toBe(false);
    expect(p.some((x) => x.check === "no-audio" && x.severity === "critical")).toBe(true);
  });
});

describe("summarizeCritique", () => {
  it("passes the ship bar only with no critical or important problems", () => {
    expect(summarizeCritique([]).passesShipBar).toBe(true);
    expect(summarizeCritique([{ dimension: "pacing", check: "x", severity: "minor", message: "" }]).passesShipBar).toBe(true);
    expect(summarizeCritique([{ dimension: "pacing", check: "x", severity: "important", message: "" }]).passesShipBar).toBe(false);
    expect(summarizeCritique([{ dimension: "voice", check: "y", severity: "critical", message: "" }]).passesShipBar).toBe(false);
  });
});
