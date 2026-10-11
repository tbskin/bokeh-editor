import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as VideoThumbnails from "expo-video-thumbnails";
import { color } from "../tokens";

// Poster frames are generated ONCE per clip uri and remembered for the session: FlatList cell
// recycling remounts this component constantly, and regenerating a 4K poster on every remount
// both burns CPU and re-decodes tens of MB per clip. The crash class this guards against: RN's
// core Image decodes at SOURCE size (a 4K poster ≈ 30MB of memory each; a clips bubble of nine
// killed the app on-device) — expo-image decodes at the rendered view size instead.
const posterCache = new Map<string, string>();

export function ClipThumb({ uri }: { uri: string }) {
  const [poster, setPoster] = useState<string | null>(posterCache.get(uri) ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const cached = posterCache.get(uri);
    if (cached) { setPoster(cached); setFailed(false); return; }
    let alive = true;
    setPoster(null);
    setFailed(false);
    VideoThumbnails.getThumbnailAsync(uri, { time: 0 })
      .then((r) => { posterCache.set(uri, r.uri); if (alive) setPoster(r.uri); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [uri]);
  return (
    <View style={StyleSheet.absoluteFill}>
      {poster ? (
        <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={uri} />
      ) : failed ? (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <Ionicons name="videocam-outline" size={20} color={color.faint} />
        </View>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.loading]}>
          <ActivityIndicator size="small" color={color.muted} />
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  loading: { backgroundColor: color.surface2, alignItems: "center", justifyContent: "center" },
});
