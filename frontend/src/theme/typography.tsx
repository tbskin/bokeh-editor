import { Text, TextProps, StyleSheet } from "react-native";
import { color, font } from "./tokens";

type Props = TextProps & { children: React.ReactNode };

export function Display({ style, ...p }: Props) {
  return <Text style={[styles.display, style]} {...p} />;
}
export function Title({ style, ...p }: Props) {
  return <Text style={[styles.title, style]} {...p} />;
}
export function Body({ style, ...p }: Props) {
  return <Text style={[styles.body, style]} {...p} />;
}
export function Label({ style, ...p }: Props) {
  return <Text style={[styles.label, style]} {...p} />;
}

const styles = StyleSheet.create({
  display: { fontFamily: font.display, fontSize: 30, lineHeight: 34, color: color.text, letterSpacing: -0.9 },
  title: { fontFamily: font.display, fontSize: 20, lineHeight: 25, color: color.text, letterSpacing: -0.35 },
  body: { fontFamily: font.body, fontSize: 15, color: color.text, lineHeight: 22 },
  label: {
    fontFamily: font.mono, fontSize: 10, lineHeight: 15, color: color.muted,
    letterSpacing: 1.25, textTransform: "uppercase",
  },
});
