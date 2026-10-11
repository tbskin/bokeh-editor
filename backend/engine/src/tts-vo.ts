// Cloned-voice voiceovers: synthesize the script in the creator's own ElevenLabs voice and land it
// on the exact same contracts the recorded path uses (vo.wav 16k mono, Whisper-shaped transcript),
// so everything downstream — anchors, music, SFX, captions — never knows the difference. The
// timestamps come from the API, so TTS takes skip Whisper AND the take-cleaner entirely.
import type { Word } from "./critique";

export type TtsAlignment = {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
};

/** ElevenLabs character alignment → the Whisper word shape the whole engine speaks. Pure. */
export function alignmentToWords(a: TtsAlignment): Word[] {
  const words: Word[] = [];
  let text = "";
  let start = 0;
  for (let i = 0; i < a.characters.length; i++) {
    const c = a.characters[i];
    if (/\s/.test(c)) {
      if (text) words.push({ type: "word", text, start, end: a.character_end_times_seconds[i - 1] });
      text = "";
      continue;
    }
    if (!text) start = a.character_start_times_seconds[i];
    text += c;
  }
  if (text) words.push({ type: "word", text, start, end: a.character_end_times_seconds[a.characters.length - 1] });
  return words;
}

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ffprobeDurationSec } from "./eyes";

const pExecFile = promisify(execFile);

export type TtsFetch = (url: string, init: { method: string; headers: Record<string, string>; body: string }) =>
  Promise<{ ok: boolean; status: number; text(): Promise<string>; json(): Promise<unknown> }>;

const ELEVEN_BASE = "https://api.elevenlabs.io";

/** Synthesize the script in the creator's cloned voice onto the recorded-path contracts. */
export async function synthesizeVo(input: {
  workDir: string; script: string; voiceId: string; apiKey: string; scriptRevision?: string; fetchImpl?: TtsFetch;
}): Promise<{ voSec: number; words: ReturnType<typeof alignmentToWords>; chars: number }> {
  const doFetch = input.fetchImpl ?? (fetch as unknown as TtsFetch);
  const url = `${ELEVEN_BASE}/v1/text-to-speech/${input.voiceId}/with-timestamps?output_format=pcm_16000`;
  const res = await doFetch(url, {
    method: "POST",
    headers: { "xi-api-key": input.apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ text: input.script, model_id: "eleven_multilingual_v2" }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    if (res.status === 404 || detail.includes("voice_not_found")) throw new Error(`tts: voice_not_found: ${detail}`);
    throw new Error(`We couldn't generate your voiceover just now — try again in a moment. (tts ${res.status})`);
  }
  const j = (await res.json()) as { audio_base64: string; alignment: TtsAlignment };
  const words = alignmentToWords(j.alignment);
  if (words.length === 0) throw new Error("We couldn't generate your voiceover just now — try again in a moment. (empty)");

  // Raw 16k mono s16le → the standard vo.wav container.
  const rawPath = join(input.workDir, "vo.tts.pcm");
  await writeFile(rawPath, Buffer.from(j.audio_base64, "base64"));
  await pExecFile("ffmpeg", ["-y", "-f", "s16le", "-ar", "16000", "-ac", "1", "-i", rawPath,
    "-c:a", "pcm_s16le", join(input.workDir, "vo.wav")]);
  await rm(rawPath, { force: true });

  const trDir = join(input.workDir, "edit", "transcripts");
  await mkdir(trDir, { recursive: true });
  await writeFile(join(trDir, "vo.json"), JSON.stringify({ words }, null, 2));
  const chars = input.script.length;
  const voSec = await ffprobeDurationSec(join(input.workDir, "vo.wav"));
  await writeFile(join(input.workDir, "vo.meta.json"),
    JSON.stringify({
      via: "tts", voiceId: input.voiceId, chars, generatedAt: new Date().toISOString(),
      ...(input.scriptRevision ? { scriptRevision: input.scriptRevision } : {}),
      voSec: Number(voSec.toFixed(2)),
    }, null, 2));
  return { voSec: Number(voSec.toFixed(2)), words, chars };
}

/** How this project's take was made. "recorded" when no meta (the default path). */
export async function voSource(workDir: string): Promise<"tts" | "recorded"> {
  try {
    const meta = JSON.parse(await readFile(join(workDir, "vo.meta.json"), "utf8")) as { via?: string };
    return meta.via === "tts" ? "tts" : "recorded";
  } catch { return "recorded"; }
}

/** Non-silent seconds in a wav (speech = duration − detected silence). Validates voice samples. */
export async function speechSeconds(wavPath: string): Promise<number> {
  const dur = await ffprobeDurationSec(wavPath);
  const { stderr } = await pExecFile("ffmpeg", ["-i", wavPath, "-af", "silencedetect=n=-35dB:d=0.5", "-f", "null", "-"], { maxBuffer: 16 * 1024 * 1024 });
  let silent = 0;
  for (const m of stderr.matchAll(/silence_duration:\s*([0-9.]+)/g)) silent += Number(m[1]);
  return Math.max(0, Number((dur - silent).toFixed(2)));
}
