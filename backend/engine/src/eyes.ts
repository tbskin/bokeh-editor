import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { trackAiGeneration } from "./telemetry";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pExecFile = promisify(execFile);

const EYES_MODEL = process.env.OLE_EYES_MODEL ?? "gpt-5-mini";
const NFRAMES = 5;
const FRAME_WIDTH = 512;

export type Segment = {
  start: number; end: number; description: string;
  subjects: string[]; motion: string; quality: string; tags: string[];
  implies?: string; // second-order: what this moment could MEAN in a story, not what it shows
};
export type ClipNotes = { file: string; durationSec: number; segments: Segment[] };

export type VisionCall = (prompt: string, imagesB64: string[]) => Promise<{ text: string; inputTokens: number; outputTokens: number }>;
export type FrameSampler = (clipPath: string, timestamps: number[]) => Promise<string[]>;

export type ChatPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export const imagePart = (b64: string): ChatPart => ({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}` } });

// Transient upstream weather (429/5xx/network) gets a couple of retries with backoff — one OpenAI
// blip must not fail a whole prep. 4xx (except 429) means OUR request is wrong: fail fast.
const CHAT_ATTEMPTS = 3;
const BACKOFF_MS = () => Number(process.env.OLE_CHAT_BACKOFF_MS ?? 1500);

/** One OpenAI chat/completions call with interleaved text+image content. Shared by the eyes and the
 *  direct Plan. Throws on missing key, non-retryable non-2xx, empty completion, or retries exhausted. */
export async function callChat(
  content: ChatPart[],
  opts: { model?: string; maxTokens?: number; reasoningEffort?: string; jsonObject?: boolean; purpose?: string; systemPrompt?: string } = {},
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("callChat: OPENAI_API_KEY not set");
  const body: Record<string, unknown> = {
    model: opts.model ?? "gpt-5-mini",
    messages: [...(opts.systemPrompt ? [{ role: "developer", content: opts.systemPrompt }] : []), { role: "user", content }],
    max_completion_tokens: opts.maxTokens ?? 2000,
  };
  if (opts.reasoningEffort) body.reasoning_effort = opts.reasoningEffort;
  if (opts.jsonObject) body.response_format = { type: "json_object" };
  const startedAt = Date.now();
  let grewBudget = false;

  for (let attempt = 1; ; attempt++) {
    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: AbortSignal.timeout(180_000),
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt >= CHAT_ATTEMPTS) throw e;
      await new Promise((r) => setTimeout(r, attempt * BACKOFF_MS()));
      continue;
    }
    if (!res.ok) {
      const detail = `callChat: ${res.status}: ${(await res.text()).slice(0, 300)}`;
      if ((res.status === 429 || res.status >= 500) && attempt < CHAT_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * BACKOFF_MS()));
        continue;
      }
      throw new Error(detail);
    }
    const j = (await res.json()) as any;
    const choice = j.choices?.[0];
    const text = choice?.message?.content;
    if (!text) {
      // Reasoning models spend max_completion_tokens on thinking FIRST; if the budget ran out
      // before any visible output, retry once with double the room rather than failing the job.
      if (choice?.finish_reason === "length" && !grewBudget) {
        grewBudget = true;
        body.max_completion_tokens = Number(body.max_completion_tokens) * 2;
        console.warn(`callChat(${opts.purpose ?? "chat"}): finish=length with empty output — retrying with max_completion_tokens=${body.max_completion_tokens}`);
        continue;
      }
      throw new Error(`callChat: empty completion (finish=${choice?.finish_reason})`);
    }
    trackAiGeneration({
      model: String(body.model), provider: "openai",
      inputTokens: j.usage?.prompt_tokens ?? 0, outputTokens: j.usage?.completion_tokens ?? 0,
      latencyMs: Date.now() - startedAt, purpose: opts.purpose ?? "chat",
    });
    return { text, inputTokens: j.usage.prompt_tokens, outputTokens: j.usage.completion_tokens };
  }
}

/** Evenly-spaced sample points across a clip: (i + 0.5)/n of the duration. Pure. */
export function frameTimestamps(durationSec: number, n = NFRAMES): number[] {
  if (durationSec <= 0 || n <= 0) return [];
  return Array.from({ length: n }, (_, i) => Number((durationSec * (i + 0.5) / n).toFixed(2)));
}

export async function ffprobeDurationSec(path: string): Promise<number> {
  const { stdout } = await pExecFile("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", path,
  ]);
  return parseFloat(stdout.trim());
}

/** Real frame sampler: one downscaled JPEG per timestamp, returned as base64. */
export const sampleFrames: FrameSampler = async (clipPath, timestamps) => {
  const dir = await mkdtemp(join(tmpdir(), "ole-eyes-"));
  try {
    const out: string[] = [];
    for (const [i, t] of timestamps.entries()) {
      const f = join(dir, `f${i}.jpg`);
      await pExecFile("ffmpeg", ["-y", "-ss", String(t), "-i", clipPath,
        "-frames:v", "1", "-vf", `scale=${FRAME_WIDTH}:-2`, "-q:v", "5", f]);
      out.push((await readFile(f)).toString("base64"));
    }
    return out;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

/** Real vision call: OpenAI chat/completions with inline JPEG frames. */
const openaiVision: VisionCall = async (prompt, imagesB64) =>
  callChat([{ type: "text", text: prompt }, ...imagesB64.map(imagePart)], {
    model: EYES_MODEL, maxTokens: 2000, reasoningEffort: "low", jsonObject: true, purpose: "analyze",
  });

/** Exported so the dev analysis viewer can show the LIVE prompt the eyes run with (never a copy). */
export function buildPrompt(fileLabel: string, durationSec: number, timestamps: number[], context?: string): string {
  const ts = timestamps.map((t) => `~${t}s`).join(", ");
  const lens = context
    ? `The creator told us about this footage, in their own words: "${context}"\n` +
      `Read the clip THROUGH that context: bias descriptions, tags, and especially "implies" toward what ` +
      `each moment means in THEIR story — their stated feelings, goals, and plans. The context is a lens, ` +
      `not ground truth about pixels: describe only what is actually visible (it may mention things this ` +
      `clip doesn't show), and never invent visual content to match it.\n`
    : "";
  return (
    `You are analyzing ONE short video clip for a vertical short-form reel.\n${lens}` +
    `You are given ${timestamps.length} frames sampled evenly across the clip's ${durationSec.toFixed(2)}s duration (at ${ts}).\n` +
    `Identify the clip's distinct USABLE SEGMENTS (moments usable at different points in a reel).\n` +
    `For each segment ALSO give "implies": the second-order reading — what this moment could MEAN or ` +
    `represent in a first-person story (the feeling, stakes, or subtext a writer could use), not its ` +
    `literal contents. e.g. staring at a menu implies being new/overwhelmed; a long communal street ` +
    `table implies being welcomed into something; packing a bag implies a decision already made.\n` +
    `Return ONLY valid JSON of this exact shape: {"file":"${fileLabel}","durationSec":${durationSec.toFixed(3)},` +
    `"segments":[{"start":0,"end":0,"description":"","implies":"","subjects":[],"motion":"","quality":"","tags":[]}]}. Prefer 1-4 segments.`
  );
}

export async function analyzeClip(args: {
  clipPath: string; fileLabel: string; context?: string; durationSec: number;
  sample?: FrameSampler; vision?: VisionCall;
}): Promise<{ notes: ClipNotes; inputTokens: number; outputTokens: number }> {
  const sample = args.sample ?? sampleFrames;
  const vision = args.vision ?? openaiVision;
  const timestamps = frameTimestamps(args.durationSec);
  const images = await sample(args.clipPath, timestamps);
  const prompt = buildPrompt(args.fileLabel, args.durationSec, timestamps, args.context);
  const { text, inputTokens, outputTokens } = await vision(prompt, images);
  const notes = JSON.parse(text) as ClipNotes;
  // Trust our own duration/file label over the model's.
  notes.file = args.fileLabel;
  notes.durationSec = args.durationSec;
  return { notes, inputTokens, outputTokens };
}
