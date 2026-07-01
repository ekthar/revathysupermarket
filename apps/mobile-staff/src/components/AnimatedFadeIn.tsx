import { PropsWithChildren, useRef } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Registry of entrance keys that have already played their fade-in.
 *
 * Reanimated `entering` animations fire on component mount, and virtualized
 * FlatList rows unmount/remount as they scroll out of and back into the
 * viewport. Without this guard the entrance would replay every time a row
 * re-appears, producing a persistent flicker on long lists. Callers rendering
 * inside a FlatList `renderItem` pass a stable `entranceKey` (the item id) so
 * the entrance plays only on first appearance.
 */
const seenEntranceKeys = new Set<string>();

interface AnimatedFadeInProps extends PropsWithChildren {
  index?: number;
  delay?: number;
  duration?: number;
  /**
   * Stable identity for the entrance. When provided, the fade-in plays only the
   * first time this key is seen; later mounts of the same key (e.g. a
   * virtualized FlatList row scrolling back into view) render without replaying
   * it. Omit for non-virtualized mapped lists whose items mount only once.
   */
  entranceKey?: string;
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
  entranceKey,
  className,
  style,
}: AnimatedFadeInProps) {
  // Decide once, on first render of this instance, whether the entrance should
  // play. A remount of the same virtualized row re-runs this initializer with a
  // fresh ref, but the key is already registered so it renders statically.
  const shouldAnimate = useRef<boolean | null>(null);
  if (shouldAnimate.current === null) {
    shouldAnimate.current =
      entranceKey === undefined || !seenEntranceKeys.has(entranceKey);
    if (entranceKey !== undefined) seenEntranceKeys.add(entranceKey);
  }

  return (
    <Animated.View
      className={className}
      style={style}
      entering={
        shouldAnimate.current
          ? FadeInDown.delay(index * delay).duration(duration).springify()
          : undefined
      }
    >
      {children}
    </Animated.View>
  );
}
