import { describe, it, expect, vi } from "vitest";
import { advancePhase, stepsFor, STAGE_PHASES } from "../src/jobs";

describe("the one state contract (spec 2026-07-19)", () => {
  it("advancePhase banks the finished phase so a coarse poll can never skip it", () => {
    let s: Parameters<typeof advancePhase>[0] = { state: "running", stage: "assemble", phase: "transcribing your voiceover" };
    s = advancePhase(s, "tightening your take");
    s = advancePhase(s, "rendering your reel"); // two phases flew by between polls
    expect(s.phasesDone).toEqual(["transcribing your voiceover", "tightening your take"]);
    expect(s.phase).toBe("rendering your reel");
  });

  it("advancePhase never duplicates a banked phase", () => {
    let s: Parameters<typeof advancePhase>[0] = { state: "running", stage: "assemble", phase: "cutting your clips", phasesDone: ["cutting your clips"] };
    s = advancePhase(s, "adding captions");
    expect((s.phasesDone ?? []).filter((p) => p === "cutting your clips")).toHaveLength(1);
  });

  it("stepsFor marks everything before the live phase done, ledger included", () => {
    const steps = stepsFor("assemble", "voiceover", "rendering your reel", ["transcribing your voiceover"]);
    expect(steps).toBeDefined();
    const done = steps!.filter((x) => x.done).map((x) => x.name);
    expect(done).toContain("transcribing your voiceover"); // from the ledger
    expect(done).toContain("adding captions");             // earlier than the live phase
    expect(steps!.find((x) => x.name === "rendering your reel")!.done).toBe(false); // live, not done
    expect(steps!.map((x) => x.name)).toEqual(STAGE_PHASES["assemble:voiceover"]);
  });

  it("prep stages expose the two-step footage/script list with analyze completing first", () => {
    expect(stepsFor("analyze", "voiceover", undefined)).toEqual([
      { name: "watching your footage", done: false }, { name: "writing your script", done: false }]);
    expect(stepsFor("plan", "voiceover", undefined)![0].done).toBe(true);
  });

  it("talking-head gets its own list; unknown stages get none", () => {
    expect(stepsFor("assemble", "talking_head", undefined)!.map((s) => s.name)).toEqual(STAGE_PHASES["assemble:talking_head"]);
    expect(stepsFor(undefined, "voiceover", undefined)).toBeUndefined();
  });
});

describe("sweepOrphanJobs (deploys kill jobs; orphans resume or become honest errors)", () => {
  const seed = async (files: Record<string, object>) => {
    const { mkdtemp, mkdir, writeFile } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join, dirname } = await import("node:path");
    const root = await mkdtemp(join(tmpdir(), "ole-orphan-"));
    for (const [rel, body] of Object.entries(files)) {
      await mkdir(dirname(join(root, rel)), { recursive: true });
      await writeFile(join(root, rel), JSON.stringify(body));
    }
    return root;
  };
  const readJson = async (root: string, rel: string) => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    return JSON.parse(await readFile(join(root, rel), "utf8"));
  };

  it("errors unresumable orphans honestly and leaves settled statuses alone", async () => {
    const { sweepOrphanJobs } = await import("../src/jobs");
    const root = await seed({
      "p1/status.json": { state: "running", stage: "analyze", pid: 999 }, // no prep-request → can't resume
      "p2/status.json": { state: "done", stage: "assemble", reelUrl: "/r" },
    });
    expect(await sweepOrphanJobs(root)).toEqual({ resumed: 0, errored: 1 });
    const p1 = await readJson(root, "p1/status.json");
    expect(p1.state).toBe("error");
    expect(p1.stage).toBe("analyze"); // retry maps to the right action
    expect(p1.error).toMatch(/restarted mid-job/i);
    expect((await readJson(root, "p2/status.json")).state).toBe("done");
  });

  it("resumes a resumable orphan exactly once — a second death becomes the honest error", async () => {
    const { existsSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { sweepOrphanJobs } = await import("../src/jobs");
    const root = await seed({ "p1/status.json": { state: "running", stage: "plan", pid: 999 } });
    const resume = vi.fn(async () => true);
    expect(await sweepOrphanJobs(root, resume)).toEqual({ resumed: 1, errored: 0 });
    expect(resume).toHaveBeenCalledTimes(1);
    expect(existsSync(join(root, "p1", "resume-attempt.json"))).toBe(true); // armed until the job settles
    // The resumed job dies to another restart: marker present → no second resume, honest error.
    expect(await sweepOrphanJobs(root, resume)).toEqual({ resumed: 0, errored: 1 });
    expect(resume).toHaveBeenCalledTimes(1);
    expect((await readJson(root, "p1/status.json")).state).toBe("error");
    expect(existsSync(join(root, "p1", "resume-attempt.json"))).toBe(false); // re-armed for the future
  });

  it("never touches a running job this process owns (interval/race safety)", async () => {
    const { sweepOrphanJobs } = await import("../src/jobs");
    const root = await seed({ "p1/status.json": { state: "running", stage: "assemble", pid: process.pid } });
    const resume = vi.fn(async () => true);
    expect(await sweepOrphanJobs(root, resume)).toEqual({ resumed: 0, errored: 0 });
    expect(resume).not.toHaveBeenCalled();
    expect((await readJson(root, "p1/status.json")).state).toBe("running");
  });

  it("orphanResumePlan: initial prep resumes; revisions, switches, and refines never do", async () => {
    const { orphanResumePlan } = await import("../src/jobs");
    const running = (stage: string, extra: object = {}) => ({ state: "running" as const, stage: stage as never, ...extra });
    const root = await seed({
      "prep/status.json": running("plan"), "prep/prep-request.json": { hasIdea: true, context: "day out" },
      "revision/status.json": running("plan"), "revision/prep-request.json": { hasIdea: true }, "revision/script.md": {},
      "bare/status.json": running("analyze"),
    });
    expect(orphanResumePlan(root, "prep", running("plan"), null)).toBe("prep");
    expect(orphanResumePlan(root, "revision", running("plan"), null)).toBe(null);   // script.md exists — an edit died, don't re-plan the original
    expect(orphanResumePlan(root, "bare", running("analyze"), null)).toBe(null);    // pre-persistence project — no request to replay
    expect(orphanResumePlan(root, "prep", running("assemble", { phase: "transcribing your voiceover" }), "voiceover")).toBe("assemble");
    expect(orphanResumePlan(root, "prep", running("assemble", { phase: "finishing up", phasesDone: ["rendering in HD"] }), "voiceover")).toBe("finalize");
    expect(orphanResumePlan(root, "prep", running("assemble"), "voiceover")).toBe(null); // a refine — its message died with the process
    expect(orphanResumePlan(root, "prep", running("assemble", { phase: "transcribing every take" }), "talking_head")).toBe("prep");
  });
});

describe("presentError (user-facing errors are human sentences)", () => {
  it("launders system errors and passes human sentences through", async () => {
    const { presentError } = await import("../src/jobs");
    const enoent = Object.assign(new Error("ENOENT: no such file or directory, open '/data/x/edit/script-revision.json'"), { code: "ENOENT" });
    expect(presentError(enoent)).toBe("Something broke on our side — tap Try again.");
    expect(presentError(new Error("The editor didn't return a revised script."))).toBe("The editor didn't return a revised script.");
    const conflict = Object.assign(new Error("The script changed before the voiceover was generated. Reload it and try again."), { code: "script_revision_conflict" });
    expect(presentError(conflict)).toBe("The script changed before the voiceover was generated. Reload it and try again.");
  });
});
