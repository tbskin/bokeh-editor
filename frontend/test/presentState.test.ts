import { describe, it, expect } from "vitest";
import { presentState } from "../src/lib/presentState";
import type { ProjectState } from "../src/lib/types";

const server = (status: Partial<ProjectState & { lifecycle: string }> & { lifecycle: string }): ProjectState =>
  ({ kind: "server", status: status as never, startedAt: 1 });

describe("presentState — the one renderer input (spec 2026-07-19)", () => {
  it("local device work shows its own two steps with live progress", () => {
    const p = presentState("voiceover", { kind: "local", step: "optimizing", progress: 0.4, startedAt: 1 });
    expect(p.tone).toBe("working");
    expect(p.steps![0]).toMatchObject({ name: "Optimizing your clips", active: true, done: false });
    expect(p.progress).toBe(0.4);
    const up = presentState("voiceover", { kind: "local", step: "uploading", progress: 0.8, startedAt: 1 });
    expect(up.steps![0].done).toBe(true);
    expect(up.steps![1].active).toBe(true);
  });

  it("a dead local upload is an error with the prep retry — never a fake working state", () => {
    const p = presentState("voiceover", { kind: "local-error", message: "Upload got interrupted — tap Try again.", retry: "prep" });
    expect(p.tone).toBe("error");
    expect(p.cta).toBe("retry-prep");
  });

  it("server 'uploading' lifecycle means the clips never arrived — honest error, not analyzing", () => {
    const p = presentState("voiceover", server({ lifecycle: "uploading" }));
    expect(p.tone).toBe("error");
    expect(p.cta).toBe("retry-prep");
  });

  it("working lifecycles pass the server's ledger-backed steps through with one active", () => {
    const p = presentState("voiceover", server({
      lifecycle: "rendering", phase: "rendering your reel",
      steps: [
        { name: "transcribing your voiceover", done: true },
        { name: "cutting your clips", done: true },
        { name: "rendering your reel", done: false },
      ],
    } as never));
    expect(p.tone).toBe("working");
    expect(p.steps!.filter((s) => s.done)).toHaveLength(2);
    expect(p.steps!.find((s) => s.active)!.name).toBe("rendering your reel");
    expect(p.headline).toBe("rendering your reel");
  });

  it("awaiting_voice is an attention state whose CTA is the voice card", () => {
    const p = presentState("voiceover", server({ lifecycle: "awaiting_voice" }));
    expect(p.tone).toBe("attention");
    expect(p.cta).toBe("voice");
  });

  it("ready carries the reel and any editor reply (failed edits answer in chat, reel survives)", () => {
    const p = presentState("voiceover", server({ lifecycle: "ready", reelUrl: "/r", reply: "I couldn't do that edit." } as never));
    expect(p.tone).toBe("ready");
    expect(p.reelUrl).toBe("/r");
    expect(p.reply).toBe("I couldn't do that edit.");
  });

  it("errors map their retry from the failed stage", () => {
    expect(presentState("voiceover", server({ lifecycle: "error", stage: "assemble", error: "x" } as never)).cta).toBe("retry-assemble");
    expect(presentState("voiceover", server({ lifecycle: "error", stage: "plan", error: "x" } as never)).cta).toBe("retry-prep");
  });
});
