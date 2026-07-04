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
      <Text className="text-base font-medium text-neutral-700 mb-1 text-center">
        Oops!
      </Text>
      <Text className="text-sm text-neutral-400 text-center mb-6">
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="bg-primary-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Try Again</Text>
        </Pressable>
      )}
    </View>
  );
}


