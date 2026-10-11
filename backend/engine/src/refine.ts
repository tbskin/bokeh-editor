import { readFile, rm, stat } from "node:fs/promises";
import { join } from "node:path";
import { editorRuntime, type Runtime } from "./runtime";

/** The agent's closing summary from its trace — what it did, or why it couldn't. Surfaced to the
 *  user as the editor's chat reply; without it the app shows a one-sided conversation. */
async function lastAgentMessage(traceFile: string): Promise<string | undefined> {
  try {
    const lines = (await readFile(traceFile, "utf8")).trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const item = JSON.parse(lines[i])?.item;
        // Belt-and-braces on the prompt's "no paths, no markdown" reply contract: flatten any
        // markdown links (their targets are container paths, meaningless to the app user).
        if (item?.type === "agent_message" && typeof item.text === "string" && item.text.trim()) {
          return item.text.trim().replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
        }
      } catch { /* not JSON — skip */ }
    }
  } catch { /* no trace — no reply */ }
  return undefined;
}

/** The agent's total token usage from its trace's final turn (codex emits one turn.completed). */
export async function lastTurnUsage(traceFile: string): Promise<{ inputTokens: number; outputTokens: number } | undefined> {
  try {
    const lines = (await readFile(traceFile, "utf8")).trim().split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const e = JSON.parse(lines[i]);
        if (e?.type === "turn.completed" && typeof e.usage?.input_tokens === "number") {
          return { inputTokens: e.usage.input_tokens, outputTokens: e.usage.output_tokens ?? 0 };
        }
      } catch { /* not JSON — skip */ }
    }
  } catch { /* no trace */ }
  return undefined;
}

/**
 * Refine an existing cut in `workDir` (which holds AGENTS.md + edit/edl.json + edit/project.md +
 * edit/critique.json). Re-runs the agent with the user's instruction; it edits the EDL in place and
 * re-renders through the SAME render tool as the assembly loop — one render path (regrade +
 * render.py + loudnorm VO mux) no matter who asks.
 */
export async function refineJob(input: { workDir: string; message: string; runtime?: Runtime }) {
  const runtime = input.runtime ?? editorRuntime;
  const reelPath = join(input.workDir, "edit", "final.mp4");
  const traceFile = join(input.workDir, "trace", `editor-refine-${Date.now()}.jsonl`);
  const unsupportedFile = join(input.workDir, "edit", "unsupported.json");
  await rm(unsupportedFile, { force: true });
  // The agent can exit 0 having changed nothing (seen in prod: its sandbox failed on every
  // command and it politely gave up). "Done" must mean the reel actually changed.
  const before = await stat(reelPath).catch(() => null);
  await runtime.run({
    cwd: input.workDir,
    instruction: `Apply this request to the current cut: ${JSON.stringify(input.message)}. Preserve what the creator actually said. For talking-head edits, use retained candidates and word boundaries. If this cannot be expressed through supported edit commands, explain that limitation. Reply with one or two plain sentences about the visible change.`,
    traceFile,
    // Refine is genuinely open-ended but scoped to a small edit — medium is the right balance.
    reasoningEffort: "medium",
  });
  const reply = await lastAgentMessage(traceFile);
  const after = await stat(reelPath).catch(() => null);
  const unchanged = !after || !!(before && after.mtimeMs === before.mtimeMs && after.size === before.size);
  const unsupported = await readFile(unsupportedFile, "utf8").then(JSON.parse).catch(() => null) as { reason?: string } | null;
  if (unsupported && !unchanged) throw new Error("The editor marked this request unsupported after changing the reel.");
  if (unsupported && unchanged) {
    const explanation = reply ?? String(unsupported.reason ?? "That edit isn't supported yet.");
    return { reelPath, reply: explanation, unsupported: true as const };
  }
  if (unchanged) {
    // Include the agent's own explanation when it has one — "I couldn't do X because Y" beats a shrug.
    throw new Error(reply ? `That change didn't go through — the editor says: ${reply.slice(0, 300)}` : "The change didn't get applied — please try again.");
  }
  return { reelPath, reply, unsupported: false as const };
}
