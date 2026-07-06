import { useEffect, useMemo } from "react";
import { View, Text, Pressable, Dimensions } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { Check, Package, ArrowLeft } from "lucide-react-native";
import { Button } from "@/components/ui/Button";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COLORS = [
  "#22C55E",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

const CONFETTI_COUNT = 30;

interface ConfettiConfig {
  x: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
}

function ConfettiParticle({ config }: { config: ConfettiConfig }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      config.delay,
      withTiming(SCREEN_HEIGHT + 20, {
        duration: config.duration,
        easing: Easing.linear,
      })
    );

    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(40, { duration: config.duration / 4 }),
          withTiming(-40, { duration: config.duration / 4 }),
          withTiming(30, { duration: config.duration / 4 }),
          withTiming(-30, { duration: config.duration / 4 })
        ),
        -1,
        true
      )
    );

    rotate.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(360, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1
      )
    );

    opacity.value = withDelay(
      config.delay + config.duration * 0.7,
      withTiming(0, { duration: config.duration * 0.3 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: config.x,
          top: 0,
          width: config.size,
          height: config.size * 0.6,
          backgroundColor: config.color,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

export default function CheckoutSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const confettiConfigs = useMemo(() => {
    const configs: ConfettiConfig[] = [];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      configs.push({
        x: Math.random() * SCREEN_WIDTH,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 6 + Math.random() * 10,
        delay: Math.random() * 2000,
        duration: 2000 + Math.random() * 3000,
      });
    }
    return configs;
  }, []);

  const handleTrackOrder = () => {
    router.push(`/orders/${orderId}/tracking`);
  };

  const handleBackToHome = () => {
    router.push("/(tabs)/home");
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white">
        <View className="absolute inset-0" pointerEvents="none">
          {confettiConfigs.map((config, i) => (
            <ConfettiParticle key={i} config={config} />
          ))}
        </View>

        <View className="pt-14 px-4">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center"
          >
            <ArrowLeft size={16} color="#374151" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-6 pb-12">
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={pulseStyle}
            className="w-24 h-24 rounded-full bg-secondary-100 items-center justify-center mb-6"
          >
            <Check size={48} color="#22C55E" strokeWidth={3} />
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.duration(600).delay(400)}
            className="text-display font-black text-neutral-900 text-center"
          >
            Order Placed{"\n"}Successfully!
          </Animated.Text>

          {orderId ? (
            <Animated.View
              entering={FadeInDown.duration(600).delay(600)}
              className="mt-4 bg-neutral-50 rounded-xl px-6 py-3"
            >
              <Text className="text-caption text-neutral-500 text-center">
                Order Number
              </Text>
              <Text className="text-body font-bold text-neutral-900 text-center mt-1">
                #{orderId}
              </Text>
            </Animated.View>
          ) : null}

          <Animated.Text
            entering={FadeInDown.duration(600).delay(800)}
            className="mt-6 text-caption text-neutral-400 text-center leading-5"
          >
            Your order has been placed and is being processed.
          </Animated.Text>

          <Animated.View
            entering={FadeInUp.duration(600).delay(1000)}
            className="w-full mt-10 gap-3"
          >
            <Button
              onPress={handleTrackOrder}
              size="lg"
              fullWidth
              icon={<Package size={18} color="#FFFFFF" />}
            >
              Track Order
            </Button>
            <Button
              onPress={handleBackToHome}
              variant="outline"
              size="lg"
              fullWidth
            >
              Back to Home
            </Button>
          </Animated.View>
        </View>
      </View>
    </>
  );
}
