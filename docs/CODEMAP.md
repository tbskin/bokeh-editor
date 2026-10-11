# Code map

How this repo is laid out, how a reel actually gets made, and where to add things without
spelunking. Written for agents and humans alike.

New here? Start with [README.md](../README.md), the [technical guide](technical-guide.md),
and [third-party notices](third-party-notices.md). This map is the implementation reference.

**Keeping it fresh:** if you add, move, or rename a module, or change the pipeline, update this
file (and README.md if the top-level shape changed) in the same commit. `pnpm check:docs` fails
the build on any path referenced here that no longer exists — run it after editing.

## The 10,000-foot view

pnpm monorepo. Each top-level dir is a deployable (or feeds one):

| Path | What | Deploys to |
| --- | --- | --- |
| `frontend/` | Expo React Native app — thin client, all real work is server-side | Expo Go today, EAS/TestFlight next |
| `backend/api/` | Express HTTP API + job runner (auth, quota, uploads, status) | Railway (auto-deploys on push to main, healthchecked `/api/health`) |
| `backend/engine/` | The editor: eyes, writer, deterministic assembler, refine agent | same backend service |
| `backend/vendor/video-use/` | VENDORED render pipeline (`helpers/render.py` et al) — see its `VENDORED.md` | inside the container |
| `website/` | Next.js marketing site + SEO blog | Vercel (Root Directory = `website`) |
| `shared/` | Reserved for shared TS types (currently just a README) | — |
| `brand/` | Logo/icon assets | — |
| `docs/` | Setup guide, code map, third-party notices | — |

The repo root `.env` (gitignored) holds local secrets; Railway/Vercel hold their own copies.

## The reel pipeline (the product, end to end)

One reel = one project = one server-owned conversation plus immutable source assets. Railway's
volume is job scratch and the legacy-project adapter; new source/output durability is private
Supabase Storage.

1. **Choose format and upload** — `frontend/app/reel/new.tsx` runs the scripted creation
   conversation: format chip, clip picker, then context or a pasted script, then launch. It creates
   the project and routes immediately to `frontend/app/reel/[id]/index.tsx`. The old dedicated
   picker/context screens (`new/index.tsx`, `new/clips.tsx`, `new/idea.tsx`) and their
   `NewReelDraft` context are gone; the conversation is deterministic client script
   (`frontend/src/lib/draftScript.ts`) until clips launch. New uploads reserve stable
   `project_assets` rows and use Supabase's direct TUS hostname, the user JWT, and exact 6 MB
   chunks (`frontend/src/lib/resumableUpload.ts`). The server materializes ready objects into job
   scratch and derives hashes/thumbnails (`backend/api/src/object-storage.ts`). The old
   `/api/uploads` and multipart adapters remain for existing app builds and tests.
2. **Persistent conversation** — `project_messages` is authoritative and ordered; material,
   direction, script, voice choice, reel results, edit requests, and failures survive relaunches and
   devices. `frontend/src/lib/projectThread.ts` keeps only an optimistic/offline display cache.
   Live phase progress stays status-driven instead of creating a message for every tick.
3. **Voiceover prep** — the existing eyes/writer path remains intact:
   `backend/engine/src/analyze.ts` samples clips and `backend/engine/src/plan.ts` applies
   `backend/engine/recipe/plan-reel.md`, producing `analysis.json`, `plan.json`, and `script.md`.
   Direction/script are also appended to the conversation. A creator can record in the existing
   teleprompter or preview their own ElevenLabs cloned voice. Script save/generation use revision
   hashes (`backend/api/src/script-state.ts`); editing words invalidates only stale generated
   narration, and assembly rejects narration from an older revision.
4. **Talking-head first cut** — `backend/engine/src/talking-head.ts` transcribes each source once
   with ElevenLabs word timing and caches by source hash. It segments candidate attempts, groups
   semantically equivalent takes across files, rejects unusable/incomplete takes deterministically,
   and asks the planner to select a coherent hook/body/conclusion without blindly preferring the
   last attempt. Selected and rejected alternatives/reasons remain in the plan for later “use the
   other take” edits. Cut edges use word padding and 30 ms audio fades; captions are rebuilt on the
   output timeline. Submission is permission to render the first cut, with no voice/teleprompter
   branch or extra confirmation.
5. **Shared edit/render layer** — `backend/engine/src/edit-document.ts` adapts old EDLs to v2 and
   validates trim/remove/replace/reorder, silence cuts, transforms/punch-ins, exactly two-source
   split screen, text/image overlays, curated motion, ranged volume, SFX, cut/fade/crossfade, and
   captions. The model proposes commands; `backend/engine/src/harness.ts` validates and applies them.
   Vendored `backend/vendor/video-use/helpers/render.py` performs transforms/layouts/overlays, then
   captions last and audio mix/verification. `backend/engine/src/motion-graphics.ts` exposes only
   typed `kinetic_text` and `text_card` HyperFrames templates, serial alpha-WebM rendering, caching,
   and `OLE_HYPERFRAMES=0` rollback-safe disablement.
6. **Chat edits and undo** — `POST /api/projects/:id/messages` appends the request before work,
   routes voiceover feedback to script revision while awaiting voice, and routes ready-project
   requests to `backend/engine/src/refine.ts`. Unsupported work returns honestly without changing
   the reel. `backend/api/src/checkpoints.ts` snapshots current mutable state, commits exactly one
   previous successful state, rolls failures back, and powers `POST /api/projects/:id/undo`.
7. **Share / save** — the prominent conversation preview supports playback/scrubbing and share.
   Signals land in PostHog alongside format, take-selection, edit, undo, and unsupported-edit events.
   `POST /api/projects/:id/finalize` re-renders the existing cut in HD.

## Where state lives (one project dir)

| File | Written by | Notes |
| --- | --- | --- |
| `clips/` | storage materializer / legacy upload | immutable job input; private sources are retained 14 days |
| `brief.json`, `analysis.json` | analyze | the eyes' understanding |
| `plan.json`, `script.md` | plan | sequence (+`hold`, +`sfx`), `pace`, `titleStyle`, `music`, title/hook/angle alternates; script frontmatter |
| `vo.wav` | vo upload | master audio; never hand-edited |
| `vo.meta.json` | cloned-voice synthesis | exact word timings + the script revision used |
| `edit/talking-head.candidates.json`, `edit/talking-head.plan.json` | take selection | retained alternatives, issues, choices, and rejection reasons |
| `edit/edl.json` (+ `edl.base.json`) | assemble | the cut; base = untouched fallback |
| `edit/document.v2.json` | adapter / apply-edit | format-aware shared edit document and agent command target |
| `edit/master.srt`, `edit/title.ass` | assemble | captions from VO; title card — agents must never edit |
| `edit/final.mp4`, `edit/cover.jpg` | render | the reel; first-frame cover (title visible) |
| `edit/critique.json`, `trace/` | loop/refine | quality judgment; agent traces |
| `.ole-checkpoints/previous/` | edit transaction | exactly one undo state; no version list or redo |
| `status.json` | jobs.ts | write-through job status (survives restarts) |
| `prep-request.json` | POST /prep | the prep args, persisted so boot recovery can replay a restart-killed prep |
| `resume-attempt.json` | boot sweep | marks one auto-resume per orphan (stops crash loops); cleared when the job settles |
| `AGENTS.md`, `edit/project.md` | assemble | standing context for any agent working here |

## backend/api — the HTTP layer

| File | Job |
| --- | --- |
| `backend/api/src/server.ts` | all routes; multer upload limits; human error messages (+ machine `code` when the app routes on it) |
| `backend/api/src/uploads.ts` | resumable tus upload endpoint (auth + ownership hooks, moves finished files into `clips/`, sweeps stale partials in `data/_tus`) |
| `backend/api/src/jobs.ts` | one-job-per-project runner; status persistence; boot restart-recovery (orphaned jobs resume once or become honest retryable errors); `hooks_generated` tracking; folds each take's measured pace into the creator profile |
| `backend/api/src/object-storage.ts` | private project-media materialization, thumbnails, output upload/read, and 14-day source retention |
| `backend/api/src/checkpoints.ts` | transactional edit snapshot/rollback and one-step undo |
| `backend/api/src/script-state.ts` | optimistic script revisions and stale generated-voice protection |
| `backend/api/src/profiles.ts` | per-creator learned parameters (`data/_profiles/<uid>.json`, e.g. speaking wps, cloned-voice `voiceId`/consent) — the account-level closed loop |
| `backend/api/src/store.ts` | disk layout, VO normalization, clip placement, source pruning |
| `backend/api/src/voice.ts` | cloned-voice routes mounted at `/api/voice` — `GET /` (status), `POST /setup`, `DELETE /`; ElevenLabs `addVoice`/`deleteVoice`; `voiceId`/`consentAt` stored on creator profile |
| `backend/api/src/auth.ts` | Supabase JWT verify via JWKS; daily quota (`OLE_DAILY_LIMIT`, default 5) |
| `backend/api/src/db.ts` | Postgres (Supabase) — projects/formats, persistent messages, stable assets, ownership, quotas, signals |
| `backend/api/migrations/002_formats_messages_assets.sql` | dual-format fields, messages/assets tables, private bucket and ownership RLS |
| `backend/api/src/telemetry.ts` | server-side PostHog `track()` — must never throw |
| `backend/api/src/dev-viewer.ts` + `dev-viewer.html` | localhost:4700 analysis viewer — clip video beside what the eyes understood, exact sampled frames, live prompt (`pnpm --filter @ole/api viewer`) |

## backend/engine — the editor

| File | Job |
| --- | --- |
| `backend/engine/src/eyes.ts` | frame sampling, OpenAI vision call, `buildPrompt`, `callChat` (shared, retrying) |
| `backend/engine/src/analyze.ts` | per-clip analysis fan-out → `analysis.json` |
| `backend/engine/src/plan.ts` | writer call + humanizer pass + script gate → `plan.json`/`script.md` (drafts kept: `script.raw.md` pre-humanizer, `script.pregate.md` pre-critic) |
| `backend/engine/src/script-critic.ts` | the script gate: deterministic checks (exemplar lift, label echo) + model checklist, one rewrite max → `script-critique.json` meter |
| `backend/engine/recipe/plan-reel.md` | THE script doctrine: plain real speech, hook-first opener, on-screen title spec |
| `backend/engine/src/assemble-reel.ts` | deterministic cut: anchored timeline fit (`matchAnchor`)/pace/polish, EDL, captions, title card (`buildTitleAss`), ending, mux, cover |
| `backend/engine/src/clean-vo.ts` | take cleaner: dead-air + re-take cuts before the fit (modular for talking-head) |
| `backend/engine/src/assemble-loop.ts` | draft → judge → (only if failing) validated JSON edit pass |
| `backend/engine/src/critique.ts` | deterministic quality meters (min-clip, max-hold, cut-on-beat...) |
| `backend/engine/src/watch.ts` | model-eyes judgment of a rendered reel |
| `backend/engine/src/verify.ts` | ffprobe sanity checks (duration, vertical, streams) |
| `backend/engine/src/edl.ts` | EDL schema + validation |
| `backend/engine/src/edit-document.ts` | v2 shared document, v1 adapter, validated deterministic edit commands |
| `backend/engine/src/talking-head.ts` | transcription cache, candidate/group model, clean-take selection, assembly and semantic quality gates |
| `backend/engine/src/motion-graphics.ts` | typed/cached/serial HyperFrames templates plus static alpha overlays |
| `backend/engine/src/tighten.ts` | the one sanctioned VO shorten: cut a timeline span (audio+video+captions together) |
| `backend/engine/src/refine.ts` | the refine agent run + closing summary for the app's chat |
| `backend/engine/src/tts-vo.ts` | ElevenLabs text-to-speech (creator's cloned voice) straight to `vo.wav` — the generate-instead-of-record alternative |
| `backend/engine/src/harness.ts` / `runtime.ts` | structured JSON editor; allowlisted context, no shell or filesystem tools |
| `backend/engine/src/tools.ts` | developer CLI command helpers; not exposed as model tools |
| `backend/engine/src/telemetry.ts` | `$ai_generation` LLM analytics events |

Vendored render pipeline: `backend/vendor/video-use/helpers/render.py` owns the visual render
(concat, HDR→SDR tonemap, caption burn) — never hand-write ffmpeg in an agent path; fonts ship in
`backend/vendor/fonts/` and are installed by `backend/Dockerfile`.

## frontend — the Expo app

Screens (`frontend/app/`): `index.tsx` project/status hub → `reel/new.tsx`, the scripted creation
conversation (format chip, clip picker, context or pasted script, then launch — the old
`new/index.tsx` + `new/clips.tsx` + `new/idea.tsx` picker/context flow and its `NewReelDraft`
context are gone) → `reel/[id]/index.tsx`, a full-height conversation (assistant-ui) with
quick-reply chips, a live progress bubble, and the reel playing in-thread as a poster card →
fullscreen player sheet (share/HD/undo); no pinned status/error/voice cards above it.
Voiceover-only `reel/[id]/record.tsx` owns the editable
teleprompter, recording, generated-voice preview, and automatic assembly after voice acceptance —
it now presents modally over the conversation and dismisses back to it.
`voice-setup.tsx` (one-time cloned-voice consent + sample recording, reachable from the record
screen), `login.tsx` (Supabase email OTP), `onboarding.tsx`, `settings.tsx`, `_layout.tsx`
(providers).

Lib (`frontend/src/lib/`): `api.ts` (format/project/message/asset/script/undo calls),
`projectThread.ts` (server-authoritative conversation + optimistic AsyncStorage cache),
`jobStore.tsx` (client job state machine + persisted lifecycle recovery),
`generateVoState.ts` (pure state for the record screen's generated-take branch — idle/generating/
ready, and any script edit invalidates a ready take back to idle), `presentState.ts` (THE
pure presenter every surface renders from) + `pollStatus.ts` (contract polling), `projects.tsx` (local project list), `auth.tsx` +
`supabase.ts`, `analytics.ts` (PostHog), `compress.ts` (client-side video optimize before upload),
`config.ts` (base URL), `types.ts`.

Theme (`frontend/src/theme/`): light-only tokens (`#F7F7FB` background, graphite actions), dark
status-bar content, Schibsted Grotesk, and the component kit. Shared native controls (headers, icon
buttons, text fields, segmented controls) live in `frontend/src/theme/components/Controls.tsx`. The
project conversation renders through assistant-ui's external-store runtime in
`frontend/src/theme/components/AssistantChat.tsx` (server-owned `project_messages` stay
authoritative; chips, the live progress bubble, and the reel poster card all render inside the
thread). The website is separately warm-editorial (`#F6F1E8` background, `#A8600A` accent), also light-only.

Verify on a physical iPhone via Expo Go (`npx expo start` in `frontend/`) — tsc + bundle is not
proof; there is no simulator here.

## website — marketing + blog

Static Next.js (`website/app/page.tsx`, `faq/`, `blog/` — one dir per post). Existing layout,
motion, reel wall, content and SEO are preserved under the light warm-editorial palette. Deploys
to Vercel.

## Conventions that keep this sane

- **Decisions vs execution:** models decide (plan, critique verdicts, refine intents);
  deterministic code executes (timeline math, rendering, muxing). New capability = new data in
  `plan.json`/EDL + code that honors it, not a freer agent.
- **Script doctrine lives in one place** (`backend/engine/recipe/plan-reel.md`) — plain real
  speech; the hook is the most interesting TRUE thing said first, never copywriter-clever.
- **User-facing errors are human sentences**, with a machine `code` only when the app must route
  recovery (`vo_missing` → back to record).
- **Telemetry never throws** and never blocks; everything lands in PostHog (one founder dashboard).
- **Engine logic is pure-function tested** (`backend/engine/test/`, vitest); ffmpeg-touching code
  gets tiny-fixture tests.

## Recipes

- **New API route:** `backend/api/src/server.ts` (auth is already applied under `/api/projects`);
  long work goes through `backend/api/src/jobs.ts` so status/persistence/telemetry come free.
- **New pipeline step:** engine module + export via `backend/engine/src/index.ts`; call it from
  `jobs.ts`; write artifacts into the project dir; add a phase string the app can show.
- **New app screen:** `frontend/app/<route>.tsx` (expo-router), components from
  `frontend/src/theme/`, server calls in `frontend/src/lib/api.ts`.
- **New tracked event:** server `track()` in `backend/api/src/telemetry.ts` callers; app
  `frontend/src/lib/analytics.ts`; LLM calls auto-tracked via `callChat`.
- **New edit capability:** add a strict command schema in `backend/engine/src/edit-schema.ts`,
  implement deterministic execution, and test rejection and rollback behavior. Never expose a shell.

## Env vars

| Var | Where | Meaning |
| --- | --- | --- |
| `OPENAI_API_KEY` | engine | vision, writing, structured editing |
| `OLE_EYES_MODEL` / `OLE_PLAN_MODEL` / `OLE_HUMANIZER_MODEL` / `OLE_EDITOR_MODEL` | engine | model overrides (defaults: gpt-5-mini / gpt-5.5 / gpt-5.5 / gpt-5.5) |
| `OLE_CRITIC_MODEL` | engine | script-gate critic model (default gpt-5-mini; rewrite uses `OLE_PLAN_MODEL`) |
| `OLE_ASSEMBLE_LOOP` | engine | `0` = plain deterministic render, no judge/polish |
| `OLE_HYPERFRAMES` | engine | `0` disables curated motion overlays; failures always roll an edit back |
| `OLE_TALKING_HEAD` | api/app | `0` removes talking head from capabilities and rejects creation during staged rollout |
| `OLE_VO_VOICE_CHAIN` | engine | phone-mic cleanup ffmpeg filter chain ahead of the loudness master (default highpass+denoise; empty = bypass) |
| `OLE_MUSIC_BED_GAIN` | engine | music bed volume before sidechain ducking under the voiceover (default 0.45) |
| `OLE_MUSIC_DUCK_THRESHOLD` | engine | sidechain ducking threshold that pulls the music bed down under speech (default 0.05) |
| `OLE_MUSIC_DUCK_RATIO` | engine | sidechain ducking compression ratio under speech (default 2) |
| `OLE_SFX_TARGET_PEAK_DB` | engine | true-peak target each SFX one-shot is normalized to before its artistic offset (default -3) |
| `OLE_ANALYZE_CONCURRENCY`, `OLE_CHAT_BACKOFF_MS`, `OLE_VIDEO_USE_DIR`, `UV_CACHE_DIR` | engine | tuning/infra knobs |
| `OLE_MUSIC_DIR` / `OLE_SFX_DIR` | engine | optional absolute paths to installer-owned audio libraries and their manifests |
| `OLE_DATA` | api | project data root (persistent backend volume) |
| `ELEVENLABS_API_KEY` | api/engine | cloned-voice setup + generate-vo synthesis; unset = feature off (`canGenerateVo` stays false) |
| `OLE_DAILY_LIMIT` | api | reels/user/day (default 5) |
| `OLE_MAX_UPLOAD_MB`, `PORT`, `OLE_VIEWER_PORT` | api | limits/ports |
| `OLE_DIRECT_MEDIA_MAX_MB` | api | max size (MB) for a direct-to-storage asset before the client falls back to the standard upload (default 50) |
| `DATABASE_URL`, `SUPABASE_URL` | api | Supabase Postgres + JWKS issuer |
| `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_TUS_URL` | api | modern server-only private object key, legacy fallback, and optional direct-TUS host override |
| `POSTHOG_API_KEY`, `POSTHOG_HOST` | api/engine | server-side analytics (keyless = no-op) |
| `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_LOCAL_API_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` | app | client keys (publishable only) |

## Build / run / deploy

```bash
pnpm install                                   # workspace deps
pnpm --filter @ole/api dev                     # API on :8787 (reads root .env)
pnpm --filter @ole/api viewer                  # analysis viewer on :4700
cd frontend && npx expo start                  # app via Expo Go (physical iPhone)
pnpm --filter @ole/engine test                 # engine suite (vitest)
pnpm --filter @ole/api test && pnpm --filter @ole/frontend test
pnpm check:docs                                # this file's paths still exist?
# Deployment is configured separately by each installer.
```
