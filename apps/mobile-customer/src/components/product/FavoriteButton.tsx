import { Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Heart } from "lucide-react-native";
import { useFavoritesStore } from "@/stores/favorites";

interface FavoriteButtonProps {
  productId: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ productId, size = "sm" }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const favorited = isFavorite(productId);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.7, { damping: 8, stiffness: 500 }),
      withSpring(1.2, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    toggleFavorite(productId);
  };

  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View
        style={animatedStyle}
        className={`${sizeClass} rounded-full items-center justify-center ${
          favorited ? "bg-error-50" : "bg-white/80"
        }`}
      >
        <Heart
          size={iconSize}
          color={favorited ? "#EF4444" : "#9CA3AF"}
          fill={favorited ? "#EF4444" : "none"}
          strokeWidth={2}
        />
      </Animated.View>
    </Pressable>
  );
}
