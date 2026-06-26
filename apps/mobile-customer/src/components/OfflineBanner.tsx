import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      exiting={FadeOutUp.duration(300)}
      className="bg-red-500 px-4 py-2 items-center"
    >
      <Text className="text-white text-xs font-sans-medium">
        No internet connection
      </Text>
    </Animated.View>
  );
}
