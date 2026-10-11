import { describe, expect, it } from "vitest";
import {
  buildTalkingHeadEdl, groupCandidateTakes, segmentTakeCandidates, validateTalkingHeadPlan,
  type TakeCandidate, type TakeGroup, type TalkingHeadPlan,
} from "../src/talking-head";

type Entry = { type: "word" | "audio_event"; text: string; start: number; end: number };
const words = (sentences: Array<{ text: string; at: number; gap?: number }>, events: Entry[] = []) => {
  const entries: Entry[] = [...events];
  for (const sentence of sentences) {
    let at = sentence.at;
    for (const token of sentence.text.split(" ")) {
      entries.push({ type: "word", text: token, start: at, end: at + 0.22 });
      at += sentence.gap ?? 0.27;
    }
  }
  return { words: entries.sort((a, b) => a.start - b.start) };
};

const planFor = (selected: TakeCandidate[], groups: TakeGroup[], compromises: string[] = []): TalkingHeadPlan => ({
  storyline: "A clear hook, useful explanation, and conclusion.",
  selectedCandidateIds: selected.map((candidate) => candidate.id),
  takeGroups: groups.filter((group) => group.candidates.length > 1).map((group) => {
    const chosen = selected.find((candidate) => group.candidates.some((item) => item.id === candidate.id)) ?? group.candidates[0];
    return {
      semanticBeat: group.semanticBeat,
      candidateIds: group.candidates.map((candidate) => candidate.id),
      selectedCandidateId: chosen.id,
      rejectionReasons: Object.fromEntries(group.candidates.filter((candidate) => candidate.id !== chosen.id).map((candidate) => [candidate.id, "A cleaner equivalent was selected."])),
    };
  }),
  compromises,
});

describe("talking-head take selection", () => {
  it("groups three attempts of the same sentence and does not blindly keep the worse final attempt", () => {
    const candidates = segmentTakeCandidates("one", words([
      { text: "The reason I started was simple.", at: 0 },
      { text: "The reason I started was simple.", at: 3 },
      { text: "The reason I sorry started was simple.", at: 6 },
    ]));
    const groups = groupCandidateTakes(candidates);
    expect(groups).toHaveLength(1);
    expect(groups[0].candidates).toHaveLength(3);
    expect(groups[0].selectedCandidateId).not.toBe(candidates[2].id);
    expect(candidates[2].issues).toContain("verbal_mistake");
  });

  it("groups equivalent attempts spread across files", () => {
    const a = segmentTakeCandidates("a", words([{ text: "Here is the simplest way to plan content.", at: 0 }]))[0];
    const b = segmentTakeCandidates("b", words([{ text: "Here is the simplest way to plan content.", at: 10 }]))[0];
    expect(groupCandidateTakes([a, b])[0].candidates.map((candidate) => candidate.source)).toEqual(["a", "b"]);
  });

  it("recognizes a false start followed by a clean take from the repeated opening", () => {
    const candidates = segmentTakeCandidates("one", words([
      { text: "The reason I", at: 0 },
      { text: "The reason I made this change was to save time.", at: 2 },
    ]));
    const group = groupCandidateTakes(candidates)[0];
    expect(group.candidates).toHaveLength(2);
    expect(candidates[0].issues).toEqual(expect.arrayContaining(["false_start", "abandoned_sentence"]));
    expect(group.selectedCandidateId).toBe(candidates[1].id);
  });

  it("rejects a verbal mistake when a corrected take exists", () => {
    const candidates = segmentTakeCandidates("one", words([
      { text: "My best advice, sorry, is to post weekly.", at: 0 },
      { text: "My best advice is to post weekly.", at: 4 },
    ]));
    const groups = groupCandidateTakes(candidates);
    const badPlan = planFor([candidates[0]], groups);
    expect(() => validateTalkingHeadPlan(badPlan, candidates, groups)).toThrow(/cleaner equivalent/);
  });

  it("marks a long internal pause but preserves shorter natural pauses", () => {
    const long = segmentTakeCandidates("one", words([{ text: "This pause is still inside the sentence.", at: 0, gap: 0.73 }]))[0];
    const natural = segmentTakeCandidates("two", words([{ text: "This pause feels natural and useful.", at: 0, gap: 0.35 }]))[0];
    expect(long.issues).toContain("long_dead_air");
    expect(natural.issues).not.toContain("long_dead_air");
  });

  it("keeps a useful laugh audio event inside the selected take", () => {
    const candidate = segmentTakeCandidates("one", words(
      [{ text: "That was definitely not the plan.", at: 0 }],
      [{ type: "audio_event", text: "laughter", start: 1.62, end: 1.9 }],
    ))[0];
    expect(candidate.transcript).toContain("(laughter)");
    expect(candidate.preservedEvents).toContain("laughter");
    expect(candidate.endSec).toBeGreaterThan(1.9);
  });

  it("allows intentional rhetorical repetition only when the plan records it", () => {
    const candidates = [
      segmentTakeCandidates("a", words([{ text: "You have to start before you feel ready.", at: 0 }]))[0],
      segmentTakeCandidates("b", words([{ text: "You have to start before you feel ready.", at: 0 }]))[0],
    ];
    const groups = groupCandidateTakes(candidates);
    expect(() => validateTalkingHeadPlan(planFor(candidates, groups), candidates, groups)).toThrow(/repeat/);
    expect(() => validateTalkingHeadPlan(planFor(candidates, groups, ["Intentional rhetorical repetition supports the ending."]), candidates, groups)).not.toThrow();
  });

  it("allows the strongest complete imperfect take when no clean attempt exists and discloses the compromise", () => {
    const candidates = segmentTakeCandidates("one", words([
      { text: "I mean the useful part is the consistent habit.", at: 0 },
      { text: "Sorry the useful part is the consistent habit.", at: 5 },
    ]));
    const groups = groupCandidateTakes(candidates);
    expect(() => validateTalkingHeadPlan(planFor([candidates[0]], groups, ["No completely clean attempt exists; this is the strongest complete take."]), candidates, groups)).not.toThrow();
  });

  it("uses real word boundaries with 30–200ms padding and builds output-ordered ranges", () => {
    const candidates = [
      segmentTakeCandidates("a", words([{ text: "A complete first thought.", at: 1 }]))[0],
      segmentTakeCandidates("b", words([{ text: "A different complete conclusion.", at: 4 }]))[0],
    ];
    expect(candidates[0].wordStartSec! - candidates[0].startSec).toBeCloseTo(0.08, 3);
    expect(candidates[0].endSec - candidates[0].wordEndSec!).toBeCloseTo(0.12, 3);
    const groups = groupCandidateTakes(candidates);
    const plan = planFor(candidates, groups);
    const edl = buildTalkingHeadEdl(plan, candidates, { a: "/a.mov", b: "/b.mov" });
    expect(edl.ranges.map((range) => range.source)).toEqual(["a", "b"]);
    expect(edl.total_duration_s).toBeCloseTo(candidates.reduce((sum, item) => sum + item.endSec - item.startSec, 0), 3);
    expect(edl.metadata?.storyline).toBe(plan.storyline);
  });
});
