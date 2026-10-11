<p align="center"><img src="brand/icon-192.png" alt="Bokeh" width="88" /></p>
<h1 align="center">Bokeh Editor</h1>
<p align="center"><strong>Your clips. Your voice. A finished reel.</strong></p>
<p align="center">
  <a href="https://trybokeh.com">Website</a> ·
  <a href="#what-it-does">Features</a> ·
  <a href="#getting-started">Get started</a> ·
  <a href="docs/technical-guide.md">Self-hosting guide</a> ·
  <a href="CONTRIBUTING.md">Contribute</a>
</p>

Bokeh is an AI video editor for short-form content. Bring clips from your phone, describe what
you want to make, and work with an editor in a conversation. Bokeh helps write a voiceover,
chooses and cuts footage, adds captions, and renders a vertical video you can save or share.
Ask for a change in chat to keep editing.

This repository contains the **Expo mobile app, video-editing backend, and Next.js website**.
The hosted product is at [trybokeh.com](https://trybokeh.com). You can run this source independently
with your own Supabase project, backend, and model API keys. Nothing defaults to the hosted
product's service accounts.

**Status:** early developer release. Voiceover editing is the primary workflow; talking-head
editing is experimental and off by default. Self-hosting requires paid API services and a video
processing environment. Expect rough edges; this is not a one-click desktop editor.

## What it does

| Workflow | You bring | Bokeh does |
| --- | --- | --- |
| **Voiceover reel** | B-roll, an idea or script, and your narration | Understands the footage, proposes a script, fits shots to your voice, and adds captions and titles |
| **Talking-head reel** *(experimental)* | Recordings of you speaking, including repeated takes | Transcribes the recordings, compares takes, and selects a coherent first cut |

- **Your voice:** record with the in-app teleprompter, or optionally set up an ElevenLabs clone
  of your own voice with consent.
- **Chat edits:** trim or reorder shots, replace a segment, add punch-ins, split screens,
  captions, text/image overlays, curated motion graphics, transitions, and ranged volume changes.
- **Saved projects:** conversations, source assets, progress, and results persist across sessions.
- **Undo and share:** undo the previous edit, request an HD render, then save or share the result.

Music and sound-effect support is present, but audio files are **not bundled**. Add your own
licensed files using the [asset guide](backend/engine/assets/music/README.md). The renderer
works without them. Website reel cards are original abstract illustrations, not customer results.

The editor accepts a bounded set of validated commands. It cannot execute arbitrary code, fetch
assets from a URL, rewrite source media, or perform every edit a full desktop NLE supports.
Unsupported requests return an explanation. Review generated scripts and videos before posting.

## The workflow

1. **Choose clips** and explain the story, or paste a script you already have.
2. **Review the script** and record narration for a voiceover reel. Talking-head reels use the
   speech in the uploaded footage.
3. **Watch the first cut**, then ask for changes in the conversation.
4. **Render and share** when you are happy with the result.

## Getting started

### Website preview — no API keys needed

Install Git, **Node.js 22.13+**, and **pnpm 11.1.0**. Then:

```sh
git clone https://github.com/tbskin/bokeh-editor.git
cd bokeh-editor
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @ole/website dev
```

Open [localhost:3000](http://localhost:3000). This starts the marketing website; video editing
runs through the mobile app and backend below. The optional waitlist and analytics are disabled
until you configure your own accounts.

### Run the editor

You need your own **Supabase project**, **OpenAI key**, **ElevenLabs key**, and a backend with
persistent disk and FFmpeg/Python support. The [self-hosting guide](docs/technical-guide.md)
covers the complete setup, migrations, Docker/native runtime, and phone connection.

```sh
cp .env.example .env
cp frontend/.env.example frontend/.env
# Fill both files with your own values and apply the Supabase migrations.
# Prepare the media runtime using the self-hosting guide, then:
pnpm --filter @ole/api dev
pnpm --filter @ole/frontend start
```

Run the last two commands in separate terminals. On a physical phone, set
`EXPO_PUBLIC_API_URL` to your computer's reachable LAN address or your deployed HTTPS API.
`localhost` on the phone refers to the phone itself.

| Configuration | Belongs where |
| --- | --- |
| OpenAI, ElevenLabs, Supabase **secret** key, Postgres password | Root `.env` / backend host only |
| API URL, Supabase URL and **publishable** key | `frontend/.env` / your EAS environment |
| Optional Web3Forms and Vercel analytics | `website/.env` / your website deployment |

No shared demo credentials are supplied. Never put a server secret in an `EXPO_PUBLIC_*` or
`NEXT_PUBLIC_*` variable. For store builds, link your own Expo project and replace the placeholder
app IDs; see [mobile distribution](frontend/DISTRIBUTION.md).

## How it works

```text
Expo app → authenticated Express API → editing engine → FFmpeg / Python / HyperFrames
                    ↕                       ↕
         Supabase Auth, DB, Storage    OpenAI + ElevenLabs
```

The engine analyzes sampled video frames, writes or revises a script, and constructs an edit
plan. Deterministic code builds the timeline, renders video, mixes audio, and verifies the output.
For chat edits, the model proposes JSON commands; application code validates them and applies
only supported operations. The model has no shell or filesystem tools.

| Directory | Contents |
| --- | --- |
| [`frontend/`](frontend/) | Expo / React Native app, authentication, project conversations, recording and sharing |
| [`backend/api/`](backend/api/) | Express API, ownership checks, uploads, jobs, persistence, and SQL migrations |
| [`backend/engine/`](backend/engine/) | Analysis, scripts, edit documents, structured editing, rendering and verification |
| [`backend/vendor/`](backend/vendor/) | Vendored video-use helpers and caption fonts with their licenses |
| [`website/`](website/) | Next.js marketing site and blog |
| [`shared/`](shared/) | API types shared with the client |
| [`docs/CODEMAP.md`](docs/CODEMAP.md) | Detailed module map and environment reference |

Package names retain the internal `@ole/*` namespace; the public project is Bokeh Editor.

## Privacy, costs, and deployment

Source footage, transcripts, project conversations, intermediate renders, and output videos are
private application data. They belong in your own storage and backend data volume, never Git.
OpenAI receives the frames and text needed for analysis/editing; ElevenLabs receives audio for
transcription or voice features. Optional PostHog telemetry is off when keys are unset.

Running the editor incurs your providers' model, transcription, storage, and compute charges.
Source retention is currently 14 days; retain originals separately. This is an early application,
not a hardened public multi-tenant hosting platform. Use resource limits, backups, appropriate
access controls, and a deployment review before opening an instance to untrusted users. See
[security](SECURITY.md) and [deployment details](docs/technical-guide.md#deployment-and-data).

## Development

```sh
pnpm -r test
pnpm --filter @ole/engine typecheck
pnpm --filter @ole/api typecheck
pnpm --filter @ole/frontend exec tsc --noEmit
pnpm --filter @ole/website exec tsc --noEmit
pnpm --filter @ole/website build
pnpm check:docs
```

Rendering tests need FFmpeg. Mobile changes also need a physical-device
upload/record/render/share check; a successful bundle does not prove those flows work.
See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

Original project code is [MIT licensed](LICENSE), copyright TourByte Inc. Third-party code,
fonts, and installed dependencies keep their own licenses. GSAP uses its separate Standard No
Charge license; native media tools can carry LGPL/GPL obligations. See
[third-party notices](docs/third-party-notices.md) and [NOTICE](NOTICE). The license does not grant
rights to use Bokeh's trademarks or access the hosted product's infrastructure.
