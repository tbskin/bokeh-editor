// Agent tool: taste-check the current render with the eyes. Usage: tsx watch-reel.ts <workDir>
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { watchReel } from "../watch";
import type { Edl } from "../edl";

const workDir = process.argv[2];
if (!workDir) { console.log(JSON.stringify({ ok: false, error: "usage: watch-reel.ts <workDir>" })); process.exit(1); }

(async () => {
  const editDir = join(workDir, "edit");
  const edl = JSON.parse(await readFile(join(editDir, "edl.json"), "utf8")) as Edl;
  const words = (JSON.parse(await readFile(join(editDir, "transcripts", "vo.json"), "utf8")).words ?? []);
  const problems = await watchReel({ reelPath: join(editDir, "final.mp4"), edl, words });
  console.log(JSON.stringify({ problems }, null, 2));
})().catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
