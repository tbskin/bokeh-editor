import { describe, it, expect, vi } from "vitest";
import { compressClipsForUpload } from "../src/lib/compress";
import type { ClipFile } from "../src/lib/types";

const clips: ClipFile[] = [
  { uri: "file:///a.mov", name: "IMG_001.MOV", type: "video/quicktime" },
  { uri: "file:///b.mov", name: "IMG_002.MOV", type: "video/quicktime" },
];

describe("compressClipsForUpload", () => {
  it("passes clips through untouched when the native module is unavailable (Expo Go)", async () => {
    const out = await compressClipsForUpload(clips, { video: null });
    expect(out).toEqual(clips);
  });

  it("uploads the compressed file with an mp4 name and type", async () => {
    const video = { compress: vi.fn(async (uri: string) => uri.replace("file:///", "file:///compressed-")) };
    const out = await compressClipsForUpload(clips, { video });
    expect(out[0]).toEqual({ uri: "file:///compressed-a.mov", name: "IMG_001.mp4", type: "video/mp4" });
    expect(out[1].name).toBe("IMG_002.mp4");
    expect(video.compress).toHaveBeenCalledTimes(2);
  });

  it("falls back to the original clip when one compression fails, without failing the batch", async () => {
    const video = { compress: vi.fn(async (uri: string) => {
      if (uri.includes("a.mov")) throw new Error("codec says no");
      return "file:///small-b.mp4";
    }) };
    const out = await compressClipsForUpload(clips, { video });
    expect(out[0]).toEqual(clips[0]); // original survives
    expect(out[1].uri).toBe("file:///small-b.mp4");
  });

  it("reports overall progress ending at 1", async () => {
    const video = { compress: vi.fn(async () => "file:///c.mp4") };
    const seen: number[] = [];
    await compressClipsForUpload(clips, { video, onProgress: (f) => seen.push(f) });
    expect(seen[seen.length - 1]).toBe(1);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...seen)).toBeLessThanOrEqual(1);
  });
});
