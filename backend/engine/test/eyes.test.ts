import { describe, it, expect, vi } from "vitest";
import { frameTimestamps, analyzeClip, type ClipNotes } from "../src/eyes";

describe("frameTimestamps", () => {
  it("returns n evenly-spaced timestamps inside the clip", () => {
    expect(frameTimestamps(10, 5)).toEqual([1, 3, 5, 7, 9]);
  });
  it("stays strictly inside (0, duration) and handles a short clip", () => {
    const ts = frameTimestamps(2, 5);
    expect(ts).toHaveLength(5);
    for (const t of ts) { expect(t).toBeGreaterThan(0); expect(t).toBeLessThan(2); }
  });
  it("returns [] for a non-positive duration", () => {
    expect(frameTimestamps(0)).toEqual([]);
  });
});

describe("analyzeClip", () => {
  it("samples frames, calls the model once, and returns the parsed ClipNotes", async () => {
    const notes: ClipNotes = { file: "clips/a.mov", durationSec: 3, segments: [
      { start: 0, end: 3, description: "d", subjects: ["s"], motion: "m", quality: "q", tags: ["t"] },
    ] };
    const sample = vi.fn(async (_p: string, ts: number[]) => ts.map((_, i) => `b64_${i}`));
    const vision = vi.fn(async (prompt: string, imgs: string[]) => {
      expect(imgs).toHaveLength(5);            // frames were sampled and passed
      expect(prompt).toContain("SF tech bro"); // creator context biased the prompt
      return { text: JSON.stringify(notes), inputTokens: 3000, outputTokens: 500 };
    });
    const out = await analyzeClip({ clipPath: "/x/a.mov", fileLabel: "clips/a.mov", context: "SF tech bro", durationSec: 3, sample, vision });
    expect(vision).toHaveBeenCalledOnce();
    expect(out.notes).toEqual(notes);
    expect(out.inputTokens).toBe(3000);
  });
});
