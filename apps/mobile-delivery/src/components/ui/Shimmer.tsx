import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Shimmer({
  width = "100%",
  height = 20,
  borderRadius = 8,
  className = "",
}: ShimmerProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.ease }),
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
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#e2e8f0",
        },
        animatedStyle,
      ]}
      className={className}
    />
  );
}

/** Shimmer skeleton for a product card */
export function ProductCardSkeleton() {
  return (
    <View className="w-[48%] mb-4 bg-white border border-slate-100 rounded-2xl overflow-hidden">
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
    <View className="py-4 border-b border-slate-50">
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
    <View className="w-[48%] mb-3 rounded-2xl p-4 bg-slate-200">
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
    <View className="flex-row py-4 border-b border-slate-50">
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
