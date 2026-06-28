import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag } from "lucide-react-native";
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import { useFavoritesStore } from "@/stores/favorites";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";
import { Button } from "@/components/ui/Button";
import { FavoriteButton } from "@/components/product/FavoriteButton";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch {}
      setIsLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      image: product.image,
      price: product.price,
      discountPrice: product.discountPrice,
      quantity,
      unit: product.unit,
      stock: product.stock,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#050505" size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-neutral-400">Product not found</Text>
      </View>
    );
  }

  const effectivePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white">
        <ScrollView className="flex-1">
          {/* Product Image */}
          <Animated.View entering={FadeInDown.duration(400)} className="h-72 bg-neutral-50 relative">
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <ShoppingBag size={48} color="#D1D5DB" />
              </View>
            )}
            {discount > 0 && (
              <View className="absolute top-4 left-4 bg-primary-900 px-3 py-1.5 rounded-full">
                <Text className="text-white font-black text-caption">
                  {discount}% OFF
                </Text>
              </View>
            )}
            {/* Back button */}
            <Pressable
              onPress={() => router.back()}
              className="absolute top-14 left-4 h-10 w-10 rounded-full bg-white/90 items-center justify-center"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 }}
            >
              <ArrowLeft size={18} color="#374151" />
            </Pressable>
            {/* Favorite button */}
            <View className="absolute top-14 right-4">
              <FavoriteButton productId={product.id} size="md" />
            </View>
          </Animated.View>

          {/* Product Info */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} className="px-5 pt-5">
            <Text className="text-micro font-bold text-neutral-400 uppercase tracking-wide mb-1">
              {product.category?.name || "Product"}
            </Text>
            <Text className="text-heading font-bold text-neutral-900 mb-1">
              {product.name}
            </Text>
            <Text className="text-caption text-neutral-400 mb-4">{product.unit}</Text>

            {/* Price */}
            <View className="flex-row items-baseline mb-4">
              <Text className="text-heading font-black text-neutral-900">
                {formatCurrency(effectivePrice)}
              </Text>
              {product.discountPrice && (
                <Text className="text-body text-neutral-400 line-through ml-3">
                  {formatCurrency(product.price)}
                </Text>
              )}
              {product.discountPrice && (
                <View className="ml-3 bg-secondary-50 px-2 py-0.5 rounded-full">
                  <Text className="text-micro font-bold text-secondary-700">
                    Save {formatCurrency(product.price - product.discountPrice)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stock Status */}
            <View className="flex-row items-center mb-6">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  product.stock > 0 ? "bg-secondary-500" : "bg-error-500"
                }`}
              />
              <Text
                className={`text-caption font-medium ${
                  product.stock > 0 ? "text-secondary-600" : "text-error-500"
                }`}
              >
                {product.stock > 0
                  ? `In Stock (${product.stock} available)`
                  : "Out of Stock"}
              </Text>
            </View>

            {/* Description */}
            <Text className="text-body font-bold text-neutral-900 mb-2">
              Description
            </Text>
            <Text className="text-caption text-neutral-600 leading-5 mb-6">
              {product.description}
            </Text>

            {/* GST Info */}
            {product.gstRate && (
              <View className="bg-neutral-50 rounded-xl p-3 mb-6">
                <Text className="text-micro text-neutral-500">
                  Price inclusive of {product.gstRate}% GST
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom Add to Cart */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          className="px-5 py-4 pb-8 border-t border-neutral-100 bg-white"
        >
          <View className="flex-row items-center mb-3">
            {/* Quantity Selector */}
            <View className="flex-row items-center h-[38px] rounded-full bg-primary-900">
              <Pressable
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-full items-center justify-center"
              >
                <Minus size={14} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
              <Text className="w-8 text-center text-body font-bold text-white">
                {quantity}
              </Text>
              <Pressable
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-10 h-full items-center justify-center"
              >
                <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>

            <Text className="ml-4 text-title font-bold text-neutral-900">
              {formatCurrency(effectivePrice * quantity)}
            </Text>
          </View>

          <Button
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            fullWidth
            size="lg"
            variant={addedToCart ? "secondary" : "primary"}
          >
            {addedToCart
              ? "✓ Added to Cart!"
              : product.stock === 0
              ? "Out of Stock"
              : `Add to Cart — ${formatCurrency(effectivePrice * quantity)}`}
          </Button>
        </Animated.View>
      </View>
    </>
  );
}
