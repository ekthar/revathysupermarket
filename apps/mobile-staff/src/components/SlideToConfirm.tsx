/**
 * Swipe-to-confirm gesture component using Reanimated + GestureHandler.
 * Works reliably on Android (primary target) and iOS.
 *
 * BUG FIX: Previously used useState(300) as initial trackWidth, causing
 * maxX to be incorrect before onLayout fired. The thumb would snap back
 * because the threshold was computed against a stale width. Now we guard
 * gesture rendering until layout is measured, and use useSharedValue for
 * maxX so the gesture worklet always references the true track width.
 */

import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Vibration, ActivityIndicator } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

interface SlideToConfirmProps {
  label?: string;
  onConfirm: () => void;
  disabled?: boolean;
  confirmColor?: string;
  trackColor?: string;
}

const THUMB_SIZE = 56;
const TRACK_PADDING = 4;
const CONFIRM_THRESHOLD = 0.85;

export function SlideToConfirm({
  label = "Slide to confirm",
  onConfirm,
  disabled = false,
  confirmColor = "#10b981",
  trackColor = "#1e293b",
}: SlideToConfirmProps) {
  const [layoutReady, setLayoutReady] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const translateX = useSharedValue(0);
  // Use a shared value so the gesture worklet always has the correct max
  const maxXShared = useSharedValue(0);

  const handleLayout = useCallback((e: { nativeEvent: { layout: { width: number } } }) => {
    const width = e.nativeEvent.layout.width;
    const computedMax = width - THUMB_SIZE - TRACK_PADDING * 2;
    maxXShared.value = computedMax;
    if (!layoutReady) setLayoutReady(true);
  }, [layoutReady, maxXShared]);

  function handleConfirm() {
    setConfirmed(true);
    Vibration.vibrate([50, 30, 100]);
    setTimeout(onConfirm, 150);
  }

  function handleSnapBack() {
    Vibration.vibrate(20);
  }

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !confirmed && layoutReady)
    .onUpdate((event) => {
      "worklet";
      const max = maxXShared.value;
      translateX.value = Math.max(0, Math.min(event.translationX, max));
    })
    .onEnd(() => {
      "worklet";
      const max = maxXShared.value;
      if (max <= 0) {
        translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
        return;
      }
      if (translateX.value >= max * CONFIRM_THRESHOLD) {
        translateX.value = withSpring(max, { damping: 20, stiffness: 200 });
        runOnJS(handleConfirm)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
        runOnJS(handleSnapBack)();
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => {
    "worklet";
    const max = maxXShared.value;
    return {
      opacity: max > 0
        ? interpolate(translateX.value, [0, max * 0.3], [1, 0], Extrapolation.CLAMP)
        : 1,
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    "worklet";
    const max = maxXShared.value;
    return {
      opacity: max > 0
        ? interpolate(translateX.value, [0, max], [0.1, 0.6], Extrapolation.CLAMP)
        : 0.1,
    };
  });

  if (confirmed) {
    return (
      <View
        style={[styles.track, { backgroundColor: confirmColor }]}
        className="items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Confirmed"
      >
        <Text className="text-white font-bold text-base">✓ Confirmed!</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.track, { backgroundColor: disabled ? "#e2e8f0" : trackColor }]}
      onLayout={handleLayout}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Slide right to confirm"
    >
      {/* Progress fill */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: confirmColor, borderRadius: 16 },
          progressStyle,
        ]}
      />

      {/* Label */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.labelContainer, labelStyle]}>
        <Text
          style={{ color: disabled ? "#94a3b8" : "rgba(255,255,255,0.7)" }}
          className="text-sm font-bold"
        >
          {label} →
        </Text>
      </Animated.View>

      {/* Thumb — only render gesture after layout is measured */}
      {layoutReady ? (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.thumb,
              { backgroundColor: disabled ? "#cbd5e1" : confirmColor },
              thumbStyle,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Slide thumb"
          >
            <Text className="text-white text-lg font-bold">›› </Text>
          </Animated.View>
        </GestureDetector>
      ) : (
        <View style={[styles.thumb, { backgroundColor: disabled ? "#cbd5e1" : confirmColor }]}>
          <ActivityIndicator size="small" color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  labelContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: TRACK_PADDING,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
