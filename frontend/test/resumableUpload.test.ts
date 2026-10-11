import { describe, it, expect, vi } from "vitest";
vi.mock("../src/lib/api", () => ({
  reserveProjectAsset: vi.fn(),
  completeProjectAsset: vi.fn(async () => {}),
}));
import { uploadClipsResumable, uploadClipsToProjectMedia, uploadStateFor, uploadSetKey, type DirectAssetState } from "../src/lib/resumableUpload";
import { completeProjectAsset } from "../src/lib/api";
import type { ClipFile } from "../src/lib/types";

const clips: ClipFile[] = [
  { uri: "file:///a.mp4", name: "a.mp4", type: "video/mp4" },
  { uri: "file:///b.mp4", name: "b.mp4", type: "video/mp4" },
  { uri: "file:///c.mp4", name: "c.mp4", type: "video/mp4" },
];
const sizes = [100, 200, 100]; // 400 total

const argsFor = (state = uploadStateFor(clips), fractions: number[] = [], states: unknown[] = []) => ({
  base: "http://x", projectId: "p1", token: "t", clips, sizes, state,
  onState: (s: unknown) => states.push(JSON.parse(JSON.stringify(s))),
  onProgress: (f: number) => fractions.push(Number(f.toFixed(3))),
});

describe("direct private project-media uploads", () => {
  it("uses Supabase's metadata contract and exact 6MB chunks", async () => {
    const one = [clips[0]];
    const state: DirectAssetState = {
      [one[0].uri]: { assetId: "asset-1", endpoint: "https://storage.example/resumable", bucketName: "project-media", objectName: "u/p/source/asset-1" },
    };
    let captured: Record<string, unknown> = {};
    await uploadClipsToProjectMedia({
      base: "http://api", projectId: "p", token: "jwt", clips: one, sizes: [100], state,
      onState: () => {},
    }, async (_clip, opts) => {
      captured = opts as unknown as Record<string, unknown>;
      opts.onUrl("https://storage.example/resumable/one");
      opts.onProgress(100);
    });
    expect(captured.endpoint).toBe("https://storage.example/resumable");
    expect(captured.chunkSize).toBe(6 * 1024 * 1024);
    expect(captured.metadata).toEqual({
      bucketName: "project-media", objectName: "u/p/source/asset-1", contentType: "video/mp4", cacheControl: "3600",
    });
    expect(state[one[0].uri].done).toBe(true);
    expect(completeProjectAsset).toHaveBeenCalledWith("http://api", "p", "asset-1");
  });

  it("restarts once with the same stable object after Supabase expires a resume URL", async () => {
    const one = [clips[0]];
    const state: DirectAssetState = {
      [one[0].uri]: {
        assetId: "asset-1", endpoint: "https://storage.example/resumable", bucketName: "project-media",
        objectName: "u/p/source/asset-1", uploadUrl: "https://storage.example/resumable/expired",
      },
    };
    const resumeUrls: Array<string | undefined> = [];
    await uploadClipsToProjectMedia({
      base: "http://api", projectId: "p", token: "jwt", clips: one, sizes: [100], state, onState: () => {},
    }, async (_clip, opts) => {
      resumeUrls.push(opts.uploadUrl);
      if (opts.uploadUrl) throw new Error("response code: 410");
      opts.onProgress(100);
    });
    expect(resumeUrls).toEqual(["https://storage.example/resumable/expired", undefined]);
    expect(state[one[0].uri].done).toBe(true);
  });
});

describe("uploadClipsResumable", () => {
  it("aggregates progress across clips against total bytes", async () => {
    const fractions: number[] = [];
    const a = argsFor(uploadStateFor(clips), fractions);
    await uploadClipsResumable(a, async (clip, opts) => {
      const size = sizes[clips.findIndex((c) => c.uri === clip.uri)];
      opts.onUrl(`http://x/api/uploads/${clip.name}`);
      opts.onProgress(size / 2);
      opts.onProgress(size);
    });
    // Half of clip a = 50/400, full a = 100/400, half b = 200/400, full b = 300/400 ... to 1.
    expect(fractions).toEqual([0.125, 0.25, 0.25, 0.5, 0.75, 0.75, 0.875, 1, 1]);
    expect(a.state.doneUris).toEqual(clips.map((c) => c.uri));
    expect(a.state.urls).toEqual({}); // resume handles cleaned up as clips finish
  });

  it("RESUMES: skips server-complete clips and continues a half-done clip from its offset", async () => {
    const prev = {
      setKey: uploadSetKey(clips),
      doneUris: [clips[0].uri],                       // a.mp4 fully on the server already
      urls: { [clips[1].uri]: "http://x/api/uploads/b-partial" }, // b.mp4 half-uploaded
    };
    const fractions: number[] = [];
    const seen: { uri: string; resumeUrl?: string }[] = [];
    const a = argsFor(uploadStateFor(clips, prev), fractions);
    await uploadClipsResumable(a, async (clip, opts) => {
      seen.push({ uri: clip.uri, resumeUrl: opts.uploadUrl });
      // The server said "I already have 120 of b's 200 bytes" — tus reports progress FROM there.
      if (clip.uri === clips[1].uri) { opts.onProgress(120); opts.onProgress(200); return; }
      opts.onProgress(100);
    });
    expect(seen).toEqual([
      { uri: clips[1].uri, resumeUrl: "http://x/api/uploads/b-partial" }, // a skipped entirely
      { uri: clips[2].uri, resumeUrl: undefined },
    ]);
    // First visible fraction: (100 done + 120 resumed) / 400 = 0.55 — the bar JUMPS to 55%,
    // proving to the user the upload resumed rather than restarted.
    expect(fractions[0]).toBe(0.25); // the skip of clip a reports its share first
    expect(fractions[1]).toBe(0.55);
    expect(fractions[fractions.length - 1]).toBe(1);
  });

  it("falls back to a fresh upload once when a stored resume URL was swept (404)", async () => {
    const prev = { setKey: uploadSetKey(clips), doneUris: [clips[0].uri, clips[2].uri], urls: { [clips[1].uri]: "http://x/gone" } };
    const a = argsFor(uploadStateFor(clips, prev));
    let calls = 0;
    await uploadClipsResumable(a, async (_clip, opts) => {
      calls++;
      if (opts.uploadUrl) throw new Error("tus: unexpected response while resuming upload, originated from request (response code: 404)");
      opts.onProgress(200);
    });
    expect(calls).toBe(2); // resume attempt, then fresh
    expect(a.state.doneUris).toContain(clips[1].uri);
  });

  it("invalidates state from a different upload set (re-optimized files)", () => {
    const prev = { setKey: "old|set", doneUris: [clips[0].uri], urls: { x: "y" } };
    const s = uploadStateFor(clips, prev);
    expect(s.doneUris).toEqual([]);
    expect(s.urls).toEqual({});
    expect(s.setKey).toBe(uploadSetKey(clips));
  });
});
