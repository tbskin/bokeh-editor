import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, writeFile as fsWriteFile, mkdir as fsMkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { alignmentToWords, synthesizeVo, speechSeconds } from "../src/tts-vo";
import { prepareEdit } from "../src/assemble-reel";

const pExec = promisify(execFile);

const align = (s: string, dt = 0.1) => ({
  characters: [...s],
  character_start_times_seconds: [...s].map((_, i) => Number((i * dt).toFixed(3))),
  character_end_times_seconds: [...s].map((_, i) => Number(((i + 1) * dt).toFixed(3))),
});

describe("alignmentToWords", () => {
  it("splits on whitespace, keeps punctuation attached, times span first→last char", () => {
    const words = alignmentToWords(align("Hi there,  friend."));
    expect(words.map((w) => w.text)).toEqual(["Hi", "there,", "friend."]);
    expect(words[0]).toMatchObject({ type: "word", start: 0, end: 0.2 });     // H,i
    expect(words[1].start).toBeCloseTo(0.3, 3);                               // t of there
    expect(words[2].end).toBeCloseTo(1.8, 3);                                 // final .
  });
  it("handles apostrophes inside words and leading/trailing space", () => {
    const words = alignmentToWords(align(" don't stop "));
    expect(words.map((w) => w.text)).toEqual(["don't", "stop"]);
  });
  it("returns [] for empty or whitespace-only alignment", () => {
    expect(alignmentToWords(align(""))).toEqual([]);
    expect(alignmentToWords(align("   "))).toEqual([]);
  });
});

// 0.5s of 16k mono s16le silence as the "synthesized" PCM payload.
const pcmB64 = Buffer.alloc(16000, 0).toString("base64");
const fakeAlignment = align("hey there");

const fakeFetch = (capture: { url?: string; body?: unknown }) => async (url: string, init: { body: string }) => {
  capture.url = url;
  capture.body = JSON.parse(init.body);
  return {
    ok: true, status: 200,
    text: async () => "",
    json: async () => ({ audio_base64: pcmB64, alignment: fakeAlignment }),
  };
};

describe("synthesizeVo", () => {
  it("writes vo.wav (16k mono), a Whisper-shaped transcript, and the tts meta marker", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-tts-"));
    const cap: { url?: string; body?: { text?: string } } = {};
    const out = await synthesizeVo({ workDir, script: "hey there", voiceId: "v123", apiKey: "k", fetchImpl: fakeFetch(cap) as never });
    expect(cap.url).toContain("/v1/text-to-speech/v123/with-timestamps");
    expect(cap.url).toContain("output_format=pcm_16000");
    expect(cap.body!.text).toBe("hey there");
    expect(out.voSec).toBeCloseTo(0.5, 1);
    expect(out.words.map((w) => w.text)).toEqual(["hey", "there"]);
    const probe = await pExec("ffprobe", ["-v", "error", "-show_entries", "stream=sample_rate,channels", "-of", "csv=p=0", join(workDir, "vo.wav")]);
    expect(probe.stdout.trim()).toBe("16000,1");
    const tr = JSON.parse(await readFile(join(workDir, "edit", "transcripts", "vo.json"), "utf8"));
    expect(tr.words[0]).toMatchObject({ type: "word", text: "hey" });
    const meta = JSON.parse(await readFile(join(workDir, "vo.meta.json"), "utf8"));
    expect(meta).toMatchObject({ via: "tts", voiceId: "v123", chars: 9 });
  });

  it("surfaces a missing voice as voice_not_found (the API clears the profile on this)", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-tts-"));
    const gone = async () => ({ ok: false, status: 404, text: async () => '{"detail":{"status":"voice_not_found"}}', json: async () => ({}) });
    await expect(synthesizeVo({ workDir, script: "x y", voiceId: "gone", apiKey: "k", fetchImpl: gone as never }))
      .rejects.toThrow(/voice_not_found/);
  });
});

describe("prepareEdit on a TTS take", () => {
  it("never calls transcribe (the transcript is already exact) and never rewrites vo.wav (no cleaner)", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-ttsprep-"));
    // A 2s silent wav "take" + exact transcript + tts meta + a one-clip plan whose clip is the wav itself
    // (ffprobe reads duration from wav fine; the EDL is written, not rendered, in prepareEdit).
    await pExec("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "2", "-c:a", "pcm_s16le", join(workDir, "vo.wav")]);
    await fsMkdir(join(workDir, "clips"), { recursive: true });
    await pExec("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:r=10", "-t", "3", join(workDir, "clips", "a.mp4")]);
    await fsMkdir(join(workDir, "edit", "transcripts"), { recursive: true });
    await fsWriteFile(join(workDir, "edit", "transcripts", "vo.json"),
      JSON.stringify({ words: [{ type: "word", text: "hey", start: 0.1, end: 0.4 }] }));
    await fsWriteFile(join(workDir, "vo.meta.json"), JSON.stringify({ via: "tts", voiceId: "v", chars: 3, generatedAt: "now" }));
    await fsWriteFile(join(workDir, "plan.json"), JSON.stringify({
      angle: "t", targetSeconds: 2, pace: "quick",
      sequence: [{ file: "clips/a.mp4", start: 0, end: 2 }],
    }));
    let transcribeCalled = 0;
    const before = (await readFile(join(workDir, "vo.wav"))).length;
    const out = await prepareEdit({ workDir, transcribe: async () => { transcribeCalled++; } });
    expect(transcribeCalled).toBe(0);
    expect((await readFile(join(workDir, "vo.wav"))).length).toBe(before); // cleaner never touched it
    expect(out.words.map((w) => w.text)).toEqual(["hey"]);
  });
});

describe("prepareEdit on a recorded take", () => {
  it("calls transcribe (no exact timestamps to reuse) — the mirror of the TTS take above, which skips it", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-recprep-"));
    // Same scaffolding as "prepareEdit on a TTS take": a wav "take" + a one-clip plan whose clip is
    // the wav itself, but NO vo.meta.json — the default, recorded path.
    await pExec("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono", "-t", "2", "-c:a", "pcm_s16le", join(workDir, "vo.wav")]);
    await fsMkdir(join(workDir, "clips"), { recursive: true });
    await pExec("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=black:s=64x64:r=10", "-t", "3", join(workDir, "clips", "a.mp4")]);
    await fsWriteFile(join(workDir, "plan.json"), JSON.stringify({
      angle: "t", targetSeconds: 2, pace: "quick",
      sequence: [{ file: "clips/a.mp4", start: 0, end: 2 }],
    }));
    let transcribeCalled = 0;
    const transcribe = async (_wd: string, editDir: string) => {
      transcribeCalled++;
      await fsMkdir(join(editDir, "transcripts"), { recursive: true });
      await fsWriteFile(join(editDir, "transcripts", "vo.json"),
        JSON.stringify({ words: [{ type: "word", text: "hey", start: 0.1, end: 0.4 }] }));
    };
    const out = await prepareEdit({ workDir, transcribe });
    expect(transcribeCalled).toBe(1);
    expect(out.words.map((w) => w.text)).toEqual(["hey"]);
  });
});

describe("speechSeconds", () => {
  it("counts only non-silent audio", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-speech-"));
    const p = join(dir, "s.wav");
    // 1s tone + 2s silence + 1s tone = ~2s of "speech" in a 4s file.
    await pExec("ffmpeg", ["-y",
      "-f", "lavfi", "-i", "sine=frequency=200:duration=1",
      "-f", "lavfi", "-i", "anullsrc=r=16000:cl=mono",
      "-f", "lavfi", "-i", "sine=frequency=200:duration=1",
      "-filter_complex", "[1:a]atrim=0:2[s];[0:a][s][2:a]concat=n=3:v=0:a=1,aresample=16000[a]",
      "-map", "[a]", "-ac", "1", "-c:a", "pcm_s16le", p]);
    const sec = await speechSeconds(p);
    expect(sec).toBeGreaterThan(1.5);
    expect(sec).toBeLessThan(2.6);
  });
});
