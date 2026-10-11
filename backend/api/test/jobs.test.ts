import { describe, it, expect, vi } from "vitest";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.OLE_DATA = mkdtempSync(join(tmpdir(), "ole-jobs-"));

vi.mock("@ole/engine", () => ({
  assembleReel: vi.fn(async () => ({ reelPath: "/x/final.mp4" })),
  runAssembleLoop: vi.fn(async () => ({ reelPath: "/x/final.mp4" })),
  renderFromEdl: vi.fn(async () => ({ reelPath: "/x/final.mp4", voDuration: 5 })),
  refineJob: vi.fn(async () => ({})),
  runAnalyzeJob: vi.fn(async () => ({})),
  runPlanJob: vi.fn(async () => ({})),
}));
vi.mock("../src/db", () => ({
  insertProjectMessage: vi.fn(async () => ({})),
  projectFormat: vi.fn(async () => "voiceover"),
  projectOwner: vi.fn(async () => null),
  setProjectStatus: vi.fn(async () => {}),
}));
import { startAssemble, startFinalize, startAnalyze, startPlan, getStatus, currentReelUrl, setReelUrl } from "../src/jobs";

describe("jobs", () => {
  it("transitions running -> done with a reel url", async () => {
    startAssemble("p1");
    expect(getStatus("p1").state).toBe("running");
    await new Promise((r) => setTimeout(r, 20));
    expect(getStatus("p1").state).toBe("done");
    expect(getStatus("p1").reelUrl).toContain("/reel");
  });

  it("keeps the current reel revision stable between detail polls", async () => {
    startAssemble("p1-stable");
    await new Promise((r) => setTimeout(r, 20));
    const first = currentReelUrl("p1-stable");
    expect(first).toContain("/reel?t=");
    expect(currentReelUrl("p1-stable")).toBe(first);
  });

  it("startFinalize re-renders to done", async () => {
    startFinalize("p1b");
    expect(getStatus("p1b").state).toBe("running");
    await new Promise((r) => setTimeout(r, 20));
    expect(getStatus("p1b").state).toBe("done");
  });

  it("startAnalyze reports the analyze stage", () => {
    startAnalyze("p2", "coffee");
    expect(getStatus("p2").stage).toBe("analyze");
  });

  it("startPlan reports the plan stage", () => {
    startPlan("p3", { hasIdea: false });
    expect(getStatus("p3").stage).toBe("plan");
  });

  it("persists status to disk so it survives a restart", async () => {
    startAssemble("p8");
    await new Promise((r) => setTimeout(r, 20));
    const onDisk = JSON.parse(readFileSync(join(process.env.OLE_DATA!, "p8", "status.json"), "utf8"));
    expect(onDisk.state).toBe("done");
  });

  it("undo's setReelUrl adopts the fresh cache-busted URL into persisted status, not the pre-undo one", async () => {
    startAssemble("p-undo");
    await new Promise((r) => setTimeout(r, 20));
    const preUndo = currentReelUrl("p-undo");
    expect(getStatus("p-undo").reelUrl).toBe(preUndo);

    // Mirrors what POST /api/projects/:id/undo does: mint once, then adopt the same value the
    // response returns into the status the app polls — never the stale pre-undo reelUrl.
    const undoneUrl = `/api/projects/p-undo/reel?t=${Date.now() + 1}`;
    setReelUrl("p-undo", undoneUrl);

    expect(getStatus("p-undo").reelUrl).toBe(undoneUrl);
    expect(getStatus("p-undo").reelUrl).not.toBe(preUndo);
    expect(currentReelUrl("p-undo")).toBe(undoneUrl);
    const onDisk = JSON.parse(readFileSync(join(process.env.OLE_DATA!, "p-undo", "status.json"), "utf8"));
    expect(onDisk.reelUrl).toBe(undoneUrl); // persisted, matches the value the route's response carries
  });

  it("surfaces a stale 'running' status from a dead process as an error", () => {
    // a previous server process persisted "running", then died mid-job — the in-memory promise is gone
    const dir = join(process.env.OLE_DATA!, "p9");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "status.json"), JSON.stringify({ state: "running", stage: "assemble", pid: 99999999 }));
    const s = getStatus("p9");
    expect(s.state).toBe("error");
    expect(s.error).toMatch(/restart/i);
  });
});
