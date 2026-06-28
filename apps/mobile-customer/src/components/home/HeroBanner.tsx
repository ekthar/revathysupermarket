import { View, Text, Pressable, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";

interface HeroBannerProps {
  image: string;
  title: string;
  href?: string;
  deliveryRadiusKm?: number;
}

export function HeroBanner({
  image,
  title,
  href = "/products",
  deliveryRadiusKm = 5,
}: HeroBannerProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).springify()}
      className="px-4 pt-3 pb-1"
    >
      <Pressable
        onPress={() => router.push("/(tabs)/categories")}
        className="relative overflow-hidden rounded-2xl"
        style={{ aspectRatio: 2.2 }}
      >
        <Image
          source={{ uri: image }}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        {/* NativeWind doesn't support gradient, use overlay */}
        <View className="absolute inset-0 bg-black/30" />
        <View className="absolute bottom-0 left-0 right-0 p-4">
          <View className="bg-white/20 self-start rounded-full px-2 py-0.5 mb-1.5">
            <Text className="text-micro font-semibold text-white">
              {deliveryRadiusKm} KM delivery
            </Text>
          </View>
          <Text className="text-title font-bold text-white leading-snug">
            {title}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
