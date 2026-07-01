/**
 * Swipe-to-confirm gesture component using Reanimated + GestureHandler.
 * Works reliably on Android (primary target) and iOS.
 */

import { useState } from "react";
import { View, Text, StyleSheet, Vibration } from "react-native";
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
  const [trackWidth, setTrackWidth] = useState(300);
  const [confirmed, setConfirmed] = useState(false);
  const translateX = useSharedValue(0);
  const maxX = trackWidth - THUMB_SIZE - TRACK_PADDING * 2;

  function handleConfirm() {
    setConfirmed(true);
    Vibration.vibrate([50, 30, 100]);
    setTimeout(onConfirm, 150);
  }

  function handleSnapBack() {
    Vibration.vibrate(20);
  }

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !confirmed)
    .onUpdate((event) => {
      translateX.value = Math.max(0, Math.min(event.translationX, maxX));
    })
    .onEnd(() => {
      if (translateX.value >= maxX * CONFIRM_THRESHOLD) {
        translateX.value = withSpring(maxX, { damping: 20, stiffness: 200 });
        runOnJS(handleConfirm)();
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 300 });
        runOnJS(handleSnapBack)();
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, maxX * 0.3],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, maxX],
      [0.1, 0.6],
      Extrapolation.CLAMP
    ),
  }));

  if (confirmed) {
    return (
      <View
        style={[styles.track, { backgroundColor: confirmColor }]}
        className="items-center justify-center"
      >
        <Text className="text-white font-bold text-base">✓ Confirmed!</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.track, { backgroundColor: disabled ? "#e2e8f0" : trackColor }]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
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

      {/* Thumb */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.thumb,
            { backgroundColor: disabled ? "#cbd5e1" : confirmColor },
            thumbStyle,
          ]}
        >
          <Text className="text-white text-lg font-bold">›› </Text>
        </Animated.View>
      </GestureDetector>
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
