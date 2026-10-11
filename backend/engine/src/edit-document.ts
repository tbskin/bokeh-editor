import { readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Edl } from "./edl";
import { commandSchema } from "./edit-schema";
import { validateEdl } from "./edl";

export type ReelFormat = "voiceover" | "talking_head";
export type EditDocument = {
  version: 2;
  format: ReelFormat;
  canvas: { width: 1080; height: 1920; fps: 30 };
  sources: Record<string, { assetId: string }>;
  segments: Array<{
    id: string;
    source: string;
    sourceStartSec: number;
    durationSec: number;
    transform?: { scale: number; x: number; y: number };
    split?: { source: string; sourceStartSec: number; side: "left" | "right" };
    transitionIn?: { kind: "cut" | "fade" | "crossfade"; durationSec?: number };
  }>;
  overlays: Array<
    | { kind: "text"; startSec: number; durationSec: number; text: string; position: "top" | "center" | "bottom" }
    | { kind: "image"; startSec: number; durationSec: number; assetId: string; position: "top" | "center" | "bottom" }
    | { kind: "motion"; startSec: number; durationSec: number; template: "kinetic_text" | "text_card"; props: Record<string, string> }
  >;
  audio: {
    master: "voiceover" | "source";
    envelopes: Array<{ target: "voice" | "music" | "source"; startSec: number; endSec: number; gainDb: number }>;
    sfx: Array<{ name: string; atSec: number; gainDb?: number }>;
  };
  captions?: { file: string; style: string };
  metadata?: { sourcePaths?: Record<string, string> };
};

export type EditCommand =
  | { op: "trim"; segmentId: string; sourceStartSec: number; durationSec: number }
  | { op: "remove"; segmentIds: string[] }
  | { op: "replace"; segmentId: string; source: string; sourceStartSec: number; durationSec: number }
  | { op: "reorder"; segmentIds: string[] }
  | { op: "transform"; segmentId: string; scale: number; x: number; y: number }
  | { op: "split"; segmentId: string; source: string; sourceStartSec: number; side: "left" | "right" }
  | { op: "transition"; segmentId: string; kind: "cut" | "fade" | "crossfade"; durationSec?: number }
  | { op: "addOverlay"; overlay: EditDocument["overlays"][number] }
  | { op: "removeOverlay"; index: number }
  | { op: "volume"; target: "voice" | "music" | "source"; startSec: number; endSec: number; gainDb: number }
  | { op: "sfx"; name: string; atSec: number; gainDb?: number }
  | { op: "captions"; file: string; style: string };

const finite = (value: number) => Number.isFinite(value);
const totalDuration = (document: EditDocument) => document.segments.reduce((sum, segment, index) => {
  const overlap = index > 0 && segment.transitionIn?.kind === "crossfade" ? (segment.transitionIn.durationSec ?? 0.25) : 0;
  return sum + segment.durationSec - overlap;
}, 0);

export function validateEditDocument(document: EditDocument): void {
  if (document.version !== 2) throw new Error("edit document: version must be 2");
  if (document.format !== "voiceover" && document.format !== "talking_head") throw new Error("edit document: invalid format");
  if (document.canvas.width !== 1080 || document.canvas.height !== 1920 || document.canvas.fps !== 30) throw new Error("edit document: unsupported canvas");
  if (!document.segments.length) throw new Error("edit document: no segments");
  if (document.audio.master !== "voiceover" && document.audio.master !== "source") throw new Error("edit document: invalid audio master");
  const ids = new Set<string>();
  for (const segment of document.segments) {
    if (ids.has(segment.id)) throw new Error(`edit document: duplicate segment ${segment.id}`);
    ids.add(segment.id);
    if (!Object.hasOwn(document.sources, segment.source)) throw new Error(`edit document: unknown source ${segment.source}`);
    if (!finite(segment.sourceStartSec) || segment.sourceStartSec < 0 || !finite(segment.durationSec) || segment.durationSec <= 0) throw new Error(`edit document: invalid timing for ${segment.id}`);
    if (segment.transform && (!finite(segment.transform.scale) || segment.transform.scale < 1 || segment.transform.scale > 3 || !finite(segment.transform.x) || !finite(segment.transform.y) || Math.abs(segment.transform.x) > 1 || Math.abs(segment.transform.y) > 1)) throw new Error(`edit document: invalid transform for ${segment.id}`);
    if (segment.split && (!Object.hasOwn(document.sources, segment.split.source) || segment.split.sourceStartSec < 0 || !finite(segment.split.sourceStartSec) || !["left", "right"].includes(segment.split.side))) throw new Error(`edit document: invalid split source ${segment.split.source}`);
    if (segment.transitionIn && !["cut", "fade", "crossfade"].includes(segment.transitionIn.kind)) throw new Error(`edit document: invalid transition for ${segment.id}`);
    if (segment.transitionIn?.durationSec != null && (segment.transitionIn.durationSec < 0 || segment.transitionIn.durationSec > 1)) throw new Error(`edit document: invalid transition for ${segment.id}`);
  }
  if (document.segments[0].transitionIn?.kind === "crossfade") throw new Error("edit document: first segment cannot crossfade");
  for (let index = 1; index < document.segments.length; index++) {
    const segment = document.segments[index];
    if (segment.transitionIn?.kind === "crossfade") {
      const overlap = segment.transitionIn.durationSec ?? 0.25;
      if (!(overlap > 0 && overlap < Math.min(segment.durationSec, document.segments[index - 1].durationSec))) throw new Error(`edit document: crossfade is longer than segment ${segment.id}`);
    }
  }
  const duration = totalDuration(document);
  for (const overlay of document.overlays) {
    if (!finite(overlay.startSec) || !finite(overlay.durationSec) || overlay.startSec < 0 || overlay.durationSec <= 0 || overlay.startSec + overlay.durationSec > duration + 0.01) throw new Error("edit document: overlay outside timeline");
    if (overlay.kind !== "motion" && !["top", "center", "bottom"].includes(overlay.position)) throw new Error("edit document: invalid overlay position");
    if (overlay.kind === "text" && !overlay.text.trim()) throw new Error("edit document: empty text overlay");
    if (overlay.kind === "image" && (!overlay.assetId || basename(overlay.assetId) !== overlay.assetId)) throw new Error("edit document: invalid image asset");
    if (overlay.kind === "motion" && overlay.template !== "kinetic_text" && overlay.template !== "text_card") throw new Error("edit document: unsupported motion template");
    if (overlay.kind === "motion") {
      if (overlay.durationSec > 8 || !String(overlay.props.text ?? "").trim()) throw new Error("edit document: invalid motion graphic");
      if (Object.keys(overlay.props).some((key) => !["text", "eyebrow"].includes(key)) || Object.values(overlay.props).some((value) => typeof value !== "string")) throw new Error("edit document: unsupported motion props");
    }
  }
  for (const envelope of document.audio.envelopes) {
    if (!["voice", "music", "source"].includes(envelope.target)) throw new Error("edit document: invalid audio target");
    if (![envelope.startSec, envelope.endSec, envelope.gainDb].every(finite) || envelope.startSec < 0 || envelope.endSec <= envelope.startSec || envelope.endSec > duration + 0.01 || envelope.gainDb < -60 || envelope.gainDb > 12) throw new Error("edit document: invalid audio envelope");
  }
  for (const sfx of document.audio.sfx) {
    if (!finite(sfx.atSec) || (sfx.gainDb != null && !finite(sfx.gainDb)) || !/^[a-z0-9_-]{1,80}$/i.test(sfx.name) || sfx.atSec < 0 || sfx.atSec > duration + 0.01 || (sfx.gainDb != null && (sfx.gainDb < -60 || sfx.gainDb > 12))) throw new Error("edit document: invalid sound effect");
  }
  if (document.captions && (basename(document.captions.file) !== document.captions.file || !/\.(srt|ass)$/i.test(document.captions.file) || !/^[a-z0-9_-]{1,80}$/i.test(document.captions.style))) throw new Error("edit document: invalid caption settings");
}

export function applyEditCommands(current: EditDocument, commands: EditCommand[]): EditDocument {
  commands = commands.map((command) => commandSchema.parse(command));
  const next = structuredClone(current);
  const segment = (id: string) => {
    const hit = next.segments.find((candidate) => candidate.id === id);
    if (!hit) throw new Error(`apply-edit: unknown segment ${id}`);
    return hit;
  };
  for (const command of commands) {
    switch (command.op) {
      case "trim": Object.assign(segment(command.segmentId), { sourceStartSec: command.sourceStartSec, durationSec: command.durationSec }); break;
      case "remove": next.segments = next.segments.filter((item) => !command.segmentIds.includes(item.id)); break;
      case "replace": Object.assign(segment(command.segmentId), { source: command.source, sourceStartSec: command.sourceStartSec, durationSec: command.durationSec }); break;
      case "reorder": {
        if (command.segmentIds.length !== next.segments.length || new Set(command.segmentIds).size !== next.segments.length) throw new Error("apply-edit: reorder must name every segment exactly once");
        const byId = new Map(next.segments.map((item) => [item.id, item]));
        next.segments = command.segmentIds.map((id) => { const hit = byId.get(id); if (!hit) throw new Error(`apply-edit: unknown segment ${id}`); return hit; });
        break;
      }
      case "transform": segment(command.segmentId).transform = { scale: command.scale, x: command.x, y: command.y }; break;
      case "split": segment(command.segmentId).split = { source: command.source, sourceStartSec: command.sourceStartSec, side: command.side }; break;
      case "transition": segment(command.segmentId).transitionIn = { kind: command.kind, ...(command.durationSec != null ? { durationSec: command.durationSec } : {}) }; break;
      case "addOverlay": next.overlays.push(command.overlay); break;
      case "removeOverlay": {
        if (!next.overlays[command.index]) throw new Error(`apply-edit: unknown overlay ${command.index}`);
        next.overlays.splice(command.index, 1); break;
      }
      case "volume": next.audio.envelopes.push({ target: command.target, startSec: command.startSec, endSec: command.endSec, gainDb: command.gainDb }); break;
      case "sfx": next.audio.sfx.push({ name: command.name, atSec: command.atSec, ...(command.gainDb != null ? { gainDb: command.gainDb } : {}) }); break;
      case "captions": next.captions = { file: command.file, style: command.style }; break;
    }
  }
  validateEditDocument(next);
  return next;
}

export function fromV1(edl: Edl, format: ReelFormat = "voiceover"): EditDocument {
  let atSec = 0;
  const sfx = edl.ranges.flatMap((range, index) => {
    if (index > 0 && range.transitionIn?.kind === "crossfade") atSec -= range.transitionIn.durationSec ?? 0.25;
    const current = atSec;
    atSec += range.end - range.start;
    return range.sfx ? [{ name: range.sfx, atSec: current }] : [];
  });
  const document: EditDocument = {
    version: 2, format, canvas: { width: 1080, height: 1920, fps: 30 },
    sources: Object.fromEntries(Object.entries(edl.sources).map(([key, path]) => [key, { assetId: basename(path) }])),
    segments: edl.ranges.map((range, index) => ({
      id: `seg_${String(index).padStart(3, "0")}`, source: range.source, sourceStartSec: range.start, durationSec: range.end - range.start,
      ...(range.transform ? { transform: range.transform } : {}),
      ...(range.split ? { split: range.split } : {}),
      ...(range.transitionIn ? { transitionIn: range.transitionIn } : {}),
    })),
    overlays: ((edl.metadata?.overlaysV2 as EditDocument["overlays"] | undefined) ?? []),
    audio: { master: format === "voiceover" ? "voiceover" : "source", envelopes: [], sfx },
    ...(edl.subtitles ? { captions: { file: edl.subtitles, style: "default" } } : {}),
    metadata: { sourcePaths: { ...edl.sources } },
  };
  const audio = edl.metadata?.audio as EditDocument["audio"] | undefined;
  if (audio) document.audio = structuredClone(audio);
  validateEditDocument(document);
  return document;
}

export function toV1(document: EditDocument, grade: string): Edl {
  validateEditDocument(document);
  const sourcePaths = document.metadata?.sourcePaths ?? {};
  const edl: Edl = {
    version: 1,
    sources: Object.fromEntries(Object.keys(document.sources).map((key) => [key, sourcePaths[key] ?? document.sources[key].assetId])),
    ranges: document.segments.map((segment, index) => {
      const startInOutput = document.segments.slice(0, index).reduce((sum, item, priorIndex) => {
        const overlap = priorIndex > 0 && item.transitionIn?.kind === "crossfade" ? (item.transitionIn.durationSec ?? 0.25) : 0;
        return sum + item.durationSec - overlap;
      }, 0) - (index > 0 && segment.transitionIn?.kind === "crossfade" ? (segment.transitionIn.durationSec ?? 0.25) : 0);
      const sfx = document.audio.sfx.find((item) => Math.abs(item.atSec - startInOutput) < 0.05);
      return {
        source: segment.source, start: segment.sourceStartSec, end: segment.sourceStartSec + segment.durationSec,
        ...(segment.transform ? { transform: segment.transform } : {}),
        ...(segment.split ? { split: segment.split } : {}),
        ...(segment.transitionIn ? { transitionIn: segment.transitionIn } : {}),
        ...(sfx ? { sfx: sfx.name } : {}),
      };
    }),
    grade, overlays: [], subtitles: document.captions?.file,
    total_duration_s: Number(totalDuration(document).toFixed(3)),
    metadata: { editDocumentVersion: 2, format: document.format, audio: document.audio, overlaysV2: document.overlays },
  } as Edl;
  validateEdl(edl);
  return edl;
}

export async function ensureEditDocument(workDir: string, format: ReelFormat = "voiceover"): Promise<EditDocument> {
  const file = join(workDir, "edit", "document.v2.json");
  const existing = await readFile(file, "utf8").then(JSON.parse).catch(() => null) as EditDocument | null;
  if (existing) { validateEditDocument(existing); return existing; }
  const edl = JSON.parse(await readFile(join(workDir, "edit", "edl.json"), "utf8")) as Edl;
  const document = fromV1(edl, format);
  await writeFile(file, JSON.stringify(document, null, 2));
  return document;
}

export async function applyEditCommandsToProject(workDir: string, commands: EditCommand[], format: ReelFormat = "voiceover"): Promise<EditDocument> {
  const document = applyEditCommands(await ensureEditDocument(workDir, format), commands);
  const edl = JSON.parse(await readFile(join(workDir, "edit", "edl.json"), "utf8")) as Edl;
  await writeFile(join(workDir, "edit", "document.v2.json"), JSON.stringify(document, null, 2));
  await writeFile(join(workDir, "edit", "edl.json"), JSON.stringify(toV1(document, edl.grade), null, 2));
  return document;
}
