import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  BounceIn,
  FlipInXUp,
  ZoomIn,
  SlideInLeft,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useGoogleAuth } from "@/services/google-auth";

const FUNNY_MESSAGES = [
  "Our designer is on a chai break...",
  "Pixels are being hand-crafted...",
  "Teaching buttons how to behave...",
  "Convincing fonts to look pretty...",
  "OTP screen called in sick today...",
  "UI is doing yoga, be right back...",
];

export default function LoginScreen() {
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleAuth();
  const [messageIndex, setMessageIndex] = useState(0);
  const [showRedirect, setShowRedirect] = useState(false);

  // Rotate through funny messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % FUNNY_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Show redirect hint after a delay
  useEffect(() => {
    const timeout = setTimeout(() => setShowRedirect(true), 3000);
    return () => clearTimeout(timeout);
  }, []);

  // Floating animation for the construction emoji
  const floatY = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-12, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    wobble.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(5, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${wobble.value}deg` },
    ],
  }));

  // Pulsing dots animation
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View className="flex-1 bg-white">
      {/* Background decoration */}
      <View className="absolute inset-0 overflow-hidden">
        <Animated.View
          entering={FadeInDown.delay(200).duration(1000)}
          className="absolute top-16 left-6 w-20 h-20 rounded-full bg-amber-100/60"
        />
        <Animated.View
          entering={FadeInDown.delay(400).duration(1000)}
          className="absolute top-32 right-8 w-14 h-14 rounded-full bg-emerald-100/60"
        />
        <Animated.View
          entering={FadeInDown.delay(600).duration(1000)}
          className="absolute bottom-40 left-10 w-16 h-16 rounded-full bg-blue-100/60"
        />
        <Animated.View
          entering={FadeInDown.delay(800).duration(1000)}
          className="absolute bottom-60 right-12 w-12 h-12 rounded-full bg-pink-100/60"
        />
      </View>

      {/* Main content */}
      <View className="flex-1 justify-center items-center px-8">
        {/* Floating construction emoji */}
        <Animated.View style={floatingStyle}>
          <Animated.Text
            entering={BounceIn.delay(300).duration(800)}
            className="text-7xl mb-4"
          >
            🚧
          </Animated.Text>
        </Animated.View>

        {/* Main heading */}
        <Animated.View entering={FlipInXUp.delay(500).duration(700)}>
          <Text className="text-4xl font-heading text-center text-slate-900 mb-2">
            HOLD UP!
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(700).duration(600)}>
          <Text className="text-xl font-sans-bold text-center text-emerald-600 mb-3">
            Design in Progress
          </Text>
        </Animated.View>

        {/* Funny rotating message */}
        <Animated.View
          entering={FadeInDown.delay(900).duration(500)}
          className="bg-slate-100 rounded-2xl px-6 py-4 mb-8 min-h-[60px] justify-center"
        >
          <Animated.View style={pulseStyle}>
            <Text className="text-base text-center text-slate-600 font-sans-medium">
              {FUNNY_MESSAGES[messageIndex]}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Construction emojis row */}
        <Animated.View
          entering={SlideInLeft.delay(1100).duration(600)}
          className="flex-row items-center gap-3 mb-8"
        >
          <Text className="text-2xl">👷</Text>
          <Text className="text-2xl">🔨</Text>
          <Text className="text-2xl">🎨</Text>
          <Text className="text-2xl">✨</Text>
          <Text className="text-2xl">💅</Text>
        </Animated.View>

        {/* Bold statement */}
        <Animated.View entering={ZoomIn.delay(1400).duration(500)}>
          <Text className="text-center text-lg font-heading text-slate-800 mb-2 px-4">
            This page will be{" "}
            <Text className="text-emerald-600">absolutely gorgeous</Text>
          </Text>
          <Text className="text-center text-sm text-slate-400 mb-10">
            ...just not today. Meanwhile:
          </Text>
        </Animated.View>

        {/* Google Sign In - the actual CTA */}
        <Animated.View
          entering={SlideInRight.delay(1800).duration(600)}
          className="w-full"
        >
          <Pressable
            onPress={googleSignIn}
            disabled={googleLoading}
            className="h-16 rounded-2xl items-center justify-center flex-row bg-white border-2 border-slate-200 shadow-lg shadow-slate-200/50"
            style={{ elevation: 8 }}
          >
            {googleLoading ? (
              <ActivityIndicator color="#059669" size="large" />
            ) : (
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">G</Text>
                <View>
                  <Text className="text-lg font-sans-bold text-slate-800">
                    Continue with Google
                  </Text>
                  <Text className="text-xs text-slate-400">
                    The only way in (for now)
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Redirect hint */}
        {showRedirect && (
          <Animated.View entering={FadeInUp.duration(500)} className="mt-6">
            <Text className="text-center text-xs text-slate-400">
              Phone login coming soon{" "}
              <Text className="text-amber-500">with confetti</Text> 🎉
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Bottom fun text */}
      <Animated.View
        entering={FadeInDown.delay(2200).duration(600)}
        className="pb-10 px-6"
      >
        <Text className="text-center text-xs text-slate-300">
          v0.0.1-alpha-pre-beta-not-even-close
        </Text>
      </Animated.View>
    </View>
  );
}
