import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Redirect } from "expo-router";
import { Screen } from "@/theme/Screen";
import { Title, Body, Label } from "@/theme/typography";
import { PrimaryButton } from "@/theme/components/PrimaryButton";
import { Wordmark } from "@/theme/components/Wordmark";
import { TextField } from "@/theme/components/Controls";
import { color, font } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const { session } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. after verifying) — leave the login screen.
  if (session) return <Redirect href="/" />;

  const sendCode = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
    setBusy(false);
    if (error) return setError(error.message);
    setStep("code");
  };

  const verify = async () => {
    setBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setError(error.message);
    // Success → onAuthStateChange sets the session → the redirect above fires.
  };

  return (
    <Screen dismissKeyboard>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
          <Wordmark size={22} />
          {step === "email" ? (
            <>
              <Title>Sign in to make reels</Title>
              <Body style={{ color: color.muted }}>Enter your email and we'll send you a 6-digit code. No password.</Body>
              <TextField
                value={email}
                onChangeText={setEmail}
                placeholder="you@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
              />
              {error && <Body style={{ color: color.danger }}>{error}</Body>}
              <PrimaryButton label={busy ? "Sending…" : "Send code"} disabled={busy || !email.includes("@")} onPress={sendCode} />
            </>
          ) : (
            <>
              <Title>Enter your code</Title>
              <Body style={{ color: color.muted }}>We sent a 6-digit code to {email.trim()}.</Body>
              <TextField
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="number-pad"
                autoFocus
                maxLength={6}
                style={styles.code}
              />
              {error && <Body style={{ color: color.danger }}>{error}</Body>}
              <PrimaryButton label={busy ? "Verifying…" : "Verify"} disabled={busy || code.trim().length < 6} onPress={verify} />
              <Pressable onPress={() => { setStep("email"); setCode(""); setError(null); }} hitSlop={10} style={{ alignSelf: "center" }}>
                <Label>Use a different email</Label>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: { fontFamily: font.mono, fontSize: 24, letterSpacing: 8, textAlign: "center" },
});
