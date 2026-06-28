import { forwardRef } from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { spring as springPresets, tapScale } from "@/theme/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "style"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-primary-900 active:bg-neutral-800",
  secondary: "bg-secondary-500 active:bg-secondary-600",
  outline: "bg-transparent border-2 border-neutral-200 active:bg-neutral-50",
  ghost: "bg-transparent active:bg-neutral-100",
  danger: "bg-error-500 active:bg-error-700",
};

const variantTextStyles: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-neutral-900",
  ghost: "text-neutral-900",
  danger: "text-white",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-9 px-4 rounded-full",
  md: "h-12 px-6 rounded-xl",
  lg: "h-14 px-8 rounded-2xl",
};

const sizeTextStyles: Record<ButtonSize, string> = {
  sm: "text-caption font-bold",
  md: "text-body font-bold",
  lg: "text-body font-bold",
};

export const Button = forwardRef<typeof Pressable, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      children,
      fullWidth = false,
      disabled,
      style,
      ...props
    },
    _ref
  ) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
      scale.value = withSpring(tapScale.primary, springPresets.snappy);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, springPresets.snappy);
    };

    const isDisabled = disabled || loading;

    return (
      <AnimatedPressable
        {...props}
        disabled={isDisabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
        className={`flex-row items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${isDisabled ? "opacity-50" : ""}`}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === "outline" || variant === "ghost" ? "#050505" : "#FFFFFF"}
          />
        ) : (
          <>
            {icon}
            <Text
              className={`${variantTextStyles[variant]} ${sizeTextStyles[size]} ${icon ? "ml-2" : ""} ${iconRight ? "mr-2" : ""}`}
            >
              {children}
            </Text>
            {iconRight}
          </>
        )}
      </AnimatedPressable>
    );
  }
);
