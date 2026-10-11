import { describe, it, expect, beforeAll } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readProfile, noteWps } from "../src/profiles";

beforeAll(async () => {
  process.env.OLE_DATA = await mkdtemp(join(tmpdir(), "ole-prof-"));
});

describe("creator profiles (the account-level learning store)", () => {
  it("is empty for an unknown creator", () => {
    expect(readProfile("nobody")).toEqual({});
  });

  it("learns speaking pace as a recent-weighted mean that settles fast", () => {
    expect(noteWps("u1", 4.0).wps).toBe(4.0);
    // One slow take pulls the mean, but doesn't erase history.
    expect(noteWps("u1", 2.0).wps).toBe(3.0);
    // A consistent fast talker converges back toward their real pace (window ~5).
    for (let i = 0; i < 6; i++) noteWps("u1", 4.4);
    const p = readProfile("u1");
    expect(p.wps!).toBeGreaterThan(4.0);
    expect(p.wpsSamples).toBe(8);
  });

  it("remembers recent reels newest-first, capped, so the writer never re-treads", async () => {
    const { noteReel } = await import("../src/profiles");
    for (let i = 1; i <= 10; i++) noteReel("u3", { angle: `angle ${i}`, title: `t${i}`, opener: `o${i}` });
    const p = readProfile("u3");
    expect(p.recentReels).toHaveLength(8);
    expect(p.recentReels![0].angle).toBe("angle 10"); // newest first
    expect(p.recentReels![7].angle).toBe("angle 3");  // oldest kept
  });

  it("keeps creators separate and survives a re-read from disk", () => {
    noteWps("u2", 2.2);
    expect(readProfile("u2").wps).toBe(2.2);
    expect(readProfile("u1").wps!).toBeGreaterThan(4.0);
  });

  it("stores and clears the cloned voice with its consent timestamp", async () => {
    const { setVoice, clearVoice } = await import("../src/profiles");
    const p = setVoice("u4", { voiceId: "el-abc", sampleSec: 52 });
    expect(p.voiceId).toBe("el-abc");
    expect(p.voiceSampleSec).toBe(52);
    expect(typeof p.voiceConsentAt).toBe("string");
    expect(clearVoice("u4").voiceId).toBeUndefined();
  });
});
