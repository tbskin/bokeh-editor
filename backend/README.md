# backend

**One deployment.** A single container (see the repo README) that serves the API *and* runs the
engine. Split into two modules for a clean boundary — not two deploys:

- `api/` — control plane: auth, projects, persistent conversation, private assets, job enqueue +
  status, checkpoints, and undo. Fast request/response.
- `engine/` — the editing runtime: format-specific planning plus validated shared edit commands,
  vendored video-use rendering, and curated HyperFrames overlays. Runs the heavy work
  (understand/transcribe → choose → cut → render → verify) as background jobs.

The container image installs FFmpeg + headless Chrome + Python + Node. Deploys to a container host
(Railway / Render / Fly / a VM) — not Vercel serverless. At scale, `engine` can later move to
isolated render workers; not needed for the MVP.
