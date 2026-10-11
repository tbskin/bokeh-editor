import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  ThreadPrimitive,
  type ThreadMessageLike,
  type AppendMessage,
  type ThreadMessage,
} from "@assistant-ui/react-native";
import { useExternalStoreRuntime } from "@assistant-ui/core/react";
import { Body, Label } from "../typography";
import { color, font, radius } from "../tokens";
import type { ClipFile, ProjectMessage } from "@/lib/types";
import type { Chip } from "@/lib/chips";
import type { PresentStep } from "@/lib/presentState";
import { LIVE_ID } from "@/lib/threadItems";
import { loadBaseUrl } from "@/lib/config";
import { joinUrl } from "@/lib/url";
import { ClipThumb } from "./ClipThumb";
import { AuthenticatedImage } from "./AuthenticatedImage";
import { PopIn } from "./Motion";
import { TypingDots } from "./TypingDots";
import { ChipRow } from "./ChipRow";
import { ReelPosterCard } from "./ReelPosterCard";

// The conversation, rendered through assistant-ui's external-store runtime: the server-owned
// project_messages array stays authoritative (spec: docs/superpowers/specs/2026-07-19-one-state-
// system-design.md), assistant-ui owns the thread/composer mechanics. Each ProjectMessage travels
// through convertMessage with its kind+body in metadata.custom, so rendering stays ours. The
// screen assembles `messages` (incl. the live progress bubble, id LIVE_ID) via buildThreadItems —
// this component only renders; it never synthesizes thread content.

type CustomMeta = { kind?: ProjectMessage["kind"]; body?: Record<string, unknown>; live?: boolean };

const metaOf = (message: ThreadMessage): CustomMeta =>
  (message.metadata?.custom ?? {}) as CustomMeta;

const convertMessage = (message: ProjectMessage): ThreadMessageLike => {
  const body = message.body as Record<string, unknown>;
  const text = message.kind === "script" ? String(body.script ?? "")
    : message.kind === "voice"
      ? `${body.mode === "cloned" ? "Generated in your voice" : "Recorded by you"}${typeof body.durationSec === "number" ? ` · ${Math.round(body.durationSec)}s` : ""}`
      : message.kind === "reel" ? String(body.summary ?? "Your reel is ready.")
        : String(body.text ?? "");
  return {
    id: message.id,
    role: message.role === "user" ? "user" : "assistant",
    content: [{ type: "text", text }],
    createdAt: new Date(message.created_at),
    metadata: { custom: { kind: message.kind, body, live: message.id === LIVE_ID } },
  };
};

function EventRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.event}>
      <Label>{label}</Label>
      {children}
    </View>
  );
}

function AttachmentStrip({ attachments, localClips, remoteBase }: {
  attachments: Array<{ filename?: string; thumbnailUri?: string }>;
  localClips: ClipFile[];
  remoteBase: string | null;
}) {
  // Explicit height on the strip: a horizontal ScrollView inside a Fabric list cell can otherwise
  // expand into the cell instead of wrapping its children (seen on-device in Expo Go / new arch).
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentStrip} contentContainerStyle={styles.attachments}>
      {attachments.map((attachment, index) => {
        const local = localClips.find((clip) => clip.name === attachment.filename) ?? localClips[index];
        return (
          <View key={`${attachment.filename}-${index}`} style={styles.attachment}>
            {attachment.thumbnailUri && remoteBase
              ? <AuthenticatedImage uri={joinUrl(remoteBase, attachment.thumbnailUri)} style={StyleSheet.absoluteFill} />
              : local?.uri
                ? <ClipThumb uri={local.uri} />
                : <Ionicons name="videocam-outline" size={20} color={color.muted} />}
          </View>
        );
      })}
    </ScrollView>
  );
}

function MessageRow({ message, localClips, remoteBase, lastReelId, steps, working, coverUrl, onOpenReel }: {
  message: ThreadMessage;
  localClips: ClipFile[];
  remoteBase: string | null;
  lastReelId: string | null;
  steps?: PresentStep[];
  working: boolean;
  coverUrl?: string | null;
  onOpenReel?: () => void;
}) {
  const { kind = "text", body = {}, live } = metaOf(message);
  const text = message.content.filter((p) => p.type === "text").map((p) => p.text).join("");

  if (live) {
    return (
      <PopIn>
        <View style={styles.editorBubble}>
          {steps?.filter((s) => s.done).map((s) => (
            <View key={s.name} style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Ionicons name="checkmark" size={14} color={color.action} />
              <Body style={styles.eventBody}>{s.name}</Body>
            </View>
          ))}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            {working ? <TypingDots /> : null}
            <Body style={[styles.messageText, styles.editorText]}>{text}</Body>
          </View>
        </View>
      </PopIn>
    );
  }
  if (kind === "material") {
    const attachments = Array.isArray(body.attachments) ? body.attachments as Array<{ filename?: string; thumbnailUri?: string }> : [];
    return (
      <PopIn>
        <View style={styles.userBubbleWide}>
          <AttachmentStrip attachments={attachments} localClips={localClips} remoteBase={remoteBase} />
          {text ? <Body style={[styles.messageText, styles.userText]}>{text}</Body> : null}
        </View>
      </PopIn>
    );
  }
  if (kind === "direction") return <PopIn><EventRow label="Direction"><Body style={styles.eventBody}>{text}</Body></EventRow></PopIn>;
  if (kind === "script") return <PopIn><EventRow label="Script"><Body style={styles.script}>{text}</Body></EventRow></PopIn>;
  if (kind === "voice") return <PopIn><EventRow label="Voice"><Body style={styles.eventBody}>{text}</Body></EventRow></PopIn>;
  if (kind === "reel") {
    return (
      <PopIn>
        <View style={styles.reelMessage}>
          <View style={styles.editorBubble}><Body style={[styles.messageText, styles.editorText]}>{text}</Body></View>
          {message.id === lastReelId
            ? <ReelPosterCard coverUrl={coverUrl ?? null} onOpen={onOpenReel ?? (() => {})} />
            : null}
        </View>
      </PopIn>
    );
  }
  if (message.role === "user") {
    return <PopIn><View style={styles.userBubble}><Body style={[styles.messageText, styles.userText]}>{text}</Body></View></PopIn>;
  }
  if (kind === "error") return <PopIn><View style={styles.errorBubble}><Body style={[styles.messageText, styles.editorText]}>{text}</Body></View></PopIn>;
  return <PopIn><View style={styles.editorBubble}><Body style={[styles.messageText, styles.editorText]}>{text}</Body></View></PopIn>;
}

export function AssistantChat({
  messages, localClips = [], working, steps, chips, onChip, canChat, placeholder, onSend, onOpenReel, coverUrl, chipArmKey,
}: {
  /** Fully assembled by buildThreadItems (server messages + material + legacy + reel + live bubble). */
  messages: ProjectMessage[];
  localClips?: ClipFile[];
  /** pres.tone === "working" — drives the runtime's isRunning + the live bubble's TypingDots. */
  working: boolean;
  /** Done-steps rendered as green checkmarks inside the live bubble. */
  steps?: PresentStep[];
  chips: Chip[];
  onChip: (chip: Chip) => void;
  canChat: boolean;
  placeholder: string;
  onSend: (text: string) => void;
  /** Poster card tap — opens the fullscreen player sheet. */
  onOpenReel?: () => void;
  /** Poster image for the latest reel message. */
  coverUrl?: string | null;
  /** Bump to re-arm the chip row after an action that didn't change the chip set — picker
   * cancel, modal dismissed, failed action. */
  chipArmKey?: unknown;
}) {
  const [remoteBase, setRemoteBase] = useState<string | null>(null);
  useEffect(() => { loadBaseUrl().then(setRemoteBase).catch(() => {}); }, []);
  const listRef = useRef<FlatList<ThreadMessage>>(null);
  // Follow-scroll only while the reader is at (or near) the bottom — a reader who scrolled up to
  // reread something must never get yanked back down by new content arriving underneath them.
  const nearEndRef = useRef(true);
  // The very first content-size event after mount is the list's initial layout, not "new content
  // arrived" — jump there instantly instead of animating a scroll from nothing.
  const didInitialScrollRef = useRef(false);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const distanceFromEnd = contentSize.height - layoutMeasurement.height - contentOffset.y;
    nearEndRef.current = distanceFromEnd <= 120;
  }, []);

  const onContentSizeChange = useCallback(() => {
    if (!didInitialScrollRef.current) {
      didInitialScrollRef.current = true;
      listRef.current?.scrollToEnd({ animated: false });
      return;
    }
    if (nearEndRef.current) listRef.current?.scrollToEnd({ animated: true });
  }, []);

  // Chips are the list footer; when they change (or thumbnails finish loading and grow the
  // content) the end can slip under the composer — follow it after layout settles, but only if
  // the reader was already following along.
  const chipSignature = chips.map((chip) => chip.id).join(",");
  useEffect(() => {
    if (!nearEndRef.current) return;
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [chipSignature]);

  const lastReelId = useMemo(() => [...messages].reverse().find((m) => m.kind === "reel")?.id ?? null, [messages]);

  const onNew = useCallback(async (appended: AppendMessage) => {
    const text = appended.content.filter((p) => p.type === "text").map((p) => p.text).join("\n").trim();
    if (text) onSend(text);
  }, [onSend]);

  const runtime = useExternalStoreRuntime<ProjectMessage>({
    messages,
    convertMessage,
    onNew,
    isRunning: working,
    isSendDisabled: !canChat,
  });

  // The upstream d.ts bundles two copies of MessageState (store entry vs root entry), so the
  // children-render arg can't be named nominally here; it IS a ThreadMessage structurally.
  const renderMessage = useCallback(({ message }: { message: unknown }) => (
    <MessageRow
      message={message as ThreadMessage}
      localClips={localClips}
      remoteBase={remoteBase}
      lastReelId={lastReelId}
      steps={steps}
      working={working}
      coverUrl={coverUrl}
      onOpenReel={onOpenReel}
    />
  ), [localClips, remoteBase, lastReelId, steps, working, coverUrl, onOpenReel]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root style={styles.thread}>
        <ThreadPrimitive.Messages
          ref={listRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={100}
          onContentSizeChange={onContentSizeChange}
          ListFooterComponent={<ChipRow chips={chips} onPress={onChip} armKey={chipArmKey} />}
        >
          {renderMessage}
        </ThreadPrimitive.Messages>
        <ComposerPrimitive.Root style={styles.composer}>
          <ComposerPrimitive.Input
            placeholder={placeholder}
            editable={canChat}
            style={[styles.input, { opacity: canChat ? 1 : 0.6 }]}
            placeholderTextColor={color.faint}
          />
          <ComposerPrimitive.Send
            accessibilityRole="button"
            accessibilityLabel="Send"
            style={({ pressed }) => [styles.send, pressed && styles.sendPressed, !canChat && styles.sendDisabled]}
          >
            <Ionicons name="arrow-up" size={20} color={color.actionInk} />
          </ComposerPrimitive.Send>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  );
}

const styles = StyleSheet.create({
  thread: { flex: 1, gap: 10 },
  list: { flex: 1 },
  listContent: { paddingTop: 10, paddingBottom: 22 },
  event: { gap: 9, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: color.line },
  eventBody: { color: color.muted, fontSize: 14 },
  script: { color: color.text, fontSize: 15, lineHeight: 23 },
  attachmentStrip: { height: 70, flexGrow: 0 },
  attachments: { gap: 7 },
  attachment: { width: 48, height: 70, borderRadius: 8, overflow: "hidden", backgroundColor: color.surface2, alignItems: "center", justifyContent: "center" },
  userBubble: { alignSelf: "flex-end", maxWidth: "86%", marginVertical: 5, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: color.action, borderRadius: radius.control },
  userBubbleWide: { alignSelf: "flex-end", maxWidth: "86%", gap: 9, marginVertical: 5, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: color.action, borderRadius: radius.control },
  editorBubble: { alignSelf: "flex-start", maxWidth: "86%", marginVertical: 5, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line2, borderRadius: radius.control },
  errorBubble: { alignSelf: "flex-start", maxWidth: "86%", marginVertical: 5, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: color.dangerWash, borderLeftWidth: 2, borderLeftColor: color.danger, borderRadius: radius.control },
  reelMessage: { gap: 10, marginVertical: 5 },
  messageText: { fontSize: 14 },
  userText: { color: color.actionInk },
  editorText: { color: color.text },
  composer: { flexDirection: "row", gap: 10, alignItems: "flex-end", paddingBottom: 8 },
  input: { flex: 1, minHeight: 48, maxHeight: 120, fontFamily: font.body, fontSize: 16, color: color.text, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line2, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 12 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: color.action },
  sendPressed: { backgroundColor: color.actionPressed },
  sendDisabled: { opacity: 0.4 },
});
