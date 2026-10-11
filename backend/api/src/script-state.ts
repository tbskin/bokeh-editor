import { createHash } from "node:crypto";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseScriptMd } from "@ole/engine";

export const scriptRevision = (markdown: string): string =>
  createHash("sha256").update(markdown).digest("hex");

export async function readScriptState(workDir: string): Promise<{
  markdown: string;
  script: string;
  angle: string;
  targetSeconds: number;
  revision: string;
  generatedTake?: { durationSec?: number; revision?: string };
}> {
  const markdown = await readFile(join(workDir, "script.md"), "utf8");
  const parsed = parseScriptMd(markdown);
  const meta = await readFile(join(workDir, "vo.meta.json"), "utf8")
    .then(JSON.parse)
    .catch(() => null) as { via?: string; voSec?: number; scriptRevision?: string } | null;
  return {
    markdown,
    ...parsed,
    revision: scriptRevision(markdown),
    ...(meta?.via === "tts"
      ? { generatedTake: { durationSec: meta.voSec, revision: meta.scriptRevision } }
      : {}),
  };
}

/** Persist the teleprompter body without discarding its planning metadata. */
export async function updateScript(input: {
  workDir: string;
  script: string;
  expectedRevision: string;
}): Promise<{ revision: string; invalidatedGeneratedTake: boolean }> {
  const current = await readScriptState(input.workDir);
  if (current.revision !== input.expectedRevision) {
    const e = new Error("The script changed somewhere else. Reload it before saving again.") as Error & { code?: string };
    e.code = "script_revision_conflict";
    throw e;
  }
  const script = input.script.trim();
  if (!script) throw new Error("The script cannot be empty.");
  const markdown = `---\nangle: ${JSON.stringify(current.angle)}\ntargetSeconds: ${current.targetSeconds}\n---\n${script}`;
  const tmp = join(input.workDir, "script.md.next");
  await writeFile(tmp, markdown);
  await rename(tmp, join(input.workDir, "script.md"));

  // A generated take is tied to exact words. A recorded take remains the creator's source of truth.
  const invalidatedGeneratedTake = await invalidateGeneratedTake(input.workDir);
  return { revision: scriptRevision(markdown), invalidatedGeneratedTake };
}

/** Angle/regenerate paths rewrite script.md inside the engine, so they cannot use updateScript's
 * compare-and-swap. They still must discard narration tied to the words they just replaced. */
export async function invalidateGeneratedTake(workDir: string): Promise<boolean> {
  const metaPath = join(workDir, "vo.meta.json");
  const meta = await readFile(metaPath, "utf8").then(JSON.parse).catch(() => null) as { via?: string } | null;
  if (meta?.via !== "tts") return false;
  await Promise.all([
    rm(join(workDir, "vo.wav"), { force: true }),
    rm(metaPath, { force: true }),
    rm(join(workDir, "edit", "transcripts", "vo.json"), { force: true }),
  ]);
  return true;
}

export async function assertGeneratedTakeMatchesScript(workDir: string): Promise<void> {
  const meta = await readFile(join(workDir, "vo.meta.json"), "utf8").then(JSON.parse).catch(() => null) as
    { via?: string; scriptRevision?: string } | null;
  if (meta?.via !== "tts" || !meta.scriptRevision) return; // Legacy generated takes stay compatible.
  const state = await readScriptState(workDir);
  if (state.revision !== meta.scriptRevision) {
    const e = new Error("That generated voiceover belongs to an older script. Generate it again before assembling.") as Error & { code?: string };
    e.code = "stale_generated_voice";
    throw e;
  }
}
