/**
 * Beautiful Mobile Onboarding — Swipeable Fullscreen Stories
 * ═══════════════════════════════════════════════════════════
 *
 * Inspired by Instagram Stories / Duolingo onboarding.
 * Features:
 * - Fullscreen gradient slides with floating animated elements
 * - Gesture-driven horizontal swipe navigation
 * - Auto-advancing progress bars (like Stories)
 * - Haptic feedback on transitions
 * - Reanimated spring animations
 * - Persisted in AsyncStorage (shows only once)
 * - Respects accessibility (reduced motion)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  StatusBar,
  useWindowDimensions,
  AccessibilityInfo,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  interpolateColor,
  Extrapolation,
  runOnJS,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ShoppingBag,
  Truck,
  MapPin,
  Gift,
  ArrowRight,
  Sparkles,
} from "lucide-react-native";
import { lightHaptic } from "@/lib/haptic";
import { spring, timing, tapScale } from "@/theme/motion";

const STORAGE_KEY = "msm:mobile-onboarding-complete:v1";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLIDE_DURATION = 5000; // 5 seconds per slide

// ─── Slide Configuration ──────────────────────────────────────────────────────

interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  colors: [string, string, string]; // gradient stops
  icon: React.ReactNode;
  emojis: { emoji: string; size: number; x: number; y: number }[];
}

const slides: OnboardingSlide[] = [
  {
    id: "fresh",
    badge: "500+ products",
    title: "Fresh groceries,\nmade easy",
    subtitle: "Browse our full catalogue of farm-fresh produce, pantry essentials, and everyday items.",
    colors: ["#059669", "#047857", "#065F46"],
    icon: <ShoppingBag size={32} color="#FFFFFF" strokeWidth={1.8} />,
    emojis: [
      { emoji: "🥬", size: 32, x: 0.12, y: 0.15 },
      { emoji: "🍎", size: 28, x: 0.82, y: 0.12 },
      { emoji: "🥛", size: 26, x: 0.08, y: 0.55 },
      { emoji: "🍞", size: 30, x: 0.85, y: 0.52 },
      { emoji: "🧀", size: 24, x: 0.45, y: 0.08 },
    ],
  },
  {
    id: "delivery",
    badge: "~30 min delivery",
    title: "Lightning fast\nto your door",
    subtitle: "Real-time order tracking with live updates. Know exactly when your groceries arrive.",
    colors: ["#7C3AED", "#6D28D9", "#4C1D95"],
    icon: <Truck size={32} color="#FFFFFF" strokeWidth={1.8} />,
    emojis: [
      { emoji: "🛵", size: 34, x: 0.15, y: 0.18 },
      { emoji: "📍", size: 28, x: 0.8, y: 0.15 },
      { emoji: "⚡", size: 26, x: 0.1, y: 0.5 },
      { emoji: "🏠", size: 30, x: 0.82, y: 0.48 },
    ],
  },
  {
    id: "tracking",
    badge: "Live tracking",
    title: "Track every\nstep live",
    subtitle: "Watch your order move from store to door on a real-time map with driver location.",
    colors: ["#2563EB", "#1D4ED8", "#1E40AF"],
    icon: <MapPin size={32} color="#FFFFFF" strokeWidth={1.8} />,
    emojis: [
      { emoji: "🗺️", size: 32, x: 0.12, y: 0.2 },
      { emoji: "📦", size: 28, x: 0.83, y: 0.18 },
      { emoji: "✅", size: 26, x: 0.08, y: 0.52 },
      { emoji: "🔔", size: 24, x: 0.85, y: 0.5 },
    ],
  },
  {
    id: "rewards",
    badge: "Earn rewards",
    title: "Pay on delivery.\nEarn points.",
    subtitle: "Cash on delivery or UPI at your doorstep. Plus earn loyalty points on every order.",
    colors: ["#F59E0B", "#D97706", "#B45309"],
    icon: <Gift size={32} color="#FFFFFF" strokeWidth={1.8} />,
    emojis: [
      { emoji: "💰", size: 30, x: 0.1, y: 0.18 },
      { emoji: "🎁", size: 32, x: 0.82, y: 0.15 },
      { emoji: "⭐", size: 26, x: 0.12, y: 0.52 },
      { emoji: "🏆", size: 28, x: 0.84, y: 0.5 },
    ],
  },
];

// ─── Floating Emoji Component ─────────────────────────────────────────────────

function FloatingEmoji({ emoji, size, x, y, delay }: {
  emoji: string;
  size: number;
  x: number;
  y: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(0.85, { duration: 500 }));
    scale.value = withDelay(delay, withSpring(1, spring.bouncy));
    translateY.value = withDelay(
      delay + 600,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(10, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          left: x * SCREEN_WIDTH,
          top: y * SCREEN_HEIGHT * 0.45,
        },
      ]}
    >
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
}

// ─── Progress Bar Component ───────────────────────────────────────────────────

function ProgressBar({ index, currentIndex, progress }: {
  index: number;
  currentIndex: number;
  progress: Animated.SharedValue<number>;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (index < currentIndex) {
      return { width: "100%" };
    }
    if (index === currentIndex) {
      return { width: `${progress.value * 100}%` };
    }
    return { width: "0%" };
  });

  return (
    <View className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden mx-0.5">
      <Animated.View
        style={animatedStyle}
        className="h-full rounded-full bg-white"
      />
    </View>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const progress = useSharedValue(0);
  const slideTranslateX = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Auto-advance timer
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: SLIDE_DURATION, easing: Easing.linear });

    timerRef.current = setTimeout(() => {
      if (currentIndex < slides.length - 1) {
        goToNext();
      }
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      lightHaptic();
      setCurrentIndex((prev) => prev + 1);
      progress.value = 0;
    }
  }, [currentIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      lightHaptic();
      setCurrentIndex((prev) => prev - 1);
      progress.value = 0;
    }
  }, [currentIndex]);

  const handleComplete = useCallback(async () => {
    lightHaptic();
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    onComplete();
  }, [onComplete]);

  // Swipe gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      slideTranslateX.value = e.translationX * 0.3;
    })
    .onEnd((e) => {
      slideTranslateX.value = withSpring(0, spring.snappy);
      if (e.translationX < -50 && e.velocityX < -100) {
        if (currentIndex < slides.length - 1) {
          runOnJS(goToNext)();
        }
      } else if (e.translationX > 50 && e.velocityX > 100) {
        if (currentIndex > 0) {
          runOnJS(goToPrev)();
        }
      }
    });

  // Tap gesture (left/right half of screen)
  const tapGesture = Gesture.Tap().onEnd((e) => {
    if (e.x < SCREEN_WIDTH * 0.3) {
      runOnJS(goToPrev)();
    } else if (e.x > SCREEN_WIDTH * 0.7) {
      runOnJS(goToNext)();
    }
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideTranslateX.value }],
  }));

  const slide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  return (
    <View className="flex-1" style={{ backgroundColor: slide.colors[0] }}>
      <StatusBar barStyle="light-content" />

      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[slideAnimatedStyle, { flex: 1 }]}>
          {/* Background gradient */}
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: slide.colors[1],
              opacity: 0.8,
            }}
          />

          {/* Radial glow effects */}
          <View className="absolute top-0 left-0 w-80 h-80 rounded-full opacity-30"
            style={{ backgroundColor: slide.colors[0], transform: [{ translateX: -80 }, { translateY: -80 }] }}
          />
          <View className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-20"
            style={{ backgroundColor: slide.colors[2], transform: [{ translateX: 60 }, { translateY: 60 }] }}
          />

          {/* Progress bars at top */}
          <View className="absolute top-0 left-0 right-0 pt-16 px-4 z-50">
            <View className="flex-row">
              {slides.map((_, idx) => (
                <ProgressBar
                  key={idx}
                  index={idx}
                  currentIndex={currentIndex}
                  progress={progress}
                />
              ))}
            </View>
          </View>

          {/* Skip button */}
          <View className="absolute top-20 right-4 z-50">
            <Pressable
              onPress={handleComplete}
              className="px-4 py-2 rounded-full bg-white/15"
            >
              <Text className="text-white text-caption font-bold">Skip</Text>
            </Pressable>
          </View>

          {/* Floating emojis */}
          <View className="absolute inset-0">
            {!reducedMotion && slide.emojis.map((emoji, idx) => (
              <FloatingEmoji
                key={`${slide.id}-${idx}`}
                emoji={emoji.emoji}
                size={emoji.size}
                x={emoji.x}
                y={emoji.y}
                delay={300 + idx * 200}
              />
            ))}
          </View>

          {/* Main content */}
          <View className="flex-1 justify-center items-center px-8">
            {/* Icon container */}
            <Animated.View
              entering={FadeInDown.duration(500).springify()}
              key={`icon-${slide.id}`}
              className="mb-6"
            >
              <View className="h-20 w-20 rounded-3xl bg-white/15 items-center justify-center backdrop-blur-sm border border-white/20">
                {slide.icon}
              </View>
            </Animated.View>

            {/* Badge */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400).springify()}
              key={`badge-${slide.id}`}
              className="mb-4"
            >
              <View className="flex-row items-center px-4 py-1.5 rounded-full bg-white/15 border border-white/20">
                <Sparkles size={12} color="#FFFFFF" />
                <Text className="ml-1.5 text-white text-micro font-bold uppercase tracking-wider">
                  {slide.badge}
                </Text>
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(500).springify()}
              key={`title-${slide.id}`}
            >
              <Text className="text-center text-white text-[34px] font-black leading-[40px] tracking-tight">
                {slide.title}
              </Text>
            </Animated.View>

            {/* Subtitle */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400).springify()}
              key={`subtitle-${slide.id}`}
              className="mt-4 max-w-[280px]"
            >
              <Text className="text-center text-white/75 text-body leading-6">
                {slide.subtitle}
              </Text>
            </Animated.View>
          </View>

          {/* Bottom section */}
          <View className="px-6 pb-12">
            {/* Slide indicator dots */}
            <View className="flex-row items-center justify-center mb-8">
              {slides.map((_, idx) => (
                <View
                  key={idx}
                  className={`mx-1 rounded-full ${
                    idx === currentIndex
                      ? "w-8 h-2.5 bg-white"
                      : idx < currentIndex
                      ? "w-2.5 h-2.5 bg-white/60"
                      : "w-2.5 h-2.5 bg-white/25"
                  }`}
                  style={idx === currentIndex ? {
                    shadowColor: "#FFFFFF",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.6,
                    shadowRadius: 6,
                  } : undefined}
                />
              ))}
            </View>

            {/* Action buttons */}
            {isLast ? (
              <Animated.View entering={FadeInUp.duration(400).springify()}>
                {/* Primary CTA - Get Started */}
                <Pressable
                  onPress={handleComplete}
                  className="h-[56px] rounded-2xl bg-white items-center justify-center flex-row"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.2,
                    shadowRadius: 20,
                    elevation: 8,
                  }}
                >
                  <Text className="text-[15px] font-black text-neutral-900 mr-2.5 tracking-tight">
                    Get Started
                  </Text>
                  <View className="h-7 w-7 rounded-full bg-neutral-900 items-center justify-center">
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </Pressable>

                {/* Secondary - Browse as Guest */}
                <Pressable
                  onPress={handleComplete}
                  className="mt-4 h-[50px] rounded-2xl items-center justify-center bg-white/10 border border-white/20"
                >
                  <Text className="text-[14px] font-bold text-white">
                    Browse as Guest
                  </Text>
                </Pressable>
              </Animated.View>
            ) : (
              <View>
                {/* Next button - beautiful glass style */}
                <Pressable
                  onPress={goToNext}
                  className="h-[56px] rounded-2xl items-center justify-center flex-row bg-white/15 border border-white/25"
                  style={{
                    shadowColor: "#FFFFFF",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                  }}
                >
                  <Text className="text-[15px] font-bold text-white mr-2.5">
                    Continue
                  </Text>
                  <View className="h-7 w-7 rounded-full bg-white/20 items-center justify-center">
                    <ArrowRight size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                </Pressable>

                {/* Skip text link */}
                <Pressable
                  onPress={handleComplete}
                  className="mt-4 items-center justify-center py-2"
                >
                  <Text className="text-[13px] font-semibold text-white/50">
                    Skip intro
                  </Text>
                </Pressable>
              </View>
            )}
                </Pressable>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Onboarding Check Hook ────────────────────────────────────────────────────

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, "true");
}
