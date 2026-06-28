import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  className,
}: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: typeof width === "number" ? width : undefined,
          height,
          borderRadius,
        },
        animatedStyle,
      ]}
      className={`bg-neutral-200 ${className || ""} ${typeof width === "string" ? "w-full" : ""}`}
    />
  );
}

/** Product card skeleton */
export function ProductCardSkeleton() {
  return (
    <View className="w-[48%] mb-4 bg-white border border-neutral-100 rounded-xl overflow-hidden">
      <Skeleton height={128} borderRadius={0} />
      <View className="p-3">
        <Skeleton height={14} width="80%" />
        <View className="mt-2">
          <Skeleton height={12} width="40%" />
        </View>
        <View className="flex-row items-center justify-between mt-3">
          <Skeleton height={16} width={50} />
          <Skeleton height={32} width={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
}

/** Order row skeleton */
export function OrderRowSkeleton() {
  return (
    <View className="py-4 border-b border-neutral-50">
      <View className="flex-row justify-between mb-2">
        <Skeleton height={14} width={80} />
        <Skeleton height={20} width={70} borderRadius={10} />
      </View>
      <View className="flex-row justify-between">
        <Skeleton height={12} width={60} />
        <Skeleton height={14} width={50} />
      </View>
    </View>
  );
}
