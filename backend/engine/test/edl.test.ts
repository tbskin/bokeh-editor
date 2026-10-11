import { describe, it, expect } from "vitest";
import { validateEdl, type Edl } from "../src/edl";

const base: Edl = {
  version: 1,
  sources: { clip_00: "/abs/a.mov" },
  ranges: [{ source: "clip_00", start: 0, end: 2 }],
  grade: "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
  overlays: [],
  subtitles: "master.srt",
  total_duration_s: 2,
};

describe("validateEdl", () => {
  it("accepts a well-formed EDL", () => {
    expect(() => validateEdl(base)).not.toThrow();
  });
  it("rejects an empty ranges list", () => {
    expect(() => validateEdl({ ...base, ranges: [] })).toThrow(/ranges/);
  });
  it("rejects a range whose source is not in sources", () => {
    expect(() => validateEdl({ ...base, ranges: [{ source: "nope", start: 0, end: 2 }] })).toThrow(/source/);
  });
  it("rejects a range with end <= start", () => {
    expect(() => validateEdl({ ...base, ranges: [{ source: "clip_00", start: 2, end: 2 }] })).toThrow(/end/);
  });
});
