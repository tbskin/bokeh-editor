import type { ClipFile } from "./types";

/** The slice of react-native-compressor's Video API we use. */
export type VideoCompressor = {
  compress: (uri: string, options: Record<string, unknown>, onProgress?: (p: number) => void) => Promise<string>;
};

// Upload target: 1080p H.264 at ~8 Mbps. The reel renders at 720p (draft) / 1080p (HD), so a 4K
// source is ~10x more bytes than the output can ever use — a ~600MB clip becomes ~40-60MB and the
// minute-long fragile upload becomes seconds. AVAssetExportSession reads the picked file and writes
// a NEW temp file; the original in the photo library is never touched.
const COMPRESS_OPTIONS = { compressionMethod: "manual", maxSize: 1920, bitrate: 8_000_000 } as const;

/** react-native-compressor is a native module: present in EAS/TestFlight builds, absent in Expo Go.
 *  Resolve it at runtime; null means "upload originals" — never an error. */
/** True inside the Expo Go sandbox, where native modules like the compressor can't exist.
 *  Lazily required: expo-constants doesn't parse under vitest's node environment. */
function isExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require("expo-constants").default as { appOwnership?: string | null };
    return Constants?.appOwnership === "expo";
  } catch {
    return false;
  }
}

export function loadCompressor(): VideoCompressor | null {
  // Expo Go can never have the native module — skip the require entirely so its init doesn't
  // spray a scary (but harmless) NitroModules error into the console on every upload.
  if (isExpoGo()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("react-native-compressor") as { Video?: VideoCompressor };
    return mod?.Video ?? null;
  } catch {
    return null;
  }
}

/** Downscale clips for upload. Compression is an optimization, never a gate: a missing module or a
 *  clip that fails to compress falls back to the original bytes and the upload proceeds. */
export async function compressClipsForUpload(
  clips: ClipFile[],
  opts: { video?: VideoCompressor | null; onProgress?: (fraction: number) => void } = {},
): Promise<ClipFile[]> {
  const video = opts.video === undefined ? loadCompressor() : opts.video;
  if (!video || clips.length === 0) return clips;

  const out: ClipFile[] = [];
  for (const [i, clip] of clips.entries()) {
    try {
      const uri = await video.compress(clip.uri, COMPRESS_OPTIONS, (p) => {
        const clamped = Math.min(Math.max(p, 0), 1);
        opts.onProgress?.((i + clamped) / clips.length);
      });
      out.push({ uri, name: clip.name.replace(/\.[^.]+$/, "") + ".mp4", type: "video/mp4" });
    } catch {
      out.push(clip); // this clip uploads as-is; the batch never fails on compression
    }
    opts.onProgress?.((i + 1) / clips.length);
  }
  return out;
}
