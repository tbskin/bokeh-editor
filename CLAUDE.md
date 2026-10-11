# Bokeh contributor and agent guide

Read README.md and docs/CODEMAP.md first. This public repository is independent of the hosted
product; never add production credentials, account IDs, private media, or service defaults.

- Models propose data; validated application code renders it. Never give user-directed models
  a shell, arbitrary filesystem access, or environment variables. See harness.ts and edit-schema.ts.
- Keep the README, setup guide, and code map accurate when behavior or paths change.
- Preserve the voiceover doctrine in backend/engine/recipe/plan-reel.md: true facts, plain speech.
- Run affected tests, TypeScript checks, and `pnpm check:docs`. Mobile changes also need a physical
  device upload/record/render/share check; report explicitly when it could not be performed.
- Preserve vendored licenses. Add media only with documented redistribution rights.
- Keep source footage and logs out of Git. Use synthetic fixtures in tests.
- This repository has no deployment integration. Deployment belongs to each installer's account.
- Do not restart a running backend while its health endpoint reports active jobs.
