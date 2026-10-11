import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { CritiqueProblem } from "./critique";

const pExecFile = promisify(execFile);

export type ReelProbe = { hasVideo: boolean; hasAudio: boolean; width: number; height: number; colorTransfer: string; durationSec: number };
export type ReelProblem = { severity: "critical" | "warn"; message: string };

// SDR transfers (or unset) are fine; PQ/HLG mean HDR wasn't tonemapped.
const HDR_TRANSFERS = new Set(["smpte2084", "arib-std-b67"]);

export async function probeReel(path: string): Promise<ReelProbe> {
  const { stdout } = await pExecFile("ffprobe", [
    "-v", "error", "-show_entries",
    "stream=codec_type,width,height,color_transfer:format=duration",
    "-of", "json", path,
  ]);
  const j = JSON.parse(stdout) as { streams?: any[]; format?: { duration?: string } };
  const streams = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === "video");
  return {
    hasVideo: !!v,
    hasAudio: streams.some((s) => s.codec_type === "audio"),
    width: v?.width ?? 0,
    height: v?.height ?? 0,
    colorTransfer: v?.color_transfer ?? "",
    durationSec: parseFloat(j.format?.duration ?? "0") || 0,
  };
}

/** The ONE set of file-integrity checks, in the rubric's vocabulary. critiqueReel composes these
 *  into the ship bar; verifyReel maps them onto its own gate policy. Pure over a probe. */
export function checkIntegrity(info: ReelProbe, opts: { expectedDurationSec?: number } = {}): CritiqueProblem[] {
  const problems: CritiqueProblem[] = [];
  if (!info.hasVideo) problems.push({ dimension: "integrity", check: "no-video", severity: "critical", message: "reel has no video stream" });
  if (!info.hasAudio) problems.push({ dimension: "voice", check: "no-audio", severity: "critical", message: "reel has no audio (voiceover missing)" });
  if (info.hasVideo && info.height <= info.width) problems.push({ dimension: "framing", check: "not-vertical", severity: "critical", message: `reel is not vertical (${info.width}x${info.height})` });
  if (HDR_TRANSFERS.has(info.colorTransfer)) problems.push({ dimension: "color", check: "hdr-not-tonemapped", severity: "critical", message: `HDR transfer "${info.colorTransfer}" not tonemapped (over-exposed risk)`, fixHint: "apply the HDR->SDR tonemap chain" });
  if (opts.expectedDurationSec && info.durationSec > 0 && Math.abs(info.durationSec - opts.expectedDurationSec) > 1.5) {
    problems.push({ dimension: "length", check: "duration-off", severity: "minor", message: `reel duration ${info.durationSec.toFixed(1)}s vs expected ~${opts.expectedDurationSec.toFixed(1)}s` });
  }
  return problems;
}

// verifyReel's gate policy: these break the FILE and block delivery outright; everything else
// (HDR look, duration drift) is a warning — the ship bar in critique.ts holds the quality line.
const GATE_CRITICAL = new Set(["no-video", "no-audio", "not-vertical"]);

/** Deterministic sanity check on the finished reel. Critical problems mean the render is broken and
 *  should not ship; warnings are logged. No model call — this is a meter. */
export async function verifyReel(
  reelPath: string,
  opts: { expectedDurationSec?: number; probe?: (p: string) => Promise<ReelProbe> } = {},
): Promise<ReelProblem[]> {
  const info = await (opts.probe ?? probeReel)(reelPath);
  return checkIntegrity(info, { expectedDurationSec: opts.expectedDurationSec }).map((p) => ({
    severity: GATE_CRITICAL.has(p.check) ? "critical" as const : "warn" as const,
    message: p.message,
  }));
}
