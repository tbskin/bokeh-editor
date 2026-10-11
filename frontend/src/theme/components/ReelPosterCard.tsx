import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Label } from "../typography";
import { color, radius } from "../tokens";
import { AuthenticatedImage } from "./AuthenticatedImage";
import { PopIn } from "./Motion";

/** The reel as a chat message: poster frame + play glyph. Tapping opens the fullscreen player. */
export function ReelPosterCard({ coverUrl, onOpen }: { coverUrl: string | null; onOpen: () => void }) {
  return (
    <PopIn>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Watch your reel"
        style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}>
        {coverUrl
          ? <AuthenticatedImage uri={coverUrl} style={StyleSheet.absoluteFill} />
          : <View style={[StyleSheet.absoluteFill, { backgroundColor: "#101014" }]} />}
        <View style={styles.scrim}>
          <View style={styles.play}><Ionicons name="play" size={22} color="#101014" /></View>
        </View>
        <View style={styles.caption}>
          <Body style={{ color: color.onMedia, fontSize: 13 }}>First cut</Body>
          <Label style={{ color: color.onMediaMuted }}>Tap to watch</Label>
        </View>
      </Pressable>
    </PopIn>
  );
}

const styles = StyleSheet.create({
  card: { width: 132, aspectRatio: 9 / 16, borderRadius: radius.tile, overflow: "hidden", marginVertical: 5, borderWidth: 1, borderColor: color.line },
  scrim: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.18)" },
  play: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center", paddingLeft: 3 },
  caption: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 9, gap: 1, backgroundColor: color.overlay },
});
