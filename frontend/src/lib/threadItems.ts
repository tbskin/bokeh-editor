import type { Presentation } from "./presentState";
import type { ClipFile, ProjectMessage, RefineMsg } from "./types";

// The whole thread is assembled here, pure: server messages + optimistic material + legacy
// refine chat + legacy reel synthesis + the live progress bubble. Screens render, never decide.
export const LIVE_ID = "assistant-live";
export const LEGACY_REEL_ID = "legacy-reel";

export function buildThreadItems({ messages, project, pres, liveText }: {
  messages: ProjectMessage[];
  project?: { clips?: ClipFile[]; context?: string; createdAt: number; refineMessages?: (string | RefineMsg)[] } | undefined;
  pres: Presentation;
  liveText?: string;
}): ProjectMessage[] {
  const createdAt = new Date(project?.createdAt ?? 0).toISOString();
  const out: ProjectMessage[] = messages.some((m) => m.kind === "material") || !project?.clips?.length
    ? [...messages]
    : [{
        id: "optimistic-material", role: "user", kind: "material", created_at: createdAt,
        body: {
          attachments: project.clips.map((clip) => ({ filename: clip.name, mimeType: clip.type })),
          ...(project.context ? { text: project.context } : {}),
        },
      }, ...messages];

  for (const [index, item] of (project?.refineMessages ?? []).entries()) {
    const legacy = typeof item === "string" ? { role: "you" as const, text: item } : item;
    out.push({
      id: `legacy-${index}`, role: legacy.role === "you" ? "user" : "editor", kind: "text",
      body: { text: legacy.text }, created_at: createdAt,
    });
  }

  if (pres.reelUrl && !out.some((m) => m.kind === "reel")) {
    out.push({
      id: LEGACY_REEL_ID, role: "editor", kind: "reel", created_at: createdAt,
      body: { reelUrl: pres.reelUrl, summary: "Your reel is ready." },
    });
  }

  if (liveText) {
    out.push({ id: LIVE_ID, role: "editor", kind: "text", body: { text: liveText }, created_at: new Date().toISOString() });
  }
  return out;
}
