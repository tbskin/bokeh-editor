import { Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Label } from "../typography";
import { color, radius } from "../tokens";
import type { ProjectRecord } from "@/lib/types";
import { AuthenticatedImage } from "./AuthenticatedImage";

export function ReelTile({ project, onPress, onLongPress, statusLine }: {
  project: ProjectRecord; onPress: () => void; onLongPress?: () => void; statusLine?: string;
}) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      {project.thumbnailUri ? (
        <AuthenticatedImage uri={project.thumbnailUri} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: color.surface2 }]} />
      )}
      <View style={styles.overlay}>
        <Body numberOfLines={1} style={styles.title}>{project.title}</Body>
        <View style={styles.statusRow}>
          <View style={[styles.statusMark, (statusLine ?? "Ready") !== "Ready" && styles.statusMarkActive]} />
          <Label numberOfLines={1} style={styles.status}>{statusLine ?? "Ready"}</Label>
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  tile: { flex: 1, aspectRatio: 9 / 16, borderRadius: radius.tile, overflow: "hidden", borderWidth: 1, borderColor: color.line },
  overlay: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: color.overlay, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  title: { fontSize: 13, color: color.onMedia },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
  statusMark: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.onMediaMuted },
  statusMarkActive: { backgroundColor: color.onMedia },
  status: { flex: 1, fontSize: 8, lineHeight: 12, letterSpacing: 0.65, color: color.onMediaMuted },
  pressed: { opacity: 0.82 },
});
