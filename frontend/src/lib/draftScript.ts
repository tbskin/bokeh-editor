import type { ClipFile, ProjectMessage, ReelFormat } from "./types";

// The scripted conversation BEFORE a server project exists (decisions-vs-execution: this is
// deterministic client script, not server messages). Once clips launch, the real pipeline owns it.
export type DraftState = { step: "format" | "clips" | "context" | "script" | "ready"; format?: ReelFormat; clips: ClipFile[]; context: string; script?: string };
export type DraftEvent =
  | { type: "choose-format"; format: ReelFormat }
  | { type: "add-clips"; clips: ClipFile[] }
  | { type: "remove-clip"; uri: string }
  | { type: "set-context"; text: string }
  | { type: "begin-script" }
  | { type: "set-script"; text: string }
  | { type: "skip-context" };

export const draftInit: DraftState = { step: "format", clips: [], context: "" };

export function draftReduce(state: DraftState, event: DraftEvent): DraftState {
  switch (event.type) {
    case "choose-format": return { ...state, format: event.format, step: "clips" };
    case "add-clips": {
      const clips = [...state.clips, ...event.clips];
      return { ...state, clips, step: clips.length ? "context" : "clips" };
    }
    case "remove-clip": {
      const clips = state.clips.filter((c) => c.uri !== event.uri);
      return { ...state, clips, step: clips.length ? state.step : "clips" };
    }
    case "set-context": return { ...state, context: event.text, step: "ready" };
    case "begin-script": return { ...state, step: "script" };
    case "set-script": return { ...state, script: event.text, context: "", step: "ready" };
    // Reused from the "script" step as the bail-out chip too — clears any script alongside
    // context so the script step is never a dead end (see draftChips).
    case "skip-context": return { ...state, context: "", script: undefined, step: "ready" };
  }
}

const at = new Date(0).toISOString();
const editor = (id: string, text: string): ProjectMessage => ({ id, role: "editor", kind: "text", body: { text }, created_at: at });
const user = (id: string, text: string): ProjectMessage => ({ id, role: "user", kind: "text", body: { text }, created_at: at });

export function draftMessages(state: DraftState): ProjectMessage[] {
  const out: ProjectMessage[] = [editor("d-greet", "New reel — what did you shoot?")];
  if (!state.format) return out;
  out.push(user("d-format", state.format === "talking_head" ? "Talking head" : "Voiceover"));
  out.push(editor("d-clips-ask", state.format === "talking_head"
    ? "Show me the recordings. One long take or several attempts — keep the mistakes in."
    : "Show me the footage. Pick everything that belongs in this reel."));
  if (state.clips.length === 0) return out;
  out.push({
    id: "d-material", role: "user", kind: "material", created_at: at,
    body: { attachments: state.clips.map((c) => ({ filename: c.name, mimeType: c.type })), ...(state.context ? { text: state.context } : {}) },
  });
  if (state.step === "context") {
    out.push(editor("d-context-ask", "Anything I should know? What was going on, how it felt, what you want it to land. Type it below — or let me work from the footage alone."));
  }
  if (state.step === "script") {
    out.push(editor("d-script-ask", "Type or paste your voiceover script below — I'll use your words exactly as they are and cut the clips to fit."));
  }
  if (state.step === "ready") {
    out.push(editor("d-ready", "Got it. Ready when you are."));
  }
  return out;
}

export type DraftChip = { id: string; label: string; format?: ReelFormat };

export function draftChips(state: DraftState, enabledFormats: ReelFormat[]): DraftChip[] {
  if (state.step === "format") {
    return [
      ...(enabledFormats.includes("voiceover") ? [{ id: "format-voiceover", label: "Voiceover", format: "voiceover" as ReelFormat }] : []),
      ...(enabledFormats.includes("talking_head") ? [{ id: "format-talking_head", label: "Talking head", format: "talking_head" as ReelFormat }] : []),
    ];
  }
  if (state.step === "clips") return [{ id: "pick-clips", label: "Choose clips" }];
  if (state.step === "context") {
    return [
      { id: "skip-context", label: "Do it for me" },
      ...(state.format === "voiceover" ? [{ id: "write-script", label: "I wrote a script" }] : []),
    ];
  }
  if (state.step === "script") return [{ id: "skip-context", label: "Never mind — do it for me" }];
  return [{ id: "launch", label: "Build my reel" }];
}

export function draftLaunch(state: DraftState): { format: ReelFormat; clips: ClipFile[]; context: string; hasIdea: boolean; script?: string; title: string } | null {
  if (state.step !== "ready" || !state.format || state.clips.length === 0) return null;
  const context = state.context.trim();
  const script = state.script?.trim() || undefined;
  const title = context ? context.split(/\s+/).slice(0, 6).join(" ")
    : script ? script.split(/\s+/).slice(0, 6).join(" ")
    : `${state.format === "talking_head" ? "Talking head" : "Reel"} · ${new Date().toLocaleDateString()}`;
  return { format: state.format, clips: state.clips, context, hasIdea: context.length > 0 || !!script, script, title };
}
