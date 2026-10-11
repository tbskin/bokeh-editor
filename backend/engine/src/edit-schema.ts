import { z } from "zod";

const id = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/).refine((s) => !["__proto__", "constructor", "prototype", ".", ".."].includes(s));
const sec = z.number().finite().min(0).max(3600);
const duration = z.number().finite().positive().max(120);
const text = z.string().min(1).max(1000);
const position = z.enum(["top", "center", "bottom"]);
const overlay = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), startSec: sec, durationSec: duration, text, position }).strict(),
  z.object({ kind: z.literal("image"), startSec: sec, durationSec: duration, assetId: id, position }).strict(),
  z.object({ kind: z.literal("motion"), startSec: sec, durationSec: duration.max(8), template: z.enum(["kinetic_text", "text_card"]), props: z.object({ text, eyebrow: text.optional() }).strict() }).strict(),
]);
export const commandSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("trim"), segmentId: id, sourceStartSec: sec, durationSec: duration }).strict(),
  z.object({ op: z.literal("remove"), segmentIds: z.array(id).min(1).max(100) }).strict(),
  z.object({ op: z.literal("replace"), segmentId: id, source: id, sourceStartSec: sec, durationSec: duration }).strict(),
  z.object({ op: z.literal("reorder"), segmentIds: z.array(id).min(1).max(100) }).strict(),
  z.object({ op: z.literal("transform"), segmentId: id, scale: z.number().min(1).max(3), x: z.number().min(-1).max(1), y: z.number().min(-1).max(1) }).strict(),
  z.object({ op: z.literal("split"), segmentId: id, source: id, sourceStartSec: sec, side: z.enum(["left", "right"]) }).strict(),
  z.object({ op: z.literal("transition"), segmentId: id, kind: z.enum(["cut", "fade", "crossfade"]), durationSec: sec.max(1).optional() }).strict(),
  z.object({ op: z.literal("addOverlay"), overlay }).strict(),
  z.object({ op: z.literal("removeOverlay"), index: z.number().int().min(0).max(99) }).strict(),
  z.object({ op: z.literal("volume"), target: z.enum(["voice", "music", "source"]), startSec: sec, endSec: sec, gainDb: z.number().min(-60).max(12) }).strict(),
  z.object({ op: z.literal("sfx"), name: id, atSec: sec, gainDb: z.number().min(-60).max(12).optional() }).strict(),
  z.object({ op: z.literal("captions"), file: id, style: id }).strict(),
]);
export const editReplySchema = z.object({ commands: z.array(commandSchema).max(32), summary: text, unsupported: text.optional() }).strict()
  .refine((v) => !v.unsupported || v.commands.length === 0, "Unsupported requests must not contain commands");
export const scriptReplySchema = z.object({ script: z.string().min(1).max(12000), summary: text }).strict();
export const takePlanSchema = z.object({
  storyline: text, selectedCandidateIds: z.array(id).min(1).max(100),
  takeGroups: z.array(z.object({ semanticBeat: text, candidateIds: z.array(id).max(200), selectedCandidateId: z.string().max(100), rejectionReasons: z.record(id, text) }).strict()).max(200),
  compromises: z.array(text).max(50),
}).strict();

export const EDIT_CONTRACT = `Return JSON {"commands":[...],"summary":"one plain sentence","unsupported":"optional reason"}.
Only these commands exist (omit optional fields rather than using null):
trim {segmentId,sourceStartSec,durationSec}; remove {segmentIds}; replace {segmentId,source,sourceStartSec,durationSec}; reorder {segmentIds};
transform {segmentId,scale:1..3,x:-1..1,y:-1..1}; split {segmentId,source,sourceStartSec,side:"left"|"right"};
transition {segmentId,kind:"cut"|"fade"|"crossfade",durationSec?:0..1}; removeOverlay {index};
addOverlay {overlay:{kind:"text",startSec,durationSec,text,position:"top"|"center"|"bottom"}};
addOverlay {overlay:{kind:"image",startSec,durationSec,assetId,position:"top"|"center"|"bottom"}};
addOverlay {overlay:{kind:"motion",startSec,durationSec:0..8,template:"kinetic_text"|"text_card",props:{text,eyebrow?}}};
volume {target:"voice"|"music"|"source",startSec,endSec,gainDb:-60..12}; sfx {name,atSec,gainDb?}; captions {file,style}.
Each command has an "op" field with its name plus only the listed fields. Use existing source/segment IDs and supplied assets. At most 32 commands, 120 seconds of output. Preserve voiceover duration. You cannot edit source media, voiceover, titles in plan.json, files, execute code, fetch URLs, or run shell commands. For those requests return commands:[] and unsupported. Do not claim success without commands.`;
