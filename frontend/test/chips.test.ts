import { describe, expect, it } from "vitest";
import { chipsFor } from "../src/lib/chips";
import type { Presentation } from "../src/lib/presentState";

const pres = (over: Partial<Presentation>): Presentation =>
  ({ tone: "working", badge: "", headline: "", ...over });

describe("chipsFor", () => {
  it("voice cta offers generate + record when cloning is available", () => {
    const chips = chipsFor(pres({ tone: "attention", cta: "voice" }), { voice: { canGenerate: true } });
    expect(chips.map((c) => c.id)).toEqual(["voice-generate", "voice-record"]);
  });
  it("voice cta offers only record without cloning", () => {
    const chips = chipsFor(pres({ tone: "attention", cta: "voice" }), { voice: { canGenerate: false } });
    expect(chips.map((c) => c.id)).toEqual(["voice-record"]);
  });
  it("error tone offers retry only", () => {
    expect(chipsFor(pres({ tone: "error", cta: "retry-prep" }), null).map((c) => c.id)).toEqual(["retry"]);
  });
  it("ready tone offers edit suggestions, plus undo when available", () => {
    const ids = chipsFor(pres({ tone: "ready" }), { canUndo: true }).map((c) => c.id);
    expect(ids).toEqual(["suggest-tighten", "suggest-opening", "suggest-ending", "undo"]);
    const noUndo = chipsFor(pres({ tone: "ready" }), { canUndo: false }).map((c) => c.id);
    expect(noUndo).not.toContain("undo");
  });
  it("suggestion chips carry the text they post", () => {
    const tighten = chipsFor(pres({ tone: "ready" }), null).find((c) => c.id === "suggest-tighten");
    expect(tighten?.suggestText).toBe("Tighten the intro");
  });
  it("working tone has no chips", () => {
    expect(chipsFor(pres({ tone: "working" }), null)).toEqual([]);
  });
});
