import { PropsWithChildren } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface AnimatedFadeInProps extends PropsWithChildren {
  index?: number;
  delay?: number;
  duration?: number;
  /** Passed through to the animated container so it can take part in flex layouts. */
  className?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps children in an animated fade-in-from-below effect.
 * Stagger by setting `index` prop for list items.
 */
export function AnimatedFadeIn({
  children,
  index = 0,
  delay = 50,
  duration = 400,
  className,
  style,
}: AnimatedFadeInProps) {
  return (
    <Animated.View
      className={className}
      style={style}
      entering={FadeInDown.delay(index * delay).duration(duration).springify()}
    >
      {children}
    </Animated.View>
  );
}
