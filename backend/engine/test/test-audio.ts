import { beforeAll, afterAll } from "vitest";
import { mkdtemp, copyFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

/** Original synthetic test tones: no dependence on redistribution-restricted audio. */
export function useTestAudioLibrary() {
  let dir: string;
  const previousMusic = process.env.OLE_MUSIC_DIR;
  const previousSfx = process.env.OLE_SFX_DIR;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "bokeh-test-audio-"));
    const tone = join(dir, "tone.mp3");
    await promisify(execFile)("ffmpeg", ["-y", "-f", "lavfi", "-i", "sine=frequency=660:duration=2", "-q:a", "9", tone]);
    for (const kind of ["music", "sfx"]) {
      const manifest = new URL(`../assets/${kind}/${kind}.json`, import.meta.url);
      const entries = JSON.parse(await readFile(manifest, "utf8")) as Array<{ file: string }>;
      await copyFile(manifest, join(dir, `${kind}.json`));
      for (const entry of entries) await copyFile(tone, join(dir, entry.file));
    }
    process.env.OLE_MUSIC_DIR = dir;
    process.env.OLE_SFX_DIR = dir;
  });
  afterAll(async () => {
    if (previousMusic == null) delete process.env.OLE_MUSIC_DIR; else process.env.OLE_MUSIC_DIR = previousMusic;
    if (previousSfx == null) delete process.env.OLE_SFX_DIR; else process.env.OLE_SFX_DIR = previousSfx;
    if (dir) await rm(dir, { recursive: true, force: true });
  });
}
