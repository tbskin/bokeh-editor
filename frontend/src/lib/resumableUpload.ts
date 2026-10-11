import * as tus from "tus-js-client";
import type { ClipFile } from "./types";
import { completeProjectAsset, reserveProjectAsset } from "./api";

// Resumable clip uploads (tus). Each clip goes up in ~10MB chunks against an upload URL the server
// hands out; the URL is persisted on the project record, so a retry — or an app relaunch — HEADs
// the server for the last confirmed byte and continues from there. The progress bar is computed
// over TOTAL bytes across all clips, so a resumed upload visibly picks up where it stopped (the bar
// jumps back to, say, 62% and climbs) instead of lying back to zero.

export type UploadState = {
  doneUris: string[];              // clips fully received by the server (skipped on retry)
  urls: Record<string, string>;    // clip uri -> tus upload URL (the resume handle)
  setKey: string;                  // identity of the upload set; a new set invalidates old state
};

export const uploadSetKey = (clips: ClipFile[]) => clips.map((c) => c.uri).join("|");

/** Fresh state unless `prev` belongs to this exact upload set. */
export function uploadStateFor(clips: ClipFile[], prev?: Partial<UploadState>): UploadState {
  const setKey = uploadSetKey(clips);
  if (prev?.setKey === setKey) return { doneUris: [...(prev.doneUris ?? [])], urls: { ...(prev.urls ?? {}) }, setKey };
  return { doneUris: [], urls: {}, setKey };
}

type UploadOneOpts = {
  endpoint: string; token: string | null; projectId: string;
  uploadUrl?: string; size?: number;
  metadata?: Record<string, string>; chunkSize?: number;
  onUrl: (url: string) => void;          // fires when the server assigns/confirms the upload URL
  onProgress: (sentBytes: number) => void;
};
type UploadOne = (clip: ClipFile, opts: UploadOneOpts) => Promise<void>;

/** One clip over tus. Exported default; injectable in tests. */
const tusUploadOne: UploadOne = (clip, opts) =>
  new Promise<void>((resolve, reject) => {
    // React Native: tus-js-client takes { uri } and reads the file itself (no Blob juggling).
    const upload = new tus.Upload({ uri: clip.uri } as unknown as Blob, {
      endpoint: opts.endpoint,
      ...(opts.uploadUrl ? { uploadUrl: opts.uploadUrl } : {}),
      metadata: opts.metadata ?? { filename: clip.name, filetype: clip.type, projectId: opts.projectId },
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : {},
      chunkSize: opts.chunkSize ?? 10 * 1024 * 1024,
      retryDelays: [0, 1000, 3000, 6000], // transient blips retry in place, same offset
      storeFingerprintForResuming: false, // we persist the upload URL ourselves (project record)
      ...(opts.size ? { uploadSize: opts.size } : {}),
      onProgress: (sent) => opts.onProgress(sent),
      onChunkComplete: () => { if (upload.url) opts.onUrl(upload.url); },
      onSuccess: () => resolve(),
      onError: (e) => reject(e),
    });
    upload.start();
  });

/**
 * Upload the set sequentially with aggregate progress and persisted resume state.
 * `onState` fires whenever the resume state changes — the caller persists it.
 */
export async function uploadClipsResumable(
  args: {
    base: string; projectId: string; token: string | null;
    clips: ClipFile[]; sizes: (number | null)[];
    state: UploadState;
    onState: (s: UploadState) => void;
    onProgress?: (fraction: number) => void;
  },
  uploadOne: UploadOne = tusUploadOne,
): Promise<void> {
  const total = args.sizes.reduce((a: number, s) => a + (s ?? 0), 0);
  const frac = (bytes: number) => (total > 0 ? Math.min(1, bytes / total) : 0);
  let confirmed = 0;

  for (const [i, clip] of args.clips.entries()) {
    const size = args.sizes[i] ?? 0;
    if (args.state.doneUris.includes(clip.uri)) {
      confirmed += size;
      args.onProgress?.(frac(confirmed));
      continue;
    }

    const run = (resumeUrl?: string) =>
      uploadOne(clip, {
        endpoint: `${args.base}/api/uploads`,
        token: args.token,
        projectId: args.projectId,
        uploadUrl: resumeUrl,
        size: size || undefined,
        onUrl: (url) => {
          if (args.state.urls[clip.uri] !== url) {
            args.state.urls[clip.uri] = url;
            args.onState({ ...args.state, urls: { ...args.state.urls } });
          }
        },
        onProgress: (sent) => args.onProgress?.(frac(confirmed + sent)),
      });

    try {
      await run(args.state.urls[clip.uri]);
    } catch (e) {
      // A swept/expired partial 404s or 410s on resume — retry ONCE from scratch before failing.
      if (args.state.urls[clip.uri] && /\b(404|410)\b/.test(String(e))) {
        delete args.state.urls[clip.uri];
        args.onState({ ...args.state, urls: { ...args.state.urls } });
        await run(undefined);
      } else {
        throw new Error("Upload didn't go through — tap Try again and it picks up where it stopped.");
      }
    }

    confirmed += size;
    delete args.state.urls[clip.uri];
    args.state.doneUris.push(clip.uri);
    args.onState({ ...args.state, doneUris: [...args.state.doneUris], urls: { ...args.state.urls } });
    args.onProgress?.(frac(confirmed));
  }
}

export type DirectAssetState = Record<string, {
  assetId: string; endpoint: string; bucketName: string; objectName: string;
  uploadUrl?: string; done?: boolean;
}>;

/** Direct-to-private-Supabase TUS path for new projects. Railway receives only a job scratch copy of the source. */
export async function uploadClipsToProjectMedia(
  args: {
    base: string; projectId: string; token: string | null; clips: ClipFile[]; sizes: (number | null)[];
    state: DirectAssetState; onState: (state: DirectAssetState) => void; onProgress?: (fraction: number) => void;
  },
  uploadOne: UploadOne = tusUploadOne,
): Promise<void> {
  const total = args.sizes.reduce((sum: number, size) => sum + (size ?? 0), 0);
  let confirmed = 0;
  const progress = (sent: number) => args.onProgress?.(total > 0 ? Math.min(1, (confirmed + sent) / total) : 0);
  for (const [index, clip] of args.clips.entries()) {
    const size = args.sizes[index] ?? 0;
    let reservation = args.state[clip.uri];
    if (!reservation) {
      const next = await reserveProjectAsset(args.base, args.projectId, clip, size || undefined);
      reservation = {
        assetId: next.asset.id, endpoint: next.upload.endpoint, bucketName: next.upload.bucketName,
        objectName: next.upload.objectName,
      };
      args.state[clip.uri] = reservation;
      args.onState({ ...args.state });
    }
    if (reservation.done) { confirmed += size; progress(0); continue; }
    const run = (uploadUrl?: string) => uploadOne(clip, {
      endpoint: reservation!.endpoint,
      token: args.token,
      projectId: args.projectId,
      uploadUrl,
      size: size || undefined,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: reservation!.bucketName,
        objectName: reservation!.objectName,
        contentType: clip.type,
        cacheControl: "3600",
      },
      onUrl: (url) => { reservation!.uploadUrl = url; args.onState({ ...args.state }); },
      onProgress: progress,
    });
    try {
      await run(reservation.uploadUrl);
    } catch (error) {
      // Supabase expires unfinished TUS resources after a day. Keep the stable asset/object name,
      // discard only the dead resume handle, and retry the upload once from byte zero.
      if (reservation.uploadUrl && /\b(404|410)\b/.test(String(error))) {
        reservation.uploadUrl = undefined;
        args.onState({ ...args.state });
        await run(undefined);
      } else {
        throw new Error("Upload didn't go through — tap Try again and it picks up where it stopped.");
      }
    }
    await completeProjectAsset(args.base, args.projectId, reservation.assetId);
    reservation.done = true;
    reservation.uploadUrl = undefined;
    confirmed += size;
    args.onState({ ...args.state });
    progress(0);
  }
}
