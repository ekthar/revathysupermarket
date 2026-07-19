/**
 * Enhanced Skeleton Loading Components
 * ═════════════════════════════════════
 *
 * Beautiful shimmer-based skeleton screens for:
 * - Generic shapes
 * - Product cards (grid + list)
 * - Order rows
 * - Category grid
 * - Home page full skeleton
 */

import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

// ─── Base Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
  delay?: number;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 8,
  className,
  delay = 0,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
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

// ─── Product Card Skeleton ────────────────────────────────────────────────────

export function ProductCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <View className="w-[48%] mb-4 bg-white border border-neutral-100 rounded-2xl overflow-hidden">
      <Skeleton height={140} borderRadius={0} delay={index * 80} />
      <View className="p-3">
        <Skeleton height={14} width="85%" delay={index * 80 + 100} />
        <View className="mt-2">
          <Skeleton height={11} width="45%" delay={index * 80 + 200} />
        </View>
        <View className="flex-row items-center justify-between mt-3">
          <Skeleton height={18} width={55} delay={index * 80 + 300} />
          <Skeleton height={32} width={32} borderRadius={16} delay={index * 80 + 350} />
        </View>
      </View>
    </View>
  );
}

// ─── Product List Skeleton (horizontal) ───────────────────────────────────────

export function ProductListSkeleton({ index = 0 }: { index?: number }) {
  return (
    <View className="w-36 mr-3 bg-white border border-neutral-100 rounded-2xl overflow-hidden">
      <Skeleton height={110} borderRadius={0} delay={index * 60} />
      <View className="p-2.5">
        <Skeleton height={12} width="80%" delay={index * 60 + 100} />
        <View className="mt-2">
          <Skeleton height={14} width="50%" delay={index * 60 + 150} />
        </View>
      </View>
    </View>
  );
}

// ─── Category Skeleton ────────────────────────────────────────────────────────

export function CategorySkeleton({ index = 0 }: { index?: number }) {
  return (
    <View className="items-center mr-5">
      <Skeleton height={64} width={64} borderRadius={16} delay={index * 50} />
      <View className="mt-2">
        <Skeleton height={10} width={48} borderRadius={4} delay={index * 50 + 80} />
      </View>
    </View>
  );
}

// ─── Order Row Skeleton ───────────────────────────────────────────────────────

export function OrderRowSkeleton({ index = 0 }: { index?: number }) {
  return (
    <View className="p-4 mb-3 bg-white border border-neutral-100 rounded-2xl">
      <View className="flex-row justify-between items-center mb-3">
        <Skeleton height={14} width={100} delay={index * 100} />
        <Skeleton height={24} width={80} borderRadius={12} delay={index * 100 + 50} />
      </View>
      <View className="flex-row justify-between items-center">
        <View>
          <Skeleton height={12} width={120} delay={index * 100 + 100} />
          <View className="mt-1.5">
            <Skeleton height={10} width={80} delay={index * 100 + 150} />
          </View>
        </View>
        <Skeleton height={16} width={60} delay={index * 100 + 200} />
      </View>
    </View>
  );
}

// ─── Home Page Full Skeleton ──────────────────────────────────────────────────

export function HomePageSkeleton() {
  return (
    <View className="flex-1 bg-white px-4 pt-16">
      {/* Header skeleton */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Skeleton height={12} width={80} delay={0} />
          <View className="mt-2">
            <Skeleton height={20} width={140} delay={50} />
          </View>
        </View>
        <Skeleton height={40} width={40} borderRadius={20} delay={100} />
      </View>

      {/* Search bar skeleton */}
      <Skeleton height={48} borderRadius={12} delay={150} className="mb-5" />

      {/* Hero banner skeleton */}
      <Skeleton height={180} borderRadius={16} delay={200} className="mb-5" />

      {/* Categories skeleton */}
      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-3">
          <Skeleton height={18} width={100} delay={300} />
          <Skeleton height={12} width={50} delay={320} />
        </View>
        <View className="flex-row">
          {[0, 1, 2, 3, 4].map((i) => (
            <CategorySkeleton key={i} index={i} />
          ))}
        </View>
      </View>

      {/* Product section skeleton */}
      <View>
        <View className="flex-row justify-between items-center mb-3">
          <Skeleton height={18} width={140} delay={400} />
          <Skeleton height={12} width={60} delay={420} />
        </View>
        <View className="flex-row flex-wrap justify-between">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} index={i} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Banner Skeleton ──────────────────────────────────────────────────────────

export function BannerSkeleton() {
  return (
    <View className="mx-4 rounded-2xl overflow-hidden">
      <Skeleton height={180} borderRadius={16} delay={0} />
    </View>
  );
}
