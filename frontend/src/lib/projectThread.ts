import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProjectDetail, getProjectMessages, type ProjectDetail } from "./api";
import { loadBaseUrl } from "./config";
import type { ProjectMessage } from "./types";

type CachedThread = { detail: ProjectDetail | null; messages: ProjectMessage[] };

export function useProjectThread(id: string) {
  const key = `ole.thread.${id}`;
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);

  const refresh = useCallback(async () => {
    const base = await loadBaseUrl();
    const [nextDetail, nextMessages] = await Promise.all([getProjectDetail(base, id), getProjectMessages(base, id)]);
    setDetail(nextDetail);
    setMessages((current) => {
      const pending = current.filter((message) => message.id.startsWith("optimistic-")
        && !nextMessages.some((server) => server.client_id && server.client_id === message.client_id));
      const merged = [...nextMessages, ...pending];
      AsyncStorage.setItem(key, JSON.stringify({ detail: nextDetail, messages: merged } satisfies CachedThread)).catch(() => {});
      return merged;
    });
  }, [id, key]);

  useEffect(() => {
    let live = true;
    let stopped = false; // guard: a 404 stops the poll exactly once, however many in-flight calls hit it
    let timer: ReturnType<typeof setInterval> | undefined;
    // The project is gone from the server (deleted / never existed) — polling it forever just
    // spins the thread eternally. Everything else (network blip, 5xx) stays transient and swallowed.
    const stopIfGone = (e: unknown) => {
      if (stopped || (e as { status?: number })?.status !== 404) return;
      stopped = true;
      if (timer) clearInterval(timer);
    };
    AsyncStorage.getItem(key).then((raw) => {
      if (!live || !raw) return;
      const cached = JSON.parse(raw) as CachedThread;
      setDetail(cached.detail);
      setMessages(cached.messages ?? []);
    }).catch(() => {});
    refresh().catch(stopIfGone);
    timer = setInterval(() => refresh().catch(stopIfGone), 2500);
    return () => { live = false; if (timer) clearInterval(timer); };
  }, [key, refresh]);

  const appendOptimistic = useCallback((message: ProjectMessage) => {
    setMessages((current) => {
      if (current.some((m) => m.client_id && m.client_id === message.client_id)) return current;
      const next = [...current, message];
      AsyncStorage.setItem(key, JSON.stringify({ detail, messages: next } satisfies CachedThread)).catch(() => {});
      return next;
    });
  }, [detail, key]);

  // A send that never reached the server must not leave a permanent ghost bubble — the error
  // reply already explains the failure, so the optimistic row itself just goes away.
  const removeOptimistic = useCallback((clientId: string) => {
    setMessages((current) => {
      const next = current.filter((m) => !(m.id.startsWith("optimistic-") && m.client_id === clientId));
      AsyncStorage.setItem(key, JSON.stringify({ detail, messages: next } satisfies CachedThread)).catch(() => {});
      return next;
    });
  }, [detail, key]);

  return { detail, messages, refresh, appendOptimistic, removeOptimistic };
}
