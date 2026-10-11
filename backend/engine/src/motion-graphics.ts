import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { EditDocument } from "./edit-document";

const require = createRequire(import.meta.url);
const pExecFile = promisify(execFile);
const DESIGN_HASH = "ole-iris-light-v1";
const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type RenderOverlay = { file: string; start_in_output: number; duration: number };

function motionProps(template: "kinetic_text" | "text_card", props: Record<string, string>): { text: string; eyebrow: string } {
  const allowed = new Set(template === "kinetic_text" ? ["text", "eyebrow"] : ["text", "eyebrow"]);
  for (const key of Object.keys(props)) if (!allowed.has(key)) throw new Error(`motion graphic: unsupported prop ${key}`);
  const text = String(props.text ?? "").trim().slice(0, 120);
  if (!text) throw new Error("motion graphic: text is required");
  return { text, eyebrow: String(props.eyebrow ?? "").trim().slice(0, 36) };
}

export function motionTemplateHtml(input: {
  template: "kinetic_text" | "text_card"; durationSec: number; props: Record<string, string>;
}): string {
  if (!(input.durationSec > 0 && input.durationSec <= 8)) throw new Error("motion graphic: duration must be 0–8 seconds");
  const { text, eyebrow } = motionProps(input.template, input.props);
  const card = input.template === "text_card";
  const exitAt = Math.max(0.8, input.durationSec - 0.28);
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:transparent}
@font-face{font-family:'OLE Sans';src:url('./Montserrat.ttf') format('truetype');font-weight:100 900;font-style:normal;font-display:block}
#main{position:relative;width:1080px;height:1920px;background:transparent;color:#17171F;font-family:"OLE Sans",sans-serif}
.scene{box-sizing:border-box;width:100%;height:100%;padding:120px 76px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:24px}
.halo{position:absolute;width:680px;height:680px;left:-180px;top:610px;border-radius:50%;background:radial-gradient(circle,rgba(108,92,255,.22),rgba(108,92,255,0) 68%)}
.rule{width:180px;height:12px;border-radius:8px;background:#6C5CFF;transform-origin:left center}
.eyebrow{font-family:"OLE Sans",sans-serif;font-size:25px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6C5CFF}
.copy{box-sizing:border-box;max-width:928px;font-size:${card ? 72 : 96}px;line-height:1.02;letter-spacing:-.045em;font-weight:800;${card ? "padding:52px 48px;border-radius:28px;background:#FFFFFF;border:3px solid rgba(23,23,31,.14);box-shadow:0 24px 80px rgba(23,23,31,.16)" : "text-shadow:0 3px 20px rgba(255,255,255,.72)"}}
.mark{position:absolute;right:72px;bottom:230px;width:82px;height:82px;border:3px solid #6C5CFF;transform:rotate(12deg)}
</style></head><body>
<div id="main" data-composition-id="main" data-width="1080" data-height="1920" data-start="0" data-duration="${input.durationSec}" data-track-index="0">
  <div class="halo"></div><div class="scene"><div class="rule"></div>${eyebrow ? `<div class="eyebrow">${escapeHtml(eyebrow)}</div>` : ""}<div class="copy">${escapeHtml(text)}</div></div><div class="mark"></div>
  <script src="./gsap.min.js"></script><script>
  window.__timelines=window.__timelines||{};const tl=gsap.timeline({paused:true});
  tl.fromTo('.rule',{scaleX:0},{scaleX:1,duration:.32,ease:'expo.out'},.16);
  ${eyebrow ? "tl.fromTo('.eyebrow',{opacity:0,x:-32},{opacity:1,x:0,duration:.42,ease:'power3.out'},.24);" : ""}
  tl.fromTo('.copy',{opacity:0,y:54,scale:.94},{opacity:1,y:0,scale:1,duration:.58,ease:'back.out(1.25)'},.3);
  tl.fromTo('.mark',{opacity:0,rotation:-18,scale:.7},{opacity:1,rotation:12,scale:1,duration:.46,ease:'circ.out'},.46);
  tl.fromTo('.halo',{opacity:.2,scale:.92},{opacity:.75,scale:1.08,duration:${Math.max(0.8, input.durationSec - 0.3)},ease:'sine.inOut'},.18);
  tl.to('.scene,.mark,.halo',{opacity:0,duration:.24,ease:'power2.in'},${exitAt});
  tl.set('.scene,.mark,.halo',{opacity:0,visibility:'hidden'},${exitAt + 0.24});
  window.__timelines.main=tl;</script>
</div></body></html>`;
}

let motionQueue: Promise<unknown> = Promise.resolve();
const oneAtATime = async <T>(work: () => Promise<T>): Promise<T> => {
  const current = motionQueue.then(work, work);
  motionQueue = current.catch(() => {});
  return current;
};

async function renderMotion(input: { workDir: string; template: "kinetic_text" | "text_card"; durationSec: number; props: Record<string, string> }): Promise<string> {
  if (process.env.OLE_HYPERFRAMES === "0") throw new Error("Motion graphics are disabled on this deployment.");
  const hash = createHash("sha256").update(JSON.stringify({ ...input, workDir: undefined, design: DESIGN_HASH })).digest("hex");
  const cacheDir = join(input.workDir, "edit", "motion-cache");
  const output = join(cacheDir, `${hash}.webm`);
  if (existsSync(output)) return output;
  const compDir = join(cacheDir, `${hash}.composition`);
  await mkdir(compDir, { recursive: true });
  await writeFile(join(compDir, "index.html"), motionTemplateHtml(input));
  await writeFile(join(compDir, "hyperframes.json"), JSON.stringify({ entry: "index.html" }));
  await copyFile(require.resolve("gsap/dist/gsap.min.js"), join(compDir, "gsap.min.js"));
  await copyFile(resolve(import.meta.dirname, "..", "..", "vendor", "fonts", "Montserrat[wght].ttf"), join(compDir, "Montserrat.ttf"));
  const bin = require.resolve("hyperframes/bin/hyperframes.mjs");
  if (!existsSync(bin)) throw new Error("Motion graphics renderer is not installed.");
  await oneAtATime(async () => {
    await pExecFile(process.execPath, [bin, "lint"], { cwd: compDir, maxBuffer: 8 * 1024 * 1024 });
    await pExecFile(process.execPath, [bin, "validate", "--no-contrast"], { cwd: compDir, maxBuffer: 8 * 1024 * 1024 });
    await pExecFile(process.execPath, [bin, "inspect", "--samples", "5"], { cwd: compDir, maxBuffer: 8 * 1024 * 1024 });
    await pExecFile(process.execPath, [bin, "render", "--format", "webm", "--fps", "30", "--workers", "1", "--output", output, "--quiet"], { cwd: compDir, maxBuffer: 32 * 1024 * 1024 });
  });
  const probe = await pExecFile("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,pix_fmt:stream_tags=alpha_mode", "-of", "json", output]);
  const info = JSON.parse(probe.stdout) as { streams?: Array<{ codec_name?: string; pix_fmt?: string; tags?: Record<string, string> }> };
  const stream = info.streams?.[0];
  const alphaMode = Object.entries(stream?.tags ?? {}).find(([key]) => key.toLowerCase() === "alpha_mode")?.[1];
  if (stream?.codec_name !== "vp9" || (stream.pix_fmt !== "yuva420p" && alphaMode !== "1")) throw new Error("Motion graphic render did not preserve alpha.");
  return output;
}

/** Render only the two curated motion templates; static overlays stay deterministic elsewhere. */
export async function renderMotionOverlays(workDir: string, document: EditDocument): Promise<RenderOverlay[]> {
  const overlays: RenderOverlay[] = [];
  for (const overlay of document.overlays) {
    if (overlay.kind !== "motion") continue;
    const file = await renderMotion({ workDir, template: overlay.template, durationSec: overlay.durationSec, props: overlay.props });
    overlays.push({ file, start_in_output: overlay.startSec, duration: overlay.durationSec });
  }
  return overlays;
}

const assEscape = (value: string) => value.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}").replace(/\n/g, "\\N");
async function renderStaticText(input: { workDir: string; text: string; durationSec: number; position: "top" | "center" | "bottom" }): Promise<string> {
  const cacheDir = join(input.workDir, "edit", "overlay-cache");
  const hash = createHash("sha256").update(JSON.stringify({ ...input, workDir: undefined, design: DESIGN_HASH })).digest("hex");
  const output = join(cacheDir, `${hash}.webm`);
  if (existsSync(output)) return output;
  await mkdir(cacheDir, { recursive: true });
  const alignment = input.position === "top" ? 8 : input.position === "center" ? 5 : 2;
  const marginV = input.position === "top" ? 260 : input.position === "bottom" ? 360 : 0;
  const ass = `[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\n[V4+ Styles]\nFormat: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding\nStyle: OLE,Montserrat SemiBold,76,&H0017171F,&H0017171F,&H00FFFFFF,&H00000000,-1,0,0,0,100,100,-2,0,3,4,0,${alignment},80,80,${marginV},1\n[Events]\nFormat: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text\nDialogue: 0,0:00:00.00,0:00:${input.durationSec.toFixed(2)},OLE,,0,0,0,,${assEscape(input.text.slice(0, 160))}\n`;
  const assPath = join(cacheDir, `${hash}.ass`);
  await writeFile(assPath, ass);
  await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", `color=c=black@0.0:s=1080x1920:r=30:d=${input.durationSec},format=rgba`, "-vf", `ass=${assPath.replace(/:/g, "\\:")}`, "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", output], { maxBuffer: 16 * 1024 * 1024 });
  return output;
}

async function renderStaticImage(input: { workDir: string; assetId: string; durationSec: number; position: "top" | "center" | "bottom" }): Promise<string> {
  const source = join(input.workDir, "assets", basename(input.assetId));
  if (!existsSync(source)) throw new Error("Static image overlay is not a registered project asset.");
  const cacheDir = join(input.workDir, "edit", "overlay-cache");
  const hash = createHash("sha256").update(JSON.stringify({ assetId: basename(input.assetId), durationSec: input.durationSec, position: input.position, design: DESIGN_HASH })).digest("hex");
  const output = join(cacheDir, `${hash}.webm`);
  if (existsSync(output)) return output;
  await mkdir(cacheDir, { recursive: true });
  const y = input.position === "top" ? "220" : input.position === "center" ? "(H-h)/2" : "H-h-320";
  await pExecFile("ffmpeg", ["-y", "-f", "lavfi", "-i", `color=c=black@0.0:s=1080x1920:r=30:d=${input.durationSec},format=rgba`, "-loop", "1", "-i", source, "-filter_complex", `[1:v]scale=760:760:force_original_aspect_ratio=decrease[img];[0:v][img]overlay=(W-w)/2:${y}:format=auto,format=yuva420p[out]`, "-map", "[out]", "-t", String(input.durationSec), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0", output], { maxBuffer: 16 * 1024 * 1024 });
  return output;
}

export async function renderDocumentOverlays(workDir: string, document: EditDocument): Promise<RenderOverlay[]> {
  const rendered = await renderMotionOverlays(workDir, document);
  for (const overlay of document.overlays) {
    if (overlay.kind === "motion") continue;
    const file = overlay.kind === "text"
      ? await renderStaticText({ workDir, text: overlay.text, durationSec: overlay.durationSec, position: overlay.position })
      : await renderStaticImage({ workDir, assetId: overlay.assetId, durationSec: overlay.durationSec, position: overlay.position });
    rendered.push({ file, start_in_output: overlay.startSec, duration: overlay.durationSec });
  }
  return rendered.sort((a, b) => a.start_in_output - b.start_in_output);
}

export async function motionCacheKey(input: { template: string; durationSec: number; props: Record<string, string> }): Promise<string> {
  return createHash("sha256").update(JSON.stringify({ ...input, design: DESIGN_HASH })).digest("hex");
}
