import { PropsWithChildren, useEffect, useRef } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/**
 * Registry of entrance keys that have already played their fade-in.
 *
 * Reanimated `entering` animations fire on component mount, and virtualized
 * FlatList rows unmount/remount as they scroll out of and back into the
 * viewport. Without this guard the entrance would replay every time a row
 * re-appears, producing a persistent flicker on long lists. Callers rendering
 * inside a FlatList `renderItem` pass a stable `entranceKey` (a screen-namespaced
 * item id, e.g. `` `delivery:${item.id}` ``) so the entrance plays only on first
 * appearance. Namespacing per screen keeps an id that appears in more than one
 * list (delivery/packing/admin) from colliding: each list owns its own entrance.
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
   * it. Prefix with a screen id (e.g. `` `delivery:${item.id}` ``) so ids shared
   * across lists don't collide. Omit for non-virtualized mapped lists whose
   * items mount only once.
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
  // fresh ref, but the key is already registered (see the effect below) so it
  // renders statically. Reading the registry here is a pure lookup: the key is
  // only *registered* in a mount effect so a render that React prepares and then
  // discards (StrictMode double-invoke, interrupted concurrent render) can never
  // mark a key seen without the row actually committing.
  const shouldAnimate = useRef<boolean | null>(null);
  if (shouldAnimate.current === null) {
    shouldAnimate.current =
      entranceKey === undefined || !seenEntranceKeys.has(entranceKey);
  }

  useEffect(() => {
    if (entranceKey !== undefined) seenEntranceKeys.add(entranceKey);
  }, [entranceKey]);

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
