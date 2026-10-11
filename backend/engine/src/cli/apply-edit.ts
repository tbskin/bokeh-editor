import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applyEditCommandsToProject, type EditCommand, type ReelFormat } from "../edit-document";

const workDir = resolve(process.argv[2] ?? ".");
const commandsFile = process.argv[3];
if (!commandsFile) throw new Error("usage: apply-edit.ts <work-dir> <commands.json>");
const commands = JSON.parse(await readFile(resolve(workDir, commandsFile), "utf8")) as EditCommand[];
const format = (process.argv[4] ?? "voiceover") as ReelFormat;
const document = await applyEditCommandsToProject(workDir, commands, format);
console.log(JSON.stringify({ ok: true, segments: document.segments.length, overlays: document.overlays.length }));
