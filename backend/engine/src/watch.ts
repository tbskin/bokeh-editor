import type { Edl } from "./edl";
import { CRITIQUE_DEFAULTS, type CritiqueConfig, type CritiqueProblem, type RubricDimension, type Severity, type Word } from "./critique";
import { callChat, imagePart, sampleFrames, type FrameSampler } from "./eyes";

const WATCH_MODEL = process.env.OLE_EYES_MODEL ?? "gpt-5-mini";
const MAX_PROBLEMS = 6;

const DIMENSIONS = new Set<RubricDimension>(["voice", "pacing", "footage", "framing", "color", "captions", "structure", "integrity", "length"]);
const SEVERITIES = new Set<Severity>(["critical", "important", "minor"]);

/** The rubric's eyes budget as sample points: the opening, each cut ±0.3s, midpoints of long holds. Pure. */
export function pickWatchTimestamps(edl: Edl, cfg: CritiqueConfig, cap = 10): number[] {
  const total = edl.ranges.reduce((a, r) => a + (r.end - r.start), 0);
  const raw: number[] = [0.3, 1.2];
  let acc = 0;
  for (let i = 0; i < edl.ranges.length; i++) {
    const dur = edl.ranges[i].end - edl.ranges[i].start;
    if (dur > cfg.maxHoldSec) raw.push(acc + dur / 2);
    acc += dur;
    if (i < edl.ranges.length - 1) raw.push(acc - 0.3, acc + 0.3);
  }
  const seen = new Set<number>();
  const out: number[] = [];
  for (const t of raw.map((t) => Math.min(Math.max(t, 0), Math.max(0, total - 0.1))).sort((a, b) => a - b)) {
    const key = Math.round(t * 10); // dedupe at 0.1s resolution
    if (!seen.has(key)) { seen.add(key); out.push(Number(t.toFixed(2))); }
  }
  return out.slice(0, cap);
}

/** The narration text spoken around time t (±1.5s) — lets the eyes judge "does the visual match". */
function narrationAround(words: Word[], t: number): string {
  return words
    .filter((w) => w.type === "word" && typeof w.start === "number" && (w.start as number) > t - 1.5 && (w.start as number) < t + 1.5)
    .map((w) => (w.text ?? "").trim()).join(" ");
}

function buildWatchPrompt(edl: Edl, words: Word[], timestamps: number[]): string {
  const frameNotes = timestamps.map((t, i) => {
    const said = narrationAround(words, t);
    return `frame ${i + 1}: at ~${t}s${said ? ` (narration: "${said}")` : ""}`;
  }).join("\n");
  return (
    `You are reviewing a rendered 9:16 voiceover reel for TASTE problems a meter can't catch. ` +
    `You are given ${timestamps.length} frames sampled at critical moments (the opening, around each cut, long holds):\n${frameNotes}\n\n` +
    `Check ONLY for: (1) a dead/static stretch where nothing happens; (2) blurry/shaky/unusable footage; ` +
    `(3) a clip starting on a bad frame (mid-blur, hand over lens, black); (4) the subject cut off by the vertical crop; ` +
    `(5) a caption covering a face or the key action; (6) an opening too weak to stop the scroll; ` +
    `(7) a visual that clearly mismatches the narration next to it.\n` +
    `Only report what you can SEE in these frames. Be conservative — an empty list is a fine answer.\n` +
    `Return ONLY valid JSON: {"problems":[{"dimension":"footage|framing|captions|structure","check":"","severity":"important|minor","message":"what and roughly when (use the frame times)"}]}. At most ${MAX_PROBLEMS}.`
  );
}

/** Watch the rendered reel at taste-critical moments — ONE vision call. Failures degrade to []
 *  (the eyes must never break assembly). */
export async function watchReel(input: {
  reelPath: string; edl: Edl; words: Word[]; cfg?: Partial<CritiqueConfig>;
  sample?: FrameSampler;
  vision?: (prompt: string, imagesB64: string[]) => Promise<{ text: string }>;
}): Promise<CritiqueProblem[]> {
  const cfg = { ...CRITIQUE_DEFAULTS, ...(input.cfg ?? {}) };
  const sample = input.sample ?? sampleFrames;
  const vision = input.vision ?? (async (prompt: string, imagesB64: string[]) =>
    callChat([{ type: "text", text: prompt }, ...imagesB64.map(imagePart)],
      { model: WATCH_MODEL, maxTokens: 1500, reasoningEffort: "low", jsonObject: true, purpose: "watch" }));
  try {
    const timestamps = pickWatchTimestamps(input.edl, cfg);
    if (timestamps.length === 0) return [];
    const frames = await sample(input.reelPath, timestamps);
    const { text } = await vision(buildWatchPrompt(input.edl, input.words, timestamps), frames);
    const parsed = JSON.parse(text) as { problems?: unknown[] };
    return (Array.isArray(parsed.problems) ? parsed.problems : []).slice(0, MAX_PROBLEMS).map((raw): CritiqueProblem => {
      const p = raw as Record<string, unknown>;
      return {
        dimension: DIMENSIONS.has(p.dimension as RubricDimension) ? (p.dimension as RubricDimension) : "footage",
        check: typeof p.check === "string" && p.check ? p.check : "eyes-flag",
        severity: SEVERITIES.has(p.severity as Severity) ? (p.severity as Severity) : "minor",
        message: typeof p.message === "string" ? p.message : "",
      };
    });
  } catch (e) {
    console.warn(`[watch] eyes failed, continuing with meters only: ${String(e)}`);
    return [];
  }
}
