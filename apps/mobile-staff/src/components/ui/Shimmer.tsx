import { useEffect, useState } from "react";
import { View, StyleSheet, useColorScheme, type LayoutChangeEvent } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useReducedMotion,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

/**
 * Skeleton placeholder with a moving gradient "sweep" highlight (translateX
 * loop) instead of a simple opacity pulse. Base + highlight colors adapt to
 * light/dark color schemes. Falls back to a static base fill when reduce-motion
 * is enabled or before the element has been measured.
 */
export function Shimmer({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className = "",
}: ShimmerProps) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const reducedMotion = useReducedMotion();

  const baseColor = isDark ? "#1e293b" : "#e2e8f0";
  const highlightColor = isDark ? "#334155" : "#f8fafc";
  const highlightOpacity = isDark ? 0.4 : 0.9;

  const [measuredWidth, setMeasuredWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.linear }),
      -1,
      false
    );
  }, [reducedMotion]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -measuredWidth + progress.value * 2 * measuredWidth },
    ],
  }));

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
  };

  return (
    <View
      onLayout={handleLayout}
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: baseColor,
        overflow: "hidden",
      }}
      className={className}
    >
      {!reducedMotion && measuredWidth > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
          <Svg width={measuredWidth} height={height}>
            <Defs>
              <LinearGradient id="shimmerSweep" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={highlightColor} stopOpacity={0} />
                <Stop
                  offset="0.5"
                  stopColor={highlightColor}
                  stopOpacity={highlightOpacity}
                />
                <Stop offset="1" stopColor={highlightColor} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={measuredWidth}
              height={height}
              fill="url(#shimmerSweep)"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

/** Shimmer skeleton for a product card */
export function ProductCardSkeleton() {
  return (
    <View className="w-[48%] mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
      <Shimmer height={128} borderRadius={0} />
      <View className="p-3">
        <Shimmer height={14} width="80%" />
        <View className="mt-2">
          <Shimmer height={12} width="40%" />
        </View>
        <View className="flex-row justify-between mt-3">
          <Shimmer height={16} width="30%" />
          <Shimmer height={28} width={28} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

/** Shimmer skeleton for an order row */
export function OrderRowSkeleton() {
  return (
    <View className="py-4 border-b border-slate-50 dark:border-slate-800">
      <View className="flex-row justify-between mb-2">
        <Shimmer height={14} width="35%" />
        <Shimmer height={22} width="25%" borderRadius={12} />
      </View>
      <View className="flex-row justify-between">
        <Shimmer height={12} width="20%" />
        <Shimmer height={14} width="15%" />
      </View>
    </View>
  );
}

/** Shimmer for delivery dashboard stat cards */
export function StatCardSkeleton() {
  return (
    <View className="w-[48%] mb-3 rounded-2xl p-4 bg-slate-200 dark:bg-slate-800">
      <Shimmer height={10} width="60%" />
      <View className="mt-3">
        <Shimmer height={20} width="50%" />
      </View>
    </View>
  );
}

/** Shimmer for a list item row */
export function ListItemSkeleton() {
  return (
    <View className="flex-row py-4 border-b border-slate-50 dark:border-slate-800">
      <Shimmer height={56} width={56} borderRadius={12} />
      <View className="flex-1 ml-3 justify-center">
        <Shimmer height={14} width="70%" />
        <View className="mt-2">
          <Shimmer height={12} width="40%" />
        </View>
      </View>
    </View>
  );
}
