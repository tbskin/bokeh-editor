import { describe, expect, it } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import {
  deterministicChecks, exemplarLift, labelEcho, registerExamples, scriptCriticPass,
} from "../src/script-critic";
import type { callChat } from "../src/eyes";

const recipe = readFileSync(new URL("../recipe/plan-reel.md", import.meta.url), "utf8");

describe("registerExamples", () => {
  it("extracts the marked block from the live recipe (the meter reads what the writer read)", () => {
    const ex = registerExamples(recipe);
    expect(ex).toContain("The plan today was to finally set up the apartment");
    expect(ex).toContain("taco truck");
    expect(ex).toContain("flea market");
  });
});

describe("exemplarLift", () => {
  it("catches a verbatim run lifted from the examples (the 'like a normal person' class)", () => {
    const script = "So yeah, I'm probably part of the problem from here on.";
    expect(exemplarLift(script, registerExamples(recipe))).toBe("i'm probably part of"); // first lifted run wins
  });
  it("does not fire on ordinary shared short phrases", () => {
    const script = "The coffee was fine. I like it. The park was quiet and the day just kept going.";
    expect(exemplarLift(script, registerExamples(recipe))).toBeNull();
  });
});

describe("labelEcho (the shipped 'SF tech bro' echo)", () => {
  const context = "Day 1 in the life of an SF tech bro";
  it("catches the creator's label repeated in the spoken hook", () => {
    expect(labelEcho(context, "This was my first day doing the SF tech bro thing, and honestly, I did way too much.")).toBe("sf tech"); // first echoed pair wins
  });
  it("passes a hook written from the footage", () => {
    expect(labelEcho(context, "I paid nine dollars for an iced coffee and didn't even flinch.")).toBeNull();
  });
});

describe("scriptCriticPass", () => {
  it("bounces a failing draft through one rewrite and records the meter", async () => {
    const work = await mkdtemp(join(tmpdir(), "critic-"));
    const calls: string[] = [];
    const chat = (async (content: { text?: string }[], opts: { purpose?: string }) => {
      calls.push(opts.purpose ?? "?");
      if (opts.purpose === "critique-script")
        return { text: JSON.stringify({ failures: [{ check: "hook-closed", detail: "the first line spends the payoff" }] }) };
      return { text: JSON.stringify({ script: "A stranger waved me into a street party today. I almost kept walking.", title: "" }) };
    }) as unknown as typeof callChat;
    const out = await scriptCriticPass({
      workDir: work, script: "I did way too much today.", title: "Day One", context: "big day",
      targetSeconds: 30, recipe, chat,
    });
    expect(out.script).toContain("street party");
    expect(calls).toEqual(["critique-script", "critique-rewrite"]);
    const meter = JSON.parse(await readFile(join(work, "script-critique.json"), "utf8"));
    expect(meter.rewritten).toBe(true);
    expect(meter.failures.map((f: { check: string }) => f.check)).toContain("hook-closed");
  });

  it("passes a clean draft untouched and still writes the meter", async () => {
    const work = await mkdtemp(join(tmpdir(), "critic-"));
    const chat = (async () => ({ text: JSON.stringify({ failures: [] }) })) as unknown as typeof callChat;
    const out = await scriptCriticPass({
      workDir: work, script: "Nobody warned me the good part starts after the line gets boring.",
      title: "Twenty Minutes For Tacos", context: "taco day", recipe, chat,
    });
    expect(out.script).toBe("Nobody warned me the good part starts after the line gets boring.");
    const meter = JSON.parse(await readFile(join(work, "script-critique.json"), "utf8"));
    expect(meter).toMatchObject({ failures: [], rewritten: false });
  });

  it("fails open when the critic model breaks — the reel ships, the meter says why", async () => {
    const work = await mkdtemp(join(tmpdir(), "critic-"));
    const chat = (async () => { throw new Error("upstream down"); }) as unknown as typeof callChat;
    const out = await scriptCriticPass({
      workDir: work, script: "A plain fine script.", title: "A Title", recipe, chat,
    });
    expect(out.script).toBe("A plain fine script.");
    const meter = JSON.parse(await readFile(join(work, "script-critique.json"), "utf8"));
    expect(meter.criticError).toContain("upstream down");
  });

  it("too-thin fires on a short script over many clips, never over few", () => {
    const short = "Quick day. Coffee, a walk, some food, and honestly it was fine.";
    expect(deterministicChecks({ script: short, recipe, clipCount: 6 }).map((f) => f.check)).toContain("too-thin");
    expect(deterministicChecks({ script: short, recipe, clipCount: 2 }).map((f) => f.check)).not.toContain("too-thin");
  });

  it("deterministic checks catch lifts and echoes without any model", () => {
    const failures = deterministicChecks({
      script: "The thing about hardware stores is they never let you leave with one thing. It went fine.",
      context: "first tech bro day", recipe,
    });
    expect(failures.map((f) => f.check)).toContain("exemplar-lift");
  });
});
