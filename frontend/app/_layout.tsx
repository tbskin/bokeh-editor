import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppFonts } from "@/theme/fonts";
import { color } from "@/theme/tokens";
import { AuthProvider } from "@/lib/auth";
import { ProjectsProvider } from "@/lib/projects";
import { JobProvider } from "@/lib/jobStore";

export default function RootLayout() {
  const [loaded, fontError] = useAppFonts();
  const [timedOut, setTimedOut] = useState(false);

  // Safety net: never block the app forever if fonts stall.
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Gate ONLY on fonts. No imperative navigation here — the root must render
  // a navigator before any routing happens. Onboarding redirect lives in index.
  if (!loaded && !fontError && !timedOut) {
    return <View style={{ flex: 1, backgroundColor: color.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProjectsProvider>
          <JobProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.bg } }}>
              {/* Presentation is a navigator-level option: setting it from inside a mounted screen
                  re-presents that screen on every options update (seen on-device as the record
                  sheet re-opening once a second while providers tick). */}
              <Stack.Screen name="reel/[id]/record" options={{ presentation: "modal" }} />
            </Stack>
          </JobProvider>
        </ProjectsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
