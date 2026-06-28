import { View, Text } from "react-native";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      {icon ? (
        <View className="h-20 w-20 rounded-full bg-neutral-50 items-center justify-center mb-5">
          {icon}
        </View>
      ) : emoji ? (
        <Text className="text-5xl mb-5">{emoji}</Text>
      ) : null}
      <Text className="text-title font-bold text-neutral-900 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-body text-neutral-500 text-center mt-2 max-w-[260px]">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <View className="mt-6">
          <Button onPress={onAction} size="md">
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
}
