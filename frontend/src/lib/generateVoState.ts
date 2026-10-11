// The record screen's generated-take state, pure so it's testable: a ready take is only ever
// valid for the script revision it was generated from — any edit sends it back to idle.
export type GenState = { status: "idle" | "generating" | "ready"; voSec?: number; scriptRev: number };
export const idle = (rev = 0): GenState => ({ status: "idle", scriptRev: rev });
export const onGenerate = (s: GenState): GenState => ({ status: "generating", scriptRev: s.scriptRev });
export const onGenerated = (s: GenState, voSec: number): GenState => ({ status: "ready", voSec, scriptRev: s.scriptRev });
export const onScriptEdited = (s: GenState): GenState => ({ status: "idle", scriptRev: s.scriptRev + 1 });
