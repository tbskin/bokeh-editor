import { describe, it, expect } from "vitest";
import { REELS, columnPlan } from "./reels";

describe("columnPlan", () => {
  it("splits reels into N columns with alternating direction + varied speed", () => {
    const cols = columnPlan(REELS.slice(0, 12), 3);
    expect(cols).toHaveLength(3);
    expect(cols[0].reels.length + cols[1].reels.length + cols[2].reels.length).toBe(12);
    expect(cols[0].reverse).toBe(false);
    expect(cols[1].reverse).toBe(true);
    expect(cols[0].durationSec).not.toBe(cols[1].durationSec);
  });
});
