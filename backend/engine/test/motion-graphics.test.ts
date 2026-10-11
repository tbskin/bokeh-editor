import { describe, expect, it } from "vitest";
import { mkdir, mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { motionCacheKey, motionTemplateHtml, renderDocumentOverlays, renderMotionOverlays } from "../src/motion-graphics";
import type { EditDocument } from "../src/edit-document";

const pExecFile = promisify(execFile);
const document = (): EditDocument => ({
  version: 2, format: "talking_head", canvas: { width: 1080, height: 1920, fps: 30 },
  sources: { a: { assetId: "a.mov" } },
  segments: [{ id: "one", source: "a", sourceStartSec: 0, durationSec: 2 }],
  overlays: [{ kind: "motion", startSec: 0.2, durationSec: 0.6, template: "kinetic_text", props: { eyebrow: "ONE THING", text: "Keep the clean take" } }],
  audio: { master: "source", envelopes: [], sfx: [] },
});

describe("curated HyperFrames motion graphics", () => {
  it("authors a deterministic, transparent, locally-loaded registered timeline", () => {
    const html = motionTemplateHtml({ template: "text_card", durationSec: 2, props: { text: '<script>alert("x")</script>', eyebrow: "NOTE" } });
    expect(html).toContain('data-composition-id="main"');
    expect(html).toContain("window.__timelines.main=tl");
    expect(html).toContain('src="./gsap.min.js"');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("background:transparent");
  });

  it("accepts only typed props and the two curated templates", () => {
    expect(() => motionTemplateHtml({ template: "kinetic_text", durationSec: 2, props: { text: "Hi", html: "no" } })).toThrow(/unsupported prop/);
    expect(() => motionTemplateHtml({ template: "kinetic_text", durationSec: 9, props: { text: "Hi" } })).toThrow(/duration/);
  });

  it("uses template, timing, props, and design identity in a stable cache key", async () => {
    const a = await motionCacheKey({ template: "kinetic_text", durationSec: 1, props: { text: "A" } });
    const b = await motionCacheKey({ template: "kinetic_text", durationSec: 1, props: { text: "A" } });
    const c = await motionCacheKey({ template: "kinetic_text", durationSec: 1, props: { text: "B" } });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it("lints, validates, inspects, renders alpha WebM, and reuses the cached render", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-hyperframes-"));
    const [first] = await renderMotionOverlays(workDir, document());
    const before = await stat(first.file);
    const probe = JSON.parse((await pExecFile("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,pix_fmt:stream_tags=alpha_mode", "-of", "json", first.file])).stdout);
    expect(probe.streams[0].codec_name).toBe("vp9");
    const alphaMode = Object.entries(probe.streams[0].tags ?? {}).find(([key]) => key.toLowerCase() === "alpha_mode")?.[1];
    expect(probe.streams[0].pix_fmt === "yuva420p" || alphaMode === "1").toBe(true);
    const [second] = await renderMotionOverlays(workDir, document());
    expect(second.file).toBe(first.file);
    expect((await stat(second.file)).mtimeMs).toBe(before.mtimeMs);
  }, 120_000);

  it("renders deterministic static text and registered-image overlays with alpha", async () => {
    const workDir = await mkdtemp(join(tmpdir(), "ole-static-overlays-"));
    await mkdir(join(workDir, "assets"), { recursive: true });
    await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", "color=c=red@0.6:s=240x120:d=0.1,format=rgba", "-frames:v", "1", join(workDir, "assets", "logo.png")]);
    const doc = document();
    doc.overlays = [
      { kind: "text", startSec: 0.1, durationSec: 0.4, text: "Static note", position: "top" },
      { kind: "image", startSec: 0.8, durationSec: 0.4, assetId: "logo.png", position: "center" },
    ];
    const rendered = await renderDocumentOverlays(workDir, doc);
    expect(rendered).toHaveLength(2);
    for (const overlay of rendered) {
      const stream = JSON.parse((await pExecFile("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name:stream_tags=alpha_mode", "-of", "json", overlay.file])).stdout).streams[0];
      const alphaMode = Object.entries(stream.tags ?? {}).find(([key]) => key.toLowerCase() === "alpha_mode")?.[1];
      expect(stream.codec_name).toBe("vp9");
      expect(alphaMode).toBe("1");
    }
  }, 120_000);
});
