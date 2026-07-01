/**
 * Shared Button component for mobile-staff app.
 * Provides consistent styling across all screens with variants and sizes.
 *
 * Adds a subtle press-scale (~0.96) spring animation via Reanimated while
 * keeping the existing variants/sizes/API and NativeWind className styling
 * unchanged. Respects the OS "reduce motion" setting.
 */

import { Pressable, Text, ActivityIndicator, Vibration, type PressableProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from "react-native-reanimated";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const PRESS_SCALE = 0.96;
const SPRING_CONFIG = { damping: 15, stiffness: 320, mass: 0.4 };

const VARIANT_STYLES: Record<ButtonVariant, { container: string; text: string; loader: string }> = {
  primary: {
    container: "bg-emerald-600 dark:bg-emerald-500",
    text: "text-white",
    loader: "#ffffff",
  },
  secondary: {
    container: "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700",
    text: "text-slate-900 dark:text-white",
    loader: "#059669",
  },
  danger: {
    container: "bg-red-500 dark:bg-red-600",
    text: "text-white",
    loader: "#ffffff",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-slate-700 dark:text-slate-300",
    loader: "#059669",
  },
  outline: {
    container: "bg-transparent border border-slate-200 dark:border-slate-700",
    text: "text-slate-900 dark:text-white",
    loader: "#059669",
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: "h-10 px-4 rounded-xl", text: "text-xs" },
  md: { container: "h-12 px-5 rounded-xl", text: "text-sm" },
  lg: { container: "h-14 px-6 rounded-2xl", text: "text-base" },
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = true,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, fullWidth ? { width: "100%" } : undefined]}>
      <Pressable
        onPressIn={(e) => {
          if (!isDisabled && !reducedMotion) {
            scale.value = withSpring(PRESS_SCALE, SPRING_CONFIG);
          }
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!reducedMotion) {
            scale.value = withSpring(1, SPRING_CONFIG);
          }
          onPressOut?.(e);
        }}
        onPress={(e) => {
          if (isDisabled) return;
          Vibration.vibrate(8);
          onPress?.(e);
        }}
        disabled={isDisabled}
        className={`flex-row items-center justify-center gap-2 ${sizeStyle.container} ${variantStyle.container} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : ""}`}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyle.loader} />
        ) : (
          <>
            {icon && <Text className={`${variantStyle.text} text-base`}>{icon}</Text>}
            <Text className={`font-bold ${sizeStyle.text} ${variantStyle.text}`}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
