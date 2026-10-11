import { describe, it, expect, vi } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAssembleLoop } from "../src/assemble-loop";
import type { CritiqueProblem } from "../src/critique";

const IMPORTANT: CritiqueProblem = { dimension: "pacing", check: "max-hold", severity: "important", message: "clip 0 holds too long" };

async function tempWork(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "ole-loop-"));
  await mkdir(join(dir, "edit"), { recursive: true });
  // Both files exist after a real prepareEdit; the loop reads edl.json and falls back to edl.base.json.
  const baseEdl = JSON.stringify({ version: 1, sources: {}, ranges: [], grade: "", overlays: [], total_duration_s: 5 });
  await writeFile(join(dir, "edit", "edl.json"), baseEdl);
  await writeFile(join(dir, "edit", "edl.base.json"), baseEdl);
  return dir;
}

function deps(overrides: Record<string, unknown> = {}) {
  return {
    prepare: vi.fn(async () => ({ voDuration: 5, words: [] })),
    render: vi.fn(async ({ workDir }: { workDir: string }) => ({ reelPath: join(workDir, "edit", "final.mp4"), voDuration: 5 })),
    critique: vi.fn(async () => [] as CritiqueProblem[]),
    watch: vi.fn(async () => [] as CritiqueProblem[]),
    verify: vi.fn(async () => []),
    ...overrides,
  };
}

describe("runAssembleLoop", () => {
  it("skips the agent entirely when the draft passes the ship bar", async () => {
    const workDir = await tempWork();
    const d = deps();
    const runtime = { run: vi.fn(async () => {}) };
    const { reelPath } = await runAssembleLoop({ workDir, runtime, deps: d });
    expect(runtime.run).not.toHaveBeenCalled();
    expect(reelPath).toBe(join(workDir, "edit", "final.mp4"));
    const critique = JSON.parse(await readFile(join(workDir, "edit", "critique.json"), "utf8"));
    expect(critique.summary.passesShipBar).toBe(true);
  });

  it("dispatches the agent when the draft fails the ship bar", async () => {
    const workDir = await tempWork();
    const d = deps({ critique: vi.fn(async () => [IMPORTANT]) });
    const runtime = { run: vi.fn(async (_opts: { instruction: string }) => {}) };
    await runAssembleLoop({ workDir, runtime, deps: d });
    expect(runtime.run).toHaveBeenCalledOnce();
    const instruction = runtime.run.mock.calls[0][0].instruction;
    expect(instruction).toContain("edit/critique.json");
    expect(instruction).toContain("one bounded set");
  });

  it("falls back to the base EDL when the agent leaves the reel broken", async () => {
    const workDir = await tempWork();
    // First verify (post-agent) reports a critical; after fallback it's clean.
    const verify = vi.fn(async (): Promise<{ severity: string; message: string }[]> => [])
      .mockImplementationOnce(async () => [{ severity: "critical", message: "no video" }]);
    const d = deps({ critique: vi.fn(async () => [IMPORTANT]), verify });
    // The "agent" mangles the cut — fallback must restore the base copy over it.
    const runtime = { run: vi.fn(async () => {
      await writeFile(join(workDir, "edit", "edl.json"), JSON.stringify({ version: 1, sources: {}, ranges: [], grade: "", overlays: [], total_duration_s: 999 }));
    }) };
    await runAssembleLoop({ workDir, runtime, deps: d });
    // fallback restored the base EDL over edl.json and re-rendered
    const edl = JSON.parse(await readFile(join(workDir, "edit", "edl.json"), "utf8"));
    expect(edl.total_duration_s).toBe(5);
    expect(d.render).toHaveBeenCalledTimes(2); // draft + fallback re-render
  });

  it("falls back when the runtime itself throws", async () => {
    const workDir = await tempWork();
    const d = deps({ critique: vi.fn(async () => [IMPORTANT]) });
    const runtime = { run: vi.fn(async () => { throw new Error("codex died"); }) };
    const { reelPath } = await runAssembleLoop({ workDir, runtime, deps: d });
    expect(reelPath).toBe(join(workDir, "edit", "final.mp4"));
    expect(d.render).toHaveBeenCalledTimes(2);
  });

  it("throws only when even the fallback render is broken", async () => {
    const workDir = await tempWork();
    const verify = vi.fn(async () => [{ severity: "critical", message: "no video" }]);
    const d = deps({ critique: vi.fn(async () => [IMPORTANT]), verify });
    const runtime = { run: vi.fn(async () => {}) };
    await expect(runAssembleLoop({ workDir, runtime, deps: d })).rejects.toThrow(/no video/);
  });
});
