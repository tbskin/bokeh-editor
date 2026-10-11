import * as api from "./api";

/** Poll the one status contract every 2s until the project leaves its working lifecycles;
 *  reject with the server's human sentence on error. */
export function pollStatus(
  base: string, id: string, _stage?: "analyze" | "plan" | "assemble",
  onPhase?: (phase: string | undefined) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const s = await api.getStatus(base, id);
        if (s.lifecycle === "preparing" || s.lifecycle === "rendering" || s.lifecycle === "editing") { onPhase?.(s.phase); return; }
        clearInterval(timer);
        if (s.lifecycle === "error") reject(new Error(s.error ?? "Something went wrong — try again."));
        else resolve(); // awaiting_voice / ready / anything settled
      } catch { /* transient — keep polling */ }
    };
    const timer = setInterval(tick, 2000);
    tick();
  });
}
