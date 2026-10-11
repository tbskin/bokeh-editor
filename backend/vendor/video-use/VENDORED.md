# Vendored: video-use helpers

Vendored from https://github.com/browser-use/video-use (working tree at
~/Developer/video-use) so local and prod render the SAME pipeline — the deploy
image previously cloned upstream fresh, silently dropping our local fixes.

Local modifications carried here (vs upstream):
- `helpers/render.py` — caption style (Montserrat SemiBold, real outline + soft
  shadow for legibility on busy footage) and an HDR tonemap fallback
  (`TONEMAP_CHAIN_COLORSPACE`) for ffmpeg builds without libzimg.

The engine invokes these via `uv run --project <this dir>` (see
`backend/engine/src/assemble-reel.ts` runVideoUse). `.venv/` is created on
first run and is git-ignored. `backend/vendor/fonts/Montserrat[wght].ttf`
(OFL 1.1, via Google Fonts) is installed into the deploy image for the burned
captions.

To pull upstream improvements: diff against the GitHub repo, re-apply the
modifications above, and re-run a real render before shipping.
