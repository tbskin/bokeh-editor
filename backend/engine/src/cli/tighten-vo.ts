// Agent tool: cut a dead span out of the TIMELINE (voice + captions + cut together).
// Usage: tsx tighten-vo.ts <workDir> <fromSec> <toSec>   — then re-render with the render tool.
import { cutVoSpan } from "../tighten";

const [workDir, from, to] = process.argv.slice(2);
const fromSec = Number(from);
const toSec = Number(to);
if (!workDir || !Number.isFinite(fromSec) || !Number.isFinite(toSec)) {
  console.log(JSON.stringify({ ok: false, error: "usage: tighten-vo.ts <workDir> <fromSec> <toSec>" }));
  process.exit(1);
}

cutVoSpan({ workDir, fromSec, toSec })
  .then(({ newVoSec, removedSec }) =>
    console.log(JSON.stringify({ ok: true, removedSec: Number(removedSec.toFixed(3)), voSec: Number(newVoSec.toFixed(3)) })))
  .catch((e) => { console.log(JSON.stringify({ ok: false, error: String(e) })); process.exit(1); });
