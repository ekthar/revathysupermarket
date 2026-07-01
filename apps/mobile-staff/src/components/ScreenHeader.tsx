/**
 * Shared ScreenHeader component for mobile-staff app.
 * Provides consistent page header with optional back button and subtitle.
 */

import { View, Text, Pressable, Vibration } from "react-native";
import { router } from "expo-router";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, showBack = false, rightAction }: ScreenHeaderProps) {
  return (
    <View className="bg-white dark:bg-slate-950 px-5 pt-14 pb-4 border-b border-slate-100 dark:border-slate-800">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          {showBack && (
            <Pressable
              onPress={() => { Vibration.vibrate(5); router.back(); }}
              className="w-10 h-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text className="text-slate-600 dark:text-slate-300 text-lg">←</Text>
            </Pressable>
          )}
          <View className="flex-1">
            <Text
              className="text-2xl font-bold text-slate-900 dark:text-white"
              accessibilityRole="header"
            >
              {title}
            </Text>
            {subtitle && (
              <Text className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {rightAction && <View>{rightAction}</View>}
      </View>
    </View>
  );
}
