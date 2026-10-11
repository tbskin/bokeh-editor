import { describe, expect, it } from "vitest";
import { draftChips, draftInit, draftLaunch, draftMessages, draftReduce } from "../src/lib/draftScript";
import type { ClipFile } from "../src/lib/types";

const clip = (uri: string): ClipFile => ({ uri, name: `${uri}.mov`, type: "video/quicktime" });

describe("draft flow", () => {
  it("walks format → clips → context → ready", () => {
    let s = draftInit;
    expect(s.step).toBe("format");
    s = draftReduce(s, { type: "choose-format", format: "voiceover" });
    expect(s.step).toBe("clips");
    s = draftReduce(s, { type: "add-clips", clips: [clip("a")] });
    expect(s.step).toBe("context");
    s = draftReduce(s, { type: "set-context", text: "beach day with the crew" });
    expect(s.step).toBe("ready");
  });
  it("removing the last clip returns to the clips step", () => {
    let s = draftReduce(draftReduce(draftInit, { type: "choose-format", format: "voiceover" }), { type: "add-clips", clips: [clip("a")] });
    s = draftReduce(s, { type: "remove-clip", uri: "a" });
    expect(s.step).toBe("clips");
  });
  it("launch payload derives the title from context words", () => {
    let s = draftReduce(draftInit, { type: "choose-format", format: "voiceover" });
    s = draftReduce(s, { type: "add-clips", clips: [clip("a")] });
    s = draftReduce(s, { type: "set-context", text: "golden hour surf session with my brother in Malibu" });
    expect(draftLaunch(s)).toMatchObject({ format: "voiceover", hasIdea: true, title: "golden hour surf session with my" });
  });
  it("skip-context launches with hasIdea false and a dated title", () => {
    let s = draftReduce(draftInit, { type: "choose-format", format: "voiceover" });
    s = draftReduce(s, { type: "add-clips", clips: [clip("a")] });
    s = draftReduce(s, { type: "skip-context" });
    const launch = draftLaunch(s);
    expect(launch?.hasIdea).toBe(false);
    expect(launch?.title).toContain("Reel ·");
  });
  it("cannot launch before ready", () => {
    expect(draftLaunch(draftInit)).toBeNull();
  });
  it("chips follow the step and enabled formats", () => {
    expect(draftChips(draftInit, ["voiceover"]).map((c) => c.id)).toEqual(["format-voiceover"]);
    const s = draftReduce(draftInit, { type: "choose-format", format: "voiceover" });
    expect(draftChips(s, ["voiceover"]).map((c) => c.id)).toEqual(["pick-clips"]);
  });
  it("draftMessages narrates the exchange so far", () => {
    let s = draftReduce(draftInit, { type: "choose-format", format: "talking_head" });
    const kinds = draftMessages(s).map((m) => `${m.role}:${m.kind}`);
    expect(kinds[0]).toBe("editor:text");           // greeting
    expect(kinds).toContain("user:text");            // format echo
  });
  it("voiceover can switch to script mode and launch with the script", () => {
    let s = draftReduce(draftInit, { type: "choose-format", format: "voiceover" });
    s = draftReduce(s, { type: "add-clips", clips: [clip("a")] });
    expect(draftChips(s, ["voiceover"]).map((c) => c.id)).toEqual(["skip-context", "write-script"]);
    s = draftReduce(s, { type: "begin-script" });
    expect(s.step).toBe("script");
    s = draftReduce(s, { type: "set-script", text: "eight words of narration that I wrote myself" });
    expect(draftLaunch(s)).toMatchObject({ script: "eight words of narration that I wrote myself", hasIdea: true, title: "eight words of narration that I" });
  });
  it("the script step is never a dead end — skip-context bails out to ready with no script", () => {
    let s = draftReduce(draftInit, { type: "choose-format", format: "voiceover" });
    s = draftReduce(s, { type: "add-clips", clips: [clip("a")] });
    s = draftReduce(s, { type: "begin-script" });
    expect(s.step).toBe("script");
    expect(draftChips(s, ["voiceover"]).map((c) => c.id)).toContain("skip-context");
    s = draftReduce(s, { type: "skip-context" });
    expect(s.step).toBe("ready");
    expect(s.script).toBeUndefined();
    expect(draftLaunch(s)?.hasIdea).toBe(false);
  });
});
