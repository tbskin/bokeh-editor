import { type ReactNode, useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from "react-native-reanimated";

const SPRING = { damping: 16, stiffness: 220, mass: 0.7 }; // ~300ms settle, slight overshoot

/** Spring entrance for chat content: fade + scale 0.96→1 + 8px rise. */
export function PopIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withDelay(delay, withSpring(1, SPRING)); }, [delay, t]);
  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 8 }, { scale: 0.96 + t.value * 0.04 }],
  }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
