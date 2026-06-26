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
import { api } from "@/services/api";
import { useCartStore } from "@/stores/cart";
import type { Product } from "@msm/shared/types";
import { formatCurrency } from "@msm/shared/utils";

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
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-slate-400">Product not found</Text>
      </View>
    );
  }

  const effectivePrice = product.discountPrice || product.price;
  const discount = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "" }} />
      <View className="flex-1 bg-white">
        <ScrollView className="flex-1">
          {/* Product Image */}
          <Animated.View entering={FadeInDown.duration(400)} className="h-72 bg-slate-50">
            {product.image ? (
              <Image
                source={{ uri: product.image }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Text className="text-6xl">🛒</Text>
              </View>
            )}
            {discount > 0 && (
              <View className="absolute top-4 left-4 bg-red-500 px-3 py-1.5 rounded-lg">
                <Text className="text-white font-sans-bold text-sm">
                  {discount}% OFF
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Product Info */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} className="px-5 pt-5">
            <Text className="text-xs text-primary-600 font-sans-medium mb-1">
              {product.category?.name || "Product"}
            </Text>
            <Text className="text-2xl font-heading text-slate-900 mb-1">
              {product.name}
            </Text>
            <Text className="text-sm text-slate-400 mb-4">{product.unit}</Text>

            {/* Price */}
            <View className="flex-row items-baseline mb-4">
              <Text className="text-2xl font-heading text-slate-900">
                {formatCurrency(effectivePrice)}
              </Text>
              {product.discountPrice && (
                <Text className="text-base text-slate-400 line-through ml-3">
                  {formatCurrency(product.price)}
                </Text>
              )}
              {product.discountPrice && (
                <View className="ml-3 bg-green-100 px-2 py-0.5 rounded">
                  <Text className="text-xs font-sans-bold text-green-700">
                    Save {formatCurrency(product.price - product.discountPrice)}
                  </Text>
                </View>
              )}
            </View>

            {/* Stock Status */}
            <View className="flex-row items-center mb-6">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  product.stock > 0 ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <Text
                className={`text-sm ${
                  product.stock > 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {product.stock > 0
                  ? `In Stock (${product.stock} available)`
                  : "Out of Stock"}
              </Text>
            </View>

            {/* Description */}
            <Text className="text-base font-heading text-slate-900 mb-2">
              Description
            </Text>
            <Text className="text-sm text-slate-600 leading-5 mb-6">
              {product.description}
            </Text>

            {/* GST Info */}
            {product.gstRate && (
              <View className="bg-slate-50 rounded-xl p-3 mb-6">
                <Text className="text-xs text-slate-500">
                  Price inclusive of {product.gstRate}% GST
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom Add to Cart */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(400)}
          className="px-5 py-4 pb-8 border-t border-slate-100 bg-white"
        >
          <View className="flex-row items-center mb-3">
            {/* Quantity Selector */}
            <View className="flex-row items-center bg-slate-100 rounded-xl">
              <Pressable
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 items-center justify-center"
              >
                <Text className="text-lg font-sans-bold text-slate-700">−</Text>
              </Pressable>
              <Text className="w-8 text-center text-base font-sans-bold">
                {quantity}
              </Text>
              <Pressable
                onPress={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="w-10 h-10 items-center justify-center"
              >
                <Text className="text-lg font-sans-bold text-slate-700">+</Text>
              </Pressable>
            </View>

            <Text className="ml-4 text-lg font-heading text-slate-900">
              {formatCurrency(effectivePrice * quantity)}
            </Text>
          </View>

          <Pressable
            onPress={handleAddToCart}
            disabled={product.stock === 0}
            className={`h-14 rounded-xl items-center justify-center ${
              addedToCart
                ? "bg-green-500"
                : product.stock === 0
                ? "bg-slate-300"
                : "bg-primary-600"
            }`}
          >
            <Text className="text-white text-base font-sans-bold">
              {addedToCart
                ? "✓ Added to Cart!"
                : product.stock === 0
                ? "Out of Stock"
                : `Add to Cart — ${formatCurrency(effectivePrice * quantity)}`}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </>
  );
}
