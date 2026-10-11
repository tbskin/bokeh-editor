import { useEffect, useState } from "react";
import type { StyleProp, ImageStyle } from "react-native";
import { Image } from "expo-image";
import { currentToken } from "@/lib/auth";

/** Protected project thumbnails use request headers, never JWT query strings that can leak into
 * logs, caches, referrers, or the persisted project metadata. expo-image (not RN Image): RN's
 * Image drops source.headers under the New Architecture (facebook/react-native#45404). */
export function AuthenticatedImage({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  useEffect(() => { currentToken().then(setToken).catch(() => setToken(null)); }, []);
  const remote = /^https?:/i.test(uri);
  // Do not issue the first request without auth and hope a later source update retries it —
  // a cached 401 leaves a protected thumbnail blank for the session.
  if (remote && !token) return null;
  return (
    <Image
      source={{ uri, ...(remote ? { headers: { Authorization: `Bearer ${token}` } } : {}) }}
      style={style as object}
      contentFit="cover"
      transition={150}
    />
  );
}
