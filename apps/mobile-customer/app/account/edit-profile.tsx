import { View, Text } from "react-native";
import { Stack } from "expo-router";

export default function EditProfileScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Edit Profile", headerTintColor: "#050505" }} />
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-4xl mb-4">👤</Text>
        <Text className="text-title font-bold text-neutral-900 text-center mb-2">Coming Soon</Text>
        <Text className="text-body text-neutral-500 text-center">Profile editing will be available in a future update.</Text>
      </View>
    </>
  );
}
