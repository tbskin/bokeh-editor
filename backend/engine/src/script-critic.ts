import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { callChat } from "./eyes";

// The script gate ("system, not fixes"): every doctrine failure that ever shipped becomes a named
// check here, so the next draft that repeats it gets bounced BEFORE the creator reads it aloud.
// Mechanical checks (verbatim lifts, label echo) are code; judgment checks (hook, thread,
// inventory) are one cheap model call. One rewrite max, then ship what we have — the meter
// (script-critique.json → script_critiqued event) records what fired either way.

// The judge needs the same taste the writer has: gpt-5-mini passed "lunch got serious over a
// falafel burger" (illegible) and a 17s script over six clips (too thin) — register judgment is
// exactly what the small model lacks.
const CRITIC_MODEL = process.env.OLE_CRITIC_MODEL ?? "gpt-5.5";
const REWRITE_MODEL = process.env.OLE_PLAN_MODEL ?? "gpt-5.5";

export type ScriptCheckFailure = { check: string; detail: string };
export type ScriptCritique = {
  failures: ScriptCheckFailure[];
  rewritten: boolean;
  afterFailures?: ScriptCheckFailure[];
  criticError?: string;
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();

/** The register examples live in the recipe between HTML-comment markers; the meter reads the SAME
 *  text the writer was shown, so doctrine edits can never desync the check. */
export function registerExamples(recipe: string): string {
  const m = recipe.match(/<!-- register-examples:start -->([\s\S]*?)<!-- register-examples:end -->/);
  return m?.[1] ?? "";
}

/** A run of `n`+ consecutive words lifted verbatim from the doctrine's examples ("like a normal
 *  person" shipped as exactly this class). Paraphrase-level resemblance is the model's check. */
export function exemplarLift(script: string, examples: string, n = 4): string | null {
  if (!examples.trim()) return null;
  const ex = ` ${normalize(examples)} `;
  const words = normalize(script).split(" ");
  for (let i = 0; i + n <= words.length; i++) {
    const gram = words.slice(i, i + n).join(" ");
    if (ex.includes(` ${gram} `)) return gram;
  }
  return null;
}

const STOP = new Set(["a", "an", "the", "in", "on", "at", "of", "to", "and", "or", "my", "your",
  "our", "this", "that", "is", "was", "it", "for", "with", "as", "i", "we", "so", "just"]);

/** A contiguous pair of content words from the creator's context appearing in the spoken hook is an
 *  echo — the writer handed the label back instead of writing ("...doing the SF tech bro thing"). */
export function labelEcho(context: string, target: string): string | null {
  const ctx = normalize(context).split(" ");
  const t = ` ${normalize(target)} `;
  for (let i = 0; i + 2 <= ctx.length; i++) {
    const [a, b] = [ctx[i], ctx[i + 1]];
    if (STOP.has(a) || STOP.has(b)) continue;
    if (t.includes(` ${a} ${b} `)) return `${a} ${b}`;
  }
  return null;
}

export function deterministicChecks(args: { script: string; context?: string; recipe: string; clipCount?: number }): ScriptCheckFailure[] {
  const failures: ScriptCheckFailure[] = [];
  // The one failure a word counter can catch: giving up early. Four+ clips always hold more day
  // than ~45 words of story (a 40-word script over six clips shipped; verdict: "such a short
  // script?"). The rewrite instruction develops MORE beats — this check never causes padding.
  const words = args.script.trim().split(/\s+/).filter(Boolean).length;
  if ((args.clipCount ?? 0) >= 4 && words < 45) failures.push({
    check: "too-thin",
    detail: `${words} words over ${args.clipCount} clips — the day has more story than this; go back to the moment list and develop more chained beats with takes (25-45s spoken), never padding`,
  });
  const lift = exemplarLift(args.script, registerExamples(args.recipe));
  if (lift) failures.push({
    check: "exemplar-lift",
    detail: `reuses the doctrine example's words verbatim ("${lift}") — rewrite that line from the footage`,
  });
  if (args.context) {
    const hook = args.script.split(/(?<=[.!?])\s/)[0] ?? "";
    const echo = labelEcho(args.context, hook);
    if (echo) failures.push({
      check: "label-echo-hook",
      detail: `the first line repeats the creator's own context words ("${echo}") instead of opening a loop from the footage`,
    });
  }
  return failures;
}

const CRITIC_PROMPT = `You are the script gate for a short reel voiceover. Judge the script against
these checks. Return ONLY JSON {"failures":[{"check":"...","detail":"..."}]} — an empty array when
it passes. Fail a check only when you are CONFIDENT; when in doubt, pass. The house register is
plain, understated, casually opinionated — understatement, "honestly", a mild anticlimax, or a
quiet close are the GOAL, never failures by themselves. A persona title ("SF tech bro") carries a
hook ingredient and passes. Each detail says concretely what to change, in one sentence.

- "hook-closed": the first line spends its own payoff or states the conclusion ("I did way too
  much") instead of opening a question the LAST line answers.
- "no-thread": you cannot complete "this reel is about ___" with one specific tension or opinion a
  stranger could care about. A day-recap ("my first day", "my trip") is not a thread.
- "inventory": any sentence lists 3+ places/objects/scenes that are visible on screen ("a deli
  stop, a real lunch, a barbershop stop, and this table thing") — the voiceover is narrating the
  footage instead of saying what was happening to the creator.
- "example-resemblance": the script's arc, opening shape, or closing move mirrors one of the
  provided register examples. Paraphrase counts ("It's a lot, and I kind of like it" mirrors "I
  think I actually like it here").
- "generic-ending": the last line could close anyone's reel about any day or city, instead of
  answering THIS script's opening.
- "performed-persona": invented self-performance or meta-filming the creator never mentioned
  ("pretended to...", "trying to look like...", "I filmed it before I knew if...", "...like a
  normal person").
- "aside-overload": more than one ironic tag-aside (", which sounds nice until...", ", which feels
  about right", "because obviously").
- "title-category-label": the on-screen title is a neutral category label with no take, stake,
  persona, or specific oddity ("A Random SF Day").
- "and-then-chain": the beats connect only by sequence ("and then", "after that", "later") with no
  but/so causality anywhere — a list wearing sentences instead of a story.
- "illegible-line": a line compresses its situation into imagery shorthand a listener can't parse
  on first hearing ("lunch was a fridge case") instead of stating the situation then the reaction.
- "no-take": the script never takes a position — no opinion said plainly with its reason anywhere;
  a generic recap any creator could read over any footage.
- "invented-interiority": oddly specific feelings, decisions, or meanings stated as fact that the
  camera couldn't show and the creator's context doesn't say ("lunch suddenly felt hard", "I kept
  making these tiny decisions").
- "question-hook": the first line is a manufactured rhetorical question ("Why does X get me every
  time?", "Could one day really...?") instead of a plain statement of the plan or stake.
- "clever-line": wordplay, a metaphor, or a punchline-shaped line anywhere ("looking at pretty
  streets like rent wasn't happening") — opinions said plainly are wanted; crafted lines are not.
- "vibe-summary": a line whose subject is the day/vibe/energy/pace in the abstract ("the day got
  social", "I ended up in the mix", "an easy yes") instead of a concrete thing plus the creator's
  position on it.`;

async function modelCritique(args: {
  script: string; title: string; context?: string; examples: string; chat: typeof callChat;
}): Promise<ScriptCheckFailure[]> {
  const { text } = await args.chat([{
    type: "text",
    text: `${CRITIC_PROMPT}\n\nCreator context: ${args.context ?? "(none)"}\nOn-screen title: ${args.title}\n\nRegister examples from the doctrine (the script must not resemble their arcs or phrases):\n${args.examples}\n\nScript:\n${args.script}`,
  }], { model: CRITIC_MODEL, maxTokens: 4000, reasoningEffort: "low", jsonObject: true, purpose: "critique-script" });
  const parsed = JSON.parse(text) as { failures?: { check?: unknown; detail?: unknown }[] };
  return (Array.isArray(parsed.failures) ? parsed.failures : [])
    .map((f) => ({ check: String(f.check ?? ""), detail: String(f.detail ?? "") }))
    .filter((f) => f.check)
    .slice(0, 10);
}

async function rewriteOnce(args: {
  script: string; title: string; failures: ScriptCheckFailure[]; recipe: string;
  targetSeconds?: number; chat: typeof callChat;
}): Promise<{ script?: string; title?: string }> {
  const { text } = await args.chat([{
    type: "text",
    text: `${args.recipe}\n\nA draft voiceover for a reel failed the script gate. Make the SMALLEST possible edit that fixes ONLY the named failures: change the failing lines, keep every other line word-for-word, same length${args.targetSeconds ? ` (~${args.targetSeconds}s spoken)` : ""}. EXCEPTION — a "too-thin" failure is fixed by DEVELOPING the story: keep what works and chain MORE moments from the footage with takes until the script reaches a real 25-45 seconds; longer through more story, never through padding. Your rewrite must be PLAINER than the draft, never fancier — adding craft, imagery, or clever phrasing to a flagged line is a worse failure than the flag. Never invent events (the tense rule above). Return ONLY JSON {"script":"the full corrected voiceover","title":"the on-screen title"} — keep the title unchanged unless a title check failed.\n\nFailures:\n${args.failures.map((f) => `- ${f.check}: ${f.detail}`).join("\n")}\n\nOn-screen title: ${args.title}\n\nDraft:\n${args.script}`,
  }], { model: REWRITE_MODEL, maxTokens: 6000, reasoningEffort: "medium", jsonObject: true, purpose: "critique-rewrite" });
  const parsed = JSON.parse(text) as { script?: unknown; title?: unknown };
  return {
    script: typeof parsed.script === "string" && parsed.script.trim() ? parsed.script.trim() : undefined,
    title: typeof parsed.title === "string" && parsed.title.trim() ? parsed.title.trim() : undefined,
  };
}

/** Run the gate over a drafted script: checks, at most ONE rewrite, and always a written meter
 *  (script-critique.json). Fails open — a broken critic never blocks a reel, but the meter says so. */
export async function scriptCriticPass(args: {
  workDir: string; script: string; title: string; context?: string; targetSeconds?: number;
  clipCount?: number; recipe: string; chat?: typeof callChat;
}): Promise<{ script: string; title?: string }> {
  const chat = args.chat ?? callChat;
  const examples = registerExamples(args.recipe);
  const critique: ScriptCritique = { failures: deterministicChecks(args), rewritten: false };
  if (process.env.OPENAI_API_KEY || args.chat) {
    try {
      critique.failures = critique.failures.concat(await modelCritique({ ...args, examples, chat }));
    } catch (e) {
      critique.criticError = String((e as Error)?.message ?? e).slice(0, 300);
    }
  } else {
    critique.criticError = "no OPENAI_API_KEY — deterministic checks only";
  }

  let out: { script: string; title?: string } = { script: args.script };
  if (critique.failures.length) {
    try {
      const r = await rewriteOnce({ ...args, failures: critique.failures, chat });
      if (r.script) {
        out = { script: r.script, ...(r.title && r.title !== args.title ? { title: r.title } : {}) };
        critique.rewritten = true;
        critique.afterFailures = deterministicChecks({ script: r.script, context: args.context, recipe: args.recipe, clipCount: args.clipCount });
      }
    } catch (e) {
      critique.criticError = String((e as Error)?.message ?? e).slice(0, 300);
    }
  }
  await writeFile(join(args.workDir, "script-critique.json"), JSON.stringify(critique, null, 2));
  return out;
}
