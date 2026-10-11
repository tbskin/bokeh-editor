import express from "express";
import { join, resolve } from "node:path";
import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { buildEyesPrompt, frameTimestamps, parseScriptMd } from "@ole/engine";

// Dev-only analysis viewer: what the eyes saw vs. what they understood, per project. Run it next to
// the API (`pnpm viewer`), open http://localhost:4700. Reads the same data dir the API writes; no
// auth because it binds to localhost and exists for the founder's own machine. NOT for prod.
const DATA = process.env.OLE_DATA ?? join(process.cwd(), "data");
const PORT = Number(process.env.OLE_VIEWER_PORT ?? 4700);

const app = express();

const readJson = async (p: string) => JSON.parse(await readFile(p, "utf8"));
const maybeJson = (p: string) => readJson(p).catch(() => null);
const maybeText = (p: string) => readFile(p, "utf8").catch(() => null);

// Projects that have an analysis.json, newest first.
app.get("/api/list", async (_req, res) => {
  const ids = (await readdir(DATA).catch(() => [] as string[])).filter((d) => !d.startsWith("_"));
  const rows = [];
  for (const id of ids) {
    const p = join(DATA, id, "analysis.json");
    if (!existsSync(p)) continue;
    const [s, brief, plan] = await Promise.all([stat(p), maybeJson(join(DATA, id, "brief.json")), maybeJson(join(DATA, id, "plan.json"))]);
    rows.push({ id, analyzedAt: s.mtimeMs, context: brief?.context ?? brief?.topic ?? null, title: plan?.title ?? plan?.angle ?? null });
  }
  rows.sort((a, b) => b.analyzedAt - a.analyzedAt);
  res.json(rows);
});

// Everything the understanding layer produced for one project, plus what the writer made of it.
app.get("/api/project/:id", async (req, res) => {
  const dir = join(DATA, req.params.id);
  if (!existsSync(join(dir, "analysis.json"))) return res.status(404).json({ error: "no analysis.json" });
  const [analysis, brief, plan, scriptMd] = await Promise.all([
    readJson(join(dir, "analysis.json")),
    maybeJson(join(dir, "brief.json")),
    maybeJson(join(dir, "plan.json")),
    maybeText(join(dir, "script.md")),
  ]);
  const context = brief?.context ?? brief?.topic ?? undefined; // old projects on disk say `topic`
  const clips = (analysis.clips ?? []).map((c: { file: string; durationSec: number }) => ({
    ...c,
    // The exact moments the eyes sampled, and the exact prompt they ran with — live from the engine.
    eyeFrames: frameTimestamps(c.durationSec),
    prompt: buildEyesPrompt(c.file, c.durationSec, frameTimestamps(c.durationSec), context),
  }));
  res.json({ id: req.params.id, summary: analysis.summary, clips, brief, plan, script: scriptMd ? parseScriptMd(scriptMd).script : null });
});

// The clip video itself (express sendFile handles Range requests for <video>).
app.get("/clip/:id/:file", (req, res) => {
  const p = resolve(join(DATA, req.params.id, "clips", req.params.file));
  if (!p.startsWith(resolve(DATA))) return res.status(400).end();
  res.sendFile(p);
});

app.get("/", async (_req, res) => {
  res.type("html").send(await readFile(new URL("./dev-viewer.html", import.meta.url), "utf8"));
});

app.listen(PORT, "127.0.0.1", () => console.log(`analysis viewer: http://localhost:${PORT} (data: ${DATA})`));
