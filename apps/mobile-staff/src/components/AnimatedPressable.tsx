/**
 * AnimatedPressable
 *
 * A drop-in replacement for React Native's Pressable that adds a subtle
 * press-scale (~0.96) spring animation powered by Reanimated. It preserves the
 * standard Pressable API (onPress, accessibility props, children, etc.) and
 * keeps the app's light haptic feedback pattern.
 *
 * Respects the OS "reduce motion" setting: when enabled, the scale animation is
 * skipped so the control never feels sluggish for users who opt out of motion.
 */

import { forwardRef } from "react";
import { Pressable, Vibration, type PressableProps, type View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const PRESS_SCALE = 0.96;
const SPRING_CONFIG = { damping: 15, stiffness: 320, mass: 0.4 };

export interface AnimatedPressableProps extends PressableProps {
  /** Target scale on press. Defaults to 0.96. */
  pressScale?: number;
  /** Enable light haptic feedback on press. Defaults to true. */
  haptic?: boolean;
}

export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(
  function AnimatedPressable(
    {
      pressScale = PRESS_SCALE,
      haptic = true,
      onPressIn,
      onPressOut,
      onPress,
      disabled,
      style,
      children,
      ...props
    },
    ref
  ) {
    const scale = useSharedValue(1);
    const reducedMotion = useReducedMotion();

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedPressableBase
        ref={ref}
        disabled={disabled}
        onPressIn={(e) => {
          if (!disabled && !reducedMotion) {
            scale.value = withSpring(pressScale, SPRING_CONFIG);
          }
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!reducedMotion) {
            scale.value = withSpring(1, SPRING_CONFIG);
          }
          onPressOut?.(e);
        }}
        onPress={(e) => {
          if (disabled) return;
          if (haptic) Vibration.vibrate(8);
          onPress?.(e);
        }}
        style={[animatedStyle, style as object]}
        {...props}
      >
        {children as React.ReactNode}
      </AnimatedPressableBase>
    );
  }
);
