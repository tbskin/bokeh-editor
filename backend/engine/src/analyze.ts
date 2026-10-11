import { writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { analyzeClip, ffprobeDurationSec, type ClipNotes } from "./eyes";

// API-bound now (the model call runs on OpenAI, not the CPU), so contention is a rate-limit concern,
// not a decode-thrash one. Still bounded, env-overridable.
const CONCURRENCY = Number(process.env.OLE_ANALYZE_CONCURRENCY ?? 8);

/** Understand every clip in workDir/clips via the eyes (one multimodal call per clip), then merge
 *  into analysis.json. Same output shape as before. A clip that fails twice is skipped, not fatal. */
export async function runAnalyzeJob(input: {
  workDir: string;
  context?: string; // the creator's own words about the footage (feelings, goals, outline)
  analyze?: typeof analyzeClip; // injectable for tests
  getDuration?: typeof ffprobeDurationSec; // injectable for tests (real ffprobe by default)
}): Promise<{ analysisPath: string }> {
  const analyze = input.analyze ?? analyzeClip;
  const getDuration = input.getDuration ?? ffprobeDurationSec;
  const clipsDir = join(input.workDir, "clips");
  const files = (await readdir(clipsDir).catch(() => [])).filter((f) => /\.(mov|mp4|m4v)$/i.test(f));
  await writeFile(join(input.workDir, "brief.json"), JSON.stringify({ context: input.context ?? null }, null, 2));

  const analyzeOne = async (file: string): Promise<ClipNotes | null> => {
    const clipPath = join(clipsDir, file);
    const fileLabel = `clips/${file}`;
    const run = async () => {
      const durationSec = await getDuration(clipPath);
      const { notes } = await analyze({ clipPath, fileLabel, context: input.context, durationSec });
      return notes;
    };
    try {
      return await run();
    } catch {
      try { return await run(); } catch { return null; }
    }
  };

  const clips: ClipNotes[] = [];
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(analyzeOne));
    for (const r of results) if (r) clips.push(r);
  }

  // Per-clip failures are skipped (footage variety), but ALL clips failing means the eyes are down
  // or the footage is unreadable — continuing would hand Plan an empty world and fail cryptically
  // downstream (seen in prod). Fail here, with a message worth showing.
  if (files.length > 0 && clips.length === 0) {
    throw new Error("analyze: none of the clips could be analyzed — try again in a minute");
  }

  const analysis = { summary: `Analyzed ${clips.length} clip(s).`, clips };
  await writeFile(join(input.workDir, "analysis.json"), JSON.stringify(analysis, null, 2));
  return { analysisPath: join(input.workDir, "analysis.json") };
}
