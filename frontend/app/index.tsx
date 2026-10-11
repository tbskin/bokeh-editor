import { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Alert } from "react-native";
import { useRouter, Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Screen } from "@/theme/Screen";
import { Wordmark } from "@/theme/components/Wordmark";
import { Label, Body } from "@/theme/typography";
import { Fab } from "@/theme/components/Fab";
import { ReelTile } from "@/theme/components/ReelTile";
import { IconButton } from "@/theme/components/Controls";
import { color } from "@/theme/tokens";
import { useProjects } from "@/lib/projects";
import { useJobs } from "@/lib/jobStore";
import { useAuth } from "@/lib/auth";
import type { ProjectState } from "@/lib/types";
import { presentState } from "@/lib/presentState";

// The tile line comes from THE presenter — the same function the detail screen renders from, so
// home and detail can never disagree about a project again.
function statusLine(state: ProjectState | undefined, format: "voiceover" | "talking_head", lifecycle?: import("@/lib/types").ProjectLifecycle): string {
  const effective: ProjectState | undefined = state ?? (lifecycle ? { kind: "server", status: { lifecycle }, startedAt: 0 } : undefined);
  if (!effective) return "Ready";
  const p = presentState(format, effective);
  return p.progress != null && p.progress > 0 ? `${p.badge} · ${Math.round(p.progress * 100)}%` : p.badge;
}

export default function Home() {
  const router = useRouter();
  const { projects, remove } = useProjects();
  const { states } = useJobs();
  const { session, loading: authLoading } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("ole.onboarded").then((v) => setOnboarded(!!v));
  }, []);

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(`Delete "${title}"?`, "The reel, clips, and voiceover are gone for good.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => remove(id).catch((e) => Alert.alert("Couldn't delete", String(e?.message ?? e))),
      },
    ]);
  };

  // Gates — all declarative redirects, safe inside the mounted navigator.
  // Order: wait for state → first-run onboarding → sign-in → home.
  if (onboarded === null || authLoading) return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (!session) return <Redirect href="/login" />;

  return (
    <Screen>
      <View style={styles.header}>
        <Wordmark size={19} />
        <IconButton icon="settings-outline" onPress={() => router.push("/settings")} label="Settings" />
      </View>
      <Label>Your reels</Label>
      {projects.length === 0 ? (
        <View style={styles.empty}>
          <Body style={{ color: color.muted, textAlign: "center" }}>No reels yet. Tap + to make your first one.</Body>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 11 }}
          contentContainerStyle={{ gap: 11, paddingTop: 12, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ReelTile
              project={item}
              statusLine={statusLine(states[item.id], item.format, item.lifecycle)}
              onPress={() => router.push(`/reel/${item.id}`)}
              onLongPress={() => confirmDelete(item.id, item.title)}
            />
          )}
        />
      )}
      <Fab onPress={() => router.push("/reel/new")} />
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
});
