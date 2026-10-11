import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdir as fsMkdir, writeFile as fsWriteFile, readFile as fsReadFile } from "node:fs/promises";
import { setVoice, readProfile } from "../src/profiles";

beforeAll(async () => {
  process.env.OLE_DATA = await mkdtemp(join(tmpdir(), "ole-voice-"));
  // The /setup route's capability gate (Fix 4) checks this env var directly, regardless of any
  // injected `eleven` client — set a baseline here so the pre-existing setup tests below keep
  // exercising the injected client instead of tripping the 503 gate. The one test that exercises
  // the gate itself deletes and restores this per-test.
  process.env.ELEVENLABS_API_KEY = "test-key";
});

const appWith = async (eleven: unknown, speechSec: number) => {
  const { createVoiceRoutes } = await import("../src/voice");
  const app = express();
  // Test stand-in for requireAuth(): a fixed user id. requireAuth() attaches req.userId
  // (see auth.ts), not oleUserId — match that field here.
  app.use((req, _res, next) => { (req as { userId?: string }).userId = "user-1"; next(); });
  app.use("/api/voice", createVoiceRoutes({ eleven: eleven as never, speech: async () => speechSec }));
  return app;
};

describe("voice setup", () => {
  it("clones on a long-enough sample and reports hasVoice", async () => {
    const eleven = { addVoice: async () => ({ voiceId: "el-1" }), deleteVoice: async () => {} };
    const app = await appWith(eleven, 52);
    const r = await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
    expect(r.status).toBe(200);
    expect((await request(app).get("/api/voice")).body).toEqual({ hasVoice: true });
  });
  it("rejects a short sample with a human sentence", async () => {
    const app = await appWith({ addVoice: async () => ({ voiceId: "x" }), deleteVoice: async () => {} }, 12);
    const r = await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/about a minute/i);
  });
  it("answers a setup failure in a human sentence, never the raw error", async () => {
    const { createVoiceRoutes } = await import("../src/voice");
    const app = express();
    app.use((req, _res, next) => { (req as { userId?: string }).userId = "user-1"; next(); });
    app.use("/api/voice", createVoiceRoutes({
      eleven: { addVoice: async () => ({ voiceId: "x" }), deleteVoice: async () => {} },
      speech: async () => { throw new Error("ffprobe exploded"); },
    }));
    const r = await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
    expect(r.status).toBe(500);
    expect(r.body.error).toMatch(/couldn't set up your voice/i);
    expect(r.body.error).not.toContain("ffprobe");
  });
  it("keeps the profile when the upstream delete fails — consent state never lies", async () => {
    const eleven = {
      addVoice: async () => ({ voiceId: "el-3" }),
      deleteVoice: async () => { throw new Error("We couldn't remove your voice just now — try again in a moment. (500)"); },
    };
    const app = await appWith(eleven, 60);
    await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
    const r = await request(app).delete("/api/voice");
    expect(r.status).toBe(502);
    expect(r.body.error).toMatch(/couldn't remove your voice/i);
    expect((await request(app).get("/api/voice")).body).toEqual({ hasVoice: true }); // still consented, still real
  });

  it("delete clears the profile and the upstream voice", async () => {
    let deleted = "";
    const eleven = { addVoice: async () => ({ voiceId: "el-2" }), deleteVoice: async (id: string) => { deleted = id; } };
    const app = await appWith(eleven, 60);
    await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
    const r = await request(app).delete("/api/voice");
    expect(r.status).toBe(200);
    expect(deleted).toBe("el-2");
    expect((await request(app).get("/api/voice")).body).toEqual({ hasVoice: false });
  });
  it("503s before the upload even lands when the capability is off, regardless of an injected eleven client", async () => {
    const prevKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;
    try {
      const eleven = { addVoice: async () => ({ voiceId: "el-x" }), deleteVoice: async () => {} };
      const app = await appWith(eleven, 52);
      const r = await request(app).post("/api/voice/setup").attach("sample", Buffer.from("RIFFfake"), "sample.m4a");
      expect(r.status).toBe(503);
      expect(r.body.error).toMatch(/isn't available/i);
    } finally {
      if (prevKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = prevKey;
    }
  });
});

describe("generate-vo", () => {
  it("generates the exact saved teleprompter revision and rejects a stale client revision", async () => {
    const { generateVoForTest } = await import("../src/jobs");
    const { readScriptState, updateScript } = await import("../src/script-state");
    const dataDir = process.env.OLE_DATA!;
    const pid = "22222222-2222-4222-8222-222222222222";
    const workDir = join(dataDir, pid);
    await fsMkdir(workDir, { recursive: true });
    await fsWriteFile(join(workDir, "script.md"), `---\nangle: "t"\ntargetSeconds: 5\n---\nstale words`);
    const staleRevision = (await readScriptState(workDir)).revision;
    const saved = await updateScript({ workDir, script: "These are my hand-edited words.", expectedRevision: staleRevision });
    let generatedText = "";
    const synth = async (input: { workDir: string; script: string }) => {
      generatedText = input.script;
      await fsWriteFile(join(input.workDir, "vo.wav"), Buffer.from("RIFF"));
      return { voSec: 4.2, words: [], chars: input.script.length };
    };
    const output = await generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", expectedRevision: saved.revision, synth: synth as never });
    expect(generatedText).toBe("These are my hand-edited words.");
    expect(output.scriptRevision).toBe(saved.revision);
    await expect(generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", expectedRevision: staleRevision, synth: synth as never }))
      .rejects.toThrow(/script changed/i);
  });

  it("synthesizes into the project dir and enforces the daily cap", async () => {
    const { generateVoForTest } = await import("../src/jobs");
    const dataDir = process.env.OLE_DATA!;
    const pid = "11111111-1111-1111-1111-111111111111";
    await fsMkdir(join(dataDir, pid), { recursive: true });
    await fsWriteFile(join(dataDir, pid, "script.md"), `---\nangle: "t"\ntargetSeconds: 5\n---\nhey there`);
    let calls = 0;
    const synth = async (input: { workDir: string; script: string }) => {
      calls++;
      await fsWriteFile(join(input.workDir, "vo.wav"), Buffer.from("RIFF"));
      return { voSec: 4.2, words: [], chars: input.script.length };
    };
    for (let i = 0; i < 5; i++) {
      const out = await generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", synth: synth as never });
      expect(out.voSec).toBe(4.2);
    }
    await expect(generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", synth: synth as never }))
      .rejects.toThrow(/enough versions for today/i);
    expect(calls).toBe(5);
    expect(JSON.parse(await fsReadFile(join(dataDir, pid, "vo.gen-count.json"), "utf8")).count).toBe(5);
  });

  it("a failed synth never burns a cap slot — the count only advances after synthesis succeeds", async () => {
    const { generateVoForTest } = await import("../src/jobs");
    const dataDir = process.env.OLE_DATA!;
    const pid = "44444444-4444-4444-4444-444444444444";
    await fsMkdir(join(dataDir, pid), { recursive: true });
    await fsWriteFile(join(dataDir, pid, "script.md"), `---\nangle: "t"\ntargetSeconds: 5\n---\nhey there`);
    const okSynth = async (input: { workDir: string; script: string }) => {
      await fsWriteFile(join(input.workDir, "vo.wav"), Buffer.from("RIFF"));
      return { voSec: 4.2, words: [], chars: input.script.length };
    };
    for (let i = 0; i < 3; i++) {
      await generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", synth: okSynth as never });
    }
    expect(JSON.parse(await fsReadFile(join(dataDir, pid, "vo.gen-count.json"), "utf8")).count).toBe(3);

    const throwingSynth = async () => { throw new Error("boom"); };
    await expect(generateVoForTest({ id: pid, voiceId: "v", apiKey: "k", synth: throwingSynth as never }))
      .rejects.toThrow(/boom/);
    // Unchanged — a failure must never burn a slot the creator never actually got.
    expect(JSON.parse(await fsReadFile(join(dataDir, pid, "vo.gen-count.json"), "utf8")).count).toBe(3);
  });

  it("clears the voice profile and asks the creator to set up again when synth reports voice_not_found", async () => {
    const { startGenerateVo } = await import("../src/jobs");
    const dataDir = process.env.OLE_DATA!;
    const pid2 = "55555555-5555-5555-5555-555555555555";
    await fsMkdir(join(dataDir, pid2), { recursive: true });
    await fsWriteFile(join(dataDir, pid2, "script.md"), `---\nangle: "t"\ntargetSeconds: 5\n---\nhey there`);
    setVoice("u9", { voiceId: "el-9", sampleSec: 50 });
    const prevKey = process.env.ELEVENLABS_API_KEY;
    process.env.ELEVENLABS_API_KEY = "k";
    try {
      const vanished = async () => { throw new Error("tts: voice_not_found: gone"); };
      await expect(startGenerateVo(pid2, "u9", { synth: vanished as never }))
        .rejects.toThrow(/setting up again/i);
      expect(readProfile("u9").voiceId).toBeUndefined();
    } finally {
      if (prevKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = prevKey;
    }
  });
});
