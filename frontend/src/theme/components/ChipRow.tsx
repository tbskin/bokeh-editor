import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Body } from "../typography";
import { color, font, radius } from "../tokens";
import type { Chip } from "@/lib/chips";
import { PopIn } from "./Motion";

/** Lemonade-style quick replies under the latest assistant message. Single-fire: the whole row
 * disables on first tap; state changes make the row disappear/recompute on the next render.
 * `armKey` is an explicit re-arm channel — bump it when an action didn't change the chip set
 * (picker cancel, modal dismissed, failed action) so the row doesn't latch dead. */
export function ChipRow({ chips, onPress, disabled, armKey }: {
  chips: Chip[]; onPress: (chip: Chip) => void; disabled?: boolean; armKey?: unknown;
}) {
  const [fired, setFired] = useState(false);
  const signature = chips.map((c) => c.id).join(",");
  useEffect(() => { setFired(false); }, [signature, armKey]);
  if (chips.length === 0) return null;
  const press = (chip: Chip) => {
    if (fired || disabled) return;
    setFired(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress(chip);
  };
  return (
    <View style={styles.row}>
      {chips.map((chip, i) => (
        <PopIn key={chip.id} delay={i * 40}>
          <Pressable
            onPress={() => press(chip)}
            disabled={fired || disabled}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed, (fired || disabled) && styles.chipDisabled]}
          >
            {({ pressed }) => <Body style={[styles.label, pressed && styles.labelPressed]}>{chip.label}</Body>}
          </Pressable>
        </PopIn>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 6, alignSelf: "flex-start" },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.chip, backgroundColor: color.surface, borderWidth: 1, borderColor: color.action },
  chipPressed: { backgroundColor: color.action, transform: [{ scale: 0.97 }] },
  chipDisabled: { opacity: 0.45 },
  label: { fontSize: 14, fontFamily: font.bodyBold, color: color.action },
  labelPressed: { color: color.actionInk },
});
