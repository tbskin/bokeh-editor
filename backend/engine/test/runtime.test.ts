import { describe, it, expect, vi } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { refineJob } from "../src/refine";
import type { Runtime } from "../src/runtime";

describe("Runtime is swappable", () => {
  it("refineJob drives the injected runtime, not Codex", async () => {
    const work = await mkdtemp(join(tmpdir(), "ole-rt-"));
    await mkdir(join(work, "edit"), { recursive: true });
    await writeFile(join(work, "edit", "edl.json"), JSON.stringify({ sequence: [] }));
    await writeFile(join(work, "edit", "project.md"), "# project");
    // A fake runtime that writes the refined output itself — proves Codex was not called.
    const fake: Runtime = {
      run: vi.fn(async (opts) => {
        await writeFile(join(opts.cwd, "edit", "final.mp4"), "fake-mp4");
      }),
    };
    const out = await refineJob({ workDir: work, message: "make it punchier", runtime: fake });
    expect(fake.run).toHaveBeenCalledOnce();
    expect(out.reelPath).toBe(join(work, "edit", "final.mp4"));
  });
});
