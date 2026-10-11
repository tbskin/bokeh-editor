# Bokeh — engine + API image (deploys to Railway).
# Contains the structured editor + vendored video-use (Python/FFmpeg) + Express API.
# video-use is vendored at backend/vendor/video-use so prod renders the EXACT same pipeline as local
# (the old image cloned upstream fresh, silently dropping caption-style and tonemap fixes).
FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg python3 python3-pip git ca-certificates fontconfig unzip \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
      libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
      libpango-1.0-0 libcairo2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN corepack enable

# Install the API subgraph (@ole/api + @ole/engine). Runs BEFORE NODE_ENV=production so devDeps
# (tsx) install — the engine's agent tools (render/critique/watch CLIs) run via tsx at runtime.
COPY . .
RUN pnpm install --frozen-lockfile --filter "@ole/api..."

# HyperFrames is pinned in @ole/engine; its matching bundled Chromium is installed into the image
# once so motion jobs never download a browser at request time. Rendering is serialized in code.
RUN pnpm --filter @ole/engine exec hyperframes browser ensure

# Caption font: Montserrat (OFL). Ship the variable font AND a static SemiBold instance — libass on
# Linux needs the static face for "FontName=Montserrat SemiBold" to resolve with real weight.
RUN pip3 install --break-system-packages fonttools \
    && mkdir -p /usr/share/fonts/truetype/montserrat \
    && cp 'backend/vendor/fonts/Montserrat[wght].ttf' /usr/share/fonts/truetype/montserrat/ \
    && fonttools varLib.instancer --update-name-table \
         -o /usr/share/fonts/truetype/montserrat/Montserrat-SemiBold.ttf \
         'backend/vendor/fonts/Montserrat[wght].ttf' wght=600 \
    && fc-cache -f

# video-use runtime: uv + a prebaked venv for the vendored project (runVideoUse calls
# `uv run --project backend/vendor/video-use`, which reuses this venv — no network at render time).
RUN pip3 install --break-system-packages uv \
    && uv sync --frozen --project backend/vendor/video-use

# Run media processing as an unprivileged user with a persistent, writable job directory.
RUN mkdir -p /data && chown -R node:node /app /data /root/.cache \
    && cp -a /root/.cache /home/node/.cache && chown -R node:node /home/node/.cache
USER node
ENV OLE_DATA=/data


ENV NODE_ENV=production
ENV HYPERFRAMES_NO_TELEMETRY=1
# Railway injects PORT; server.ts reads process.env.PORT (falls back to 8787 locally).
EXPOSE 8787
CMD ["pnpm", "--filter", "@ole/api", "start"]
