import { describe, expect, it } from "vitest";
import { mkdtemp, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reviseVoiceoverScript } from "../src/revise-script";
import type { Runtime } from "../src/runtime";

describe("reviseVoiceoverScript", () => {
  it("works on a script-ready project where edit/ doesn't exist yet (chat revisions ENOENT'd there)", async () => {
    const work = await mkdtemp(join(tmpdir(), "revise-"));
    await writeFile(join(work, "script.md"), `---\nangle: "a"\ntargetSeconds: 20\n---\nThe old script.`);
    const runtime: Runtime = {
      run: async () => {
        await writeFile(join(work, "edit", "script-revision.json"),
          JSON.stringify({ script: "The new script.", summary: "Rewrote it." }));
      },
    };
    const out = await reviseVoiceoverScript({ workDir: work, message: "make it new", runtime });
    expect(out).toEqual({ script: "The new script.", summary: "Rewrote it." });
    expect(await readFile(join(work, "edit", "script-revision.json"), "utf8")).toContain("The new script.");
  });
});
