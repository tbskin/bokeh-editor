import { useEffect, useRef, useState } from "react";
import { View, TextInput, Pressable, ScrollView, StyleSheet, Alert, Animated, Easing, Modal } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAudioRecorder, RecordingPresets, setAudioModeAsync, createAudioPlayer, type AudioPlayer } from "expo-audio";
import { Screen } from "@/theme/Screen";
import { Title, Body, Label } from "@/theme/typography";
import { PrimaryButton } from "@/theme/components/PrimaryButton";
import { GhostButton } from "@/theme/components/GhostButton";
import { AppHeader } from "@/theme/components/Controls";
import { color, font, radius } from "@/theme/tokens";
import { getScript, generatePlan, switchAngle, sendSignal, voiceStatus, generateVo, saveScript } from "@/lib/api";
import type { AngleAlternate, DroppedClip } from "@/lib/types";
import { loadBaseUrl } from "@/lib/config";
import { pollStatus } from "@/lib/pollStatus";
import { useJobs } from "@/lib/jobStore";
import { useProjects } from "@/lib/projects";
import { currentToken } from "@/lib/auth";
import { idle, onGenerate, onGenerated, onScriptEdited, type GenState } from "@/lib/generateVoState";

// A steady red dot that pulses while recording, so it's unmistakable the mic is live.
function RecordingDot({ active }: { active: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => { loop.stop(); t.setValue(0); };
  }, [active, t]);
  if (!active) return <View style={styles.recDot} />;
  return (
    <Animated.View
      style={[
        styles.recDotOn,
        {
          opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }),
          transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
        },
      ]}
    />
  );
}

export default function Record() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const { submitVoAndAssemble, assembleGenerated } = useJobs();
  const { get } = useProjects();
  const project = get(id);
  const [script, setScript] = useState("");
  const [scriptRevision, setScriptRevision] = useState("");
  const savedScript = useRef("");
  const [angle, setAngle] = useState("");
  const [alternates, setAlternates] = useState<AngleAlternate[]>([]);
  const [droppedClips, setDroppedClips] = useState<DroppedClip[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [voUri, setVoUri] = useState<string | undefined>();
  const [recording, setRecording] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  // The generate-instead-of-record branch: a ready take is only ever valid for the script
  // revision it was generated from (frontend/src/lib/generateVoState.ts owns the transitions).
  const [canGenerateVo, setCanGenerateVo] = useState(false);
  const [hasVoice, setHasVoice] = useState<boolean | null>(null);
  const [gen, setGen] = useState<GenState>(idle());
  const [player, setPlayer] = useState<AudioPlayer | null>(null);
  const [playing, setPlaying] = useState(false);

  // Live recording timer — resets on stop, ticks every second while recording.
  useEffect(() => {
    if (!recording) { setRecSeconds(0); return; }
    const t = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);
  const recElapsed = `${Math.floor(recSeconds / 60)}:${String(recSeconds % 60).padStart(2, "0")}`;

  useEffect(() => {
    (async () => {
      try {
        const base = await loadBaseUrl();
        // voiceStatus never throws (it treats any failure as "no voice yet"), so it can't
        // spuriously flip loadError — only a real script-load failure does that.
        const [r, vs] = await Promise.all([getScript(base, id), voiceStatus(base)]);
        setScript(r.script); savedScript.current = r.script; setScriptRevision(r.scriptRevision);
        setAngle(r.angle); setAlternates(r.angleAlternates ?? []); setDroppedClips(r.dropped ?? []);
        setCanGenerateVo(!!r.canGenerateVo);
        setHasVoice(vs.hasVoice);
        if (r.generatedTake?.durationSec && (!r.generatedTake.revision || r.generatedTake.revision === r.scriptRevision)) {
          setGen(onGenerated(idle(), r.generatedTake.durationSec));
        }
      } catch { setLoadError(true); } finally { setLoading(false); }
    })();
  }, [id]);

  // A live preview player: (re)subscribe on every swap, and always release the previous instance —
  // this also covers "unload on unmount" since the last player is released on the final cleanup.
  useEffect(() => {
    if (!player) return;
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.isLoaded && status.didJustFinish) setPlaying(false);
    });
    return () => { sub.remove(); player.remove(); };
  }, [player]);

  // The preview only ever makes sense alongside the "ready" card — release it the moment gen
  // leaves that state, however that happens (Regenerate, Record it myself, or hand-editing the
  // script above the card while it's showing, which also routes through onScriptEdited).
  useEffect(() => {
    if (gen.status !== "ready") { setPlayer(null); setPlaying(false); }
  }, [gen.status]);

  const toggleRecord = async () => {
    if (recording) {
      try { await recorder.stop(); } catch {}
      setVoUri(recorder.uri ?? undefined);
      setRecording(false);
      return;
    }
    try {
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch { setRecording(false); }
  };

  const regenerate = async () => {
    setSheetOpen(false);
    setRegenerating(true);
    try {
      const base = await loadBaseUrl();
      sendSignal(base, id, "rerecord");
      await generatePlan(base, id, { hasIdea: !!project?.context, context: project?.context });
      await pollStatus(base, id, "plan");
      const r = await getScript(base, id);
      setScript(r.script); savedScript.current = r.script; setScriptRevision(r.scriptRevision);
      setAngle(r.angle); setAlternates(r.angleAlternates ?? []);
      setCanGenerateVo(!!r.canGenerateVo);
      setGen(onScriptEdited); // a new script invalidates any generated take of the old one
    } catch { Alert.alert("Couldn't regenerate", "Try again in a moment."); }
    finally { setRegenerating(false); }
  };

  // Fast path: the plan already proposed this angle — only the words get rewritten (seconds, not a re-plan).
  const pickAngle = async (a: AngleAlternate) => {
    setSheetOpen(false);
    setRegenerating(true);
    try {
      const base = await loadBaseUrl();
      await switchAngle(base, id, a.angle);
      await pollStatus(base, id, "plan");
      const r = await getScript(base, id);
      setScript(r.script); savedScript.current = r.script; setScriptRevision(r.scriptRevision);
      setAngle(r.angle); setAlternates(r.angleAlternates ?? []);
      setCanGenerateVo(!!r.canGenerateVo);
      setGen(onScriptEdited); // a new script invalidates any generated take of the old one
    } catch { Alert.alert("Couldn't switch angles", "Try again in a moment."); }
    finally { setRegenerating(false); }
  };

  // Hand-editing the teleprompter text invalidates a generated take the same way (pure module).
  const onScriptChange = (t: string) => {
    setScript(t);
    setGen(onScriptEdited);
  };

  const persistScript = async (): Promise<string> => {
    if (script === savedScript.current) return scriptRevision;
    if (!scriptRevision) throw new Error("Reload the script before saving it.");
    const base = await loadBaseUrl();
    const out = await saveScript(base, id, script, scriptRevision);
    savedScript.current = script;
    setScriptRevision(out.scriptRevision);
    return out.scriptRevision;
  };

  const onGenerateVo = async () => {
    setGen(onGenerate);
    try {
      const base = await loadBaseUrl();
      const revision = await persistScript();
      const { voSec, scriptRevision: generatedRevision } = await generateVo(base, id, revision);
      setScriptRevision(generatedRevision);
      // Functional update: if the script was edited while this was in flight, gen has already
      // moved back to idle (with a bumped rev) — don't let a late response resurrect "ready".
      setGen((s) => (s.status === "generating" ? onGenerated(s, voSec) : s));
    } catch (e) {
      setGen((s) => (s.status === "generating" ? idle(s.scriptRev) : s));
      Alert.alert("Couldn't generate your voiceover", String((e as Error)?.message ?? e));
    }
  };

  const onRegenerateVo = () => {
    // The watcher effect above releases the stale preview once gen leaves "ready".
    onGenerateVo();
  };

  const onRecordInstead = () => {
    setGen(onScriptEdited); // back to the teleprompter UI; the generated take is abandoned (and released)
  };

  const onMakeReelGenerated = () => {
    assembleGenerated(id);
    router.back();
  };

  const togglePreview = async () => {
    if (player) {
      if (playing) player.pause(); else player.play();
      setPlaying(!playing);
      return;
    }
    const base = await loadBaseUrl();
    const token = await currentToken();
    const p = createAudioPlayer({
      uri: `${base}/api/projects/${id}/vo`,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    p.play();
    setPlayer(p);
    setPlaying(true);
  };

  return (
    <Screen dismissKeyboard>
      <AppHeader onBack={() => router.back()} label="Record" />
      <Title>Add your story</Title>
      {angle ? <Label style={{ color: color.faint, marginTop: 2 }}>Angle · {angle}</Label> : null}
      {droppedClips.length > 0 ? (
        <Label style={{ color: color.faint, marginTop: 2 }}>
          Left out {droppedClips.length} clip{droppedClips.length > 1 ? "s" : ""}: {droppedClips.map((d) => d.reason).join(" · ")}
        </Label>
      ) : null}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 }}>
        <Label>Teleprompter</Label>
        <Ionicons name="pencil" size={11} color={color.faint} />
        <Label style={{ color: color.faint }}>tap the script to edit it</Label>
      </View>
      <ScrollView style={styles.prompter} contentContainerStyle={{ padding: 14 }} keyboardShouldPersistTaps="handled">
        <TextInput
          value={loading ? "Loading your script…" : script}
          onChangeText={onScriptChange}
          onBlur={() => persistScript().catch((e) => Alert.alert("Couldn't save your script", String((e as Error)?.message ?? e)))}
          editable={!loading} multiline
          placeholder={loadError ? "Couldn't load your script. Tap Different angle to retry, or type your own." : undefined}
          style={styles.script} placeholderTextColor={color.faint}
        />
      </ScrollView>
      <View style={{ gap: 10, paddingBottom: 8 }}>
        {gen.status === "ready" ? (
          <View style={styles.voCard}>
            <View style={styles.voRow}>
              <Pressable onPress={togglePreview} hitSlop={10}>
                <Ionicons name={playing ? "pause-circle" : "play-circle"} size={32} color={color.action} />
              </Pressable>
              <Body>Your voiceover — {Math.round(gen.voSec ?? 0)}s</Body>
            </View>
            <PrimaryButton label="Make reel" onPress={onMakeReelGenerated} />
            <GhostButton label="Regenerate" onPress={onRegenerateVo} />
            <Pressable onPress={onRecordInstead}>
              <Label style={{ textAlign: "center", color: color.muted }}>Record it myself instead</Label>
            </Pressable>
          </View>
        ) : (
          <>
            {canGenerateVo && (
              <>
                <PrimaryButton
                  label={gen.status === "generating" ? "Generating your voiceover…" : "Generate my voiceover"}
                  disabled={gen.status === "generating" || loading}
                  onPress={onGenerateVo}
                />
                <Label style={{ textAlign: "center", color: color.faint }}>or</Label>
              </>
            )}
            <Pressable onPress={toggleRecord} style={[styles.rec, recording && styles.recOn]}>
              <RecordingDot active={recording} />
              <Body style={{ color: recording ? color.rec : color.text }}>
                {recording ? `Recording  ${recElapsed}  ·  tap to stop` : voUri ? "Re-record voiceover" : "Record voiceover"}
              </Body>
            </Pressable>
            <GhostButton
              label={regenerating ? "Rewriting…" : "Different angle"}
              onPress={() => (alternates.length ? setSheetOpen(true) : regenerate())}
              disabled={regenerating || loading}
            />
            <PrimaryButton
              label="Make reel"
              disabled={!voUri || recording || regenerating}
              onPress={async () => {
                if (!voUri) return;
                try {
                  await persistScript();
                  submitVoAndAssemble({ id, vo: { uri: voUri, name: "vo.m4a", type: "audio/m4a" } });
                  router.back();
                } catch (e) { Alert.alert("Couldn't save your script", String((e as Error)?.message ?? e)); }
              }}
            />
            {!canGenerateVo && hasVoice === false && (
              <Pressable onPress={() => router.push("/voice-setup")}>
                <Label style={{ textAlign: "center", color: color.muted }}>Skip recording next time — set up your voice</Label>
              </Pressable>
            )}
          </>
        )}
        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setSheetOpen(false)} />
          <View style={styles.sheet}>
            <Label style={{ marginBottom: 4 }}>Pick a different angle</Label>
            {alternates.map((a) => (
              <Pressable key={a.angle} onPress={() => pickAngle(a)} style={styles.angleRow}>
                <Body>{a.angle}</Body>
                {a.opener ? <Body style={{ fontSize: 13, color: color.muted }}>“{a.opener}”</Body> : null}
              </Pressable>
            ))}
            <Pressable onPress={regenerate} style={[styles.angleRow, { borderStyle: "dashed" }]}>
              <Body style={{ color: color.muted }}>None of these — surprise me</Body>
            </Pressable>
          </View>
        </Modal>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  prompter: { flex: 1, backgroundColor: color.surface, borderRadius: radius.control, borderWidth: 1, borderColor: color.line, marginTop: 8, marginBottom: 14 },
  script: { fontFamily: font.body, fontSize: 17, lineHeight: 26, color: color.text, minHeight: 160 },
  voCard: { gap: 10 },
  voRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  rec: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 13, borderRadius: radius.control, borderWidth: 1, borderColor: color.line2 },
  recOn: { borderColor: color.rec, backgroundColor: "rgba(255,69,58,0.08)" },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.faint },
  sheetBackdrop: { flex: 1, backgroundColor: color.scrim },
  sheet: { backgroundColor: color.surface, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 34 },
  angleRow: { minHeight: 58, justifyContent: "center", borderBottomWidth: 1, borderBottomColor: color.line, paddingHorizontal: 4, paddingVertical: 11, gap: 3 },
  recDotOn: { width: 10, height: 10, borderRadius: 5, backgroundColor: color.rec },
});
