/**
 * AnimatedTabIcon
 *
 * Renders a tab bar emoji icon that animates a subtle scale + opacity change
 * when it becomes the active tab. Used by the (admin)/(delivery)/(packing) tab
 * layouts. Respects the OS "reduce motion" setting.
 */

import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useReducedMotion,
} from "react-native-reanimated";

interface AnimatedTabIconProps {
  icon: string;
  color: string;
  focused: boolean;
}

const SPRING_CONFIG = { damping: 12, stiffness: 260, mass: 0.5 };

export function AnimatedTabIcon({ icon, color, focused }: AnimatedTabIconProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(focused ? 1.15 : 0.92);
  const opacity = useSharedValue(focused ? 1 : 0.7);

  useEffect(() => {
    if (reducedMotion) {
      scale.value = 1;
      opacity.value = focused ? 1 : 0.7;
      return;
    }
    scale.value = withSpring(focused ? 1.15 : 0.92, SPRING_CONFIG);
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 180 });
  }, [focused, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ color, fontSize: 20 }, animatedStyle]}>
      {icon}
    </Animated.Text>
  );
}
