import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ClipFile, ProjectState, ProjectStatus, VoFile } from "./types";
import * as api from "./api";
import { loadBaseUrl } from "./config";
import { compressClipsForUpload } from "./compress";
import { getInfoAsync } from "expo-file-system/legacy";
import { uploadClipsResumable, uploadClipsToProjectMedia, uploadStateFor } from "./resumableUpload";
import { currentToken } from "./auth";
import { track } from "./analytics";
import { useProjects } from "./projects";

// THE app-side store (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md).
// One state per project: "local" while THIS DEVICE works (compress/upload), otherwise the server's
// status contract mirrored verbatim. Screens render presentState(format, state) — nothing else.

const KEY = "ole.jobs.v2"; // new key: the legacy JobStage shapes are not readable and not migrated

// Keep in sync with the API's upload bound (OLE_MAX_UPLOAD_MB, default 3072).
const MAX_CLIP_BYTES = 3072 * 1024 * 1024;

const statSize = async (uri: string): Promise<number | null> => {
  try {
    const info = await getInfoAsync(uri);
    return info.exists && typeof (info as { size?: number }).size === "number" ? (info as { size: number }).size : null;
  } catch { return null; }
};

/** The cached optimized set, but only if it's complete and every file still exists on disk. */
async function validUploadSet(cached: ClipFile[] | undefined, expectedCount: number): Promise<ClipFile[] | null> {
  if (!cached || cached.length !== expectedCount) return null;
  const sizes = await Promise.all(cached.map((c) => statSize(c.uri)));
  return sizes.every((s) => s != null && s > 0) ? cached : null;
}

/** Instant, named failure for a clip the server would reject minutes into the upload. */
async function assertUploadable(clips: ClipFile[]): Promise<void> {
  for (const c of clips) {
    const s = (await statSize(c.uri)) ?? c.size;
    if (s && s > MAX_CLIP_BYTES) {
      const gb = (s / 1024 ** 3).toFixed(1);
      throw new Error(`${c.name} is ${gb}GB — over the ${Math.round(MAX_CLIP_BYTES / 1024 ** 3)}GB upload limit. Trim it in Photos and try again.`);
    }
  }
}

const WORKING: ProjectStatus["lifecycle"][] = ["preparing", "rendering", "editing"];

type Ctx = {
  states: Record<string, ProjectState>;
  startPrep: (id: string, args: { clips: ClipFile[]; context: string; hasIdea: boolean; script?: string }) => void;
  retryPrep: (id: string, context?: string, hasIdea?: boolean, script?: string) => void;
  submitVoAndAssemble: (args: { id: string; vo: VoFile }) => Promise<void>;
  assembleGenerated: (id: string) => Promise<void>;
  messageProject: (id: string, message: string, clientId?: string, onFail?: () => void) => Promise<void>;
  retryAssemble: (id: string) => Promise<void>;
  finalize: (id: string) => Promise<void>;
  resume: (id: string) => void;
  adoptStatus: (id: string, patch: Partial<ProjectStatus>) => void;
};
const JobContext = createContext<Ctx | null>(null);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [states, setStates] = useState<Record<string, ProjectState>>({});
  const statesRef = useRef(states);
  statesRef.current = states;
  const pollers = useRef<Record<string, ReturnType<typeof setInterval>>>({});
  const { update: updateProject, get: getProject } = useProjects();

  const setState = useCallback((id: string, state: ProjectState) => {
    if (state.kind === "local-error") track("error_shown", { projectId: id, message: state.message });
    if (state.kind === "server" && state.status.lifecycle === "error") track("error_shown", { projectId: id, message: state.status.error ?? "unknown" });
    setStates((prev) => {
      const next = { ...prev, [id]: state };
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const stopPolling = useCallback((id: string) => {
    const t = pollers.current[id];
    if (t) { clearInterval(t); delete pollers.current[id]; }
  }, []);

  const startPolling = useCallback((id: string) => {
    if (pollers.current[id]) return;
    const startedAt = Date.now();
    const tick = async () => {
      try {
        const base = await loadBaseUrl();
        const status = await api.getStatus(base, id);
        const prev = statesRef.current[id];
        const at = prev?.kind === "server" ? prev.startedAt : startedAt;
        // A polled "uploading" with no live phase means the work belongs to a device, and no
        // device is doing it (this phone's upload would be a "local" state, never a poll). The
        // honest presentation is the retryable error — polling it as "working" spun forever once
        // (crash-orphaned clips + the server's phantom "preparing").
        if (status.lifecycle === "uploading" && !status.phase) {
          stopPolling(id);
          setState(id, { kind: "local-error", message: "Your clips made it up, but the reel never started. Tap Try again to build it.", retry: "prep" });
          return;
        }
        setState(id, { kind: "server", status, startedAt: at });
        if (!WORKING.includes(status.lifecycle)) stopPolling(id);
      } catch (e: unknown) {
        // A 404 means the project is gone from the server — polling it forever just spins the
        // working UI eternally. Everything else (network blip, 5xx) is transient: keep polling.
        if ((e as { status?: number })?.status === 404) {
          stopPolling(id);
          setState(id, { kind: "local-error", message: "This reel is gone from the server.", retry: "prep" });
        }
      }
    };
    pollers.current[id] = setInterval(tick, 2000);
    tick();
  }, [setState, stopPolling]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      const saved: Record<string, ProjectState> = JSON.parse(raw);
      const reconciled: Record<string, ProjectState> = {};
      for (const [id, st] of Object.entries(saved)) {
        if (st.kind === "local") {
          // Device work died with the app. The selection is on the project record: retry works.
          reconciled[id] = { kind: "local-error", message: "Upload got interrupted — tap Try again.", retry: "prep" };
        } else {
          reconciled[id] = st;
        }
      }
      setStates(reconciled);
      // Server states re-derive; anything that was mid-work resumes its poll.
      for (const [id, st] of Object.entries(reconciled)) {
        if (st.kind === "server" && WORKING.includes(st.status.lifecycle)) startPolling(id);
      }
    });
    return () => { Object.values(pollers.current).forEach(clearInterval); };
  }, [startPolling]);

  const startPrep = useCallback((id: string, { clips, context, hasIdea, script }: { clips: ClipFile[]; context: string; hasIdea: boolean; script?: string }) => {
    const startedAt = Date.now();
    // Keep the selection (and any creator script) on the project record so retries resend the same inputs.
    updateProject(id, { clips, ...(script ? { script } : {}) });
    setState(id, { kind: "local", step: "optimizing", progress: 0, startedAt });
    (async () => {
      // Compress/upload progress callbacks fire far more often than the UI (or AsyncStorage) needs
      // — every setState here also persists a write. Only emit when the fraction moved at least a
      // point, or on completion, so a job doesn't flood state/disk with near-identical ticks.
      let lastEmitted = -1;
      const emitProgress = (step: "optimizing" | "uploading", f: number) => {
        if (lastEmitted >= 0 && f < 1 && Math.abs(f - lastEmitted) < 0.01) return;
        lastEmitted = f;
        setState(id, { kind: "local", step, progress: f, startedAt });
      };
      try {
        // Reuse the previous optimize pass when its output files still exist — a failed UPLOAD
        // retried must not re-optimize (iOS may purge the cache dir; then we re-run it).
        let toUpload = await validUploadSet(getProject(id)?.uploadClips, clips.length);
        if (!toUpload) {
          toUpload = await compressClipsForUpload(clips, {
            onProgress: (f) => emitProgress("optimizing", f),
          });
          updateProject(id, { uploadClips: toUpload });
        }
        await assertUploadable(toUpload);
        const base = await loadBaseUrl();
        setState(id, { kind: "local", step: "uploading", progress: 0, startedAt });
        const sizes = await Promise.all(toUpload.map((c) => statSize(c.uri)));
        const rec = getProject(id);
        const token = await currentToken();
        const caps = await api.capabilities(base).catch(() => ({ directProjectMedia: false as const }));
        // Direct-to-storage only when EVERY clip fits the per-file cap the server advertises; one
        // oversized clip routes the whole set through the legacy path, which has no ceiling.
        const directCap = ("directMediaMaxBytes" in caps && caps.directMediaMaxBytes) || 50 * 1024 * 1024;
        const allFit = sizes.every((s) => s != null && s > 0 && s <= directCap);
        if (caps.directProjectMedia && allFit) {
          const directAssets = { ...(rec?.directAssets ?? {}) };
          await uploadClipsToProjectMedia({
            base, projectId: id, token, clips: toUpload, sizes, state: directAssets,
            onState: (s) => updateProject(id, { directAssets: { ...s } }),
            onProgress: (f) => emitProgress("uploading", f),
          });
        } else {
          const state = uploadStateFor(toUpload, { doneUris: rec?.uploadedUris, urls: rec?.uploadUrls, setKey: rec?.uploadSetKey });
          await uploadClipsResumable({
            base, projectId: id, token, clips: toUpload, sizes, state,
            onState: (s) => updateProject(id, { uploadedUris: s.doneUris, uploadUrls: s.urls, uploadSetKey: s.setKey }),
            onProgress: (f) => emitProgress("uploading", f),
          });
        }
        await api.startPrepJob(base, id, { hasIdea, context, script });
        startPolling(id); // from here the server narrates: preparing → awaiting_voice / rendering → ready
      } catch (e: unknown) {
        setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "prep" });
      }
    })();
  }, [setState, startPolling, updateProject, getProject]);

  // Recover an interrupted or failed prep. If the clips made it to the server, re-run the prep job
  // and poll. If the upload is what died (the server says so), re-upload the SAME selection.
  const retryPrep = useCallback(async (id: string, context?: string, hasIdea = !!context, script?: string) => {
    try {
      const base = await loadBaseUrl();
      const userScript = script ?? getProject(id)?.script;
      try {
        await api.startPrepJob(base, id, { hasIdea, context, script: userScript });
      } catch (e: unknown) {
        const clips = getProject(id)?.clips;
        if (clips?.length && /never finished uploading/i.test(String((e as Error)?.message ?? e))) {
          startPrep(id, { clips, context: context ?? "", hasIdea, script: userScript });
          return;
        }
        throw e;
      }
      startPolling(id);
    } catch (e: unknown) {
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "prep" });
    }
  }, [setState, startPolling, startPrep, getProject]);

  const submitVoAndAssemble = useCallback(async ({ id, vo }: { id: string; vo: VoFile }) => {
    const startedAt = Date.now();
    setState(id, { kind: "local", step: "uploading", progress: 0, startedAt });
    try {
      const base = await loadBaseUrl();
      await api.uploadVo(base, id, vo, (f) => setState(id, { kind: "local", step: "uploading", progress: f, startedAt }));
      await api.startAssemble(base, id);
      startPolling(id);
    } catch (e: unknown) {
      // vo_missing = the server says record first; the poll renders awaiting_voice honestly.
      if ((e as { code?: string })?.code === "vo_missing") { startPolling(id); return; }
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "assemble" });
    }
  }, [setState, startPolling]);

  // The generated take already lives on the server (no upload to do) — go straight to assemble.
  const assembleGenerated = useCallback(async (id: string) => {
    try {
      const base = await loadBaseUrl();
      await api.startAssemble(base, id);
      startPolling(id);
    } catch (e: unknown) {
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "assemble" });
    }
  }, [setState, startPolling]);

  // One send for every project moment: the server routes it (script revision / refine) by lifecycle.
  const messageProject = useCallback(async (id: string, message: string, clientId?: string, onFail?: () => void) => {
    try {
      await api.sendProjectMessage(await loadBaseUrl(), id, message, clientId ?? `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      startPolling(id);
    } catch (e: unknown) {
      // A refused message NEVER destroys project state: whatever the project was doing, it still
      // is. The server's sentence surfaces as the editor's reply in the conversation. The caller's
      // optimistic bubble for this send didn't make it either — onFail lets it clean that up so a
      // failed send doesn't leave a permanent ghost bubble.
      onFail?.();
      const prev = statesRef.current[id];
      if (prev?.kind === "server" && prev.status.lifecycle !== "error") {
        setState(id, { kind: "server", status: { ...prev.status, reply: String((e as Error)?.message ?? e) }, startedAt: prev.startedAt });
        return;
      }
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "prep" });
    }
  }, [setState, startPolling]);

  // Recover a failed render: clips, voice and plan are still on the server — re-render, adopting an
  // already-finished or in-flight run instead of starting a duplicate.
  const retryAssemble = useCallback(async (id: string) => {
    const project = getProject(id);
    if (project?.format === "talking_head") {
      await retryPrep(id, project.context, !!project.context, project.script);
      return;
    }
    try {
      const base = await loadBaseUrl();
      const status = await api.getStatus(base, id);
      if (status.lifecycle === "ready") { setState(id, { kind: "server", status, startedAt: Date.now() }); return; }
      if (!WORKING.includes(status.lifecycle)) await api.startAssemble(base, id);
      startPolling(id);
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === "vo_missing") { startPolling(id); return; }
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "assemble" });
    }
  }, [setState, startPolling, getProject, retryPrep]);

  // "Render in HD": re-render the current cut at 1080p.
  const finalize = useCallback(async (id: string) => {
    try {
      await api.finalize(await loadBaseUrl(), id);
      startPolling(id);
    } catch (e: unknown) {
      setState(id, { kind: "local-error", message: String((e as Error)?.message ?? e), retry: "assemble" });
    }
  }, [setState, startPolling]);

  // Opening a project: local device work keeps narrating itself; otherwise the server is the truth.
  const resume = useCallback((id: string) => {
    const st = statesRef.current[id];
    if (st?.kind === "local") return; // an in-flight upload narrates itself
    startPolling(id);                 // one poll hydrates; non-working lifecycles stop immediately
  }, [startPolling]);

  // Adopt a server response's fields into the current status immediately, without waiting for the
  // next poll tick — e.g. undo's fresh reelUrl, so playback/Share never serve the undone cut in the
  // gap before the next 2s poll. No-op unless a "server" state already exists for this project.
  const adoptStatus = useCallback((id: string, patch: Partial<ProjectStatus>) => {
    const prev = statesRef.current[id];
    if (prev?.kind !== "server") return;
    setState(id, { kind: "server", status: { ...prev.status, ...patch }, startedAt: prev.startedAt });
  }, [setState]);

  return <JobContext.Provider value={{ states, startPrep, retryPrep, submitVoAndAssemble, assembleGenerated, messageProject, retryAssemble, finalize, resume, adoptStatus }}>{children}</JobContext.Provider>;
}

export function useJobs(): Ctx {
  const ctx = useContext(JobContext);
  if (!ctx) throw new Error("useJobs must be used within JobProvider");
  return ctx;
}
export function useJob(id: string): ProjectState | undefined {
  return useJobs().states[id];
}
