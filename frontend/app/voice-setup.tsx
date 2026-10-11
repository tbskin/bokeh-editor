// One-time voice cloning: explicit consent, one ~60s passage read with the same recorder the
// teleprompter uses, upload, done. Deleting is `DELETE /api/voice` (settings affordance ships with
// the next build).
import { useState } from "react";
import { View, Pressable, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, RecordingPresets, setAudioModeAsync } from "expo-audio";
import { Screen } from "@/theme/Screen";
import { Title, Body, Label } from "@/theme/typography";
import { PrimaryButton } from "@/theme/components/PrimaryButton";
import { AppHeader } from "@/theme/components/Controls";
import { color, radius } from "@/theme/tokens";
import { loadBaseUrl } from "@/lib/config";
import { voiceSetup } from "@/lib/api";

const PASSAGE =
  "Okay, quick sound check, reading this so the app can learn my voice. I went out for coffee this " +
  "morning and the line was somehow twenty people deep, which felt personal. The barista asked my " +
  "name twice and still wrote something wild on the cup. Anyway, the weather was perfect, one of " +
  "those bright, sharp days where everything looks better than it has any right to. I walked past " +
  "the park, watched a dog absolutely refuse to give up a tennis ball, and thought, yeah, this is " +
  "the content. If you can hear the ups and downs in this, the pauses, the quick parts, that's the " +
  "point. Thirty more seconds of me talking like a person: what did I eat today, who did I text " +
  "back too late, why do I always pick the slowest checkout line. Great questions. No answers. Done.";

export default function VoiceSetup() {
  const router = useRouter();
  // Same recorder hook and preset the teleprompter screen uses (record.tsx) — one recording idiom app-wide.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [consented, setConsented] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch { setRecording(false); }
  };
  const stop = async () => {
    try { await recorder.stop(); } catch {}
    setUri(recorder.uri ?? undefined);
    setRecording(false);
  };
  const submit = async () => {
    if (!uri) return;
    setBusy(true);
    try {
      const base = await loadBaseUrl();
      await voiceSetup(base, { uri, name: "sample.m4a", type: "audio/m4a" });
      Alert.alert("Your voice is set up", "Next reel, you can generate the voiceover instead of recording it.");
      router.back();
    } catch (e) {
      Alert.alert("Couldn't set up your voice", String((e as Error)?.message ?? e));
    } finally { setBusy(false); }
  };

  return (
    <Screen scroll dismissKeyboard>
      <AppHeader onBack={() => router.back()} />
      <View style={{ gap: 16, paddingBottom: 24 }}>
        <Title>Set up your voice</Title>
        <Body style={{ color: color.muted }}>
          Read the passage below out loud, naturally — about a minute. We use it once to clone your
          voice so future reels can be voiced without recording. We use it only to voice your reels,
          and you can delete it anytime in Settings.
        </Body>
        <Pressable onPress={() => setConsented(!consented)} style={[styles.consent, consented && styles.consentOn]}>
          <Ionicons name={consented ? "checkbox" : "square-outline"} size={22} color={consented ? color.action : color.faint} />
          <Body style={{ flex: 1, fontSize: 14 }}>This is my voice, and I consent to Bokeh cloning it to narrate my reels.</Body>
        </Pressable>
        <View style={styles.passage}><Body style={{ fontSize: 16, lineHeight: 24 }}>{PASSAGE}</Body></View>
        {!recording && !uri && <PrimaryButton label="Start recording" disabled={!consented} onPress={start} />}
        {recording && <PrimaryButton label="Stop" onPress={stop} />}
        {uri && !busy && (
          <>
            <PrimaryButton label="Create my voice" onPress={submit} />
            <Pressable onPress={() => setUri(undefined)}><Label style={{ textAlign: "center", color: color.muted }}>Re-record</Label></Pressable>
          </>
        )}
        {busy && <Label style={{ textAlign: "center" }}>Setting up your voice…</Label>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  consent: { flexDirection: "row", gap: 11, alignItems: "center", padding: 14, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line2, borderRadius: radius.control },
  consentOn: { borderColor: color.action, backgroundColor: color.selection },
  passage: { padding: 16, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line2, borderRadius: radius.control },
});
