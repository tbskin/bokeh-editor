import { describe, it, expect, vi } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sanitizeScript, runPlanJob, runAngleSwitch, parseScriptMd } from "../src/plan";

async function scratch(clips: string[]) {
  const work = await mkdtemp(join(tmpdir(), "ole-plan-"));
  await mkdir(join(work, "clips"), { recursive: true });
  for (const c of clips) await writeFile(join(work, "clips", c), "x");
  await writeFile(join(work, "analysis.json"), JSON.stringify({
    summary: "", clips: clips.map((c) => ({ file: `clips/${c}`, durationSec: 3, segments: [] })),
  }));
  return work;
}

describe("runPlanJob (direct multimodal)", () => {
  it("writes plan.json + script.md from the model, and humanizes the script", async () => {
    const work = await scratch(["a.mov", "b.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "first day", targetSeconds: 12, style: "first-day",
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "" }],
      script: "raw model script that hit me",
    }));
    const fakeHumanize = vi.fn(async (s: string) => s.replace("that hit me", "and yeah"));
    const out = await runPlanJob({ workDir: work, hasIdea: true, context: "SF", plan: fakePlan, humanize: fakeHumanize, critic: async ({ script }) => ({ script }) });

    const plan = JSON.parse(await readFile(out.planPath, "utf8"));
    expect(plan.sequence).toHaveLength(1);
    expect(plan.angle).toBe("first day");
    const script = await readFile(out.scriptPath, "utf8");
    const parsed = parseScriptMd(script);
    expect(parsed.script).toBe("raw model script and yeah"); // humanizer ran
    expect(parsed.targetSeconds).toBe(12);
    expect(fakePlan).toHaveBeenCalledOnce();
    expect(fakeHumanize).toHaveBeenCalledOnce();
    // brief.json still written
    expect(JSON.parse(await readFile(join(work, "brief.json"), "utf8"))).toEqual({ hasIdea: true, context: "SF", userScript: null, creatorWps: null, recentReels: null });
  });

  it("keeps the chosen hook AND the alternates in plan.json (closed-loop learning)", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "first day", targetSeconds: 12, style: "first-day",
      title: "  day in the life of a   tech bro  ",
      titleAlternates: ["first day in sf", "", 42 as unknown as string, "we tried every taco place"],
      openerAlternates: ["so I got locked out on day one", "I paid nine dollars for a coffee"],
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "" }],
      script: "plain script",
    }));
    const out = await runPlanJob({ workDir: work, hasIdea: true, plan: fakePlan, humanize: async (s: string) => s, critic: async ({ script }) => ({ script }) });
    const plan = JSON.parse(await readFile(out.planPath, "utf8"));
    expect(plan.title).toBe("day in the life of a tech bro"); // whitespace normalized
    expect(plan.titleAlternates).toEqual(["first day in sf", "we tried every taco place"]); // junk dropped
    expect(plan.openerAlternates).toHaveLength(2);
  });

  it("falls back to the angle as the title when the model omits one (old-shape output)", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "first day", targetSeconds: 12, style: "first-day",
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "" }],
      script: "plain script",
    }));
    const out = await runPlanJob({ workDir: work, hasIdea: false, plan: fakePlan, humanize: async (s: string) => s, critic: async ({ script }) => ({ script }) });
    const plan = JSON.parse(await readFile(out.planPath, "utf8"));
    expect(plan.title).toBe("first day");
    expect(plan.titleAlternates).toEqual([]);
    expect(plan.openerAlternates).toEqual([]);
  });

  it("keeps pace + hold + angle stubs in plan.json; junk pace is dropped", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "long plays", targetSeconds: 20, style: "sports", pace: "long-takes" as const,
      angleAlternates: [{ angle: "mic'd up", opener: "so you can hear everything" }, { angle: "", opener: "dropped" }],
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "", hold: true, extra: "junk" } as never],
      script: "plain script",
    }));
    const out = await runPlanJob({ workDir: work, hasIdea: true, plan: fakePlan, humanize: async (s: string) => s, critic: async ({ script }) => ({ script }) });
    const plan = JSON.parse(await readFile(out.planPath, "utf8"));
    expect(plan.pace).toBe("long-takes");
    expect(plan.sequence[0].hold).toBe(true);
    expect(plan.sequence[0].extra).toBeUndefined(); // only honored fields persist
    expect(plan.angleAlternates).toEqual([{ angle: "mic'd up", opener: "so you can hear everything" }]);

    const bad = vi.fn(async () => ({ angle: "x", targetSeconds: 5, style: "x", pace: "hyperspeed" as never, sequence: [{ file: "clips/a.mov", start: 0, end: 3 }], script: "s" }));
    const out2 = await runPlanJob({ workDir: work, hasIdea: false, plan: bad, humanize: async (s: string) => s });
    expect(JSON.parse(await readFile(out2.planPath, "utf8")).pace).toBeUndefined();
  });

  it("persists a valid titleStyle + music mood; junk titleStyle -> clean, junk music -> omitted", async () => {
    const work = await scratch(["a.mov"]);
    const good = vi.fn(async () => ({
      angle: "x", targetSeconds: 10, style: "x", titleStyle: "wipe" as const, music: "chill" as const,
      sequence: [{ file: "clips/a.mov", start: 0, end: 3 }], script: "s",
    }));
    const p1 = JSON.parse(await readFile((await runPlanJob({ workDir: work, hasIdea: true, plan: good, humanize: async (s: string) => s })).planPath, "utf8"));
    expect(p1.titleStyle).toBe("wipe");
    expect(p1.music).toBe("chill");

    const bad = vi.fn(async () => ({
      angle: "x", targetSeconds: 10, style: "x", titleStyle: "sparkle" as never, music: "none" as const,
      sequence: [{ file: "clips/a.mov", start: 0, end: 3 }], script: "s",
    }));
    const p2 = JSON.parse(await readFile((await runPlanJob({ workDir: work, hasIdea: true, plan: bad, humanize: async (s: string) => s })).planPath, "utf8"));
    expect(p2.titleStyle).toBe("clean"); // unknown style defaults, never crashes the cut
    expect("music" in p2).toBe(false);   // "none" is omitted, not stored
  });

  it("keeps a valid per-clip sfx tag and drops an unknown one", async () => {
    const work = await scratch(["a.mov", "b.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "x", targetSeconds: 10, style: "x",
      sequence: [
        { file: "clips/a.mov", start: 0, end: 3, sfx: "whoosh" },
        { file: "clips/b.mov", start: 0, end: 3, sfx: "airhorn" }, // not in the vocabulary
      ],
      script: "s",
    }));
    const plan = JSON.parse(await readFile((await runPlanJob({ workDir: work, hasIdea: true, plan: fakePlan, humanize: async (s: string) => s, critic: async ({ script }) => ({ script }) })).planPath, "utf8"));
    expect(plan.sequence[0].sfx).toBe("whoosh");
    expect("sfx" in plan.sequence[1]).toBe(false); // junk sfx dropped, not stored
  });

  it("uses a creator script VERBATIM — model copy and humanizer never touch it", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "their idea", targetSeconds: 10, style: "own-script",
      sequence: [{ file: "clips/a.mov", start: 0, end: 3 }],
      script: "MODEL REWRITE THAT MUST BE IGNORED",
    }));
    const humanize = vi.fn(async (s: string) => s + " HUMANIZED");
    const out = await runPlanJob({ workDir: work, hasIdea: true, userScript: "  my exact words, my voice.  ", plan: fakePlan, humanize });
    const { script } = parseScriptMd(await readFile(out.scriptPath, "utf8"));
    expect(script).toBe("my exact words, my voice.");
    expect(humanize).not.toHaveBeenCalled();
    // the brief the model saw carries the script so it storyboards around it
    expect(JSON.parse(await readFile(join(work, "brief.json"), "utf8")).userScript).toBe("my exact words, my voice.");
  });

  it("rejects when the model output has an empty sequence or script", async () => {
    const work = await scratch(["a.mov"]);
    const badPlan = vi.fn(async () => ({
      angle: "x", targetSeconds: 5, style: "x", sequence: [], script: "",
    }));
    await expect(
      runPlanJob({ workDir: work, hasIdea: false, plan: badPlan, humanize: async (s: string) => s }),
    ).rejects.toThrow(/sequence|script/);
  });
});

describe("runAngleSwitch", () => {
  it("rewrites only the words: angle swaps in, the old angle becomes an alternate, sequence/pace stay", async () => {
    const work = await scratch(["a.mov"]);
    await writeFile(join(work, "plan.json"), JSON.stringify({
      angle: "day one", targetSeconds: 12, style: "day-in-the-life", pace: "quick",
      title: "old title", titleAlternates: [], openerAlternates: [],
      angleAlternates: [{ angle: "everything I ate", opener: "five coffees, one regret" }, { angle: "the honest version", opener: "I nearly went home" }],
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "walk" }],
    }));
    await writeFile(join(work, "script.md"), `---\nangle: "day one"\ntargetSeconds: 12\n---\nOld opener line. And the rest.`);
    const fakeChat = vi.fn(async () => ({
      text: JSON.stringify({ script: "new plain script", title: "everything I ate today", titleAlternates: ["t2"], openerAlternates: ["o1"], targetSeconds: 12 }),
      inputTokens: 1, outputTokens: 1,
    }));
    const out = await runAngleSwitch({ workDir: work, angle: "everything I ate", chat: fakeChat as never, humanize: async (s: string) => s });
    const plan = JSON.parse(await readFile(out.planPath, "utf8"));
    expect(plan.angle).toBe("everything I ate");
    expect(plan.pace).toBe("quick");
    expect(plan.sequence).toEqual([{ file: "clips/a.mov", start: 0, end: 3, note: "walk" }]);
    // reversible: the previous angle is now an option, the chosen one is gone
    expect(plan.angleAlternates[0]).toEqual({ angle: "day one", opener: "Old opener line." });
    expect(plan.angleAlternates.map((a: { angle: string }) => a.angle)).not.toContain("everything I ate");
    expect(parseScriptMd(await readFile(out.scriptPath, "utf8")).script).toBe("new plain script");
  });
});

describe("parseScriptMd", () => {
  it("parses angle, targetSeconds, and the narration body", () => {
    const md = `---\nangle: "The 5am ritual"\ntargetSeconds: 32\n---\nEvery morning starts the same way.\nCoffee first.`;
    expect(parseScriptMd(md)).toEqual({ angle: "The 5am ritual", targetSeconds: 32, script: "Every morning starts the same way.\nCoffee first." });
  });
  it("falls back to sane defaults when frontmatter is missing", () => {
    expect(parseScriptMd("just words")).toEqual({ angle: "", targetSeconds: 30, script: "just words" });
  });
});

describe("sanitizeScript (mechanical hygiene is code, not a model behavior)", () => {
  it("straightens curly quotes, kills em dashes, tidies spaces — content untouched", () => {
    expect(sanitizeScript("I\u2019d say \u201Chi\u201D \u2014 honestly")).toBe("I'd say \"hi\", honestly");
    expect(sanitizeScript("already  fine")).toBe("already fine");
  });
});

describe("runPlanJob + script gate", () => {
  it("ships the critic's rewrite, keeps the pre-gate draft for attribution, honors a title fix", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "first day", targetSeconds: 12, style: "day", title: "Day One As An SF Tech Bro",
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "" }],
      script: "I did way too much today.",
    }));
    const critic = vi.fn(async () => ({ script: "A stranger waved me into a street party.", title: "The Street Party I Almost Skipped" }));
    const out = await runPlanJob({ workDir: work, hasIdea: true, context: "tech bro day", plan: fakePlan, humanize: async (s: string) => s, critic });

    expect(parseScriptMd(await readFile(out.scriptPath, "utf8")).script).toBe("A stranger waved me into a street party.");
    expect(await readFile(join(work, "script.pregate.md"), "utf8")).toBe("I did way too much today."); // attribution survives
    expect(JSON.parse(await readFile(out.planPath, "utf8")).title).toBe("The Street Party I Almost Skipped");
    expect(critic).toHaveBeenCalledWith(expect.objectContaining({
      workDir: work, context: "tech bro day", targetSeconds: 12, recipe: expect.stringContaining("register-examples:start"),
    }));
  });

  it("never gates a creator-written script (their words are theirs)", async () => {
    const work = await scratch(["a.mov"]);
    const fakePlan = vi.fn(async () => ({
      angle: "a", targetSeconds: 12, style: "day",
      sequence: [{ file: "clips/a.mov", start: 0, end: 3, note: "" }], script: "",
    }));
    const critic = vi.fn(async () => { throw new Error("must not be called"); });
    const out = await runPlanJob({ workDir: work, hasIdea: true, userScript: "My own words, exactly.", plan: fakePlan, humanize: async (s: string) => s, critic });
    expect(parseScriptMd(await readFile(out.scriptPath, "utf8")).script).toBe("My own words, exactly.");
    expect(critic).not.toHaveBeenCalled();
  });
});
