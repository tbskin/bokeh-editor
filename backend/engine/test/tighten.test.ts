import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { shiftWords, shrinkRanges, cutVoSpan } from "../src/tighten";
import type { Word } from "../src/critique";

const pExecFile = promisify(execFile);
const word = (text: string, start: number, end: number): Word => ({ type: "word", text, start, end });

describe("shiftWords", () => {
  const words = [word("before", 0, 0.9), word("gap", 1.1, 1.9), word("after", 2.5, 3.4)];
  it("drops words inside the cut and shifts later words left", () => {
    const out = shiftWords(words, 1.0, 2.0);
    expect(out.map((w) => w.text)).toEqual(["before", "after"]);
    expect(out[1].start).toBeCloseTo(1.5, 3);
    expect(out[1].end).toBeCloseTo(2.4, 3);
  });
  it("clamps a word straddling the cut start", () => {
    const out = shiftWords([word("straddle", 0.8, 1.4), word("after", 2.2, 3.0)], 1.0, 2.0);
    expect(out[0].end).toBeCloseTo(1.0, 3); // trimmed at the cut
    expect(out[1].start).toBeCloseTo(1.2, 3);
  });
  it("keeps non-word entries untouched in order", () => {
    const out = shiftWords([word("a", 0, 0.5), { type: "spacing", text: " " }, word("b", 2.5, 3)], 1, 2);
    expect(out).toHaveLength(3);
    expect(out[1].type).toBe("spacing");
  });
});

describe("shrinkRanges", () => {
  const ranges = [
    { source: "a", start: 0, end: 4 },   // 4s
    { source: "b", start: 0, end: 3 },   // 3s
    { source: "c", start: 0, end: 2 },   // 2s
  ];
  it("absorbs the delta from the tail backwards, respecting the floor", () => {
    const out = shrinkRanges(ranges, 1.0, 1.2);
    expect(out).toHaveLength(3);
    expect(out[2].end - out[2].start).toBeCloseTo(1.2, 2); // c gave 0.8 down to the floor
    expect(out[1].end - out[1].start).toBeCloseTo(2.8, 2); // b gave the remaining 0.2
    expect(out[0].end - out[0].start).toBeCloseTo(4, 2);   // a untouched
  });
  it("drops a tail range entirely when the delta swallows it", () => {
    const out = shrinkRanges(ranges, 4.5, 1.2);
    const total = out.reduce((s, r) => s + (r.end - r.start), 0);
    expect(total).toBeCloseTo(9 - 4.5, 1);
  });
  it("returns ranges unchanged for a zero delta", () => {
    expect(shrinkRanges(ranges, 0, 1.2)).toEqual(ranges);
  });
});

describe("cutVoSpan (real ffmpeg on a tiny fixture)", () => {
  it("cuts the span from vo.wav, shifts the transcript, rebuilds captions, and shrinks the EDL", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-cut-"));
    const editDir = join(dir, "edit");
    await mkdir(join(editDir, "transcripts"), { recursive: true });
    // 5s tone as the VO stand-in.
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=300:duration=5", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", join(dir, "vo.wav")]);
    await writeFile(join(editDir, "transcripts", "vo.json"), JSON.stringify({
      words: [word("hello", 0.2, 0.9), word("there", 1.0, 1.8), word("world", 3.4, 4.6)],
    }));
    await writeFile(join(editDir, "edl.json"), JSON.stringify({
      version: 1, sources: { clip_00: "/x/a.mp4", clip_01: "/x/b.mp4" },
      ranges: [{ source: "clip_00", start: 0, end: 3 }, { source: "clip_01", start: 0, end: 2 }],
      grade: "", overlays: [], total_duration_s: 5,
    }));

    const { newVoSec, removedSec } = await cutVoSpan({ workDir: dir, fromSec: 2.0, toSec: 3.2 });

    expect(removedSec).toBeCloseTo(1.2, 2);
    expect(newVoSec).toBeGreaterThan(3.6);
    expect(newVoSec).toBeLessThan(4.0);
    const tr = JSON.parse(await readFile(join(editDir, "transcripts", "vo.json"), "utf8"));
    expect(tr.words.map((w: Word) => w.text)).toEqual(["hello", "there", "world"]);
    expect(tr.words[2].start).toBeCloseTo(2.2, 2); // 3.4 shifted left by 1.2
    const srt = await readFile(join(editDir, "master.srt"), "utf8");
    expect(srt).toContain("WORLD");
    const edl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8"));
    const total = edl.ranges.reduce((s: number, r: { start: number; end: number }) => s + (r.end - r.start), 0);
    expect(total).toBeCloseTo(3.8, 1); // 5 - 1.2
    expect(edl.total_duration_s).toBeCloseTo(3.8, 1);
  });
});
