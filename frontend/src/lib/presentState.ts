// THE presenter (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md). Every
// surface — home tile, conversation screen, anything future — renders ONLY what this pure function
// returns. No screen interprets ProjectState on its own; that rule is what killed the era of the
// home tile and the detail screen disagreeing about the same reel.
import type { ProjectState, ReelFormat } from "./types";

export type PresentStep = { name: string; done: boolean; active: boolean };
export type Presentation = {
  tone: "working" | "attention" | "ready" | "error";
  title?: string;   // stage-level card title — deliberately never a phase/step name
  badge: string;      // short — the home tile line
  headline: string;   // one sentence — the status card
  steps?: PresentStep[];
  progress?: number;  // 0..1 when the device knows it (optimize/upload)
  cta?: "retry-prep" | "retry-assemble" | "voice" | "open";
  error?: string;
  reply?: string;
  reelUrl?: string;
  startedAt?: number;
};

const LOCAL_STEPS = ["Optimizing your clips", "Uploading your clips"];

const activate = (steps: { name: string; done: boolean }[]): PresentStep[] => {
  const firstOpen = steps.findIndex((s) => !s.done);
  return steps.map((s, i) => ({ ...s, active: i === firstOpen }));
};

export function presentState(format: ReelFormat, state: ProjectState | undefined): Presentation {
  if (!state) return { tone: "working", badge: "Loading", headline: "Loading this project…" };

  if (state.kind === "local") {
    const optimizing = state.step === "optimizing";
    return {
      tone: "working",
      title: "Getting your reel ready",
      badge: optimizing ? "Optimizing" : "Uploading",
      headline: optimizing ? "Optimizing your clips on this phone" : "Uploading your clips",
      steps: activate(LOCAL_STEPS.map((name, i) => ({ name, done: !optimizing && i === 0 }))),
      progress: state.progress,
      startedAt: state.startedAt,
    };
  }

  if (state.kind === "local-error") {
    return {
      tone: "error", badge: "Needs a retry", headline: state.message, error: state.message,
      cta: state.retry === "assemble" ? "retry-assemble" : "retry-prep",
    };
  }

  const s = state.status;
  switch (s.lifecycle) {
    case "uploading":
      // The server never received the clips — a previous upload died. Honest, with the exit.
      return { tone: "error", badge: "Upload unfinished", headline: "Your clips never finished uploading — tap Try again.", error: "Your clips never finished uploading — tap Try again.", cta: "retry-prep" };
    case "preparing":
      return {
        tone: "working", title: "Getting your reel ready", badge: s.phase ?? "Preparing",
        headline: s.phase ?? "Watching your footage",
        steps: s.steps ? activate(s.steps) : undefined,
        startedAt: state.startedAt,
      };
    case "awaiting_voice":
      return { tone: "attention", badge: "Ready for your voice", headline: "The script is ready — add your voice to make the reel.", cta: "voice", reply: s.reply };
    case "rendering":
      return {
        tone: "working", title: "Making your reel", badge: s.phase ?? "Making your reel",
        headline: s.phase ?? "Making your reel",
        steps: s.steps ? activate(s.steps) : undefined,
        startedAt: state.startedAt,
      };
    case "editing":
      return {
        tone: "working", title: "Editing your cut", badge: s.phase ?? "Editing your cut",
        headline: s.phase ?? "Editing your cut",
        reelUrl: s.reelUrl, startedAt: state.startedAt,
      };
    case "ready":
      return { tone: "ready", badge: "Ready", headline: "Your reel is ready.", cta: "open", reelUrl: s.reelUrl, reply: s.reply };
    case "error":
      return {
        tone: "error", badge: "Something went wrong",
        headline: s.error ?? "Something went wrong — try again.",
        error: s.error ?? "Something went wrong — try again.",
        cta: s.stage === "assemble" ? "retry-assemble" : "retry-prep",
      };
  }
}
