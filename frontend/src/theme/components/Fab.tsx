import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color } from "../tokens";

export function Fab({ onPress, icon = "add" }: { onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      accessibilityLabel="New reel"
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={28} color={color.actionInk} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  fab: {
    position: "absolute", right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28,
    backgroundColor: color.action, borderWidth: 1, borderColor: color.action,
    alignItems: "center", justifyContent: "center",
  },
  pressed: { backgroundColor: color.actionPressed },
});
