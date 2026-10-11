import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body, Label } from "../typography";
import { color, font, radius } from "../tokens";

export function IconButton({
  icon, onPress, label, tone = "plain", disabled, size = 40,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  tone?: "plain" | "solid";
  disabled?: boolean;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={tone === "plain" ? 8 : 0}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.iconButton,
        { width: size, height: size },
        tone === "solid" && styles.iconButtonSolid,
        pressed && (tone === "solid" ? styles.iconButtonSolidPressed : styles.iconButtonPressed),
        disabled && styles.disabled,
      ]}
    >
      <Ionicons name={icon} size={tone === "solid" ? 20 : 22} color={tone === "solid" ? color.actionInk : color.text} />
    </Pressable>
  );
}

export function AppHeader({ onBack, label, right }: { onBack?: () => void; label?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerSlot}>{onBack ? <IconButton icon="chevron-back" onPress={onBack} label="Back" /> : null}</View>
      <View style={styles.headerTitle}>{label ? <Label>{label}</Label> : null}</View>
      <View style={[styles.headerSlot, styles.headerRight]}>{right}</View>
    </View>
  );
}

export function TextField({ style, multiline, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      multiline={multiline}
      placeholderTextColor={props.placeholderTextColor ?? color.faint}
      style={[styles.textField, multiline && styles.textFieldMultiline, style]}
    />
  );
}

export function SegmentedControl<T extends string>({
  options, value, onChange,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && !selected && styles.segmentPressed]}
          >
            <Body style={[styles.segmentLabel, selected && styles.segmentLabelSelected]}>{option.label}</Body>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  iconButton: { alignItems: "center", justifyContent: "center", borderRadius: radius.control },
  iconButtonPressed: { backgroundColor: color.selection },
  iconButtonSolid: { backgroundColor: color.action },
  iconButtonSolidPressed: { backgroundColor: color.actionPressed },
  disabled: { opacity: 0.38 },
  header: { minHeight: 52, flexDirection: "row", alignItems: "center" },
  headerSlot: { width: 44, alignItems: "flex-start" },
  headerRight: { alignItems: "flex-end" },
  headerTitle: { flex: 1, alignItems: "center" },
  textField: { minHeight: 48, fontFamily: font.body, fontSize: 16, color: color.text, backgroundColor: color.surface, borderWidth: 1, borderColor: color.line2, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 12 },
  textFieldMultiline: { lineHeight: 24, padding: 15, textAlignVertical: "top" },
  segmented: { minHeight: 48, flexDirection: "row", gap: 3, padding: 3, backgroundColor: color.surface2, borderRadius: radius.control },
  segment: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderWidth: 1, borderColor: "transparent", borderRadius: radius.control - 3 },
  segmentSelected: { backgroundColor: color.surface, borderColor: color.line2 },
  segmentPressed: { backgroundColor: color.selection },
  segmentLabel: { color: color.muted, fontSize: 13, textAlign: "center" },
  segmentLabelSelected: { color: color.text, fontFamily: font.bodyBold },
});
