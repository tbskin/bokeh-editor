import { describe, it, expect, beforeAll } from "vitest";
import { mkdtemp, mkdir, writeFile, utimes, stat, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const pExecFile = promisify(execFile);
let store: typeof import("../src/store");

beforeAll(async () => {
  process.env.OLE_DATA = await mkdtemp(join(tmpdir(), "ole-hard-"));
  store = await import("../src/store");
});

describe("toVoWav silence guard", () => {
  it("rejects a recording that is effectively silent", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-vo-"));
    const m4a = join(dir, "silent.m4a");
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", "4", "-c:a", "aac", m4a]);
    await expect(store.toVoWav(m4a, join(dir, "vo.wav"))).rejects.toThrow(/couldn't hear/i);
  });
  it("still accepts a real recording", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-vo-"));
    const m4a = join(dir, "tone.m4a");
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=300:duration=3", "-c:a", "aac", m4a]);
    await store.toVoWav(m4a, join(dir, "vo.wav"));
    expect((await stat(join(dir, "vo.wav"))).size).toBeGreaterThan(1000);
  });

  it("compresses a long mid-recording pause down to a beat (~0.2s)", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-vo-"));
    const m4a = join(dir, "gapped.m4a");
    // 1s of voice + 3s of dead air + 1s of voice — the recording pause the agent couldn't fix.
    await pExecFile("ffmpeg", [
      "-y",
      "-f", "lavfi", "-i", "sine=frequency=300:duration=1",
      "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
      "-f", "lavfi", "-i", "sine=frequency=300:duration=1",
      "-filter_complex", "[1:a]atrim=0:3[s];[0:a][s][2:a]concat=n=3:v=0:a=1[out]",
      "-map", "[out]", "-c:a", "aac", m4a,
    ]);
    const out = join(dir, "vo.wav");
    await store.toVoWav(m4a, out);
    const dur = parseFloat((await pExecFile("ffprobe", [
      "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", out,
    ])).stdout.trim());
    // 1 + 0.2 + 1 ≈ 2.2s — the 3s hole collapses to a breath.
    expect(dur).toBeGreaterThan(1.8);
    expect(dur).toBeLessThan(2.8);
  });
});

describe("sweepTmp", () => {
  it("removes orphaned upload temp files", async () => {
    const tmp = join(process.env.OLE_DATA!, "_tmp");
    await mkdir(tmp, { recursive: true });
    await writeFile(join(tmp, "orphan1"), "x");
    await writeFile(join(tmp, "orphan2"), "x");
    const n = await store.sweepTmp();
    expect(n).toBeGreaterThanOrEqual(2);
    const left = await store.sweepTmp();
    expect(left).toBe(0);
  });
});

describe("pruneExpiredSources", () => {
  async function makeProject(id: string, ageDays: number): Promise<string> {
    const dir = join(process.env.OLE_DATA!, id);
    await mkdir(join(dir, "clips"), { recursive: true });
    await mkdir(join(dir, "edit"), { recursive: true });
    await mkdir(join(dir, "trace"), { recursive: true });
    await writeFile(join(dir, "clips", "a.mov"), "big clip bytes");
    await writeFile(join(dir, "edit", "visual.mp4"), "draft visual");
    await writeFile(join(dir, "edit", "final.mp4"), "the reel");
    await writeFile(join(dir, "trace", "editor-refine-1.jsonl"), "{}");
    const t = (Date.now() - ageDays * 86400e3) / 1000;
    await utimes(dir, t, t);
    return dir;
  }

  it("frees sources of old projects but keeps the playable reel; leaves fresh projects alone", async () => {
    const oldDir = await makeProject("22222222-2222-2222-2222-222222222222", 20);
    const freshDir = await makeProject("33333333-3333-3333-3333-333333333333", 1);
    const pruned = await store.pruneExpiredSources(14);
    expect(pruned).toContain("22222222-2222-2222-2222-222222222222");
    await expect(stat(join(oldDir, "clips"))).rejects.toThrow();          // bulk gone
    await expect(stat(join(oldDir, "edit", "visual.mp4"))).rejects.toThrow();
    expect((await readFile(join(oldDir, "edit", "final.mp4"), "utf8"))).toBe("the reel"); // reel kept
    expect((await stat(join(freshDir, "clips"))).isDirectory()).toBe(true); // fresh untouched
  });
});

describe("refineCount", () => {
  it("counts codex refine traces for the project", async () => {
    const dir = join(process.env.OLE_DATA!, "44444444-4444-4444-4444-444444444444");
    await mkdir(join(dir, "trace"), { recursive: true });
    expect(await store.refineCount("44444444-4444-4444-4444-444444444444")).toBe(0);
    await writeFile(join(dir, "trace", "editor-refine-1.jsonl"), "{}");
    await writeFile(join(dir, "trace", "editor-refine-2.jsonl"), "{}");
    await writeFile(join(dir, "trace", "editor-assemble-1.jsonl"), "{}"); // not a refine
    expect(await store.refineCount("44444444-4444-4444-4444-444444444444")).toBe(2);
  });
});
