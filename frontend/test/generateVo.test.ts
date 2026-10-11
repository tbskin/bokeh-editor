import { describe, it, expect } from "vitest";
import { idle, onGenerate, onGenerated, onScriptEdited } from "../src/lib/generateVoState";

describe("generated-take state", () => {
  it("generate -> ready carries the duration", () => {
    const s = onGenerated(onGenerate(idle()), 31.5);
    expect(s.status).toBe("ready");
    expect(s.voSec).toBe(31.5);
  });
  it("editing the script invalidates a ready take", () => {
    const s = onScriptEdited(onGenerated(onGenerate(idle()), 31.5));
    expect(s.status).toBe("idle");
    expect(s.voSec).toBeUndefined();
    expect(s.scriptRev).toBe(1);
  });
});
