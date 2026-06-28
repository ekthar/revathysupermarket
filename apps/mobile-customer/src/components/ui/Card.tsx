import { View, type ViewProps } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from "react-native-reanimated";
import { spring as springPresets, tapScale } from "@/theme/motion";

type CardVariant = "elevated" | "outlined" | "filled" | "glass";

interface CardProps extends ViewProps {
  variant?: CardVariant;
  pressable?: boolean;
  entering?: boolean;
  enteringDelay?: number;
  children: React.ReactNode;
}

const variantClasses: Record<CardVariant, string> = {
  elevated: "bg-white rounded-xl",
  outlined: "bg-white border border-neutral-100 rounded-xl",
  filled: "bg-neutral-50 rounded-xl",
  glass: "bg-white/90 rounded-xl border border-neutral-100/50",
};

export function Card({
  variant = "elevated",
  pressable = false,
  entering = false,
  enteringDelay = 0,
  children,
  className,
  ...props
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!pressable) return;
    scale.value = withSpring(tapScale.subtle, springPresets.snappy);
  };

  const handlePressOut = () => {
    if (!pressable) return;
    scale.value = withSpring(1, springPresets.snappy);
  };

  const content = (
    <Animated.View
      {...props}
      style={[animatedStyle]}
      className={`${variantClasses[variant]} p-4 ${className || ""}`}
      onTouchStart={handlePressIn}
      onTouchEnd={handlePressOut}
    >
      {children}
    </Animated.View>
  );

  if (entering) {
    return (
      <Animated.View
        entering={FadeInDown.delay(enteringDelay).duration(400).springify()}
      >
        {content}
      </Animated.View>
    );
  }

  return content;
}

/** Section card with premium shadow styling */
export function SectionCard({
  children,
  className,
  ...props
}: ViewProps & { children: React.ReactNode }) {
  return (
    <View
      className={`bg-white rounded-2xl p-4 ${className || ""}`}
      style={{
        shadowColor: "#050505",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
