# Contributing to Bokeh

Bokeh is in early development. Original project code and contributions are provided under the
root MIT License; preserve all third-party notices.

Start with the [README](README.md), [setup guide](docs/technical-guide.md), and
[code map](docs/CODEMAP.md). Use your own Supabase project, API keys, backend, and test footage.
Never test a fork against the maintained production deployment.

## Making a change

1. Create a branch and keep the change focused on one problem.
2. Explain the user-visible behavior and any setup or data changes.
3. Run the relevant workspace tests and type checks listed in the README. Changes to rendering
   need a real render check; mobile flows need testing on a physical phone.
4. Update the code map if modules or the pipeline change, then run `pnpm check:docs`.
5. Open a pull request with what changed, why, how it was verified, and known limitations.

Models choose editing decisions; deterministic code validates and executes them. Extend the edit
document and renderer together when adding an editing capability. See [CLAUDE.md](CLAUDE.md) for
the full repository conventions.

## Credentials, footage, and assets

Keep credentials, tokens, `.env` files, uploaded footage, rendered personal videos, agent traces,
database exports, and production logs out of commits and issue attachments. Use synthetic fixtures
or media you have permission to redistribute. For every new third-party asset, record its source,
author, license, and permission to redistribute the source file in
[third-party notices](docs/third-party-notices.md).

If you discover a credential or vulnerability, contact the maintainer privately with its location
and a redacted description. Do not post the credential or personal data in a public issue.
