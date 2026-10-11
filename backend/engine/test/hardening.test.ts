import { describe, it, expect, vi, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { callChat } from "../src/eyes";
import { runAnalyzeJob } from "../src/analyze";
import { runPlanJob } from "../src/plan";

process.env.OLE_CHAT_BACKOFF_MS = "1"; // keep retry tests fast

const okCompletion = (text: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content: text } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("callChat retry", () => {
  it("retries a transient 500 and succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("upstream blew up", { status: 500 }))
      .mockResolvedValueOnce(okCompletion("hello"));
    vi.stubGlobal("fetch", fetchMock);
    process.env.OPENAI_API_KEY ??= "test-key";
    const r = await callChat([{ type: "text", text: "hi" }]);
    expect(r.text).toBe("hello");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 400 (bad request is our bug, not weather)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("bad request", { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(callChat([{ type: "text", text: "hi" }])).rejects.toThrow(/400/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("gives up after three network failures", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("socket hang up"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(callChat([{ type: "text", text: "hi" }])).rejects.toThrow(/socket hang up|network/i);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("analyze total-failure guard", () => {
  it("throws a clear error when clips exist but none could be analyzed", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-an-"));
    await mkdir(join(dir, "clips"), { recursive: true });
    await writeFile(join(dir, "clips", "a.mp4"), "x");
    await writeFile(join(dir, "clips", "b.mov"), "x");
    await expect(runAnalyzeJob({
      workDir: dir,
      analyze: async () => { throw new Error("vision down"); },
      getDuration: async () => 5,
    })).rejects.toThrow(/none of the clips/i);
  });
});

describe("plan empty-analysis guard", () => {
  it("refuses to plan from zero analyzed clips instead of asking the model", async () => {
    const dir = await mkdtemp(join(tmpdir(), "ole-pl-"));
    await writeFile(join(dir, "analysis.json"), JSON.stringify({ summary: "", clips: [] }));
    const planSeam = vi.fn();
    await expect(runPlanJob({ workDir: dir, hasIdea: false, plan: planSeam as never }))
      .rejects.toThrow(/no analyzed clips/i);
    expect(planSeam).not.toHaveBeenCalled();
  });
});

