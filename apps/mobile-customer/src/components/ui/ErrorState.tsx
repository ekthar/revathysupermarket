/**
 * Beautiful Error State — Animated with retry action
 * ═══════════════════════════════════════════════════
 *
 * Shows when content fails to load with:
 * - Animated emoji/icon
 * - Clear error message
 * - Retry button with haptic feedback
 * - Secondary dismiss action
 */

import { View, Text } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Button } from "./Button";
import { RefreshCw } from "lucide-react-native";

interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  icon?: string;
  variant?: "default" | "network" | "server" | "notfound";
}

const errorVariants = {
  default: { icon: "😵", title: "Something went wrong" },
  network: { icon: "📡", title: "Connection lost" },
  server: { icon: "🔧", title: "Server error" },
  notfound: { icon: "🔍", title: "Not found" },
};

export function ErrorState({
  message = "We couldn't load this content. Please try again.",
  title,
  onRetry,
  icon,
  variant = "default",
}: ErrorStateProps) {
  const preset = errorVariants[variant];
  const displayIcon = icon || preset.icon;
  const displayTitle = title || preset.title;

  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {/* Animated icon */}
      <Animated.View entering={FadeInDown.duration(500).springify()}>
        <View className="h-20 w-20 rounded-3xl bg-red-50 items-center justify-center mb-5 border border-red-100">
          <Text className="text-4xl">{displayIcon}</Text>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
        <Text className="text-title font-black text-neutral-900 text-center tracking-tight">
          {displayTitle}
        </Text>
      </Animated.View>

      {/* Message */}
      <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
        <Text className="text-body text-neutral-500 text-center mt-2 max-w-[260px] leading-5">
          {message}
        </Text>
      </Animated.View>

      {/* Retry button */}
      {onRetry && (
        <Animated.View entering={FadeInUp.delay(300).duration(400).springify()} className="mt-7">
          <Button
            onPress={onRetry}
            size="md"
            icon={<RefreshCw size={16} color="#FFFFFF" />}
          >
            Try Again
          </Button>
        </Animated.View>
      )}
    </View>
  );
}
