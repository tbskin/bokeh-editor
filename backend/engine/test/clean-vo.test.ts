import { describe, it, expect } from "vitest";
import { planVoCuts, shiftWordsThroughCuts, VO_CLEAN } from "../src/clean-vo";
import type { Word } from "../src/critique";

const w = (text: string, start: number, end: number): Word => ({ type: "word", text, start, end });

/** Lay words down back-to-back from t0, one 0.3s word every 0.35s. */
function speech(tokens: string[], t0: number): Word[] {
  return tokens.map((t, i) => w(t, t0 + i * 0.35, t0 + i * 0.35 + 0.3));
}

describe("planVoCuts", () => {
  it("collapses a long mid-take pause to a hard cut and trims the trailing fumble", () => {
    const words = [...speech(["okay", "so", "first", "day"], 0), ...speech(["got", "a", "coffee", "obviously"], 5)];
    // last word ends 5 + 3*0.35 + 0.3 = 6.35; recording runs to 9s (fumbling for the stop button)
    const cuts = planVoCuts(words, 9);
    expect(cuts).toHaveLength(2);
    const [gap, tail] = cuts;
    expect(gap.reason).toBe("silence");
    // word 'day' ends at 1.35, 'got' starts at 5 — cut leaves keepGapSec total
    expect(gap.from).toBeCloseTo(1.35 + VO_CLEAN.keepGapSec / 2, 2);
    expect(gap.to).toBeCloseTo(5 - VO_CLEAN.keepGapSec / 2, 2);
    expect(tail.reason).toBe("silence");
    expect(tail.to).toBe(9);
  });

  it("cuts the first attempt of a re-read line, keeping the last take", () => {
    const attempt1 = speech(["i", "almost", "went", "home", "after"], 0);
    const attempt2 = speech(["i", "almost", "went", "home", "after", "the", "first", "coffee"], 4);
    const cuts = planVoCuts([...attempt1, ...attempt2], 7); // speech ends ~6.75 — no tail to trim
    expect(cuts).toHaveLength(1);
    expect(cuts[0].reason).toBe("retake");
    expect(cuts[0].from).toBeCloseTo(0, 2);        // just before attempt 1's first word (clamped ≥ 0)
    expect(cuts[0].to).toBeCloseTo(4 - 0.05, 2);   // just before the kept take restarts
  });

  it("three attempts collapse to the final one", () => {
    const line = ["okay", "this", "basketball", "play", "was", "honestly", "kind", "of", "diabolical"];
    const words = [...speech(line, 0), ...speech(line, 3.6), ...speech(line, 7.2)];
    const cuts = planVoCuts(words, 10.5);
    const removed = cuts.filter((c) => c.reason === "retake").reduce((a, c) => a + (c.to - c.from), 0);
    expect(removed).toBeGreaterThanOrEqual(7); // both early attempts gone
    // the final attempt (starting at 7.2) survives
    for (const c of cuts) expect(c.to).toBeLessThanOrEqual(7.2);
  });

  it("leaves a clean take alone (short pauses, no repeats)", () => {
    const words = speech(["honestly", "no", "idea", "what", "im", "doing", "here", "yet"], 0);
    expect(planVoCuts(words, 3.1)).toEqual([]);
  });

  it("safety valve: refuses to gut a take when cuts would remove too much", () => {
    // 2 words, then 30s of silence, then 2 words — the cut would be ~93% of the take.
    const words = [...speech(["hey", "so"], 0), ...speech(["bye", "now"], 30)];
    expect(planVoCuts(words, 31.5)).toEqual([]);
  });
});

describe("shiftWordsThroughCuts", () => {
  it("shifts words left across multiple spans, exact", () => {
    const words = [w("a", 0, 0.3), w("b", 2, 2.3), w("c", 5, 5.3)];
    const out = shiftWordsThroughCuts(words, [
      { from: 0.5, to: 1.5, reason: "silence" },
      { from: 3, to: 4.5, reason: "silence" },
    ]);
    expect(out.map((x) => [x.text, x.start])).toEqual([["a", 0], ["b", 1], ["c", 2.5]]);
  });
});
