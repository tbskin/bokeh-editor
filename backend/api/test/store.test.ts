import { describe, it, expect, beforeAll } from "vitest";
import { mkdir as mkdirP, mkdtemp, readFile, stat, writeFile as writeFileP } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import { recordSignal } from "../src/store";

const pExecFile = promisify(execFile);
let store: typeof import("../src/store");

beforeAll(async () => {
  process.env.OLE_DATA = await mkdtemp(join(tmpdir(), "ole-data-"));
  store = await import("../src/store");
});

describe("ensureProjectDir", () => {
  it("creates a working dir with clips/", async () => {
    const id = randomUUID();
    await store.ensureProjectDir(id);
    expect((await stat(join(store.projectDir(id), "clips"))).isDirectory()).toBe(true);
  });
});

describe("removeProjectDir", () => {
  it("removes the whole workspace, and tolerates an already-missing one", async () => {
    const id = randomUUID();
    await store.ensureProjectDir(id);
    await writeFileP(join(store.projectDir(id), "clips", "a.mov"), "x");
    await store.removeProjectDir(id);
    await expect(stat(store.projectDir(id))).rejects.toThrow();
    await store.removeProjectDir(id); // deleting a ghost project must not throw
  });
});

describe("toVoWav", () => {
  it("transcodes AAC/m4a to 16kHz mono PCM wav", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-vo-"));
    const m4a = join(dir, "in.m4a");
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2.5", "-c:a", "aac", m4a]);
    const out = join(dir, "vo.wav");
    await store.toVoWav(m4a, out);
    const buf = await readFile(out);
    expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
    const { stdout } = await pExecFile("ffprobe", [
      "-v", "error", "-select_streams", "a:0",
      "-show_entries", "stream=sample_rate,channels", "-of", "default=nw=1", out,
    ]);
    expect(stdout).toContain("sample_rate=16000");
    expect(stdout).toContain("channels=1");
  });
});

describe("placeClips / placeVo", () => {
  it("moves clips into clips/ and normalizes vo to vo.wav", async () => {
    const id = randomUUID();
    await store.ensureProjectDir(id);
    const tmp = await mkdtemp(join(tmpdir(), "ole-up-"));
    const clip = join(tmp, "IMG_1.mov");
    await writeFileP(clip, "fake");
    await store.placeClips(id, { clips: [{ path: clip, originalname: "IMG_1.mov" } as any] });
    expect((await stat(join(store.projectDir(id), "clips", "IMG_1.mov"))).isFile()).toBe(true);

    const m4a = join(tmp, "vo.m4a");
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2.5", "-c:a", "aac", m4a]);
    await store.placeVo(id, { vo: [{ path: m4a, originalname: "vo.m4a" } as any] });
    const buf = await readFile(join(store.projectDir(id), "vo.wav"));
    expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
  });

  it("rejects an upload with no vo file instead of silently succeeding", async () => {
    // RN drops the form field when the phone's recording file is empty/missing; a silent success
    // here let assemble start without vo.wav and die cryptically in transcribe.
    const id = randomUUID();
    await store.ensureProjectDir(id);
    await expect(store.placeVo(id, {})).rejects.toThrow(/didn't come through/);
    await expect(store.placeVo(id, undefined)).rejects.toThrow(/didn't come through/);
  });

  it("erases a stale generated take's markers when a recorded take lands, so it isn't cut against the abandoned TTS transcript", async () => {
    const id = randomUUID();
    await store.ensureProjectDir(id);
    const dir = store.projectDir(id);
    // Seed leftovers from a previous "Generate my voiceover" take.
    await writeFileP(join(dir, "vo.meta.json"), JSON.stringify({ via: "tts", voiceId: "v", chars: 3, generatedAt: "x" }));
    await mkdirP(join(dir, "edit", "transcripts"), { recursive: true });
    await writeFileP(join(dir, "edit", "transcripts", "vo.json"), JSON.stringify({ words: [] }));

    const tmp = await mkdtemp(join(tmpdir(), "ole-up-"));
    const m4a = join(tmp, "vo.m4a");
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=2.5", "-c:a", "aac", m4a]);
    await store.placeVo(id, { vo: [{ path: m4a, originalname: "vo.m4a" } as any] });

    await expect(stat(join(dir, "vo.meta.json"))).rejects.toThrow();
    await expect(stat(join(dir, "edit", "transcripts", "vo.json"))).rejects.toThrow();
  });
});

describe("recordSignal", () => {
  it("appends jsonl signal lines with a timestamp", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-sig-"));
    process.env.OLE_DATA = dir;
    await recordSignal("p1", "saved");
    await recordSignal("p1", "refine", { message: "tighten intro" });
    const lines = (await readFile(join(dir, "p1", "signals.jsonl"), "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
    const second = JSON.parse(lines[1]);
    expect(second.type).toBe("refine");
    expect(second.data).toEqual({ message: "tighten intro" });
    expect(typeof second.ts).toBe("number");
  });
});
