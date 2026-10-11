import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdtemp, mkdir, readFile, writeFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

vi.mock("../src/eyes", async (original) => ({
  ...(await original<typeof import("../src/eyes")>()),
  callChat: vi.fn(), ffprobeDurationSec: vi.fn(async () => 10),
}));
vi.mock("../src/assemble-reel", () => ({ renderFromEdl: vi.fn() }));
vi.mock("../src/verify", () => ({ verifyReel: vi.fn(async () => []) }));
import { runAgent } from "../src/harness";
import { callChat } from "../src/eyes";
import { renderFromEdl } from "../src/assemble-reel";
import { fromV1 } from "../src/edit-document";

const dirs: string[] = [];
afterEach(async () => { vi.clearAllMocks(); await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true }))); });
async function fixture() {
  const root = await realpath(await mkdtemp(join(tmpdir(), "bokeh-edit-"))); dirs.push(root);
  await mkdir(join(root, "edit"));
  await writeFile(join(root, "clip.mp4"), "source");
  const edl = { version: 1, sources: { clip: join(root, "clip.mp4") }, ranges: [{ source: "clip", start: 0, end: 5 }], grade: "null", overlays: [], total_duration_s: 5 };
  const document = fromV1(edl);
  await writeFile(join(root, "edit", "edl.json"), JSON.stringify(edl));
  await writeFile(join(root, "edit", "document.v2.json"), JSON.stringify(document));
  await writeFile(join(root, "edit", "final.mp4"), "previous cut");
  return { root, document };
}
function model(commands: unknown[], extra = {}) {
  vi.mocked(callChat).mockResolvedValue({ text: JSON.stringify({ commands, summary: "Changed the shot.", ...extra }), inputTokens: 1, outputTokens: 1 });
}

describe("validated edit application", () => {
  it("applies an allowed transform through the renderer", async () => {
    const { root } = await fixture();
    model([{ op: "transform", segmentId: "seg_000", scale: 1.2, x: 0, y: 0 }]);
    vi.mocked(renderFromEdl).mockImplementation(async ({ workDir }) => {
      const reelPath = join(workDir, "edit", "final.mp4"); await writeFile(reelPath, "new cut"); return { reelPath, voDuration: 5 };
    });
    await runAgent({ cwd: root, instruction: "Punch in" });
    expect(renderFromEdl).toHaveBeenCalledOnce();
    const next = JSON.parse(await readFile(join(root, "edit", "document.v2.json"), "utf8"));
    expect(next.segments[0].transform.scale).toBe(1.2);
    expect(await readFile(join(root, "edit", "final.mp4"), "utf8")).toBe("new cut");
  });
  it("rejects a trim beyond the source before changing files or rendering", async () => {
    const { root, document } = await fixture();
    model([{ op: "trim", segmentId: "seg_000", sourceStartSec: 8, durationSec: 5 }]);
    await expect(runAgent({ cwd: root, instruction: "Trim" })).rejects.toThrow(/source duration/);
    expect(renderFromEdl).not.toHaveBeenCalled();
    expect(JSON.parse(await readFile(join(root, "edit", "document.v2.json"), "utf8"))).toEqual(document);
  });
  it("restores both timeline formats and the previous video if the renderer fails", async () => {
    const { root, document } = await fixture();
    const originalEdl = await readFile(join(root, "edit", "edl.json"), "utf8");
    model([{ op: "transform", segmentId: "seg_000", scale: 1.2, x: 0, y: 0 }]);
    vi.mocked(renderFromEdl).mockImplementation(async ({ workDir }) => {
      await writeFile(join(workDir, "edit", "final.mp4"), "broken"); throw new Error("render failed");
    });
    await expect(runAgent({ cwd: root, instruction: "Punch in" })).rejects.toThrow(/render failed/);
    expect(JSON.parse(await readFile(join(root, "edit", "document.v2.json"), "utf8"))).toEqual(document);
    expect(await readFile(join(root, "edit", "edl.json"), "utf8")).toBe(originalEdl);
    expect(await readFile(join(root, "edit", "final.mp4"), "utf8")).toBe("previous cut");
  });
  it("refuses a source belonging to another workspace before contacting the model", async () => {
    const first = await fixture(); const second = await fixture();
    first.document.metadata!.sourcePaths!.clip = join(second.root, "clip.mp4");
    await writeFile(join(first.root, "edit", "document.v2.json"), JSON.stringify(first.document));
    await expect(runAgent({ cwd: first.root, instruction: "Read other project" })).rejects.toThrow(/outside project/);
    expect(callChat).not.toHaveBeenCalled();
  });
  it("leaves unsupported edits unchanged", async () => {
    const { root } = await fixture(); model([], { unsupported: "Source audio replacement is not supported." });
    await runAgent({ cwd: root, instruction: "Replace the source audio" });
    expect(renderFromEdl).not.toHaveBeenCalled();
    expect(await readFile(join(root, "edit", "final.mp4"), "utf8")).toBe("previous cut");
    expect(JSON.parse(await readFile(join(root, "edit", "unsupported.json"), "utf8")).reason).toMatch(/not supported/);
  });
});
