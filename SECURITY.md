# Security

Bokeh Editor is early software. The public source can be evaluated independently; it does not
provide access to the hosted product's infrastructure or a security certification for deployment.

## Report a vulnerability

Use [GitHub's private vulnerability reporting](https://github.com/tbskin/bokeh-editor/security/advisories/new)
for this repository. Include the affected version, reproduction steps, impact, and a redacted
example. Do not post credentials, private footage, transcripts, or user data in public issues.

Only the latest `main` is currently maintained. There is no guaranteed response-time commitment.

## Deployment boundary

The AI editor proposes schema-validated JSON. It has no shell, arbitrary filesystem tools, or
access to environment variables. Application code selects context, applies commands, and renders.
This reduces prompt-injection impact; it does not make the model's editorial decisions infallible.

The API still handles untrusted media using native programs and runs jobs in one service. Use
unprivileged containers, restricted volumes, resource limits, HTTPS, private storage, backups,
provider spending limits, and access controls. Do not expose the development viewer to the internet.
The Supabase privileged key belongs only on the backend. Review RLS before accepting users.

## Dependency status — October 11, 2026

The release update reduced the npm audit from 113 advisories to three: no critical, two high,
and one moderate. Registry releases fixing these three were unavailable at review time:

| Dependency / advisory | Observed dependency path | Operational guidance |
| --- | --- | --- |
| `node-forge` 1.4.0 — [signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo CLI and code-signing tooling | Keep development/build tooling on trusted machines; this is not the API's JWT implementation (which uses `jose`). |
| `braces` 3.0.3 — [nested-pattern denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Metro/Jest/glob tooling | Do not accept arbitrary build/glob patterns from untrusted sources. |
| `sprintf-js` 1.x — [precision-specifier denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | HyperFrames → ONNX → proxy/logging tools; JS build tooling | Keep format strings under application/tool control and apply worker resource limits. |

These are outstanding advisories, not claims of non-exploitability. Re-run `pnpm audit` before
deployment; update when upstream releases are available. Dependabot is configured to propose
weekly updates. CI uploads a dependency audit report even when known advisories remain.

## Credentials and media

Never commit `.env` files, provider secrets, database URLs containing passwords, signing keys,
production logs, job traces, or user uploads. Public client keys are intentionally embedded in
client builds, but each installer must configure their own account. Use only media you have
permission to process and redistribute as appropriate.
