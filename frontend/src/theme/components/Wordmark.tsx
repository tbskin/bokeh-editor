import { Text, StyleSheet } from "react-native";
import { color, font } from "../tokens";

export function Wordmark({ size = 19 }: { size?: number }) {
  return <Text style={[styles.mark, { fontSize: size }]}>Bokeh</Text>;
}
const styles = StyleSheet.create({
  mark: { fontFamily: font.display, color: color.text, letterSpacing: -0.4 },
});
