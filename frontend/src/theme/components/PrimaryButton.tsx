import { Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { color, font, radius } from "../tokens";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: "primary" | "secondary";
};

export function Button({ label, onPress, disabled, icon, variant = "primary" }: ButtonProps) {
  const ink = disabled ? color.faint : variant === "primary" ? color.actionInk : color.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.btn,
        variant === "primary" ? styles.primary : styles.secondary,
        pressed && !disabled && (variant === "primary" ? styles.primaryPressed : styles.secondaryPressed),
        disabled && styles.disabled,
      ]}
    >
      {icon && <Ionicons name={icon} size={18} color={ink} />}
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button {...props} variant="primary" />;
}

const styles = StyleSheet.create({
  btn: { minHeight: 50, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: radius.control, borderWidth: 1 },
  primary: { backgroundColor: color.action, borderColor: color.action },
  primaryPressed: { backgroundColor: color.actionPressed, borderColor: color.actionPressed },
  secondary: { backgroundColor: color.surface, borderColor: color.line2 },
  secondaryPressed: { backgroundColor: color.surface2, borderColor: color.muted },
  disabled: { opacity: 0.38 },
  label: { fontFamily: font.bodyBold, fontSize: 15 },
});
