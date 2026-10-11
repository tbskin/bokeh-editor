import { describe, it, expect } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { refineJob, lastTurnUsage } from "../src/refine";

async function workDirWithReel(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ole-refine-"));
  await mkdir(join(dir, "edit"), { recursive: true });
  await writeFile(join(dir, "edit", "final.mp4"), "original reel bytes");
  return dir;
}

type RunOpts = { traceFile?: string };
const traceLine = (text: string) => JSON.stringify({ type: "item.completed", item: { type: "agent_message", text } }) + "\n";
const usageLine = (input: number, output: number) =>
  JSON.stringify({ type: "turn.completed", usage: { input_tokens: input, cached_input_tokens: 0, output_tokens: output } }) + "\n";

describe("refineJob", () => {
  it("fails loudly when the agent exits without changing the reel (prod sandbox failure looked like success)", async () => {
    const workDir = await workDirWithReel();
    const runtime = { run: async () => { /* agent did nothing — e.g. bwrap failed on every command */ } };
    await expect(refineJob({ workDir, message: "tighten the intro", runtime })).rejects.toThrow(/didn't get applied/i);
  });

  it("surfaces the agent's own explanation when it changed nothing", async () => {
    const workDir = await workDirWithReel();
    const runtime = { run: async (opts: RunOpts) => {
      await mkdir(join(workDir, "trace"), { recursive: true });
      await writeFile(opts.traceFile!, traceLine("I can't cut the voice track directly — ask me to tighten instead."));
    } };
    await expect(refineJob({ workDir, message: "remove the audio gap", runtime }))
      .rejects.toThrow(/the editor says: I can't cut the voice track/i);
  });

  it("extracts the agent's token usage from the trace (for cost tracking)", async () => {
    const workDir = await workDirWithReel();
    await mkdir(join(workDir, "trace"), { recursive: true });
    const trace = join(workDir, "trace", "t.jsonl");
    await writeFile(trace, traceLine("working") + usageLine(316572, 5480));
    expect(await lastTurnUsage(trace)).toEqual({ inputTokens: 316572, outputTokens: 5480 });
    await writeFile(trace, traceLine("no usage event"));
    expect(await lastTurnUsage(trace)).toBeUndefined();
  });

  it("resolves with the agent's reply when it re-rendered the reel", async () => {
    const workDir = await workDirWithReel();
    const runtime = { run: async (opts: RunOpts) => {
      await mkdir(join(workDir, "trace"), { recursive: true });
      await writeFile(opts.traceFile!, traceLine("Thinking about the cut.") + traceLine("Tightened the intro and re-rendered."));
      await writeFile(join(workDir, "edit", "final.mp4"), "new, refined reel bytes!");
    } };
    const { reelPath, reply } = await refineJob({ workDir, message: "tighten the intro", runtime });
    expect(reelPath).toBe(join(workDir, "edit", "final.mp4"));
    expect(reply).toBe("Tightened the intro and re-rendered.");
  });

  it("returns an honest unsupported result without pretending the reel changed", async () => {
    const workDir = await workDirWithReel();
    const runtime = { run: async (opts: RunOpts) => {
      await mkdir(join(workDir, "trace"), { recursive: true });
      await writeFile(opts.traceFile!, traceLine("I can't remove a background in this editor yet."));
      await writeFile(join(workDir, "edit", "unsupported.json"), JSON.stringify({ reason: "Background removal isn't supported yet." }));
    } };
    const result = await refineJob({ workDir, message: "remove the background", runtime });
    expect(result.unsupported).toBe(true);
    expect(result.reply).toMatch(/can't remove a background/i);
    expect(await (await import("node:fs/promises")).readFile(join(workDir, "edit", "final.mp4"), "utf8"))
      .toBe("original reel bytes");
  });
});
