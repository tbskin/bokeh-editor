import { useTestAudioLibrary } from "./test-audio";
useTestAudioLibrary();
import { describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVideoUse } from "../src/video-use";
import { mixDocumentSfxIntoVideo, renderFromEdl } from "../src/assemble-reel";
import { fromV1 } from "../src/edit-document";

const pExecFile = promisify(execFile);

async function source(path: string, color: string, frequency: number) {
  await pExecFile("ffmpeg", [
    "-y", "-f", "lavfi", "-i", `color=c=${color}:s=360x640:r=30:d=2`,
    "-f", "lavfi", "-i", `sine=frequency=${frequency}:sample_rate=48000:duration=2`,
    "-shortest", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", path,
  ]);
}

describe("vendored deterministic render primitives", () => {
  it("renders punch-in, exact two-source split, fade/crossfade, 30ms audio edges, and crossfade-aware caption offsets", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-render-primitives-"));
    const editDir = join(workDir, "edit");
    await mkdir(join(editDir, "transcripts"), { recursive: true });
    const a = join(workDir, "a.mp4"); const b = join(workDir, "b.mp4");
    await Promise.all([source(a, "red", 330), source(b, "blue", 550)]);
    await writeFile(join(editDir, "transcripts", "a.json"), JSON.stringify({ words: [
      { type: "word", text: "First.", start: 0.1, end: 0.35 },
      { type: "word", text: "Finally.", start: 1.1, end: 1.4 },
    ] }));
    await writeFile(join(editDir, "transcripts", "b.json"), JSON.stringify({ words: [
      { type: "word", text: "Second.", start: 0.1, end: 0.35 },
    ] }));
    const edl = {
      version: 1, sources: { a, b },
      ranges: [
        { source: "a", start: 0, end: 0.8, transform: { scale: 1.2, x: 0.15, y: 0 } },
        { source: "b", start: 0, end: 0.8, split: { source: "a", sourceStartSec: 0, side: "left" }, transitionIn: { kind: "crossfade", durationSec: 0.2 } },
        { source: "a", start: 1, end: 1.8, split: { source: "b", sourceStartSec: 1, side: "right" }, transitionIn: { kind: "fade", durationSec: 0.1 } },
      ],
      grade: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
      overlays: [], subtitles: "master.srt", total_duration_s: 2.2,
      metadata: { format: "talking_head", audio: { master: "source", envelopes: [{ target: "source", startSec: 1.4, endSec: 2, gainDb: -6 }], sfx: [] } },
    };
    const edlPath = join(editDir, "edl.json"); const output = join(editDir, "final.mp4");
    await writeFile(edlPath, JSON.stringify(edl));
    await runVideoUse(["render.py", edlPath, "-o", output, "--draft", "--build-subtitles"], workDir);
    const probe = JSON.parse((await pExecFile("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", output])).stdout);
    expect(Number(probe.format.duration)).toBeCloseTo(2.2, 1);
    expect(probe.streams.some((stream: { codec_type: string }) => stream.codec_type === "audio")).toBe(true);
    expect(probe.streams.find((stream: { codec_type: string }) => stream.codec_type === "video")).toMatchObject({ width: 720, height: 1280 });
    const captions = await readFile(join(editDir, "master.srt"), "utf8");
    expect(captions).toContain("00:00:00,700 --> 00:00:00,950\nSECOND.");
    expect(captions).toContain("00:00:01,500 --> 00:00:01,800\nFINALLY.");
    const renderer = await readFile(new URL("../../vendor/video-use/helpers/render.py", import.meta.url), "utf8");
    expect(renderer).toContain("afade=t=in:st=0:d=0.03");
    expect(renderer).toContain("acrossfade=d=");
    const mixed = join(editDir, "with-sfx.mp4");
    expect(await mixDocumentSfxIntoVideo({ source: output, destination: mixed, durationSec: 2.2, sfx: [{ name: "pop", atSec: 0.7, gainDb: -3 }] })).toBe(true);
    const mixedProbe = JSON.parse((await pExecFile("ffprobe", ["-v", "error", "-show_streams", "-of", "json", mixed])).stdout);
    expect(mixedProbe.streams.some((stream: { codec_type: string }) => stream.codec_type === "audio")).toBe(true);
  }, 120_000);

  it("keeps the complete VO across a crossfade and composites title before captions", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-render-order-"));
    const editDir = join(workDir, "edit");
    await mkdir(editDir, { recursive: true });
    const a = join(workDir, "a.mp4"); const b = join(workDir, "b.mp4");
    await Promise.all([source(a, "green", 330), source(b, "purple", 550)]);
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=220:sample_rate=16000:duration=2", "-ac", "1", join(workDir, "vo.wav")]);
    const edl = {
      version: 1, sources: { a, b },
      ranges: [
        { source: "a", start: 0, end: 1 },
        { source: "b", start: 0, end: 1, transitionIn: { kind: "crossfade" as const, durationSec: 0.2 } },
      ],
      grade: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280",
      overlays: [], subtitles: "master.srt", total_duration_s: 1.8,
      metadata: { format: "voiceover" },
    };
    await writeFile(join(editDir, "edl.json"), JSON.stringify(edl));
    await writeFile(join(editDir, "document.v2.json"), JSON.stringify(fromV1(edl, "voiceover")));
    await writeFile(join(editDir, "master.srt"), "1\n00:00:00,000 --> 00:00:02,000\nCAPTIONS STAY ON TOP\n");
    await writeFile(join(workDir, "plan.json"), JSON.stringify({ title: "TITLE UNDER CAPTIONS", titleStyle: "clean", music: "none", ending: "cut" }));
    const { reelPath } = await renderFromEdl({ workDir, quality: "draft" });
    const duration = Number((await pExecFile("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", reelPath])).stdout.trim());
    expect(duration).toBeCloseTo(2, 1);
    const saved = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8"));
    expect(saved.metadata.titleAss).toBe("title.ass");
    expect(saved.total_duration_s).toBe(1.8);
    const renderer = await readFile(new URL("../../vendor/video-use/helpers/render.py", import.meta.url), "utf8");
    expect(renderer.indexOf("title_abs =")).toBeLessThan(renderer.indexOf("# Subtitles LAST"));
  }, 120_000);
});
