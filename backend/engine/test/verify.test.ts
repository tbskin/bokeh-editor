import { describe, it, expect } from "vitest";
import { verifyReel, type ReelProbe } from "../src/verify";

const ok: ReelProbe = { hasVideo: true, hasAudio: true, width: 1080, height: 1920, colorTransfer: "bt709", durationSec: 13.4 };
const probeOf = (p: Partial<ReelProbe>) => async () => ({ ...ok, ...p });

describe("verifyReel", () => {
  it("passes a good vertical SDR reel with audio", async () => {
    expect(await verifyReel("x.mp4", { expectedDurationSec: 13.4, probe: probeOf({}) })).toEqual([]);
  });
  it("flags a missing voiceover as critical", async () => {
    const probs = await verifyReel("x.mp4", { probe: probeOf({ hasAudio: false }) });
    expect(probs.some((p) => p.severity === "critical" && /audio|voiceover/i.test(p.message))).toBe(true);
  });
  it("flags a non-vertical reel as critical", async () => {
    const probs = await verifyReel("x.mp4", { probe: probeOf({ width: 1920, height: 1080 }) });
    expect(probs.some((p) => p.severity === "critical" && /vertical/i.test(p.message))).toBe(true);
  });
  it("warns on an un-tonemapped HDR transfer", async () => {
    const probs = await verifyReel("x.mp4", { probe: probeOf({ colorTransfer: "arib-std-b67" }) });
    expect(probs.some((p) => p.severity === "warn" && /hdr|tonemap|arib/i.test(p.message))).toBe(true);
  });
  it("warns when duration is far from the voiceover", async () => {
    const probs = await verifyReel("x.mp4", { expectedDurationSec: 13.4, probe: probeOf({ durationSec: 30 }) });
    expect(probs.some((p) => p.severity === "warn" && /duration/i.test(p.message))).toBe(true);
  });
});
