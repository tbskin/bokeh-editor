import { copyFile, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { prepareEdit, renderFromEdl } from "./assemble-reel";
import { critiqueReel, summarizeCritique, type CritiqueProblem, type Word } from "./critique";
import { watchReel } from "./watch";
import { verifyReel, type ReelProblem } from "./verify";
import { editorRuntime, type Runtime } from "./runtime";
import type { Edl } from "./edl";

export type LoopDeps = {
  prepare: (i: { workDir: string; onPhase?: (p: string) => void }) => Promise<{ voDuration: number; words: Word[] }>;
  render: (i: { workDir: string; quality?: "draft" | "preview" | "final"; onPhase?: (p: string) => void }) => Promise<{ reelPath: string; voDuration: number }>;
  critique: (i: { reelPath: string; edl: Edl; words: Word[] }) => Promise<CritiqueProblem[]>;
  watch: (i: { reelPath: string; edl: Edl; words: Word[] }) => Promise<CritiqueProblem[]>;
  verify: (reelPath: string, opts: { expectedDurationSec?: number }) => Promise<ReelProblem[]>;
};

const REAL_DEPS: LoopDeps = { prepare: prepareEdit, render: renderFromEdl, critique: critiqueReel, watch: watchReel, verify: verifyReel };

function buildInstruction(): string {
  return `Improve the draft using edit/critique.json. Prioritize critical and important problems. Re-time, replace or reorder existing segments; keep every range at least 1.2 seconds and avoid overlapping ranges from the same source. Preserve voiceover coverage and captions. Propose one bounded set of supported edit commands. Rendering and verification are performed by the application.`;
}

/** Assembly as an agent loop: deterministic draft first; the The editor agent iterates only when the
 *  draft fails the ship bar; deterministic fallback if the agent leaves the reel broken. */
export async function runAssembleLoop(input: {
  workDir: string;
  onPhase?: (p: string) => void;
  runtime?: Runtime;
  deps?: Partial<LoopDeps>;
}): Promise<{ reelPath: string }> {
  const phase = input.onPhase ?? (() => {});
  const runtime = input.runtime ?? editorRuntime;
  const d: LoopDeps = { ...REAL_DEPS, ...(input.deps ?? {}) };
  const editDir = join(input.workDir, "edit");

  // 1-2. Deterministic draft.
  const { voDuration, words } = await d.prepare({ workDir: input.workDir, onPhase: phase });
  const { reelPath } = await d.render({ workDir: input.workDir, quality: "draft", onPhase: phase });

  // 3. Judge: meters + eyes, written where the agent (and refine) can read it.
  phase("watching your cut");
  const edl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8")) as Edl;
  const problems = [
    ...(await d.critique({ reelPath, edl, words })),
    ...(await d.watch({ reelPath, edl, words })),
  ];
  const summary = summarizeCritique(problems);
  await writeFile(join(editDir, "critique.json"), JSON.stringify({ summary, problems }, null, 2));

  // 4. The deterministic cut already passes — no agent needed, no agent cost.
  if (summary.passesShipBar) return { reelPath };

  const baseDocument = await readFile(join(editDir, "document.v2.json")).catch(() => null);

  // 5. The loop: The editor fixes the EDL and re-renders, bounded by the recipe.
  phase("polishing the cut");
  try {
    await runtime.run({
      cwd: input.workDir,
      instruction: buildInstruction(),
      traceFile: join(input.workDir, "trace", `editor-assemble-${Date.now()}.jsonl`),
      reasoningEffort: "medium",
    });
    const critical = (await d.verify(join(editDir, "final.mp4"), { expectedDurationSec: voDuration }))
      .filter((p) => p.severity === "critical");
    if (critical.length) throw new Error(`agent output failed verification — ${critical.map((p) => p.message).join("; ")}`);

    // Re-judge the delivered cut so the on-disk record matches what ships (the agent's CLI calls
    // print to ITS stdout only). Refine and the closed loop read this file.
    const finalEdl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8")) as Edl;
    const finalProblems = [
      ...(await d.critique({ reelPath: join(editDir, "final.mp4"), edl: finalEdl, words })),
      ...(await d.watch({ reelPath: join(editDir, "final.mp4"), edl: finalEdl, words })),
    ];
    await writeFile(join(editDir, "critique.json"), JSON.stringify({ summary: summarizeCritique(finalProblems), problems: finalProblems }, null, 2));
    return { reelPath: join(editDir, "final.mp4") };
  } catch (e) {
    // 6. Fallback: the base cut is always shippable — restore and re-render it.
    console.warn(`[assemble-loop] agent failed (${String(e)}); falling back to the base cut`);
    phase("finishing up");
    await copyFile(join(editDir, "edl.base.json"), join(editDir, "edl.json"));
    if (baseDocument) await writeFile(join(editDir, "document.v2.json"), baseDocument);
    else await rm(join(editDir, "document.v2.json"), { force: true });
    const fallback = await d.render({ workDir: input.workDir, quality: "draft", onPhase: phase });
    const critical = (await d.verify(fallback.reelPath, { expectedDurationSec: voDuration }))
      .filter((p) => p.severity === "critical");
    if (critical.length) throw new Error(`assemble: reel failed verification — ${critical.map((p) => p.message).join("; ")}`);
    return { reelPath: fallback.reelPath };
  }
}
