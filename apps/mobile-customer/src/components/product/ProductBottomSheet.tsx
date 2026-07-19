/**
 * Product Bottom Sheet — Quick-Add with Quantity Stepper
 * ══════════════════════════════════════════════════════
 *
 * A beautiful bottom sheet that slides up when tapping "+"
 * on a product card. Shows product details + quantity stepper
 * without navigating to the full product page.
 *
 * Features:
 * - Gesture-driven dismiss (swipe down)
 * - Spring-animated entrance
 * - Product image with price
 * - Quantity stepper with haptic feedback
 * - Add to cart button
 * - Unit selector (if multiple units)
 * - Backdrop blur overlay
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Dimensions,
  BackHandler,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Minus, Plus, ShoppingBag, X } from "lucide-react-native";
import { spring, tapScale } from "@/theme/motion";
import { lightHaptic } from "@/lib/haptic";
import { useCartStore } from "@/stores/cart";
import { formatCurrency } from "@msm/shared/utils";
import type { Product } from "@msm/shared/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = 380;

interface ProductBottomSheetProps {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}

export function ProductBottomSheet({ product, visible, onClose }: ProductBottomSheetProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const translateY = useSharedValue(0);

  // Reset quantity when product changes
  useEffect(() => {
    if (product) setQuantity(1);
  }, [product?.id]);

  // Handle back button on Android
  useEffect(() => {
    if (!visible) return;
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    lightHaptic();
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
    onClose();
  }, [product, quantity, addItem, onClose]);

  const incrementQuantity = useCallback(() => {
    if (!product) return;
    if (quantity < product.stock) {
      lightHaptic();
      setQuantity((q) => q + 1);
    }
  }, [quantity, product]);

  const decrementQuantity = useCallback(() => {
    if (quantity > 1) {
      lightHaptic();
      setQuantity((q) => q - 1);
    }
  }, [quantity]);

  // Swipe to dismiss gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        translateY.value = withTiming(SHEET_HEIGHT, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, spring.snappy);
      }
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Reset translateY when opening
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, spring.default);
    }
  }, [visible]);

  if (!visible || !product) return null;

  const displayPrice = product.discountPrice || product.price;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const totalPrice = displayPrice * quantity;
  const savingsPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice!) / product.price) * 100)
    : 0;

  return (
    <View className="absolute inset-0 z-50">
      {/* Backdrop */}
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        className="absolute inset-0 bg-black/50"
      >
        <Pressable className="flex-1" onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(250)}
          exiting={SlideOutDown.duration(200)}
          style={[sheetAnimatedStyle]}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl"
          style={{ minHeight: SHEET_HEIGHT }}
        >
          {/* Handle bar */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 rounded-full bg-neutral-200" />
          </View>

          {/* Close button */}
          <Pressable
            onPress={onClose}
            className="absolute top-3 right-4 h-8 w-8 rounded-full bg-neutral-100 items-center justify-center z-10"
          >
            <X size={16} color="#6B7280" />
          </Pressable>

          {/* Product info */}
          <View className="px-5 pt-2 pb-4">
            <View className="flex-row">
              {/* Image */}
              <View className="w-24 h-24 rounded-2xl bg-neutral-50 overflow-hidden border border-neutral-100">
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <ShoppingBag size={24} color="#D1D5DB" />
                  </View>
                )}
                {hasDiscount && (
                  <View className="absolute top-1 left-1 bg-primary-900 px-1.5 py-0.5 rounded-full">
                    <Text className="text-[8px] font-black text-white">
                      {savingsPercent}% OFF
                    </Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View className="flex-1 ml-4 justify-center">
                <Text className="text-body font-bold text-neutral-900" numberOfLines={2}>
                  {product.name}
                </Text>
                <Text className="text-micro text-neutral-400 mt-0.5">
                  {product.unit}
                </Text>
                <View className="flex-row items-baseline mt-2">
                  <Text className="text-heading font-black text-neutral-900">
                    {formatCurrency(displayPrice)}
                  </Text>
                  {hasDiscount && (
                    <Text className="ml-2 text-caption text-neutral-400 line-through">
                      {formatCurrency(product.price)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View className="mx-5 h-px bg-neutral-100" />

          {/* Quantity section */}
          <View className="px-5 py-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-body font-semibold text-neutral-700">Quantity</Text>

              {/* Stepper */}
              <View className="flex-row items-center bg-neutral-50 rounded-2xl border border-neutral-100">
                <Pressable
                  onPress={decrementQuantity}
                  disabled={quantity <= 1}
                  className={`h-11 w-11 rounded-xl items-center justify-center ${
                    quantity <= 1 ? "opacity-30" : ""
                  }`}
                >
                  <Minus size={18} color="#050505" strokeWidth={2.5} />
                </Pressable>

                <View className="min-w-[48px] items-center">
                  <Text className="text-title font-black text-neutral-900">
                    {quantity}
                  </Text>
                </View>

                <Pressable
                  onPress={incrementQuantity}
                  disabled={quantity >= product.stock}
                  className={`h-11 w-11 rounded-xl items-center justify-center ${
                    quantity >= product.stock ? "opacity-30" : ""
                  }`}
                >
                  <Plus size={18} color="#050505" strokeWidth={2.5} />
                </Pressable>
              </View>
            </View>

            {/* Stock indicator */}
            {product.stock <= 5 && product.stock > 0 && (
              <Text className="text-micro font-semibold text-amber-600 mt-2">
                Only {product.stock} left in stock
              </Text>
            )}
          </View>

          {/* Add to cart button */}
          <View className="px-5 pb-8">
            <Pressable
              onPress={handleAddToCart}
              className="h-14 bg-primary-900 rounded-2xl flex-row items-center justify-between px-6 shadow-lg"
              style={{
                shadowColor: "#050505",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 16,
              }}
            >
              <View className="flex-row items-center">
                <ShoppingBag size={18} color="#FFFFFF" strokeWidth={2} />
                <Text className="text-body font-bold text-white ml-2">
                  Add to Cart
                </Text>
              </View>
              <Text className="text-body font-black text-white">
                {formatCurrency(totalPrice)}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
