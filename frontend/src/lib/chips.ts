import type { Presentation } from "./presentState";

// Quick-reply chips ARE the presenter wearing a chat costume: computed every render from
// (presentation, detail), never stored. suggestText chips post as ordinary chat messages;
// the rest map to existing actions in the screen.
export type ChipId = "voice-generate" | "voice-record" | "retry" | "undo"
  | "suggest-tighten" | "suggest-opening" | "suggest-ending";
export type Chip = { id: ChipId; label: string; suggestText?: string };

export function chipsFor(
  pres: Presentation,
  detail: { voice?: { canGenerate: boolean }; canUndo?: boolean } | null,
): Chip[] {
  if (pres.cta === "voice") {
    return [
      ...(detail?.voice?.canGenerate ? [{ id: "voice-generate", label: "Generate my voiceover" } as Chip] : []),
      { id: "voice-record", label: "Record it myself" },
    ];
  }
  if (pres.tone === "error") return [{ id: "retry", label: "Try again" }];
  if (pres.tone === "ready") {
    return [
      { id: "suggest-tighten", label: "Tighten the intro", suggestText: "Tighten the intro" },
      { id: "suggest-opening", label: "Different opening clip", suggestText: "Try a different opening clip" },
      { id: "suggest-ending", label: "Stronger ending", suggestText: "Make the ending land harder" },
      ...(detail?.canUndo ? [{ id: "undo", label: "Undo last change" } as Chip] : []),
    ];
  }
  return [];
}
