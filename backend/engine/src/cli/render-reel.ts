// Agent tool: render the current cut. Usage: tsx render-reel.ts <workDir> [--draft|--preview|--final]
import { renderFromEdl, type Quality } from "../assemble-reel";
import { renderTalkingHeadFromEdl } from "../talking-head";
import { probeReel } from "../verify";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const workDir = process.argv[2];
const quality = (process.argv[3]?.replace(/^--/, "") ?? "draft") as Quality;
if (!workDir) { console.log(JSON.stringify({ ok: false, error: "usage: render-reel.ts <workDir> [--draft]" })); process.exit(1); }

const format = await readFile(join(workDir, "edit", "document.v2.json"), "utf8")
  .then((raw) => JSON.parse(raw)?.format).catch(() => "voiceover");
const render = format === "talking_head"
  ? renderTalkingHeadFromEdl({ workDir, quality }).then((out) => ({ reelPath: out.reelPath, masterDuration: out.durationSec }))
  : renderFromEdl({ workDir, quality }).then((out) => ({ reelPath: out.reelPath, masterDuration: out.voDuration }));

render
  .then(async ({ reelPath, masterDuration }) => {
    const info = await probeReel(reelPath);
    console.log(JSON.stringify({ ok: true, reelPath, reelSec: Number(info.durationSec.toFixed(2)), masterSec: Number(masterDuration.toFixed(2)) }));
  })
  .catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
