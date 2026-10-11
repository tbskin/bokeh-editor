// Agent tool: judge the current render with the deterministic meters. Usage: tsx critique-reel.ts <workDir>
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { critiqueReel, summarizeCritique } from "../critique";
import type { Edl } from "../edl";

const workDir = process.argv[2];
if (!workDir) { console.log(JSON.stringify({ ok: false, error: "usage: critique-reel.ts <workDir>" })); process.exit(1); }

(async () => {
  const editDir = join(workDir, "edit");
  const edl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8")) as Edl;
  const words = (JSON.parse(await readFile(join(editDir, "transcripts", "vo.json"), "utf8")).words ?? []);
  const problems = await critiqueReel({ reelPath: join(editDir, "final.mp4"), edl, words });
  console.log(JSON.stringify({ summary: summarizeCritique(problems), problems }, null, 2));
})().catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
