import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  FadeIn,
} from "react-native-reanimated";
import { Minus, Plus } from "lucide-react-native";
import { spring as springPresets } from "@/theme/motion";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  size?: "sm" | "md";
}

/**
 * Black pill quantity stepper — matches web design
 * Animated number bounce on change
 */
export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  size = "sm",
}: QuantityStepperProps) {
  const numberScale = useSharedValue(1);

  const numberStyle = useAnimatedStyle(() => ({
    transform: [{ scale: numberScale.value }],
  }));

  const bounce = () => {
    numberScale.value = withSequence(
      withSpring(1.4, { damping: 8, stiffness: 500 }),
      withSpring(1, springPresets.snappy)
    );
  };

  const handleIncrement = () => {
    bounce();
    onIncrement();
  };

  const handleDecrement = () => {
    bounce();
    onDecrement();
  };

  const h = size === "sm" ? "h-[30px]" : "h-[34px]";
  const iconSize = size === "sm" ? 12 : 14;

  return (
    <Animated.View
      entering={FadeIn.duration(200).springify()}
      className={`flex-row ${h} items-center overflow-hidden rounded-full bg-primary-900`}
    >
      <Pressable
        onPress={handleDecrement}
        className="w-7 h-full items-center justify-center"
        hitSlop={8}
      >
        <Minus size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>

      <Animated.View style={numberStyle}>
        <Text className="w-5 text-center text-caption font-bold text-white">
          {quantity}
        </Text>
      </Animated.View>

      <Pressable
        onPress={handleIncrement}
        className="w-7 h-full items-center justify-center"
        hitSlop={8}
      >
        <Plus size={iconSize} color="#FFFFFF" strokeWidth={2.5} />
      </Pressable>
    </Animated.View>
  );
}
