import { describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beginEditCheckpoint, canUndoEdit, commitEditCheckpoint, rollbackEditCheckpoint, undoLastEdit, withEditCheckpoint, withUndoCheckpoint } from "../src/checkpoints";

async function workspace() {
  const dir = await mkdtemp(join(tmpdir(), "ole-checkpoint-"));
  await mkdir(join(dir, "edit"), { recursive: true });
  await writeFile(join(dir, "edit", "final.mp4"), "current");
  await writeFile(join(dir, "edit", "document.v2.json"), "v1");
  return dir;
}

describe("transactional edit checkpoints", () => {
  it("rolls every mutable edit input and output back after a failed edit", async () => {
    const dir = await workspace();
    await beginEditCheckpoint(dir);
    await writeFile(join(dir, "edit", "final.mp4"), "broken");
    await writeFile(join(dir, "edit", "document.v2.json"), "broken-doc");
    await rollbackEditCheckpoint(dir);
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("current");
    expect(await readFile(join(dir, "edit", "document.v2.json"), "utf8")).toBe("v1");
    expect(await canUndoEdit(dir)).toBe(false);
  });

  it("retains exactly one successful previous state and consumes it on undo", async () => {
    const dir = await workspace();
    await beginEditCheckpoint(dir);
    await writeFile(join(dir, "edit", "final.mp4"), "edited-once");
    await commitEditCheckpoint(dir);
    expect(await canUndoEdit(dir)).toBe(true);
    await undoLastEdit(dir);
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("current");
    expect(await canUndoEdit(dir)).toBe(false);
    await expect(undoLastEdit(dir)).rejects.toThrow(/isn't a previous/);
  });

  it("replaces the undo checkpoint after the next successful edit instead of creating history", async () => {
    const dir = await workspace();
    await beginEditCheckpoint(dir);
    await writeFile(join(dir, "edit", "final.mp4"), "edited-once");
    await commitEditCheckpoint(dir);
    await beginEditCheckpoint(dir);
    await writeFile(join(dir, "edit", "final.mp4"), "edited-twice");
    await commitEditCheckpoint(dir);
    await undoLastEdit(dir);
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("edited-once");
  });

  it("rolls the reel and edit document back when a HyperFrames render fails", async () => {
    const dir = await workspace();
    await expect(withEditCheckpoint(dir, async () => {
      await writeFile(join(dir, "edit", "final.mp4"), "partially-composited");
      await writeFile(join(dir, "edit", "document.v2.json"), "motion-edit");
      throw new Error("Motion graphic render did not preserve alpha.");
    })).rejects.toThrow(/alpha/);
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("current");
    expect(await readFile(join(dir, "edit", "document.v2.json"), "utf8")).toBe("v1");
    expect(await canUndoEdit(dir)).toBe(false);
  });

  it("keeps both the current reel and undo availability when durable undo upload fails", async () => {
    const dir = await workspace();
    await beginEditCheckpoint(dir);
    await writeFile(join(dir, "edit", "final.mp4"), "edited");
    await commitEditCheckpoint(dir);
    await expect(withUndoCheckpoint(dir, async () => { throw new Error("storage unavailable"); })).rejects.toThrow(/storage/);
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("edited");
    expect(await canUndoEdit(dir)).toBe(true);
    await withUndoCheckpoint(dir, async () => {});
    expect(await readFile(join(dir, "edit", "final.mp4"), "utf8")).toBe("current");
    expect(await canUndoEdit(dir)).toBe(false);
  });
});
