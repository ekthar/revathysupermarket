/**
 * Dismissible error banner for API failure feedback.
 * Shows a clear message with optional retry action.
 */

import { useState } from "react";
import { View, Text, Pressable } from "react-native";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <View
      className="mx-4 mt-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl p-4"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-sm font-semibold text-red-700 dark:text-red-300">
            {message}
          </Text>
          {onRetry && (
            <Pressable
              onPress={onRetry}
              className="mt-2"
              accessibilityRole="button"
              accessibilityLabel="Retry"
            >
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Tap to retry
              </Text>
            </Pressable>
          )}
        </View>
        {onDismiss && (
          <Pressable
            onPress={() => { setDismissed(true); onDismiss?.(); }}
            className="w-8 h-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
            accessibilityRole="button"
            accessibilityLabel="Dismiss error"
          >
            <Text className="text-red-600 dark:text-red-400 font-bold text-xs">✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
