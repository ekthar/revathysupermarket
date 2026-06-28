import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ShoppingBag, ChevronRight } from "lucide-react-native";
import { useCartStore } from "@/stores/cart";
import { formatCurrency } from "@msm/shared/utils";

/**
 * Floating cart bar — appears at bottom of home/browse when cart has items
 * Matches web's floating-cart-bar design
 */
export function FloatingCartBar() {
  const items = useCartStore((s) => s.items);
  const totals = useCartStore((s) => s.totals);

  if (items.length === 0) return null;

  const { total } = totals();

  return (
    <Animated.View
      entering={FadeInUp.duration(300).springify()}
      exiting={FadeOutDown.duration(200)}
      className="absolute bottom-20 left-4 right-4"
      style={{ zIndex: 50 }}
    >
      <Pressable
        onPress={() => router.push("/(tabs)/cart")}
        className="flex-row items-center justify-between rounded-full bg-primary-900 px-5 py-3.5"
        style={{
          shadowColor: "#050505",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.35,
          shadowRadius: 24,
          elevation: 12,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="relative">
            <ShoppingBag size={18} color="#FFFFFF" />
            <View className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-secondary-500 items-center justify-center">
              <Text className="text-[8px] font-black text-white">
                {items.length}
              </Text>
            </View>
          </View>
          <View>
            <Text className="text-body font-bold text-white">
              {items.length} item{items.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-title font-bold text-white">
            {formatCurrency(total)}
          </Text>
          <ChevronRight size={16} color="#FFFFFF" />
        </View>
      </Pressable>
    </Animated.View>
  );
}
