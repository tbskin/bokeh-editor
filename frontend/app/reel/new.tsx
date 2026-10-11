import { useEffect, useRef, useState } from "react";
import { Alert, Keyboard, View } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Screen } from "@/theme/Screen";
import { AppHeader } from "@/theme/components/Controls";
import { AssistantChat } from "@/theme/components/AssistantChat";
import { draftChips, draftInit, draftLaunch, draftMessages, draftReduce, type DraftChip, type DraftState } from "@/lib/draftScript";
import type { Chip } from "@/lib/chips";
import type { ClipFile, ReelFormat } from "@/lib/types";
import { capabilities, createProject } from "@/lib/api";
import { loadBaseUrl } from "@/lib/config";
import { useJobs } from "@/lib/jobStore";
import { useProjects } from "@/lib/projects";
import { track } from "@/lib/analytics";

// The creation conversation: deterministic client script until clips launch, then the real
// pipeline (createProject → startPrep) takes over and we replace into reel/[id].
export default function NewReelChat() {
  const router = useRouter();
  const { startPrep } = useJobs();
  const { add } = useProjects();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<DraftState>(draftInit);
  const [enabledFormats, setEnabledFormats] = useState<ReelFormat[]>(["voiceover"]); // fail closed
  const [busy, setBusy] = useState(false);
  const [chipArm, setChipArm] = useState(0);
  useEffect(() => { loadBaseUrl().then(capabilities).then((v) => setEnabledFormats(v.formats)).catch(() => {}); }, []);
  // Leaving this screen mid-launch (back nav, kill) must not teleport the creator into a project
  // they no longer expect, nor orphan a project the server already created for them.
  const aliveRef = useRef(true);
  useEffect(() => () => { aliveRef.current = false; }, []);

  const pick = async () => {
    try {
      // No videoExportPreset: forcing a transcode fails on HEVC sources — pick originals.
      const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["videos"], allowsMultipleSelection: true, quality: 1 });
      if (res.canceled) { setChipArm((k) => k + 1); return; }
      const picked: ClipFile[] = res.assets.map((a, i) => ({
        uri: a.uri, name: a.fileName ?? `clip-${Date.now()}-${i}.mov`, type: a.mimeType ?? "video/quicktime", size: a.fileSize,
      }));
      setDraft((d) => draftReduce(d, { type: "add-clips", clips: picked }));
    } catch {
      Alert.alert("Couldn't add those clips", "One of the videos couldn't be read. Try different clips.");
      setChipArm((k) => k + 1);
    }
  };

  const launch = async () => {
    const payload = draftLaunch(draft);
    if (!payload || busy) return;
    setBusy(true);
    try {
      const base = await loadBaseUrl();
      if (!aliveRef.current) return; // left before anything server-side exists — nothing to clean up
      const { id } = await createProject(base, { format: payload.format, title: payload.title });
      let thumbnailUri: string | undefined;
      try { thumbnailUri = (await VideoThumbnails.getThumbnailAsync(payload.clips[0].uri, { time: 0 })).uri; } catch {}
      // The project exists server-side now — always register it and start prep so it isn't
      // orphaned, even if the creator backed out of this screen mid-launch. Only the navigation
      // (which would teleport them into a screen they no longer expect) is conditional.
      await add({ id, title: payload.title, thumbnailUri, format: payload.format, createdAt: Date.now(), context: payload.context || undefined, script: payload.script });
      startPrep(id, { clips: payload.clips, context: payload.context, hasIdea: payload.hasIdea, script: payload.script });
      if (aliveRef.current) router.replace(`/reel/${id}`);
    } catch (e) {
      if (!aliveRef.current) return; // screen is gone — no one to show the failure to
      setBusy(false);
      Alert.alert("Couldn't start your reel", typeof (e as Error)?.message === "string" && (e as Error).message ? (e as Error).message : "Check your connection and try again.");
      setChipArm((k) => k + 1);
    }
  };

  const onChip = (chip: Chip | DraftChip) => {
    track("chip_tapped", { chip: chip.id, project: "draft" });
    const d = chip as DraftChip;
    if (d.format) return setDraft((s) => draftReduce(s, { type: "choose-format", format: d.format! }));
    if (d.id === "pick-clips") return void pick();
    if (d.id === "skip-context") return setDraft((s) => draftReduce(s, { type: "skip-context" }));
    if (d.id === "write-script") return setDraft((s) => draftReduce(s, { type: "begin-script" }));
    if (d.id === "launch") return void launch();
  };

  // Typing IS the answer: context at the context step, the script at the script step.
  const onSend = (text: string) => {
    if (draft.step === "script") {
      if (text.trim().split(/\s+/).length < 8) {
        Alert.alert("A bit short", "Your script is used word for word — give me at least 8 words.");
        return;
      }
      Keyboard.dismiss();
      setDraft((s) => draftReduce(s, { type: "set-script", text }));
      return;
    }
    Keyboard.dismiss();
    setDraft((s) => draftReduce(s, { type: "set-context", text }));
  };
  const canChat = draft.step === "context" || draft.step === "script";

  return (
    <Screen dismissKeyboard>
      <AppHeader onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))} label="New reel" />
      <View style={{ flex: 1, paddingTop: 6, paddingBottom: insets.bottom ? 0 : 8 }}>
        <AssistantChat
          messages={draftMessages(draft)}
          localClips={draft.clips}
          working={busy}
          chips={busy ? [] : (draftChips(draft, enabledFormats) as unknown as Chip[])}
          onChip={onChip as (chip: Chip) => void}
          canChat={canChat && !busy}
          placeholder={draft.step === "script" ? "Paste or write your voiceover script"
            : canChat ? "What was going on? How did it feel? A rough outline works too."
            : "Use the buttons above"}
          onSend={onSend}
          chipArmKey={chipArm}
        />
      </View>
    </Screen>
  );
}
