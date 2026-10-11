import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { callChat, imagePart, sampleFrames, ffprobeDurationSec, type ChatPart } from "./eyes";
import { scriptCriticPass } from "./script-critic";

const PLAN_MODEL = process.env.OLE_PLAN_MODEL ?? "gpt-5.5";
const HUMANIZER_MODEL = process.env.OLE_HUMANIZER_MODEL ?? "gpt-5.5";

export type Pace = "quick" | "medium" | "long-takes";
const PACES: Pace[] = ["quick", "medium", "long-takes"];
export type TitleStyle = "clean" | "pop" | "rise" | "wipe";
const TITLE_STYLES: TitleStyle[] = ["clean", "pop", "rise", "wipe"];
export type MusicMood = "upbeat" | "chill" | "cinematic" | "hype" | "cute";
const MUSIC_MOODS: MusicMood[] = ["upbeat", "chill", "cinematic", "hype", "cute"];

type PlanResult = {
  angle: string; targetSeconds: number; style: string; pace?: Pace; ending?: "hold" | "cut";
  titleStyle?: TitleStyle; music?: MusicMood | "none";
  title?: string; titleAlternates?: string[]; openerAlternates?: string[];
  angleAlternates?: { angle: string; opener: string }[];
  sequence: { file: string; start: number; end: number; note?: string; hold?: boolean; sfx?: string; anchor?: string }[];
  dropped?: { file: string; reason: string }[];
  script: string;
};

/** On-screen title: one plain line, burned onto the reel's opening frames (also the cover). */
const cleanLine = (max: number) => (v: unknown): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
const cleanTitle = cleanLine(60);
const cleanAlternates = (v: unknown, max = 60): string[] =>
  Array.isArray(v) ? v.map(cleanLine(max)).filter(Boolean).slice(0, 8) : [];
const cleanPace = (v: unknown): Pace | undefined => (PACES.includes(v as Pace) ? (v as Pace) : undefined);
const cleanEnding = (v: unknown): "hold" | "cut" | undefined => (v === "hold" || v === "cut" ? v : undefined);
// Clips the planner deliberately left out, each with a human reason — the app shows these, so a
// missing clip is never a silent mystery.
const cleanDropped = (v: unknown): { file: string; reason: string }[] =>
  (Array.isArray(v) ? v : [])
    .map((d) => ({ file: cleanLine(120)((d as { file?: unknown })?.file), reason: cleanLine(120)((d as { reason?: unknown })?.reason) }))
    .filter((d) => d.file && d.reason)
    .slice(0, 20);
const cleanTitleStyle = (v: unknown): TitleStyle => (TITLE_STYLES.includes(v as TitleStyle) ? (v as TitleStyle) : "clean");
// "none" and anything unrecognized => no music (VO-only). The resolver still no-ops if the track file is absent.
const cleanMusic = (v: unknown): MusicMood | null => (MUSIC_MOODS.includes(v as MusicMood) ? (v as MusicMood) : null);
const cleanAngleAlternates = (v: unknown): { angle: string; opener: string }[] =>
  (Array.isArray(v) ? v : [])
    .map((a) => ({ angle: cleanLine(80)((a as { angle?: unknown })?.angle), opener: cleanLine(200)((a as { opener?: unknown })?.opener) }))
    .filter((a) => a.angle)
    .slice(0, 4);

/** Mechanical text hygiene is EXECUTION, not a model's job: straight quotes, no em dashes, tidy
 *  spaces. Runs on every script we write (a curly-quoted "I’d" shipped to a teleprompter once). */
export function sanitizeScript(s: string): string {
  return s
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/ {2,}/g, " ")
    .trim();
}

const HUMANIZER_PROMPT =
  "You are editing a short spoken voiceover so it sounds like a real person talking, not AI. " +
  "Remove AI tells while KEEPING it plain and casual. Do NOT make it fancier, cleverer, longer, or more polished. " +
  "Strip: em dashes (use commas or periods), announced realizations (\"that's when it hit me\", \"I realized\", \"it clicked\"), " +
  "forced metaphors or wordplay or punchlines, rule-of-three, \"it's not just X it's Y\", empty poetic endings, signposting, " +
  "AI vocabulary (delve, tapestry, testament, vibrant, seamless), and curly quotes. " +
  "Use contractions everywhere a speaker naturally would (didn't, I'm, it's, that's). Keep the filler, mundane specifics, and understatement. If it already sounds like a real person, change little or nothing. " +
  "FIX any grammatical error (subject-verb agreement, dropped words) and NEVER introduce one — the creator reads this aloud, and \"everyone looks like they already has a routine\" shipped once. " +
  "Return ONLY the edited voiceover text, nothing else.";

/** The direct-call default: build content (doctrine + per-clip label+frame + analysis + idea) and ask gpt-5.5. */
async function directPlan(workDir: string, analysis: unknown, briefText: string): Promise<PlanResult> {
  const recipe = await readFile(new URL("../recipe/plan-reel.md", import.meta.url), "utf8");
  const clips = (analysis as { clips?: { file: string; durationSec: number; segments: unknown[] }[] }).clips ?? [];
  const content: ChatPart[] = [{ type: "text", text: `${recipe}\n\nThe caller's brief (JSON): ${briefText}\nBelow is each clip's analysis and one representative frame.` }];
  for (const c of clips) {
    const clipPath = join(workDir, c.file);
    const dur = c.durationSec > 0 ? c.durationSec : await ffprobeDurationSec(clipPath).catch(() => 0);
    // The writer gets every segment's description AND implies in full — the char-capped dump this
    // replaces (900, and 500 before it) truncated most clips mid-JSON, starving the writer of the
    // second-order layer and pushing it to invent interiority instead. Subjects/motion/quality/tags
    // are the eyes' plumbing, not the writer's input, so they stay out.
    const segments = (c.segments as { start?: number; end?: number; description?: string; implies?: string }[])
      .map((s) => ({ start: s.start, end: s.end, description: s.description, ...(s.implies ? { implies: s.implies } : {}) }));
    content.push({ type: "text", text: `\nClip ${c.file} (${dur.toFixed(2)}s): ${JSON.stringify(segments)}` });
    if (dur > 0) {
      const [b64] = await sampleFrames(clipPath, [Number((dur * 0.5).toFixed(2))]).catch(() => [] as string[]);
      if (b64) content.push(imagePart(b64));
    }
  }
  const { text } = await callChat(content, { model: PLAN_MODEL, maxTokens: 28000, reasoningEffort: "high", jsonObject: true, purpose: "plan" });
  try {
    return JSON.parse(text) as PlanResult;
  } catch {
    throw new Error(`plan: model did not return valid JSON: ${text.slice(0, 150)}`);
  }
}

const defaultHumanize = async (script: string): Promise<string> => {
  const { text } = await callChat([{ type: "text", text: `${HUMANIZER_PROMPT}\n\nVoiceover:\n${script}` }], { model: HUMANIZER_MODEL, maxTokens: 1000, reasoningEffort: "low", purpose: "humanize" });
  return text.trim();
};

/** Keep only the sequence fields the pipeline honors (file/start/end/note/hold/sfx/anchor). */
const SFX_NAMES = ["whoosh", "riser", "pop", "click"]; // per-clip content SFX the planner may tag (typewriter is title-only)
const cleanSfx = (v: unknown): string | undefined => (SFX_NAMES.includes(v as string) ? (v as string) : undefined);
const cleanAnchor = cleanLine(80); // the exact script words a clip must appear under
const cleanSequence = (seq: PlanResult["sequence"]) =>
  seq.map((s) => ({
    file: s.file, start: s.start, end: s.end, note: s.note,
    ...(s.hold === true ? { hold: true } : {}),
    ...(cleanSfx(s.sfx) ? { sfx: cleanSfx(s.sfx) } : {}),
    ...(cleanAnchor(s.anchor) ? { anchor: cleanAnchor(s.anchor) } : {}),
  }));

async function writePlanFiles(workDir: string, p: PlanResult, script: string) {
  // The on-screen title (text hook). Angle is the fallback — it's spec'd as a short plain phrase.
  const title = cleanTitle(p.title) || cleanTitle(p.angle);
  const planPath = join(workDir, "plan.json");
  const scriptPath = join(workDir, "script.md");
  const music = cleanMusic(p.music);
  await writeFile(planPath, JSON.stringify({
    angle: p.angle, targetSeconds: p.targetSeconds, style: p.style,
    ...(cleanPace(p.pace) ? { pace: cleanPace(p.pace) } : {}),
    ...(cleanEnding(p.ending) ? { ending: cleanEnding(p.ending) } : {}),
    ...(cleanDropped(p.dropped).length ? { dropped: cleanDropped(p.dropped) } : {}),
    titleStyle: cleanTitleStyle(p.titleStyle),
    ...(music ? { music } : {}),
    title, titleAlternates: cleanAlternates(p.titleAlternates), openerAlternates: cleanAlternates(p.openerAlternates, 200),
    angleAlternates: cleanAngleAlternates(p.angleAlternates),
    sequence: cleanSequence(p.sequence),
  }, null, 2));
  await writeFile(scriptPath, `---\nangle: "${p.angle}"\ntargetSeconds: ${p.targetSeconds}\n---\n${script}`);
  return { planPath, scriptPath };
}

/** Read analysis.json + a brief, ask gpt-5.5 (with a frame per clip) to storyboard the reel and write
 *  the voiceover, run a conservative humanizer pass on the script, and write plan.json + script.md.
 *  A creator-written script (userScript) is used VERBATIM — the model only storyboards around it and
 *  the humanizer never touches it. */
export async function runPlanJob(input: {
  workDir: string; hasIdea: boolean; context?: string; userScript?: string; creatorWps?: number;
  recentReels?: { angle?: string; title?: string; opener?: string }[];
  plan?: (workDir: string, analysis: unknown, briefText: string) => Promise<PlanResult>;
  humanize?: (script: string) => Promise<string>;
  critic?: typeof scriptCriticPass;
}): Promise<{ planPath: string; scriptPath: string }> {
  const userScript = input.userScript?.trim() || undefined;
  const briefText = JSON.stringify({ hasIdea: input.hasIdea, context: input.context ?? null, userScript: userScript ?? null, creatorWps: input.creatorWps ?? null, recentReels: input.recentReels ?? null }, null, 2);
  await writeFile(join(input.workDir, "brief.json"), briefText);
  const analysis = JSON.parse(await readFile(join(input.workDir, "analysis.json"), "utf8"));
  // Zero analyzed clips can't storyboard anything — refuse before spending a gpt-5.5 call on a
  // guaranteed-cryptic failure.
  const clipCount = Array.isArray((analysis as { clips?: unknown[] })?.clips) ? (analysis as { clips: unknown[] }).clips.length : 0;
  if (clipCount === 0) throw new Error("plan: no analyzed clips to work from — run prep again");

  const p = await (input.plan ?? directPlan)(input.workDir, analysis, briefText);
  if (!Array.isArray(p.sequence) || p.sequence.length === 0 || (!userScript && (typeof p.script !== "string" || !p.script.trim()))) {
    throw new Error("plan: model output missing a non-empty sequence[] or script");
  }
  // Their words are theirs: a creator script bypasses the model's copy AND the humanizer.
  let script = userScript ?? sanitizeScript(await (input.humanize ?? defaultHumanize)(p.script));
  // Keep the writer's pre-humanizer draft: when a bad line ships we can tell WHICH stage wrote it
  // ("they already has a routine" shipped unattributable — never again).
  if (!userScript && typeof p.script === "string" && p.script.trim() && p.script !== script) {
    await writeFile(join(input.workDir, "script.raw.md"), p.script);
  }
  // The gate: no drafted script ships without facing the doctrine's own checklist; at most one
  // rewrite, and script-critique.json records what fired either way. Creator scripts are never gated.
  if (!userScript) {
    const recipe = await readFile(new URL("../recipe/plan-reel.md", import.meta.url), "utf8");
    const gated = await (input.critic ?? scriptCriticPass)({
      workDir: input.workDir, script, title: cleanTitle(p.title) || cleanTitle(p.angle),
      context: input.context, targetSeconds: p.targetSeconds, clipCount, recipe,
    });
    if (gated.script !== script) {
      await writeFile(join(input.workDir, "script.pregate.md"), script); // attribution: which stage wrote a shipped line
      script = sanitizeScript(gated.script);
    }
    if (gated.title) p.title = gated.title;
  }

  return writePlanFiles(input.workDir, p, script);
}

/**
 * Fast angle switch: the creator picked one of plan.json's angleAlternates, so rewrite ONLY the
 * words (script + title + hook candidates) for that angle — text-only (no frames, analysis.json is
 * already on disk), keeping the existing sequence and pace. The previous angle joins the alternates
 * so the choice is reversible.
 */
export async function runAngleSwitch(input: {
  workDir: string; angle: string;
  chat?: typeof callChat;
  humanize?: (script: string) => Promise<string>;
}): Promise<{ planPath: string; scriptPath: string }> {
  const chat = input.chat ?? callChat;
  const recipe = await readFile(new URL("../recipe/plan-reel.md", import.meta.url), "utf8");
  const plan = JSON.parse(await readFile(join(input.workDir, "plan.json"), "utf8"));
  const analysis = await readFile(join(input.workDir, "analysis.json"), "utf8");
  const brief = await readFile(join(input.workDir, "brief.json"), "utf8").catch(() => "{}");
  const scriptMd = await readFile(join(input.workDir, "script.md"), "utf8").catch(() => "");
  const prevOpener = parseScriptMd(scriptMd).script.split(/(?<=[.!?])\s/)[0] ?? "";

  const { text } = await chat([{
    type: "text",
    text:
      `${recipe}\n\n` +
      `The reel is already storyboarded; the creator just chose a DIFFERENT ANGLE for the voiceover: "${input.angle}".\n` +
      `Rewrite ONLY the words for that angle, following every writing rule above (plain real speech, hook first line, on-screen title). ` +
      `Ground every line in the same footage. The clip sequence and pace are staying as they are.\n` +
      `The caller's brief (JSON): ${brief}\n` +
      `The footage analysis (JSON): ${analysis.slice(0, 12000)}\n` +
      `Keep targetSeconds ≈ ${plan.targetSeconds} (same footage, same length).\n` +
      `Return ONLY JSON: {"script": "...", "title": "...", "titleAlternates": ["...", "..."], "openerAlternates": ["...", "...", "...", "..."], "targetSeconds": ${plan.targetSeconds}}`,
  }], { model: PLAN_MODEL, maxTokens: 12000, reasoningEffort: "medium", jsonObject: true, purpose: "angle-switch" });

  let out: { script?: string; title?: string; titleAlternates?: string[]; openerAlternates?: string[]; targetSeconds?: number };
  try { out = JSON.parse(text); } catch { throw new Error(`angle-switch: model did not return valid JSON: ${text.slice(0, 150)}`); }
  if (typeof out.script !== "string" || !out.script.trim()) throw new Error("angle-switch: model output missing a script");
  const script = sanitizeScript(await (input.humanize ?? defaultHumanize)(out.script));

  // The chosen angle leaves the alternates; the previous angle (with its old opener) joins them.
  const alternates = [
    ...(plan.angle ? [{ angle: String(plan.angle), opener: prevOpener }] : []),
    ...cleanAngleAlternates(plan.angleAlternates).filter((a) => a.angle !== input.angle),
  ].slice(0, 4);

  return writePlanFiles(input.workDir, {
    ...plan,
    angle: input.angle,
    targetSeconds: out.targetSeconds ?? plan.targetSeconds,
    title: out.title, titleAlternates: out.titleAlternates, openerAlternates: out.openerAlternates,
    angleAlternates: alternates,
    script,
  } as PlanResult, script);
}

/** Parse script.md frontmatter (angle, targetSeconds) + narration body. */
export function parseScriptMd(md: string): { angle: string; targetSeconds: number; script: string } {
  const m = md.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { angle: "", targetSeconds: 30, script: md.trim() };
  const fm = m[1];
  const angle = (fm.match(/angle:\s*"?(.*?)"?\s*$/m)?.[1] ?? "").trim();
  const targetSeconds = Number(fm.match(/targetSeconds:\s*(\d+)/m)?.[1] ?? 30);
  return { angle, targetSeconds, script: m[2].trim() };
}
