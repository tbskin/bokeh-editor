import { useEffect, useState } from "react";
import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/theme/Screen";
import { Title, Label, Body } from "@/theme/typography";
import { PrimaryButton } from "@/theme/components/PrimaryButton";
import { GhostButton } from "@/theme/components/GhostButton";
import { TextField } from "@/theme/components/Controls";
import { color } from "@/theme/tokens";
import { loadBaseUrl, saveBaseUrl, PROD_BASE, LOCAL_BASE } from "@/lib/config";
import { useAuth } from "@/lib/auth";
import { deleteVoice, voiceStatus } from "@/lib/api";

export default function Settings() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const [url, setUrl] = useState("");
  const [hasVoice, setHasVoice] = useState(false);
  useEffect(() => {
    loadBaseUrl().then((base) => { setUrl(base); voiceStatus(base).then((s) => setHasVoice(s.hasVoice)); });
  }, []);

  return (
    <Screen scroll dismissKeyboard>
      <View style={{ gap: 16, paddingTop: 20 }}>
        <Title>Settings</Title>

        <Label>Account</Label>
        <Body style={{ color: color.muted }}>{session?.user?.email ?? "Signed in"}</Body>
        <GhostButton label="Sign out" onPress={async () => { await signOut(); router.replace("/"); }} />

        <Label>Your generated voice</Label>
        <Body style={{ color: color.muted }}>{hasVoice ? "Ready for voiceover reels." : "No cloned voice saved."}</Body>
        {hasVoice ? (
          <GhostButton label="Delete my voice" onPress={() => Alert.alert(
            "Delete your generated voice?",
            "Future reels will use recording until you set it up again.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                try { await deleteVoice(await loadBaseUrl()); setHasVoice(false); }
                catch (e) { Alert.alert("Couldn't delete your voice", String((e as Error)?.message ?? e)); }
              } },
            ],
          )} />
        ) : <GhostButton label="Set up my voice" onPress={() => router.push("/voice-setup")} />}

        {__DEV__ && (
          <>
            <Label>Backend (dev only)</Label>
            <TextField
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={PROD_BASE}
            />
            <Body style={{ color: color.muted, fontSize: 13 }}>
              On a physical phone use your machine's LAN IP. Release builds always use prod.
            </Body>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><GhostButton label="Prod" onPress={() => setUrl(PROD_BASE)} /></View>
              <View style={{ flex: 1 }}><GhostButton label="Local" onPress={() => setUrl(LOCAL_BASE)} /></View>
            </View>
            <PrimaryButton label="Save" onPress={async () => { await saveBaseUrl(url.trim()); router.back(); }} />
          </>
        )}
      </View>
    </Screen>
  );
}
