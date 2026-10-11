// The engine's public surface = what the API actually consumes. Internal modules (critique, watch,
// eyes, verify, edl, harness...) are imported relatively by engine code, the agent CLIs, and tests —
// re-export here only when a real external consumer appears.
export { assembleReel, renderFromEdl, measureCreatorWps } from "./assemble-reel";
export { runAssembleLoop } from "./assemble-loop";
export { refineJob } from "./refine";
export { runAnalyzeJob } from "./analyze";
export { runPlanJob, runAngleSwitch, parseScriptMd } from "./plan";
// For the dev analysis viewer: the live eyes prompt + the exact frame times it samples.
export { buildPrompt as buildEyesPrompt, frameTimestamps } from "./eyes";
export { synthesizeVo, voSource, speechSeconds } from "./tts-vo";
export { ensureEditDocument } from "./edit-document";
export { runTalkingHeadJob } from "./talking-head";
export { reviseVoiceoverScript } from "./revise-script";
