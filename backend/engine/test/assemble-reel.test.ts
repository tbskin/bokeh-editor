import { useTestAudioLibrary } from "./test-audio";
useTestAudioLibrary();
import { describe, it, expect } from "vitest";
import { computeTimeline, matchAnchor, polishTimeline, paceTimeline, fitTimeline, buildSrtFromVo, buildTitleAss, syncTitleCard, resolveMusicPath, sfxEventsFor, capSfxEvents, resolveSfxForRender, parseMaxVolumeDb, holdTailFor, regrade, PACE, PACE_BEATS, TITLE_SECONDS, TITLE_STYLES, TYPE_ON_SECONDS, COVER_AT_SEC, type PlanSeg, type TimelineSeg } from "../src/assemble-reel";
import type { Edl } from "../src/edl";
import { checkTimeline, CRITIQUE_DEFAULTS, type Word } from "../src/critique";
import { mkdtemp, readFile as fsReadFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as pathJoin } from "node:path";

const sum = (segs: { start: number; end: number }[]) => segs.reduce((a, s) => a + (s.end - s.start), 0);

describe("computeTimeline", () => {
  const durs = { "clips/a.mov": 10, "clips/b.mov": 10, "clips/c.mov": 10 };

  it("shrinks every cut when footage overruns the voiceover — the tail is never amputated", () => {
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 4 },
      { file: "clips/b.mov", start: 0, end: 4 },
      { file: "clips/c.mov", start: 0, end: 4 }, // 12s of footage over a 9s read
    ];
    const { segments, holdTail, dropped } = computeTimeline(seq, 9, durs);
    expect(sum(segments)).toBeCloseTo(9, 2);
    expect(holdTail).toBe(0);
    expect(dropped).toEqual([]);
    // ALL planned clips survive (the old fitter kept full-length takes and dropped the ending).
    expect(segments.map((s) => s.file)).toEqual(["clips/a.mov", "clips/b.mov", "clips/c.mov"]);
  });

  it("drops clips only when the voice physically can't fit them at the floor — and says so", () => {
    const seq: PlanSeg[] = ["a", "b", "c"].map((f) => ({ file: `clips/${f}.mov`, start: 0, end: 4 }));
    const { segments, dropped } = computeTimeline(seq, 2.6, durs); // 2.6s read, floor 1.2 → only 2 fit
    expect(sum(segments)).toBeCloseTo(2.6, 2);
    expect(segments.length).toBe(2);
    expect(dropped).toHaveLength(1);
    expect(dropped[0].reason).toMatch(/voiceover is too short/);
  });

  it("anchored clips cut in when their words are spoken; transcript order beats plan order", () => {
    const mkWords = (pairs: [string, number][]): Word[] =>
      pairs.map(([text, start]) => ({ type: "word", text, start, end: start + 0.25 }));
    const words = mkWords([
      ["okay", 0.2], ["so", 0.5], ["i", 1.0], ["sat", 1.3], ["in", 1.6], ["the", 1.9],
      ["park", 2.2], ["trying", 2.5], ["to", 2.8], ["be", 3.1], ["productive", 3.4],
      ["then", 8.0], ["this", 8.3], ["long", 8.6], ["table", 8.9], ["showed", 9.2], ["up", 9.5],
    ]);
    // Plan says table BEFORE park — the spoken take says park first. The take wins.
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 3 },
      { file: "clips/b.mov", start: 0, end: 3, anchor: "this long table" },
      { file: "clips/c.mov", start: 0, end: 3, anchor: "sat in the park trying" },
    ];
    const { segments, dropped } = computeTimeline(seq, 12, durs, { words });
    expect(dropped).toEqual([]);
    const order = segments.map((s) => s.file);
    expect(order).toEqual(["clips/a.mov", "clips/c.mov", "clips/b.mov"]); // park clip before table clip
    // Each anchored clip is ON SCREEN when its words land.
    let cum = 0;
    const cutIn: Record<string, number> = {};
    for (const s of segments) { cutIn[s.file] = cum; cum += s.end - s.start; }
    expect(cutIn["clips/c.mov"]).toBeLessThanOrEqual(1.3 + 0.01); // "sat" spoken at 1.3
    expect(cutIn["clips/c.mov"] + (segments[1].end - segments[1].start)).toBeGreaterThan(1.3);
    expect(cutIn["clips/b.mov"]).toBeCloseTo(8.3 - 0.15, 0); // "this" spoken at 8.3, minus the lead
    expect(sum(segments)).toBeCloseTo(12, 2);
  });

  it("a starving anchored tail borrows b-roll instead of freezing (the 5.27s bridge bug)", () => {
    // Words put the bridge anchor late; the bridge clip alone can't cover the tail span, but the
    // front region is sitting on two clips with plenty of unused source.
    const words: Word[] = [
      { type: "word", text: "starting", start: 0.3, end: 0.6 },
      { type: "word", text: "out", start: 0.7, end: 1.0 },
      { type: "word", text: "bridge", start: 9.0, end: 9.3 },
      { type: "word", text: "time", start: 9.4, end: 9.7 },
    ];
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 2 },  // 10s of source available
      { file: "clips/b.mov", start: 0, end: 2 },  // 10s of source available
      { file: "clips/bridge.mov", start: 0, end: 3, anchor: "bridge time" },
    ];
    const durs2 = { "clips/a.mov": 10, "clips/b.mov": 10, "clips/bridge.mov": 3 }; // bridge caps at 3s
    const { segments, holdTail, dropped } = computeTimeline(seq, 14, durs2, { words });
    // Old behavior: bridge region spans ~8.85→14 (5.15s) with only 3s of source → 2.15s freeze.
    // New behavior: a front clip migrates into the tail region; nothing freezes, nothing drops.
    expect(holdTail).toBeLessThan(0.1);
    expect(dropped).toEqual([]);
    expect(sum(segments)).toBeCloseTo(14, 1);
    // The anchored bridge still cuts in ON its words (region boundary unchanged by the borrow).
    let cum = 0; let bridgeCutIn = -1;
    for (const s of segments) { if (s.file === "clips/bridge.mov" && bridgeCutIn < 0) bridgeCutIn = cum; cum += s.end - s.start; }
    expect(bridgeCutIn).toBeCloseTo(9.0 - 0.15, 1);
  });

  it("an anchor that was edited out of the take degrades to ordinary filler", () => {
    const words: Word[] = [
      { type: "word", text: "totally", start: 0.2, end: 0.5 },
      { type: "word", text: "different", start: 0.6, end: 0.9 },
      { type: "word", text: "speech", start: 1.0, end: 1.3 },
    ];
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 3 },
      { file: "clips/b.mov", start: 0, end: 3, anchor: "ceramic animals on a shelf" },
    ];
    const { segments, dropped } = computeTimeline(seq, 6, durs, { words });
    expect(dropped).toEqual([]);
    expect(segments.map((s) => s.file)).toEqual(["clips/a.mov", "clips/b.mov"]); // plan order kept
    expect(sum(segments)).toBeCloseTo(6, 2);
  });

  it("plays each range once when footage matches the voiceover", () => {
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 5 },
      { file: "clips/b.mov", start: 0, end: 5 },
    ];
    const { segments, holdTail } = computeTimeline(seq, 10, durs);
    expect(segments).toHaveLength(2);
    expect(sum(segments)).toBeCloseTo(10, 2);
    expect(holdTail).toBe(0);
  });

  it("extends into unused source when footage is short of the voiceover", () => {
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 2 },
      { file: "clips/b.mov", start: 0, end: 2 }, // only 4s planned, clips are 10s each
    ];
    const { segments, holdTail } = computeTimeline(seq, 8, durs);
    expect(sum(segments)).toBeCloseTo(8, 1); // filled by playing more of each clip
    expect(holdTail).toBeLessThan(0.05); // no freeze needed — headroom covered it
  });

  it("holds the final frame only when clips are fully exhausted", () => {
    const shortDurs = { "clips/a.mov": 2, "clips/b.mov": 2 };
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 2 },
      { file: "clips/b.mov", start: 0, end: 2 }, // 4s total, both clips only 2s long
    ];
    const { segments, holdTail } = computeTimeline(seq, 7, shortDurs);
    expect(sum(segments)).toBeCloseTo(4, 1); // all real footage used, no repeats
    expect(holdTail).toBeCloseTo(3, 1); // remaining ~3s is a final-frame hold
  });

  it("clamps ranges to the real clip duration and skips unmeasured clips", () => {
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 99 }, // over-long end clamped to 10
      { file: "clips/missing.mov", start: 0, end: 3 }, // no duration → skipped
    ];
    const { segments } = computeTimeline(seq, 10, durs);
    expect(segments).toHaveLength(1);
    expect(segments[0].end).toBeLessThanOrEqual(10);
  });
});

describe("matchAnchor", () => {
  const words: Word[] = ["i", "spent", "way", "too", "long", "staring", "at", "the", "menu"]
    .map((text, i) => ({ type: "word", text, start: i * 0.4, end: i * 0.4 + 0.3 }));

  it("finds the spoken window even when the transcript mishears a word", () => {
    // Script said "way too long stood at the menu" — whisper heard "staring"; 4/5 tokens still match.
    expect(matchAnchor("too long stood at the", words)).toBeCloseTo(3 * 0.4, 2);
  });

  it("returns undefined when the line was cut from the take", () => {
    expect(matchAnchor("ceramic animals on a shelf", words)).toBeUndefined();
  });
});

describe("buildSrtFromVo", () => {
  it("chunks VO words into short uppercase cues on the VO timeline", () => {
    const words = [
      { type: "word", text: "so", start: 0.0, end: 0.3 },
      { type: "word", text: "I", start: 0.3, end: 0.5 },
      { type: "word", text: "landed.", start: 0.5, end: 1.0 },
      { type: "spacing", text: " " },
      { type: "word", text: "no", start: 1.2, end: 1.4 },
      { type: "word", text: "plan", start: 1.4, end: 1.9 },
    ];
    const srt = buildSrtFromVo(words);
    expect(srt).toContain("00:00:00,000 --> 00:00:01,000");
    expect(srt).toContain("SO I LANDED"); // trailing period stripped, uppercased, broke on punctuation
    expect(srt).not.toContain("spacing");
  });

  it("returns empty output for no words", () => {
    expect(buildSrtFromVo([]).trim()).toBe("");
  });
});

describe("paceTimeline", () => {
  const sum = (segs: TimelineSeg[]) => segs.reduce((a, s) => a + (s.end - s.start), 0);

  it("splits a long take into jump-cut beats, preserving total played time exactly", () => {
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 6, note: "walk" }];
    const paced = paceTimeline(segs, { "clips/a.mov": 10 });
    expect(paced.length).toBeGreaterThan(1);
    expect(sum(paced)).toBeCloseTo(6, 3);
    for (const b of paced) {
      expect(b.end - b.start).toBeLessThanOrEqual(PACE_BEATS.quick.maxBeatSec + 0.01);
      expect(b.note).toBe("walk"); // beats inherit the take's note
    }
    // Consecutive beats of the same clip skip source between them — the cut is visible.
    for (let i = 1; i < paced.length; i++) {
      expect(paced[i].start - paced[i - 1].end).toBeGreaterThanOrEqual(PACE.minSkipSec - 0.001);
    }
  });

  it("keeps short takes untouched", () => {
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 2.0 }];
    expect(paceTimeline(segs, { "clips/a.mov": 10 })).toEqual(segs);
  });

  it("a split take's sfx rides the FIRST beat only — the sound fires on the cut in, once", () => {
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 6, sfx: "whoosh" }];
    const paced = paceTimeline(segs, { "clips/a.mov": 12 });
    expect(paced.length).toBeGreaterThan(1);
    expect(paced[0].sfx).toBe("whoosh");
    expect(paced.slice(1).every((b) => b.sfx === undefined)).toBe(true);
  });

  it("refuses invisible cuts: no headroom to skip into means no split", () => {
    // The take uses the whole clip — a split could only be contiguous (no visible jump).
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 6 }];
    expect(paceTimeline(segs, { "clips/a.mov": 6 })).toEqual(segs);
  });

  it("never creates beats under the rubric's clip floor", () => {
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 2.6 }];
    const paced = paceTimeline(segs, { "clips/a.mov": 10 });
    for (const b of paced) expect(b.end - b.start).toBeGreaterThanOrEqual(1.2 - 0.001);
  });

  it("never splits a planner-held moment, whatever the pace", () => {
    const paced = paceTimeline([{ file: "clips/a.mov", start: 0, end: 10, hold: true }], { "clips/a.mov": 30 }, { maxBeatSec: 2.2 });
    expect(paced).toHaveLength(1);
    expect(paced[0].end - paced[0].start).toBeCloseTo(10, 3);
  });

  it("long-takes pace leaves complete takes whole through the full fit", () => {
    const { segments } = fitTimeline(
      [{ file: "clips/a.mov", start: 0, end: 10 }, { file: "clips/b.mov", start: 0, end: 10 }],
      20, { "clips/a.mov": 30, "clips/b.mov": 30 }, [], "long-takes",
    );
    expect(segments).toHaveLength(2); // no beat-splitting, no 5s hold cap
    expect(sum(segments)).toBeCloseTo(20, 1);
  });

  it("a hold survives polish uncapped even in a quick reel", () => {
    const { segments } = fitTimeline(
      [{ file: "clips/a.mov", start: 0, end: 8, hold: true }, { file: "clips/b.mov", start: 0, end: 4 }],
      12, { "clips/a.mov": 30, "clips/b.mov": 30 }, [], "quick",
    );
    const held = segments.find((s) => s.hold);
    expect(held).toBeTruthy();
    expect((held as TimelineSeg).end - (held as TimelineSeg).start).toBeGreaterThan(7.5); // not squeezed to maxHoldSec=5
  });

  it("skips stay inside this take's window when the same clip is used again later", () => {
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 5 },
      { file: "clips/a.mov", start: 5.5, end: 7 }, // later use — beats must not spill past 5.5
    ];
    const paced = paceTimeline(segs, { "clips/a.mov": 20 });
    const first = paced.filter((_, i) => i < paced.length - 1);
    for (const b of first) expect(b.end).toBeLessThanOrEqual(5.5 + 0.001);
    expect(sum(paced)).toBeCloseTo(6.5, 3);
  });

  it("fitTimeline end-to-end: a two-take plan becomes a faster multi-beat cut of the same length", () => {
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 10 },
      { file: "clips/b.mov", start: 0, end: 10 },
    ];
    const { segments, holdTail } = fitTimeline(seq, 20, { "clips/a.mov": 30, "clips/b.mov": 30 });
    expect(segments.length).toBeGreaterThanOrEqual(8); // ~2s beats, not two 10s takes
    expect(sum(segments)).toBeCloseTo(20, 1);
    expect(holdTail).toBe(0);
  });
});

describe("buildTitleAss", () => {
  it("holds the title through the hook window (top-center), default 'clean' fades in and out", () => {
    const ass = buildTitleAss("day in the life of a tech bro");
    expect(ass).toContain("PlayResX: 1080");
    expect(ass).toContain("PlayResY: 1920");
    expect(ass).toContain("day in the life of a tech bro");
    expect(ass).toContain("\\be2\\fad(200,250)}"); // clean = gentle fade in + out
    expect(ass).toContain(`Dialogue: 0,0:00:00.00,0:00:02.80,Title,`);
    expect(TITLE_SECONDS).toBeCloseTo(2.8, 3);
    // Alignment 8 = top-center, away from the bottom-third captions.
    expect(ass).toMatch(/Style: Title,Anton,\d+,.*,8,80,80,300/);
  });

  it("cover is pulled after the entrance settles and before the fade-out", () => {
    // COVER_AT_SEC must sit inside the fully-shown window so an animated entrance never half-draws
    // the cover: after the slowest entrance (the typewriter, ~0.9s) and before fade-out (TITLE_SECONDS-0.25).
    expect(COVER_AT_SEC).toBeGreaterThanOrEqual(TYPE_ON_SECONDS + 0.1);
    expect(COVER_AT_SEC).toBeLessThan(TITLE_SECONDS - 0.25);
  });

  it("each preset emits its own animation; unknown styles fall back to clean", () => {
    expect(buildTitleAss("x", "pop")).toContain("\\fscx108"); // scale bounce
    expect(buildTitleAss("x", "rise")).toContain("\\move(540,370,540,300"); // slide up
    // @ts-expect-error — an unrecognized style is coerced to clean, not crashed.
    expect(buildTitleAss("x", "bogus")).toContain("\\be2\\fad(200,250)}");
    for (const st of TITLE_STYLES.filter((s) => s !== "wipe")) expect(buildTitleAss("hi", st)).toContain("hi");
  });

  it("wipe is a true per-char typewriter: one alpha pop per visible character", () => {
    const ass = buildTitleAss("go up", "wipe");
    expect(ass.match(/\\alpha&HFF&/g)).toHaveLength(4);       // g,o,u,p type on; the space stays plain
    expect(ass).not.toContain("\\h");                         // plain spaces keep line-wrapping alive
    expect(ass).toContain("}g{");                              // chars are individually wrapped
    expect(ass).not.toContain("\\clip(");                      // the old linear wipe is gone
    // The last char starts typing before the type-on window closes.
    const starts = [...ass.matchAll(/\\t\((\d+),/g)].map((m) => Number(m[1]));
    expect(Math.max(...starts)).toBeLessThanOrEqual(TYPE_ON_SECONDS * 1000);
  });

  it("strips ASS override syntax and normalizes whitespace in the title", () => {
    const ass = buildTitleAss("  {\\b1}sneaky   title\\  ");
    expect(ass).toContain(",Title,{\\be2\\fad(200,250)}b1sneaky title");
    expect(ass).not.toContain("{\\b1}");
  });
});

describe("syncTitleCard (refine-ability: title regenerates from plan.json)", () => {
  it("writes the card from plan title+style, and clears it when the title is emptied", async () => {
    const dir = await mkdtemp(pathJoin(tmpdir(), "ole-title-"));
    await syncTitleCard(dir, { title: "hi there", titleStyle: "wipe" });
    const ass = await fsReadFile(pathJoin(dir, "title.ass"), "utf8");
    expect(ass.match(/\\alpha&HFF&/g)).toHaveLength(7); // per-char typewriter applied from plan (space untagged)
    // A refine that clears the title removes the card entirely (no burn).
    await syncTitleCard(dir, { title: "" });
    expect(existsSync(pathJoin(dir, "title.ass"))).toBe(false);
  });
});

describe("sfxEventsFor", () => {
  it("places the title-entrance at t=0 and each range's sfx at its cumulative cut-in time", () => {
    const ranges = [
      { start: 0, end: 2, sfx: "whoosh" },   // first range: dropped, the title entrance owns the open
      { start: 0, end: 3, sfx: "pop" },      // cut-in at 2s
      { start: 0, end: 2 },                  // no sfx
      { start: 0, end: 1.5, sfx: "click" },  // cut-in at 7s
    ];
    expect(sfxEventsFor(ranges, "typewriter")).toEqual([
      { at: 0, name: "typewriter" },
      { at: 2, name: "pop" },
      { at: 7, name: "click" },
    ]);
  });
  it("emits no entrance when there's no title sound", () => {
    expect(sfxEventsFor([{ start: 0, end: 2 }, { start: 0, end: 2, sfx: "pop" }], null)).toEqual([{ at: 2, name: "pop" }]);
  });
});

describe("capSfxEvents (restraint)", () => {
  it("drops events closer than the min gap", () => {
    const kept = capSfxEvents([{ at: 0 }, { at: 0.5 }, { at: 2 }], 30, { minGapSec: 1.5, secPerSfx: 5, hardCap: 8 });
    expect(kept.map((e) => e.at)).toEqual([0, 2]); // 0.5 too close to 0
  });
  it("caps the count to ~1 per secPerSfx, keeping the earliest (title entrance at 0 always survives)", () => {
    const events = [{ at: 0 }, { at: 2 }, { at: 4 }, { at: 6 }, { at: 8 }];
    const kept = capSfxEvents(events, 10, { minGapSec: 1.5, secPerSfx: 5, hardCap: 8 }); // maxN = round(10/5)=2
    expect(kept.map((e) => e.at)).toEqual([0, 2]);
  });
});

describe("resolveSfxForRender", () => {
  it("resolves the title entrance + tagged beats to real files, carrying offsetDb/maxSec and skipping unknown names", async () => {
    const ranges = [
      { start: 0, end: 2 },                  // first range, no sfx
      { start: 0, end: 3, sfx: "whoosh" },   // cut-in at 2s -> resolves
      { start: 0, end: 2, sfx: "nope" },     // unknown name -> skipped, never errors
    ];
    const out = await resolveSfxForRender(ranges, "wipe", true, 20); // wipe -> typewriter entrance at 0
    expect(out.map((s) => s.at)).toEqual([0, 2]);
    expect(out.every((s) => s.path.endsWith(".mp3") && typeof s.offsetDb === "number")).toBe(true);
    expect(out.find((s) => s.at === 0)!.maxSec).toBe(0.9); // typewriter capped to the title's type-on window
  });
  it("stays empty (never errors) when a name has no file and there's no title sound", async () => {
    expect(await resolveSfxForRender([{ start: 0, end: 2 }, { start: 0, end: 3, sfx: "nope" }], "clean", true, 10)).toEqual([]);
  });
  it("caps the riser from its TAIL (the build's climax) per the manifest", async () => {
    const out = await resolveSfxForRender([{ start: 0, end: 2 }, { start: 0, end: 3, sfx: "riser" }], "clean", false, 20);
    expect(out).toHaveLength(1);
    expect(out[0].capFrom).toBe("tail");
    expect(out[0].maxSec).toBe(1.3);
  });
});

describe("computeWps (the pace-learning signal)", () => {
  it("measures real speech and refuses garbage", async () => {
    const { computeWps } = await import("../src/assemble-reel");
    expect(computeWps(130, 30)).toBeCloseTo(4.33, 2); // a fast talker (the founder, measured)
    expect(computeWps(69, 30)).toBeCloseTo(2.3, 2);   // the old baseline assumption
    expect(computeWps(3, 30)).toBeNull();             // too few words to mean anything
    expect(computeWps(100, 1)).toBeNull();            // too short a take
    expect(computeWps(600, 60)).toBeNull();           // 10 wps = transcript noise, learn nothing
  });
});

describe("parseMaxVolumeDb", () => {
  it("reads ffmpeg volumedetect output", () => {
    expect(parseMaxVolumeDb("[Parsed_volumedetect_0 @ 0x1] mean_volume: -19.1 dB\n[Parsed_volumedetect_0 @ 0x1] max_volume: -2.1 dB")).toBe(-2.1);
    expect(parseMaxVolumeDb("max_volume: 0.0 dB")).toBe(0);
    expect(parseMaxVolumeDb("no volume lines here")).toBeUndefined();
  });
});

describe("resolveMusicPath", () => {
  it("is undefined for no mood or an explicit none (VO-only)", async () => {
    expect(await resolveMusicPath(null)).toBeUndefined();
    expect(await resolveMusicPath(undefined)).toBeUndefined();
    expect(await resolveMusicPath("none")).toBeUndefined();
  });
  it("resolves a supplied mood to its track; unknown moods are VO-only — music never fails a render", async () => {
    // The fixture supplies original synthetic tones; no licensed audio is bundled.
    expect(await resolveMusicPath("upbeat")).toMatch(/upbeat\.mp3$/);
    expect(await resolveMusicPath("cute")).toMatch(/cute\.mp3$/);
    // A mood the manifest doesn't know (or whose file is absent) renders VO-only, never an error.
    expect(await resolveMusicPath("totally-unknown-mood")).toBeUndefined();
  });
});

describe("holdTailFor", () => {
  it("is zero when footage covers the VO", () => {
    expect(holdTailFor(10, 10)).toBe(0);
    expect(holdTailFor(10, 12)).toBe(0);
  });
  it("is the deficit when footage falls short", () => {
    expect(holdTailFor(10, 8.5)).toBeCloseTo(1.5, 3);
  });
  it("ignores sub-50ms rounding deficits", () => {
    expect(holdTailFor(10, 9.97)).toBe(0);
  });
});

describe("regrade", () => {
  const e: Edl = { version: 1, sources: { a: "/a.mp4" }, ranges: [{ source: "a", start: 0, end: 2 }],
    grade: "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280", overlays: [],
    total_duration_s: 2, metadata: { quality: "draft" } };
  it("rewrites the vertical filter and quality metadata for the target quality", () => {
    const hd = regrade(e, "preview");
    expect(hd.grade).toContain("1080:1920");
    expect(hd.metadata?.quality).toBe("preview");
  });
  it("does not mutate the input EDL", () => {
    regrade(e, "preview");
    expect(e.grade).toContain("720:1280");
  });
});

const total = (segs: TimelineSeg[]) => segs.reduce((a, s) => a + (s.end - s.start), 0);
const word = (start: number, end: number): Word => ({ type: "word", text: "x", start, end });

describe("polishTimeline", () => {
  const durs10 = { "clips/a.mov": 10, "clips/b.mov": 10, "clips/c.mov": 10 };

  it("extends a sub-floor segment into its own headroom, preserving total", () => {
    // the real checkpoint case: a 0.89s tail clip with plenty of unused source
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 4 },
      { file: "clips/b.mov", start: 0, end: 0.89 },
    ];
    const out = polishTimeline(segs, { clipDurations: durs10 });
    expect(out.every((s) => s.end - s.start >= 1.2 - 0.02)).toBe(true);
    expect(total(out)).toBeCloseTo(4.89, 2);
  });

  it("drops a sub-floor segment when its clip has no headroom", () => {
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 5 },
      { file: "clips/b.mov", start: 0, end: 0.8 }, // clip b is only 0.8s long
    ];
    const out = polishTimeline(segs, { clipDurations: { "clips/a.mov": 10, "clips/b.mov": 0.8 } });
    expect(out).toHaveLength(1);
    expect(total(out)).toBeCloseTo(5.8, 1); // a absorbed b's time from its own headroom
  });

  it("redistributes an over-hold into other clips' headroom", () => {
    // the real checkpoint case: a 5.35s hold while others have unused source
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 2 },
      { file: "clips/b.mov", start: 2.67, end: 8.02 },
      { file: "clips/c.mov", start: 0, end: 3 },
    ];
    const out = polishTimeline(segs, { clipDurations: durs10 });
    expect(out.every((s) => s.end - s.start <= 5.0 + 0.02)).toBe(true);
    expect(total(out)).toBeCloseTo(2 + 5.35 + 3, 2);
  });

  it("leaves an over-hold alone when footage is exhausted (hold beats freeze)", () => {
    const segs: TimelineSeg[] = [{ file: "clips/a.mov", start: 0, end: 8 }];
    const out = polishTimeline(segs, { clipDurations: { "clips/a.mov": 8 } });
    expect(out).toHaveLength(1);
    expect(out[0].end - out[0].start).toBeCloseTo(8, 2);
  });

  it("snaps a cut to a nearby word boundary without moving later cuts", () => {
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 3 },     // cut at 3.0
      { file: "clips/b.mov", start: 1, end: 4 },     // cut at 6.0
      { file: "clips/c.mov", start: 0, end: 3 },
    ];
    // nearest boundary to 3.0 is 3.4 (0.4s off > 0.3 tolerance, within 0.6 snap window)
    const words = [word(0, 3.4), word(3.4, 6.0), word(6.0, 8.9)];
    const out = polishTimeline(segs, { clipDurations: durs10, words });
    expect(out[0].end - out[0].start).toBeCloseTo(3.4, 2); // cut moved to 3.4
    expect(total(out.slice(0, 2))).toBeCloseTo(6.0, 2);    // second cut unmoved
    expect(total(out)).toBeCloseTo(9, 2);
  });

  it("refuses a snap that would push a segment under the floor", () => {
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 1.3 },   // cut at 1.3
      { file: "clips/b.mov", start: 0, end: 3 },
    ];
    // boundary at 0.9 would need seg a at 0.9s < 1.2 floor — must not snap
    const words = [word(0, 0.9), word(0.9, 4.3)];
    const out = polishTimeline(segs, { clipDurations: durs10, words });
    expect(out[0].end - out[0].start).toBeCloseTo(1.3, 2);
  });

  it("never overlaps two uses of the same file", () => {
    const segs: TimelineSeg[] = [
      { file: "clips/a.mov", start: 0, end: 1.0 },   // sub-floor, must grow
      { file: "clips/a.mov", start: 1.3, end: 4.3 }, // same file right after
    ];
    const out = polishTimeline(segs, { clipDurations: { "clips/a.mov": 10 } });
    const a = out.filter((s) => s.file === "clips/a.mov");
    for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) {
      expect(a[i].start < a[j].end && a[j].start < a[i].end).toBe(false);
    }
    expect(total(out)).toBeCloseTo(4, 1);
  });
});

describe("fitTimeline", () => {
  it("produces a draft that passes the timeline meters by construction", () => {
    // mirrors the real 792910c8 shape: 5 planned ranges incl. a glitch-length one + an over-hold
    const seq: PlanSeg[] = [
      { file: "clips/a.mov", start: 0, end: 2.2 },
      { file: "clips/b.mov", start: 2.67, end: 8.02 },
      { file: "clips/c.mov", start: 0, end: 3.1 },
      { file: "clips/d.mov", start: 1.9, end: 3.8 },
      { file: "clips/e.mov", start: 0, end: 0.89 },
    ];
    const durs = { "clips/a.mov": 10, "clips/b.mov": 10, "clips/c.mov": 10, "clips/d.mov": 10, "clips/e.mov": 6 };
    // realistic density: a word boundary every ~1s (real transcripts are denser still)
    const words = [
      word(0, 1.1), word(1.15, 2.2), word(2.3, 3.4), word(3.5, 4.4), word(4.5, 5.6), word(5.7, 6.6),
      word(6.7, 7.4), word(7.5, 8.6), word(8.7, 9.6), word(9.7, 10.6), word(10.7, 11.5), word(11.6, 12.5), word(12.6, 13.44),
    ];
    const { segments, holdTail } = fitTimeline(seq, 13.44, durs, words);
    expect(holdTail).toBe(0);
    expect(total(segments)).toBeCloseTo(13.44, 1);
    // run the actual rubric meters over the result — the point of the fix
    const edl: Edl = { version: 1, sources: { s: "/x" }, ranges: segments.map((s) => ({ source: s.file, start: s.start, end: s.end })), grade: "", overlays: [], total_duration_s: total(segments) };
    const problems = checkTimeline(edl, words, CRITIQUE_DEFAULTS).filter((p) => p.severity !== "minor");
    expect(problems).toEqual([]);
  });
});
