/**
 * AnimatedPressable
 *
 * A Pressable wrapper that adds a subtle press-scale (~0.96) spring animation
 * powered by Reanimated. It accepts the standard Pressable props (onPress,
 * accessibility props, static children/style, etc.) and keeps the app's light
 * haptic feedback pattern.
 *
 * NOTE: this is not a full drop-in Pressable. It intentionally narrows two
 * props: `children` and `style` accept only their static (non-function) forms.
 * Pressable's render-prop `children={({ pressed }) => ...}` and functional
 * `style={({ pressed }) => ...}` forms are NOT supported, because the press
 * state is expressed through the animated scale rather than passed down. No
 * caller currently relies on those forms.
 *
 * Respects the OS "reduce motion" setting: when enabled, the scale animation is
 * skipped so the control never feels sluggish for users who opt out of motion.
 */

import { forwardRef, type ReactNode } from "react";
import {
  Pressable,
  Vibration,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

const PRESS_SCALE = 0.96;
const SPRING_CONFIG = { damping: 15, stiffness: 320, mass: 0.4 };

export interface AnimatedPressableProps
  extends Omit<PressableProps, "children" | "style"> {
  /** Static content to render. The Pressable render-prop form is not supported. */
  children?: ReactNode;
  /** Static style. The Pressable function-style form is not supported. */
  style?: StyleProp<ViewStyle>;
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
        style={[animatedStyle, style]}
        {...props}
      >
        {children}
      </AnimatedPressableBase>
    );
  }
);
