import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { editorRuntime, type Runtime } from "./runtime";
import { parseScriptMd } from "./plan";
import { scriptCriticPass } from "./script-critic";

export async function reviseVoiceoverScript(input: { workDir: string; message: string; runtime?: Runtime; critic?: typeof scriptCriticPass }): Promise<{ script: string; summary: string }> {
  const current = parseScriptMd(await readFile(join(input.workDir, "script.md"), "utf8"));
  // The revision writes in the SAME voice the generation doctrine defines — this path shipped a
  // clip-inventory rewrite while it was the one doctrine-free, gate-free way to change a script.
  const recipe = await readFile(new URL("../recipe/plan-reel.md", import.meta.url), "utf8").catch(() => "");
  // Script edits happen BEFORE any assemble on a script-ready project, so edit/ may not exist yet
  // (a chat revision ENOENT'd on exactly that state once).
  await mkdir(join(input.workDir, "edit"), { recursive: true });
  const output = join(input.workDir, "edit", "script-revision.json");
  await writeFile(output, "");
  await (input.runtime ?? editorRuntime).run({
    cwd: input.workDir,
    task: "script",
    traceFile: join(input.workDir, "trace", `editor-script-revision-${Date.now()}.jsonl`),
    reasoningEffort: "medium",
    instruction: `Revise the current voiceover script in response to this creator request: ${JSON.stringify(input.message)}. Read script.md, plan.json, and analysis.json. Preserve the creator's actual facts; do not invent events or claims. Apply the creator's request, but the revised script must still follow the voiceover doctrine below — its writing process (frame, but/so chaining, takes, legible lines, close) and hard rails govern every revision; never answer feedback by listing the footage.\n\n--- VOICEOVER DOCTRINE ---\n${recipe}\n--- END DOCTRINE ---\n\nWrite ONLY JSON to edit/script-revision.json with {"script":"the complete revised narration","summary":"one plain sentence explaining what changed"}. Do not edit script.md or any other file.`,
  });
  const result = JSON.parse(await readFile(output, "utf8")) as { script?: string; summary?: string };
  const script = result.script?.trim() ?? "";
  if (!script) throw new Error("The editor didn't return a revised script.");
  if (script === current.script.trim()) throw new Error(result.summary || "That request didn't change the script.");

  // The same gate generation faces — revisions were the ungated path until one shipped a failure.
  const plan = JSON.parse(await readFile(join(input.workDir, "plan.json"), "utf8").catch(() => "{}")) as { title?: string };
  const brief = JSON.parse(await readFile(join(input.workDir, "brief.json"), "utf8").catch(() => "{}")) as { context?: string | null };
  const analysis = JSON.parse(await readFile(join(input.workDir, "analysis.json"), "utf8").catch(() => "{}")) as { clips?: unknown[] };
  const gated = await (input.critic ?? scriptCriticPass)({
    workDir: input.workDir, script, title: plan.title ?? "",
    context: brief.context ?? undefined, targetSeconds: current.targetSeconds,
    clipCount: Array.isArray(analysis.clips) ? analysis.clips.length : undefined, recipe,
  });
  return { script: gated.script, summary: result.summary?.trim() || "Revised the script." };
}
