/**
 * AnimatedScreen
 *
 * A lightweight wrapper meant to be the outermost container of a screen. It
 * plays a subtle entrance (fade + slight upward translate) on mount using
 * Reanimated. It renders a plain Animated.View so it is safe to place a
 * ScrollView/FlatList (or anything else) as its child.
 *
 * Respects the OS "reduce motion" setting: when enabled the content is shown
 * immediately with no transform.
 */

import { useEffect, type PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";

interface AnimatedScreenProps extends PropsWithChildren {
  /** Entrance duration in ms. Defaults to 350. */
  duration?: number;
  /** Distance in px the content travels upward on entrance. Defaults to 12. */
  translateY?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function AnimatedScreen({
  children,
  duration = 350,
  translateY = 12,
  className = "flex-1",
  style,
}: AnimatedScreenProps) {
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * translateY }],
  }));

  return (
    <Animated.View className={className} style={[animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}
