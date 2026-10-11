import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./auth";
import { listProjects, deleteProject } from "./api";
import { loadBaseUrl } from "./config";
import { joinUrl } from "./url";
import type { ProjectRecord } from "./types";

// Local cache holds display metadata the server doesn't (thumbnails, context). The server list is the
// source of truth for WHICH reels this account has — so the list survives a reinstall or new device.
const KEY = "ole.projects";

type Ctx = {
  projects: ProjectRecord[];
  add: (p: ProjectRecord) => Promise<void>;
  update: (id: string, patch: Partial<ProjectRecord>) => Promise<void>;
  get: (id: string) => ProjectRecord | undefined;
  refresh: () => Promise<void>;
  remove: (id: string) => Promise<void>;
};
const ProjectsContext = createContext<Ctx | null>(null);

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const local = useRef<Record<string, ProjectRecord>>({});

  const persist = (arr: ProjectRecord[]) => AsyncStorage.setItem(KEY, JSON.stringify(arr)).catch(() => {});

  // Load the local metadata cache once.
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (!raw) return;
      const arr: ProjectRecord[] = JSON.parse(raw);
      local.current = Object.fromEntries(arr.map((p) => [p.id, p]));
      setProjects(arr);
    });
  }, []);

  // Fetch the account's reels from the server and enrich with any local metadata.
  const refresh = useCallback(async () => {
    if (!session) { setProjects([]); return; }
    try {
      const base = await loadBaseUrl();
      const server = await listProjects(base);
      setProjects(server.map((s) => {
        const l = local.current[s.id];
        const thumbnailUri = s.cover ? joinUrl(base, s.cover) : l?.thumbnailUri;
        return l
          ? { ...l, format: s.format ?? l.format, lifecycle: s.lifecycle, ...(thumbnailUri ? { thumbnailUri } : {}) }
          : { id: s.id, title: s.title ?? "Reel", format: s.format ?? "voiceover", lifecycle: s.lifecycle, ...(thumbnailUri ? { thumbnailUri } : {}), createdAt: new Date(s.created_at).getTime() };
      }));
    } catch { /* offline or transient — keep whatever we already show */ }
  }, [session]);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (p: ProjectRecord) => {
    local.current[p.id] = p;
    setProjects((prev) => { const next = [p, ...prev.filter((x) => x.id !== p.id)]; persist(next); return next; });
  }, []);

  const update = useCallback(async (id: string, patch: Partial<ProjectRecord>) => {
    setProjects((prev) => {
      const next = prev.map((x) => (x.id === id ? { ...x, ...patch } : x));
      const hit = next.find((x) => x.id === id);
      if (hit) local.current[id] = hit;
      persist(next);
      return next;
    });
  }, []);

  const get = useCallback((id: string) => projects.find((x) => x.id === id), [projects]);

  // Server first (it owns the list) — the tile only leaves the screen once the delete really took,
  // so a failure surfaces to the caller instead of a ghost reel reappearing on the next refresh.
  const remove = useCallback(async (id: string) => {
    await deleteProject(await loadBaseUrl(), id);
    delete local.current[id];
    setProjects((prev) => { const next = prev.filter((x) => x.id !== id); persist(next); return next; });
  }, []);

  return <ProjectsContext.Provider value={{ projects, add, update, get, refresh, remove }}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): Ctx {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within ProjectsProvider");
  return ctx;
}
