import { View, Text, Pressable, ScrollView, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { ChevronRight, Plus } from "lucide-react-native";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { useCartStore } from "@/stores/cart";

interface ProductSectionProps {
  title: string;
  icon?: React.ReactNode;
  products: Product[];
  showSeeAll?: boolean;
  onSeeAll?: () => void;
  delay?: number;
}

export function ProductSection({
  title,
  icon,
  products,
  showSeeAll = true,
  onSeeAll,
  delay = 0,
}: ProductSectionProps) {
  const { addItem } = useCartStore();

  if (products.length === 0) return null;

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity: 1,
      unit: product.unit,
      stock: product.stock,
    });
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400).springify()}
      className="pt-6"
    >
      {/* Section Header */}
      <View className="px-4 flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className="text-title font-bold text-neutral-900">{title}</Text>
        </View>
        {showSeeAll && (
          <Pressable
            onPress={onSeeAll || (() => router.push("/(tabs)/categories"))}
            className="flex-row items-center"
          >
            <Text className="text-caption font-semibold text-primary-900">
              See all
            </Text>
            <ChevronRight size={14} color="#050505" />
          </Pressable>
        )}
      </View>

      {/* Horizontal scroll product cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {products.map((product) => {
          const price = product.discountPrice || product.price;
          const discount = product.discountPrice
            ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
            : 0;

          return (
            <Pressable
              key={product.id}
              onPress={() => router.push(`/product/${product.id}`)}
              className="w-[150px] mr-3 bg-white border border-neutral-100 rounded-xl overflow-hidden"
              style={{
                shadowColor: "#050505",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              {/* Image */}
              <View className="h-[110px] bg-neutral-50 items-center justify-center">
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-2xl">🛒</Text>
                )}
                {/* Discount badge */}
                {discount > 0 && (
                  <View className="absolute top-2 left-2 bg-primary-900 px-1.5 py-0.5 rounded-full">
                    <Text className="text-micro font-black text-white">
                      {discount}% OFF
                    </Text>
                  </View>
                )}
                {/* Out of stock overlay */}
                {product.stock <= 0 && (
                  <View className="absolute inset-0 bg-white/80 items-center justify-center">
                    <View className="bg-neutral-900/90 px-2 py-0.5 rounded-full">
                      <Text className="text-micro font-semibold text-white">
                        Sold out
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Details */}
              <View className="p-2.5">
                <Text
                  className="text-caption font-semibold text-neutral-800 leading-tight"
                  numberOfLines={2}
                >
                  {product.name}
                </Text>
                <Text className="text-micro text-neutral-400 mt-0.5">
                  {product.unit}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <View>
                    <Text className="text-body font-black text-neutral-900">
                      {formatCurrency(price)}
                    </Text>
                    {product.discountPrice && (
                      <Text className="text-micro text-neutral-400 line-through">
                        {formatCurrency(product.price)}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="h-8 w-8 rounded-full bg-primary-900 items-center justify-center"
                  >
                    <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
