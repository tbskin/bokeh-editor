# Self-hosting Bokeh Editor

Each installation uses its own service accounts. No database, storage bucket, Expo project,
analytics account, or hosted API is shared with the product at trybokeh.com.

## Requirements

| Component | Requirement |
| --- | --- |
| Workspace | Git, Node.js 22.13+, pnpm 11.1.0, committed lockfile |
| Backend | Long-running service with persistent writable disk, CPU/RAM for video rendering |
| Media tools | FFmpeg/ffprobe with captions, Python 3.10+, uv, Fontconfig, Montserrat SemiBold |
| Motion graphics | HyperFrames and its matching Chromium, or `OLE_HYPERFRAMES=0` |
| Auth/data | Your Supabase project: email OTP, Postgres, private Storage |
| Model services | Your OpenAI and ElevenLabs API keys and billing |
| Mobile | Physical phone with compatible Expo Go or your own development build |

No Codex CLI or account is required. AI edits use direct API requests returning validated JSON.

## 1. Install and configure

```sh
git clone https://github.com/tbskin/bokeh-editor.git
cd bokeh-editor
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
cp frontend/.env.example frontend/.env
```

The API loads the root `.env`; Expo loads `frontend/.env`. Fill empty required values with your
own credentials. Keep one `NAME=value` per line without inline comments for Docker compatibility.
Both files are ignored by Git and excluded from Docker builds.

## 2. Create your Supabase project

Enable email sign-in and configure the email template to include a six-digit one-time code.
The app accepts codes, not magic links. Use an asymmetric Supabase signing key supported by
public JWKS verification.

Apply these files in order in your project's SQL editor:

1. [`001_projects.sql`](../backend/api/migrations/001_projects.sql)
2. [`002_formats_messages_assets.sql`](../backend/api/migrations/002_formats_messages_assets.sql)

These create tables, ownership policies, and the private `project-media` bucket. Check both
migrations completed successfully. Do not make the bucket public.

Set root `.env` values:

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Your project's HTTPS URL |
| `SUPABASE_SECRET_KEY` | Server-only secret key for private Storage |
| `DATABASE_URL` | Your Postgres connection string including its password; use a reachable pooler if needed |
| `OPENAI_API_KEY` | Your key for vision, planning, and structured editing |
| `ELEVENLABS_API_KEY` | Your key for transcription and optional cloned narration |
| `OLE_TALKING_HEAD` | `0` initially; `1` to test the experimental talking-head workflow |

`SUPABASE_SERVICE_ROLE_KEY` is a legacy alternative to `SUPABASE_SECRET_KEY`. Never place either
in the mobile app. In `frontend/.env`, use the same project's URL and its **publishable** client
key for `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The app shows a
setup error when these are missing. Authentication and RLS protect data; a publishable key
alone is intentionally not secret.

## 3. Prepare the backend runtime

### Docker

The [Dockerfile](../backend/Dockerfile) installs media tools, fonts, the Python environment,
and the rendering browser. Build from the repository root:

```sh
docker build -f backend/Dockerfile -t bokeh-backend .
docker volume create bokeh-data
docker run --rm --name bokeh-backend \
  --env-file .env -e PORT=8787 -e OLE_DATA=/data \
  -p 8787:8787 -v bokeh-data:/data bokeh-backend
```

The process runs as the `node` user (UID 1000). New named volumes inherit the image's directory
permissions; an existing volume or bind mount must be writable by UID 1000. Keep the data volume
and its backups private. Do not remove it while it contains needed projects.

### Native development

Install FFmpeg/ffprobe, Python, uv, and Fontconfig through your platform's package manager.
Install the bundled Montserrat font and its static SemiBold instance using the fonttools
commands in the Dockerfile. Then:

```sh
uv sync --frozen --project backend/vendor/video-use
pnpm --filter @ole/engine exec hyperframes browser ensure
pnpm --filter @ole/api dev
```

Set `OLE_HYPERFRAMES=0` to test without motion graphics. The API listens on **8787** unless
`PORT` overrides it. In another terminal:

```sh
curl http://localhost:8787/api/health
```

Expect `ok: true` and `db: true`. This confirms the process and database connection; still test
Storage permissions, model access, and a real render. The optional `pnpm --filter @ole/api viewer`
development viewer exposes local media/analysis on port 4700; keep it on a trusted machine.

## 4. Connect a phone

Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your backend, such as
`http://192.168.1.20:8787` for development or your HTTPS domain for deployment. The fallback is
localhost, never Bokeh's hosted API. On a phone, localhost means the phone itself. Use the same
reachable network and allow the API port through your firewall. An Expo tunnel forwards the
JavaScript bundle, not your backend.

`EXPO_PUBLIC_LOCAL_API_URL` optionally supplies a second address for the development Settings
selector. Restart Expo after changing environment variables; an existing app may also have a
saved Settings override.

```sh
pnpm --filter @ole/frontend start
```

Sign in to your Supabase project by email code, upload short test clips, record narration,
render, play, and save/share. Native compression may be unavailable in Expo Go; the app falls
back to the original file. Use a development build for the native compression path.

For EAS, link your own project and choose unique bundle/package IDs. The checked-in IDs are
placeholders. See [mobile distribution](../frontend/DISTRIBUTION.md). Test on a physical device;
unit tests and successful bundling are not substitutes.

## Website and optional services

```sh
pnpm --filter @ole/website dev
pnpm --filter @ole/website build
```

The Next.js site runs separately on port 3000 and does not render videos. For Vercel, choose
`website` as the root directory. The site retains Bokeh's branding, blog, and canonical domain;
change them for your own product before publishing a fork.

- `NEXT_PUBLIC_WEB3FORMS_KEY`: your optional waitlist account. Without it, the UI links to the
  source project and sends no signup requests.
- `NEXT_PUBLIC_VERCEL_ANALYTICS=1`: opt into analytics for your deployment.
- `POSTHOG_API_KEY` / `EXPO_PUBLIC_POSTHOG_KEY`: optional backend/mobile telemetry; blank disables it.

## Editing and media

The editor model receives allowlisted project context and proposes JSON commands. Application
code rejects unknown operations, unexpected fields, invalid timings, source IDs, and file paths,
then runs the trusted renderer. No shell or arbitrary file tools are exposed. Script revision
and take selection also return validated data to fixed output files. Model calls have timeouts.

Supported chat edits cover timeline cuts, reorder/replace, transforms, split screens, transitions,
overlays, volume, optional SFX, and existing caption settings. Direct source/voiceover rewriting,
arbitrary FFmpeg commands, and generated executable motion code are unsupported.

No music, SFX, or private demonstration footage is included. See the
[music](../backend/engine/assets/music/README.md) and [SFX](../backend/engine/assets/sfx/README.md)
guides to add files you are allowed to use. Source redistribution requires separate permission.

## Deployment and data

Deploy the API as a long-running container/service with persistent storage, not a short-lived
Vercel function. This repository has no connection to the hosted product's deployments.
Jobs currently run in the API process. Check the health endpoint's `jobs` count before restarting;
boot recovery can resume some work but cannot make every render interruption free.

| Data | Location |
| --- | --- |
| Sign-in/session | Supabase Auth; mobile session stored in SecureStore |
| Ownership, status, conversation, asset metadata | Your Postgres database |
| New source assets and outputs | Private Supabase Storage |
| Working media, frames, transcripts, edit plans, traces, profiles, legacy projects | Your backend data volume |

Source retention is 14 days in the current pruning code. Keep originals elsewhere. Logs and
traces may contain private creator text and must not be committed or attached to public issues.
OpenAI and ElevenLabs process the inputs needed for their features. Review optional telemetry
before enabling it for sensitive footage.

The removal of model shell access does not constitute a full hosting security certification.
The service still processes untrusted media with native tools. Apply OS/container resource limits,
TLS, access controls, backups, provider spending limits, and a security review before accepting
untrusted users. Do not mount unrelated host files or privileged sockets into the container.

## Checks and troubleshooting

```sh
pnpm -r test
pnpm --filter @ole/engine typecheck
pnpm --filter @ole/api typecheck
pnpm --filter @ole/frontend exec tsc --noEmit
pnpm --filter @ole/website exec tsc --noEmit
pnpm --filter @ole/website build
pnpm check:docs
pnpm audit
```

- **App cannot connect:** check API URL reachability from the phone, saved Settings overrides,
  firewall, and whether Expo was restarted after changing variables.
- **Sign-in fails:** check both apps use the same Supabase URL, email codes are configured,
  and JWKS/asymmetric signing is enabled.
- **Health reports `db: false`:** check database credentials, pooler host/port, and network access.
- **Captions or rendering fail:** verify FFmpeg/libass, Montserrat SemiBold, uv/Python, and the
  HyperFrames browser installation. Inspect private job logs locally.
- **No music:** expected unless you supplied licensed assets.

The [code map](CODEMAP.md) identifies modules and environment overrides.
