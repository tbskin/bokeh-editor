import { View, ScrollView, StyleSheet, ViewStyle, Pressable, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { color } from "./tokens";

export function Screen({
  children, style, scroll = false, dismissKeyboard = false,
}: { children: React.ReactNode; style?: ViewStyle; scroll?: boolean; dismissKeyboard?: boolean }) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.pad, style]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.pad, styles.flex, style]}>{children}</View>
  );
  const body = dismissKeyboard ? (
    <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>{content}</Pressable>
  ) : content;
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>{body}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.bg },
  pad: { paddingHorizontal: 20 },
  flex: { flex: 1 },
});
