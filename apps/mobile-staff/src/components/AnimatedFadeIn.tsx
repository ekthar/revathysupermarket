import { PropsWithChildren } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

interface AnimatedFadeInProps extends PropsWithChildren {
  index?: number;
  delay?: number;
  duration?: number;
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
}: AnimatedFadeInProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * delay).duration(duration).springify()}
    >
      {children}
    </Animated.View>
  );
}
