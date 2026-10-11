import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertGeneratedTakeMatchesScript, invalidateGeneratedTake, readScriptState, updateScript } from "../src/script-state";

const exists = (path: string) => stat(path).then(() => true).catch(() => false);
async function workspace() {
  const dir = await mkdtemp(join(tmpdir(), "ole-script-state-"));
  await mkdir(join(dir, "edit", "transcripts"), { recursive: true });
  await writeFile(join(dir, "script.md"), '---\nangle: "A practical test"\ntargetSeconds: 35\n---\nOld exact words.');
  return dir;
}

describe("server-authoritative script revisions", () => {
  it("persists the creator's exact teleprompter text and rejects stale saves", async () => {
    const dir = await workspace();
    const before = await readScriptState(dir);
    const saved = await updateScript({ workDir: dir, script: "These are my edited exact words.", expectedRevision: before.revision });
    const after = await readScriptState(dir);
    expect(after.script).toBe("These are my edited exact words.");
    expect(after.angle).toBe("A practical test");
    expect(after.targetSeconds).toBe(35);
    expect(saved.revision).toBe(after.revision);
    await expect(updateScript({ workDir: dir, script: "Stale overwrite", expectedRevision: before.revision })).rejects.toMatchObject({ code: "script_revision_conflict" });
  });

  it("invalidates generated narration from an older script but leaves a recorded take alone", async () => {
    const generated = await workspace();
    const old = await readScriptState(generated);
    await writeFile(join(generated, "vo.wav"), "tts");
    await writeFile(join(generated, "vo.meta.json"), JSON.stringify({ via: "tts", scriptRevision: old.revision, voSec: 4 }));
    await writeFile(join(generated, "edit", "transcripts", "vo.json"), "{}");
    const out = await updateScript({ workDir: generated, script: "New generated words.", expectedRevision: old.revision });
    expect(out.invalidatedGeneratedTake).toBe(true);
    expect(await exists(join(generated, "vo.wav"))).toBe(false);
    expect(await exists(join(generated, "vo.meta.json"))).toBe(false);

    const recorded = await workspace();
    const recordedState = await readScriptState(recorded);
    await writeFile(join(recorded, "vo.wav"), "recorded");
    await writeFile(join(recorded, "vo.meta.json"), JSON.stringify({ via: "recorded" }));
    await updateScript({ workDir: recorded, script: "Edited prompt only.", expectedRevision: recordedState.revision });
    expect(await readFile(join(recorded, "vo.wav"), "utf8")).toBe("recorded");
  });

  it("blocks assembly when a generated take revision no longer matches", async () => {
    const dir = await workspace();
    const state = await readScriptState(dir);
    await writeFile(join(dir, "vo.meta.json"), JSON.stringify({ via: "tts", scriptRevision: state.revision, voSec: 3 }));
    await expect(assertGeneratedTakeMatchesScript(dir)).resolves.toBeUndefined();
    await writeFile(join(dir, "script.md"), '---\nangle: "A practical test"\ntargetSeconds: 35\n---\nChanged behind the take.');
    await expect(assertGeneratedTakeMatchesScript(dir)).rejects.toMatchObject({ code: "stale_generated_voice" });
  });

  it("invalidates generated narration after an engine-owned angle rewrite", async () => {
    const dir = await workspace();
    const state = await readScriptState(dir);
    await writeFile(join(dir, "vo.wav"), "tts");
    await writeFile(join(dir, "vo.meta.json"), JSON.stringify({ via: "tts", scriptRevision: state.revision }));
    await writeFile(join(dir, "script.md"), '---\nangle: "A new angle"\ntargetSeconds: 35\n---\nEngine-rewritten words.');
    await expect(invalidateGeneratedTake(dir)).resolves.toBe(true);
    expect(await exists(join(dir, "vo.wav"))).toBe(false);
    expect((await readScriptState(dir)).script).toBe("Engine-rewritten words.");
  });
});
