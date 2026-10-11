import { describe, expect, it } from "vitest";
import { buildThreadItems, LIVE_ID, LEGACY_REEL_ID } from "../src/lib/threadItems";
import type { Presentation } from "../src/lib/presentState";
import type { ProjectMessage } from "../src/lib/types";

const pres = (over: Partial<Presentation>): Presentation =>
  ({ tone: "ready", badge: "", headline: "", ...over });
const msg = (over: Partial<ProjectMessage>): ProjectMessage =>
  ({ id: "m1", role: "user", kind: "text", body: { text: "hi" }, created_at: "2026-07-21T00:00:00Z", ...over });

describe("buildThreadItems", () => {
  it("prepends an optimistic material bubble when server has none and local clips exist", () => {
    const items = buildThreadItems({
      messages: [msg({})],
      project: { clips: [{ uri: "u", name: "a.mov", type: "video/quicktime" }], context: "beach day", createdAt: 0 },
      pres: pres({}),
    });
    expect(items[0].kind).toBe("material");
    expect((items[0].body as { text?: string }).text).toBe("beach day");
  });
  it("does not prepend material when the server already has one", () => {
    const items = buildThreadItems({
      messages: [msg({ kind: "material", body: { attachments: [] } })],
      project: { clips: [{ uri: "u", name: "a.mov", type: "video/quicktime" }], createdAt: 0 },
      pres: pres({}),
    });
    expect(items.filter((m) => m.kind === "material")).toHaveLength(1);
  });
  it("folds legacy refineMessages in as text bubbles", () => {
    const items = buildThreadItems({
      messages: [], project: { createdAt: 0, refineMessages: ["make it snappy", { role: "editor", text: "Done." }] },
      pres: pres({}),
    });
    expect(items.map((m) => m.role)).toEqual(["user", "editor"]);
  });
  it("synthesizes a reel card for legacy projects with a reelUrl but no reel message", () => {
    const items = buildThreadItems({ messages: [msg({})], project: { createdAt: 0 }, pres: pres({ reelUrl: "/api/x" }) });
    expect(items.at(-1)?.id).toBe(LEGACY_REEL_ID);
    expect(items.at(-1)?.kind).toBe("reel");
  });
  it("does not synthesize a reel card when a real reel message exists", () => {
    const items = buildThreadItems({
      messages: [msg({ kind: "reel", body: { reelUrl: "/api/x", summary: "s" } })],
      project: { createdAt: 0 }, pres: pres({ reelUrl: "/api/x" }),
    });
    expect(items.filter((m) => m.kind === "reel")).toHaveLength(1);
  });
  it("appends the live bubble last when liveText is set", () => {
    const items = buildThreadItems({ messages: [msg({})], project: { createdAt: 0 }, pres: pres({ tone: "working" }), liveText: "Watching your footage · 0:42" });
    expect(items.at(-1)).toMatchObject({ id: LIVE_ID, body: { text: "Watching your footage · 0:42" } });
  });
});
