// THE app-side state model (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md).
// "local" exists only while THIS DEVICE works (compressing, uploading); everything else mirrors
// the server's status contract verbatim. There is no other state machine.
export type ProjectStatus = {
  lifecycle: ProjectLifecycle;
  stage?: "analyze" | "plan" | "assemble";       // which retry a failure maps to
  phase?: string;                                 // live human phase while working
  steps?: { name: string; done: boolean }[];      // the active stage's full ledger-backed step list
  error?: string;                                 // human sentence when lifecycle === "error"
  canRetry?: boolean;
  reelUrl?: string;
  reply?: string;                                 // the editor's chat reply (incl. failed-edit answers)
};
export type ProjectState =
  | { kind: "local"; step: "optimizing" | "uploading"; progress: number; startedAt: number }
  | { kind: "local-error"; message: string; retry: "prep" | "assemble" }
  | { kind: "server"; status: ProjectStatus; startedAt: number };

/** One side of the refine chat. Legacy records stored bare strings (the user's messages). */
export type RefineMsg = { role: "you" | "editor"; text: string };

export type ReelFormat = "voiceover" | "talking_head";
export type ProjectLifecycle = "uploading" | "preparing" | "awaiting_voice" | "rendering" | "ready" | "editing" | "error";
export type MediaAttachment = { id?: string; uri?: string; filename: string; mimeType?: string; thumbnailUri?: string };

export type ProjectMessageBody =
  | { text: string }
  | { attachments: MediaAttachment[]; text?: string }
  | { script: string; revision: string }
  | { mode: "recorded" | "cloned"; durationSec?: number; revision?: string }
  | { reelUrl: string; summary: string };

export type ProjectMessage = {
  id: string;
  client_id?: string | null;
  role: "user" | "editor";
  kind: "material" | "direction" | "script" | "voice" | "text" | "reel" | "error";
  body: ProjectMessageBody;
  created_at: string;
};

export type ProjectRecord = {
  id: string;
  title: string;
  thumbnailUri?: string;
  format: ReelFormat;
  lifecycle?: ProjectLifecycle;
  createdAt: number;
  refineMessages?: (string | RefineMsg)[];
  // The creator's free-text context about the footage (feelings, goals, outline), kept for retries.
  context?: string;
  hdRequested?: boolean; // user tapped "Render in HD" — hide the draft/HD affordance afterward
  // The picked clips (picker URIs), kept so a failed upload can "Try again" with the SAME selection.
  clips?: ClipFile[];
  // The optimized (compressed) upload set from the last prep attempt — retries reuse these files
  // instead of re-optimizing, as long as they still exist in the cache dir.
  uploadClips?: ClipFile[];
  // Resumable-upload state (tus): which clips the server fully received, and the per-clip upload
  // URLs a retry resumes against. Keyed to the upload set so a re-optimize invalidates it.
  uploadedUris?: string[];
  uploadUrls?: Record<string, string>;
  uploadSetKey?: string;
  directAssets?: Record<string, {
    assetId: string; endpoint: string; bucketName: string; objectName: string;
    uploadUrl?: string; done?: boolean;
  }>;
  // A creator-written script (used verbatim server-side), kept so retries resend it.
  script?: string;
};



export type AngleAlternate = { angle: string; opener: string };
export type DroppedClip = { file: string; reason: string };
export type ScriptResult = {
  angle: string; targetSeconds: number; script: string; title?: string;
  angleAlternates?: AngleAlternate[]; dropped?: DroppedClip[]; canGenerateVo?: boolean;
  scriptRevision: string;
  generatedTake?: { durationSec?: number; revision?: string } | null;
};

export type ClipFile = { uri: string; name: string; type: string; size?: number };
export type VoFile = { uri: string; name: string; type: string };
