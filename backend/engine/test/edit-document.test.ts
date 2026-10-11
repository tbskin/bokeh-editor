import { describe, expect, it } from "vitest";
import { applyEditCommands, fromV1, toV1, validateEditDocument, type EditDocument } from "../src/edit-document";

const document = (): EditDocument => ({
  version: 2,
  format: "talking_head",
  canvas: { width: 1080, height: 1920, fps: 30 },
  sources: { a: { assetId: "a.mov" }, b: { assetId: "b.mov" } },
  segments: [
    { id: "one", source: "a", sourceStartSec: 0, durationSec: 4 },
    { id: "two", source: "b", sourceStartSec: 2, durationSec: 5 },
  ],
  overlays: [],
  audio: { master: "source", envelopes: [], sfx: [] },
  captions: { file: "master.srt", style: "default" },
  metadata: { sourcePaths: { a: "/tmp/a.mov", b: "/tmp/b.mov" } },
});

describe("edit document v2", () => {
  it("applies the shared deterministic edit primitives without mutating the input", () => {
    const original = document();
    const next = applyEditCommands(original, [
      { op: "trim", segmentId: "one", sourceStartSec: 0.5, durationSec: 3.5 },
      { op: "replace", segmentId: "two", source: "a", sourceStartSec: 6, durationSec: 4 },
      { op: "reorder", segmentIds: ["two", "one"] },
      { op: "transform", segmentId: "one", scale: 1.18, x: 0.1, y: -0.05 },
      { op: "split", segmentId: "two", source: "b", sourceStartSec: 3, side: "right" },
      { op: "transition", segmentId: "one", kind: "crossfade", durationSec: 0.3 },
      { op: "addOverlay", overlay: { kind: "text", startSec: 0.2, durationSec: 1, text: "Key idea", position: "top" } },
      { op: "addOverlay", overlay: { kind: "motion", startSec: 1.5, durationSec: 2, template: "kinetic_text", props: { text: "Watch this" } } },
      { op: "volume", target: "source", startSec: 2, endSec: 4, gainDb: -6 },
      { op: "sfx", name: "soft-whoosh", atSec: 1.5, gainDb: -4 },
      { op: "captions", file: "master.srt", style: "clean" },
    ]);
    expect(original.segments[0].sourceStartSec).toBe(0);
    expect(next.segments.map((segment) => segment.id)).toEqual(["two", "one"]);
    expect(next.segments[1].transform?.scale).toBe(1.18);
    expect(next.segments[0].split).toMatchObject({ source: "b", side: "right" });
    expect(next.audio.envelopes[0].gainDb).toBe(-6);
    expect(next.overlays).toHaveLength(2);
  });

  it("rejects unsafe or unsupported agent commands before a render is changed", () => {
    expect(() => applyEditCommands(document(), [{ op: "remove", segmentIds: ["one", "two"] }])).toThrow(/no segments/);
    expect(() => applyEditCommands(document(), [{ op: "addOverlay", overlay: {
      kind: "motion", startSec: 0, durationSec: 2, template: "kinetic_text", props: { text: "x", html: "<script>" },
    } }])).toThrow(/props/);
    expect(() => applyEditCommands(document(), [{ op: "captions", file: "../secret.srt", style: "default" }])).toThrow();
    expect(() => applyEditCommands(document(), [{ op: "transition", segmentId: "one", kind: "crossfade", durationSec: 0.3 }])).toThrow(/first segment/);
    expect(() => applyEditCommands(document(), [{ op: "split", segmentId: "one", source: "missing", sourceStartSec: 0, side: "left" }])).toThrow(/split/);
  });

  it("round-trips transforms, split screen, transitions, overlays, and ranged audio through the v1 adapter", () => {
    const edited = applyEditCommands(document(), [
      { op: "transform", segmentId: "one", scale: 1.2, x: 0, y: 0 },
      { op: "split", segmentId: "two", source: "a", sourceStartSec: 1, side: "left" },
      { op: "transition", segmentId: "two", kind: "fade", durationSec: 0.2 },
      { op: "addOverlay", overlay: { kind: "motion", startSec: 1, durationSec: 2, template: "text_card", props: { text: "One thing" } } },
      { op: "volume", target: "source", startSec: 1, endSec: 2, gainDb: -3 },
    ]);
    const v1 = toV1(edited, "scale=1080:1920");
    const restored = fromV1(v1, "talking_head");
    expect(restored.segments[0].transform?.scale).toBe(1.2);
    expect(restored.segments[1].split?.side).toBe("left");
    expect(restored.segments[1].transitionIn?.kind).toBe("fade");
    expect(restored.overlays[0]).toMatchObject({ kind: "motion", template: "text_card" });
    expect(restored.audio.envelopes[0].gainDb).toBe(-3);
    expect(() => validateEditDocument(restored)).not.toThrow();
  });
});
