import { View } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { AudioModule } from "expo-audio";
import { Screen } from "@/theme/Screen";
import { Wordmark } from "@/theme/components/Wordmark";
import { Display, Body, Label } from "@/theme/typography";
import { PrimaryButton } from "@/theme/components/PrimaryButton";
import { color } from "@/theme/tokens";

export default function Onboarding() {
  const router = useRouter();
  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <Wordmark size={22} />
        <Label>AI content co-pilot</Label>
        <Display>Your clips plus your story become a post-ready reel.</Display>
        <Body style={{ color: color.muted }}>
          Bring raw footage and narrate it. An agent understands your footage and cuts the reel. You steer it by chatting.
        </Body>
      </View>
      <View style={{ paddingBottom: 12 }}>
        <PrimaryButton
          label="Get started"
          onPress={async () => {
            await ImagePicker.requestMediaLibraryPermissionsAsync();
            await AudioModule.requestRecordingPermissionsAsync();
            await AsyncStorage.setItem("ole.onboarded", "1");
            router.replace("/");
          }}
        />
      </View>
    </Screen>
  );
}
