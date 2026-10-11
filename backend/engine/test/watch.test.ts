import { describe, it, expect } from "vitest";
import { pickWatchTimestamps, watchReel } from "../src/watch";
import { CRITIQUE_DEFAULTS } from "../src/critique";
import type { Edl } from "../src/edl";

const edl = (ranges: { source: string; start: number; end: number }[]): Edl => ({
  version: 1,
  sources: Object.fromEntries([...new Set(ranges.map((r) => r.source))].map((s) => [s, `/x/${s}.mp4`])),
  ranges: ranges.map((r) => ({ ...r })),
  grade: "", overlays: [],
  total_duration_s: ranges.reduce((a, r) => a + (r.end - r.start), 0),
});

describe("pickWatchTimestamps", () => {
  it("covers the opening and each cut for a two-clip reel", () => {
    const ts = pickWatchTimestamps(edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]), CRITIQUE_DEFAULTS);
    expect(ts).toContain(0.3);
    expect(ts).toContain(1.2);
    expect(ts).toContain(2.7); // cut at 3.0 − 0.3
    expect(ts).toContain(3.3); // cut at 3.0 + 0.3
  });
  it("adds the midpoint of an over-max-hold clip", () => {
    const ts = pickWatchTimestamps(edl([{ source: "a", start: 0, end: 8 }]), CRITIQUE_DEFAULTS);
    expect(ts).toContain(4); // midpoint of the 8s hold
  });
  it("stays in bounds, sorted, deduped, and capped", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ source: `s${i}`, start: 0, end: 1.5 }));
    const ts = pickWatchTimestamps(edl(many), CRITIQUE_DEFAULTS, 10);
    expect(ts.length).toBeLessThanOrEqual(10);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
    expect(ts.every((t) => t >= 0 && t <= 18 - 0.1)).toBe(true);
    expect(new Set(ts.map((t) => Math.round(t * 10))).size).toBe(ts.length);
  });
});

describe("watchReel", () => {
  const twoClips = edl([{ source: "a", start: 0, end: 3 }, { source: "b", start: 0, end: 3 }]);
  const fakeSample = async (_p: string, ts: number[]) => ts.map(() => "ZmFrZQ==");

  it("returns coerced problems from the vision call", async () => {
    const p = await watchReel({
      reelPath: "/x.mp4", edl: twoClips, words: [],
      sample: fakeSample,
      vision: async () => ({ text: JSON.stringify({ problems: [
        { dimension: "footage", check: "dead-stretch", severity: "important", message: "nothing happens 2.5-3.0s" },
        { dimension: "bogus", check: "weird", severity: "catastrophic", message: "??" },
      ] }) }),
    });
    expect(p).toHaveLength(2);
    expect(p[0]).toMatchObject({ dimension: "footage", check: "dead-stretch", severity: "important" });
    expect(p[1]).toMatchObject({ dimension: "footage", severity: "minor" }); // coerced
  });

  it("returns [] when the model output is not parseable", async () => {
    const p = await watchReel({ reelPath: "/x.mp4", edl: twoClips, words: [], sample: fakeSample,
      vision: async () => ({ text: "sorry, here are my thoughts..." }) });
    expect(p).toEqual([]);
  });

  it("returns [] when the vision call throws", async () => {
    const p = await watchReel({ reelPath: "/x.mp4", edl: twoClips, words: [], sample: fakeSample,
      vision: async () => { throw new Error("network"); } });
    expect(p).toEqual([]);
  });

  it("caps the problem list at 6", async () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ dimension: "footage", check: `c${i}`, severity: "minor", message: "" }));
    const p = await watchReel({ reelPath: "/x.mp4", edl: twoClips, words: [], sample: fakeSample,
      vision: async () => ({ text: JSON.stringify({ problems: many }) }) });
    expect(p).toHaveLength(6);
  });
});
