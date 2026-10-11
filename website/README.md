# Bokeh website

The Next.js marketing site and blog at [trybokeh.com](https://trybokeh.com).
It is separate from the Expo video editor and does not render reels.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm --filter @ole/website dev
```

Open [localhost:3000](http://localhost:3000). Use `pnpm --filter @ole/website build` for a
production build and `pnpm --filter @ole/website test` for the website tests.

On Vercel, use `website` as the root directory. Copy `.env.example` to `.env` to configure
your own optional Web3Forms key and opt-in analytics. With no key, the site links to the public
repository and sends no email submissions. Change the canonical domain and branding before
publishing your own product. The original product is at [trybokeh.com](https://trybokeh.com).

Reel cards use original abstract SVG illustrations and make no customer-performance claims.
See the [self-hosting guide](../docs/technical-guide.md) for the mobile editor and backend.
