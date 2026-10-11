import { useCallback, useEffect, useState } from "react";
import { View, Alert, Keyboard, Platform } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/theme/Screen";
import { presentState, type Presentation } from "@/lib/presentState";
import { useJob, useJobs } from "@/lib/jobStore";
import { useProjects } from "@/lib/projects";
import { loadBaseUrl } from "@/lib/config";
import { joinUrl } from "@/lib/url";
import { undoProjectEdit } from "@/lib/api";
import { useProjectThread } from "@/lib/projectThread";
import { chipsFor, type Chip } from "@/lib/chips";
import { buildThreadItems } from "@/lib/threadItems";
import { track } from "@/lib/analytics";
import { AssistantChat } from "@/theme/components/AssistantChat";
import { ReelPlayerSheet } from "@/theme/components/ReelPlayerSheet";
import { AppHeader } from "@/theme/components/Controls";

// ONE screen, ONE layout (spec: docs/superpowers/specs/2026-07-19-one-state-system-design.md):
// the conversation fills the screen, full height — no pinned status/error/voice cards above it.
// Every state (working, ready, error, awaiting voice) speaks through the thread itself: the live
// progress bubble, the reel poster message, quick-reply chips, and a synthesized error bubble.
// presentState is still THE presenter; this screen only turns its output into thread + chips.

/** Live keyboard height — KeyboardAvoidingView silently no-ops in this screen's SafeArea nesting. */
function useKeyboardHeight(): number {
  const [h, setH] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setH(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return h;
}

function useElapsed(startedAt?: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [startedAt]);
  if (!startedAt) return "";
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function Reel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resume, retryAssemble, retryPrep, messageProject, adoptStatus } = useJobs();
  const { get } = useProjects();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const keyboardPad = Math.max(0, keyboard - insets.bottom);
  const project = get(id);
  const state = useJob(id);
  const { detail, messages, refresh, appendOptimistic, removeOptimistic } = useProjectThread(id);
  const format = project?.format ?? detail?.format ?? "voiceover";
  const pres: Presentation = presentState(format, state);
  const elapsed = useElapsed(pres.startedAt);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [remoteBase, setRemoteBase] = useState<string | null>(null);
  const [chipArm, setChipArm] = useState(0);
  useEffect(() => { loadBaseUrl().then(setRemoteBase).catch(() => {}); }, []);
  useEffect(() => { if (id) resume(id); }, [id, resume]);
  // Re-arms the chip row on screen refocus — fires when the record modal or voice-setup closes
  // above this screen, even if the action didn't change the chip set (e.g. dismiss-without-record).
  useFocusEffect(useCallback(() => { setChipArm((k) => k + 1); }, []));

  // The composer is always visible; it's actionable when the server can route a message
  // (script feedback while awaiting voice, edit requests on a ready reel).
  const canChat = pres.cta === "voice" || pres.tone === "ready";
  const placeholder = pres.tone === "ready" ? "Refine, e.g. tighten the intro or beach clip first"
    : pres.cta === "voice" ? "Ask for a script or direction change"
    : pres.tone === "working" ? "Available once this step finishes"
    : "Tap Try again above";

  // status.reply is ALSO persisted as a project_messages row server-side; the live bubble only
  // bridges the polling gap until that row arrives (same dedupe pattern as the error bubble below).
  const replyText = pres.tone === "working" || pres.tone === "error" ? undefined : pres.reply;
  const liveText = pres.tone === "working" ? `${pres.headline}${elapsed ? ` · ${elapsed}` : ""}`
    : replyText && !messages.some((m) => (m.body as { text?: string }).text === replyText) ? replyText
    : undefined;
  const threadMessages = buildThreadItems({ messages, project, pres, liveText });
  const chips = pres.tone === "working" ? [] : chipsFor(pres, detail && { voice: detail.voice ?? undefined, canUndo: detail.canUndo });

  const send = (text: string) => {
    if (!text || !canChat) return;
    const clientId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    appendOptimistic({
      id: `optimistic-${clientId}`, client_id: clientId, role: "user", kind: "text",
      body: { text }, created_at: new Date().toISOString(),
    });
    Keyboard.dismiss();
    // A send that never reaches the server must not leave a permanent ghost bubble — the error
    // reply that messageProject surfaces already explains the failure.
    messageProject(id, text, clientId, () => removeOptimistic(clientId));
  };

  const onChip = (chip: Chip) => {
    track("chip_tapped", { chip: chip.id, project: id });
    if (chip.suggestText) return send(chip.suggestText);
    if (chip.id === "voice-generate" || chip.id === "voice-record") return router.push(`/reel/${id}/record`);
    if (chip.id === "retry") return pres.cta === "retry-assemble" ? retryAssemble(id) : retryPrep(id, project?.context);
    if (chip.id === "undo") {
      loadBaseUrl()
        .then((b) => undoProjectEdit(b, id))
        .then(({ reelUrl }) => {
          // Adopt the undone cut's URL immediately — otherwise playback/Share can still serve the
          // pre-undo reel in the gap before the next poll tick picks up the server's status.
          adoptStatus(id, { reelUrl });
          refresh();
        })
        .catch((e) => {
          Alert.alert("Couldn't undo", String((e as Error)?.message ?? e));
          setChipArm((k) => k + 1);
        });
    }
  };

  const errorText = pres.tone === "error" ? pres.error : undefined;
  const allMessages = errorText && !threadMessages.some((m) => m.kind === "error" && (m.body as { text?: string }).text === errorText)
    ? [...threadMessages, { id: "live-error", role: "editor" as const, kind: "error" as const, body: { text: errorText }, created_at: new Date().toISOString() }]
    : threadMessages;

  return (
    <Screen dismissKeyboard>
      <AppHeader onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))} label={project?.title} />
      <View style={{ flex: 1, paddingTop: 6, paddingBottom: keyboardPad }}>
        <AssistantChat
          messages={allMessages}
          localClips={project?.clips}
          working={pres.tone === "working"}
          steps={pres.steps}
          chips={chips}
          onChip={onChip}
          canChat={canChat}
          placeholder={placeholder}
          onSend={send}
          onOpenReel={() => setPlayerOpen(true)}
          coverUrl={detail?.cover && remoteBase ? joinUrl(remoteBase, detail.cover) : null}
          chipArmKey={chipArm}
        />
      </View>
      {!!pres.reelUrl && (
        <ReelPlayerSheet
          id={id} reelUrl={pres.reelUrl} visible={playerOpen} working={pres.tone === "working"}
          canUndo={!!detail?.canUndo} onClose={() => setPlayerOpen(false)} refresh={refresh}
        />
      )}
    </Screen>
  );
}
