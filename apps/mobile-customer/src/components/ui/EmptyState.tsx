/**
 * Beautiful Empty State — Animated illustrations with actions
 * ═══════════════════════════════════════════════════════════
 *
 * Shows a delightful empty state with:
 * - Animated icon/emoji with gentle bounce
 * - Clear title + description
 * - Primary + secondary actions
 * - Predefined variants for common states
 */

import { View, Text, Pressable } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  variant?: "default" | "cart" | "orders" | "favorites" | "search" | "error" | "offline";
}

// Preset emoji + descriptions for common states
const variants: Record<string, { emoji: string; title: string; description: string }> = {
  cart: {
    emoji: "🛒",
    title: "Your cart is empty",
    description: "Browse products and add items to your cart to get started.",
  },
  orders: {
    emoji: "📦",
    title: "No orders yet",
    description: "Your order history will appear here after your first purchase.",
  },
  favorites: {
    emoji: "💝",
    title: "No favorites saved",
    description: "Tap the heart icon on products you love to save them here.",
  },
  search: {
    emoji: "🔍",
    title: "No results found",
    description: "Try a different search term or browse our categories.",
  },
  error: {
    emoji: "😵",
    title: "Something went wrong",
    description: "We couldn't load this content. Please try again.",
  },
  offline: {
    emoji: "📡",
    title: "You're offline",
    description: "Check your internet connection and try again.",
  },
};

function FloatingEmoji({ emoji }: { emoji: string }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={animatedStyle} className="mb-6">
      <View className="h-24 w-24 rounded-3xl bg-neutral-50 items-center justify-center shadow-sm border border-neutral-100">
        <Text className="text-5xl">{emoji}</Text>
      </View>
    </Animated.View>
  );
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  variant = "default",
}: EmptyStateProps) {
  // Use variant defaults if no custom values provided
  const preset = variant !== "default" ? variants[variant] : null;
  const displayEmoji = emoji || preset?.emoji;
  const displayTitle = title || preset?.title || "Nothing here";
  const displayDescription = description || preset?.description;

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {/* Icon/Emoji with animation */}
      {icon ? (
        <Animated.View
          entering={FadeInDown.duration(500).springify()}
          className="h-24 w-24 rounded-3xl bg-neutral-50 items-center justify-center mb-6 shadow-sm border border-neutral-100"
        >
          {icon}
        </Animated.View>
      ) : displayEmoji ? (
        <FloatingEmoji emoji={displayEmoji} />
      ) : null}

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
        <Text className="text-title font-black text-neutral-900 text-center tracking-tight">
          {displayTitle}
        </Text>
      </Animated.View>

      {/* Description */}
      {displayDescription && (
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
          <Text className="text-body text-neutral-500 text-center mt-2.5 max-w-[280px] leading-5">
            {displayDescription}
          </Text>
        </Animated.View>
      )}

      {/* Primary action */}
      {actionLabel && onAction && (
        <Animated.View entering={FadeInUp.delay(300).duration(400).springify()} className="mt-7">
          <Button onPress={onAction} size="lg">
            {actionLabel}
          </Button>
        </Animated.View>
      )}

      {/* Secondary action */}
      {secondaryLabel && onSecondary && (
        <Animated.View entering={FadeInUp.delay(400).duration(400).springify()} className="mt-3">
          <Pressable onPress={onSecondary} className="px-4 py-2">
            <Text className="text-caption font-semibold text-neutral-400">
              {secondaryLabel}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
