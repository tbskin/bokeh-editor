import { useEffect } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { color } from "../tokens";

function Dot({ delay }: { delay: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(withSequence(
      withTiming(-4, { duration: 260 }), withTiming(0, { duration: 260 }), withTiming(0, { duration: 260 }),
    ), -1));
    return () => cancelAnimation(y);
  }, [delay, y]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.action }, anim]} />;
}

/** The assistant-is-working indicator: three green dots bouncing in sequence. */
export function TypingDots() {
  return (
    <View style={{ flexDirection: "row", gap: 4, alignItems: "center", height: 14 }}>
      <Dot delay={0} /><Dot delay={140} /><Dot delay={280} />
    </View>
  );
}
