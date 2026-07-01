import { View, Text, Pressable } from "react-native";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  icon?: string;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
  icon = "⚠️",
}: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-base font-sans-medium text-slate-700 mb-1 text-center">
        Oops!
      </Text>
      <Text className="text-sm text-slate-400 text-center mb-6">
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-primary-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-sans-bold text-sm">Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  subtitle,
  icon = "📭",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-lg font-heading text-slate-700 mb-1 text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-sm text-slate-400 text-center mb-6">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-primary-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-sans-bold text-sm">
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
