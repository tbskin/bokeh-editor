#!/usr/bin/env node
// Guard against doc drift: every repo path referenced in the map/readme/agent-guide must still
// exist. Catches the common rot — a module gets renamed or moved and CODEMAP.md quietly lies.
//
// Scope on purpose: we only validate tokens that point at SOURCE (a known top-level dir or a
// root file). Runtime artifacts inside a project data dir (edit/edl.json, plan.json, vo.wav,
// clips/) and placeholders (<id>, globs) are intentionally ignored — they never live at the repo
// root, so checking them would be noise.

import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = ["docs/CODEMAP.md", "README.md", "CLAUDE.md"];

// A token only gets checked if it points at source we actually track.
const ROOT_DIRS = ["backend/", "frontend/", "website/", "shared/", "brand/", "docs/", ".claude/", "scripts/"];
const ROOT_FILES = new Set(["README.md", "CLAUDE.md", "package.json", "railway.json", "pnpm-workspace.yaml"]);

const isSourcePath = (t) => ROOT_FILES.has(t) || ROOT_DIRS.some((d) => t.startsWith(d));
// Placeholders, globs, command fragments — never a literal path on disk.
const looksLiteral = (t) => !/[\s<>*?`@=|]/.test(t) && !t.includes("...");

function candidates(md) {
  // Drop fenced code blocks FIRST. They're command examples we don't validate, and their triple
  // backticks otherwise mis-pair the inline-backtick scan below, silently swallowing real
  // path references that follow a fence (the bug this checker shipped with once).
  const prose = md.replace(/```[\s\S]*?```/g, "");
  const out = new Set();
  // Markdown link targets: [text](target)
  for (const m of prose.matchAll(/\]\(([^)]+)\)/g)) out.add(m[1]);
  // Single-token backtick spans (skips command lines, which contain spaces)
  for (const m of prose.matchAll(/`([^`]+)`/g)) out.add(m[1]);
  return [...out];
}

const missing = [];
for (const doc of DOCS) {
  const abs = join(root, doc);
  if (!existsSync(abs)) { missing.push({ doc, path: doc, note: "doc file itself is missing" }); continue; }
  const md = readFileSync(abs, "utf8");
  for (let raw of candidates(md)) {
    if (raw.startsWith("http") || raw.startsWith("#") || raw.startsWith("mailto:")) continue;
    const t = raw.split("#")[0].replace(/:\d+(-\d+)?$/, "").replace(/\/$/, ""); // strip :line and trailing slash
    if (/\/\.env$/.test(t)) continue; // installer-created, intentionally untracked
    if (!looksLiteral(t) || !isSourcePath(t)) continue;
    if (!existsSync(join(root, t))) missing.push({ doc, path: raw });
  }
}

if (missing.length) {
  console.error(`\n✗ doc drift — ${missing.length} referenced path(s) no longer exist:\n`);
  for (const m of missing) console.error(`  ${m.doc}: ${m.path}${m.note ? `  (${m.note})` : ""}`);
  console.error(`\nUpdate the doc(s) to match the code, or restore the path.\n`);
  process.exit(1);
}
console.log("✓ docs in sync — all referenced source paths exist");
