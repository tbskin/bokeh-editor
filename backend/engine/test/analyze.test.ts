import { describe, it, expect, vi } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAnalyzeJob } from "../src/analyze";
import type { ClipNotes } from "../src/eyes";

async function scratchWithClips(names: string[]) {
  const work = await mkdtemp(join(tmpdir(), "ole-analyze-"));
  await mkdir(join(work, "clips"), { recursive: true });
  for (const n of names) await writeFile(join(work, "clips", n), "x"); // placeholder files
  return work;
}

describe("runAnalyzeJob (eyes-backed)", () => {
  it("analyzes each clip via the eyes and merges into analysis.json", async () => {
    const work = await scratchWithClips(["a.mov", "b.mp4"]);
    const fakeEyes: typeof import("../src/eyes").analyzeClip = vi.fn(async ({ fileLabel }) => {
      const notes: ClipNotes = { file: fileLabel, durationSec: 3, segments: [
        { start: 0, end: 3, description: fileLabel, subjects: [], motion: "", quality: "", tags: [] },
      ] };
      return { notes, inputTokens: 3000, outputTokens: 500 };
    });
    const { analysisPath } = await runAnalyzeJob({ workDir: work, context: "x", analyze: fakeEyes, getDuration: async () => 3 });
    const merged = JSON.parse(await readFile(analysisPath, "utf8"));
    expect(merged.clips).toHaveLength(2);
    expect(merged.clips.map((c: any) => c.file).sort()).toEqual(["clips/a.mov", "clips/b.mp4"]);
    expect(fakeEyes).toHaveBeenCalledTimes(2);
  });

  it("skips a clip whose analysis fails twice, without failing the batch", async () => {
    const work = await scratchWithClips(["good.mov", "bad.mov"]);
    const fakeEyes: typeof import("../src/eyes").analyzeClip = vi.fn(async ({ fileLabel }) => {
      if (fileLabel.includes("bad")) throw new Error("boom");
      return { notes: { file: fileLabel, durationSec: 2, segments: [] }, inputTokens: 1, outputTokens: 1 };
    });
    const { analysisPath } = await runAnalyzeJob({ workDir: work, analyze: fakeEyes, getDuration: async () => 3 });
    const merged = JSON.parse(await readFile(analysisPath, "utf8"));
    expect(merged.clips).toHaveLength(1);          // bad clip skipped
    expect(merged.clips[0].file).toBe("clips/good.mov");
    expect(fakeEyes).toHaveBeenCalledTimes(3);     // good x1 + bad x2 (retry once)
  });
});
