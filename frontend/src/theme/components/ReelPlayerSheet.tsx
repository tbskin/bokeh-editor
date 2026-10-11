import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { downloadAsync, cacheDirectory } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Body, Label } from "../typography";
import { color, radius } from "../tokens";
import { PrimaryButton } from "./PrimaryButton";
import { GhostButton } from "./GhostButton";
import { currentToken } from "@/lib/auth";
import { loadBaseUrl } from "@/lib/config";
import { joinUrl } from "@/lib/url";
import { sendSignal, undoProjectEdit } from "@/lib/api";
import { useJobs } from "@/lib/jobStore";
import { useProjects } from "@/lib/projects";

/** Fullscreen playback + the reel's actions (Share / HD / Undo). The chat never navigates away —
 * this is a sheet over it. Tokens travel in headers, never URLs. */
export function ReelPlayerSheet({ id, reelUrl, visible, working, canUndo, onClose, refresh }: {
  id: string; reelUrl: string; visible: boolean; working: boolean; canUndo: boolean;
  onClose: () => void; refresh: () => Promise<void>;
}) {
  const { finalize } = useJobs();
  const { get, update } = useProjects();
  const hdRequested = !!get(id)?.hdRequested;
  const [media, setMedia] = useState<{ uri: string; token: string | null } | null>(null);
  const [sharing, setSharing] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const dlRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    (async () => {
      const [b, t] = await Promise.all([loadBaseUrl(), currentToken()]);
      setMedia({ uri: joinUrl(b, reelUrl), token: t });
    })();
  }, [reelUrl]);

  const player = useVideoPlayer(null, (p) => { p.loop = true; });
  // Load once per media uri (on first open), resume on reopen — never reload a uri already loaded.
  const loadedUri = useRef<string | null>(null);
  useEffect(() => {
    if (!media || !visible) return;
    if (loadedUri.current !== media.uri) {
      loadedUri.current = media.uri;
      player.replaceAsync({ uri: media.uri, headers: media.token ? { Authorization: `Bearer ${media.token}` } : undefined })
        .then(() => player.play()).catch(() => { loadedUri.current = null; });
    } else {
      player.play();
    }
  }, [media, visible]);
  useEffect(() => { if (!visible) player.pause(); }, [visible]);

  useEffect(() => { setLocalUri(null); dlRef.current = null; }, [media?.uri]);
  const ensureDownload = (): Promise<string> => {
    if (localUri) return Promise.resolve(localUri);
    if (dlRef.current) return dlRef.current;
    const p = (async () => {
      if (!media) throw new Error("URL not ready");
      const dest = cacheDirectory + `reel-${id}-${Date.now()}.mp4`;
      const { uri } = await downloadAsync(media.uri, dest, { headers: media.token ? { Authorization: `Bearer ${media.token}` } : undefined });
      setLocalUri(uri);
      return uri;
    })();
    dlRef.current = p;
    p.catch(() => { dlRef.current = null; });
    return p;
  };
  useEffect(() => { if (media && visible) ensureDownload().catch(() => {}); }, [media?.uri, visible]);

  const share = async () => {
    setSharing(true);
    try {
      const uri = await ensureDownload();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        loadBaseUrl().then((b) => sendSignal(b, id, "shared"));
      }
    } catch { Alert.alert("Share failed", "Couldn't share the reel. Try again."); }
    finally { setSharing(false); }
  };

  const undo = async () => {
    setUndoing(true);
    try {
      await undoProjectEdit(await loadBaseUrl(), id);
      await refresh();
      onClose();
    } catch (e) { Alert.alert("Couldn't undo", String((e as Error)?.message ?? e)); }
    finally { setUndoing(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} onDismiss={onClose}>
      <View style={styles.sheet}>
        <View style={styles.grabRow}>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close player">
            <Ionicons name="chevron-down" size={26} color={color.onMedia} />
          </Pressable>
        </View>
        <View style={styles.playerBox}>
          {media && <VideoView player={player} style={{ flex: 1 }} contentFit="contain" nativeControls />}
        </View>
        <View style={styles.actions}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label={sharing ? "Sharing…" : "Share"} onPress={share} disabled={!media || sharing || working} />
            </View>
            <View style={{ flex: 1 }}>
              {hdRequested
                ? <GhostButton label="Rendered in HD ✓" onPress={() => {}} />
                : <PrimaryButton label="Render in HD" onPress={() => { update(id, { hdRequested: true }); finalize(id); onClose(); }} disabled={!media || working} />}
            </View>
          </View>
          {canUndo ? <GhostButton label={undoing ? "Undoing…" : "Undo last change"} onPress={undo} disabled={undoing || working} /> : null}
          {!hdRequested && <Label style={{ color: color.onMediaMuted }}>Fast preview — HD takes about a minute. Saving lives in the share sheet.</Label>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: "#101014" },
  grabRow: { paddingHorizontal: 16, paddingTop: 14, alignItems: "flex-start" },
  playerBox: { flex: 1, margin: 12, borderRadius: radius.tile, overflow: "hidden", backgroundColor: "#000" },
  actions: { padding: 16, paddingBottom: 28, gap: 10 },
});
