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
        { width: typeof width === "number" ? width : undefined, height, borderRadius },
        animatedStyle,
      ]}
      className={`bg-slate-200 dark:bg-slate-700 ${className || ""} ${typeof width === "string" ? "w-full" : ""}`}
    />
  );
}

export function OrderRowSkeleton() {
  return (
    <View className="px-4 py-3 gap-2">
      <View className="flex-row justify-between">
        <Skeleton width={120} height={16} borderRadius={6} />
        <Skeleton width={60} height={16} borderRadius={6} />
      </View>
      <Skeleton width="70%" height={12} borderRadius={6} />
      <View className="flex-row justify-between">
        <Skeleton width={80} height={20} borderRadius={10} />
        <Skeleton width={50} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function DetailSkeleton() {
  return (
    <View className="p-5 gap-4">
      <View className="flex-row items-center gap-3">
        <Skeleton width={40} height={40} borderRadius={20} />
        <View className="flex-1 gap-1.5">
          <Skeleton width="60%" height={18} borderRadius={6} />
          <Skeleton width="40%" height={14} borderRadius={6} />
        </View>
      </View>
      <Skeleton width="100%" height={100} borderRadius={16} />
      <Skeleton width="100%" height={80} borderRadius={16} />
      <Skeleton width="100%" height={60} borderRadius={16} />
    </View>
  );
}
