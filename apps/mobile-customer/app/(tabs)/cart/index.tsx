import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Image,
  TextInput,
} from "react-native";
import Animated, { FadeInDown, FadeOutLeft, Layout } from "react-native-reanimated";
import { router } from "expo-router";
import {
  Minus,
  Plus,
  Trash2,
  Tag,
  ShoppingBag,
  Info,
  ArrowLeft,
} from "lucide-react-native";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { formatCurrency } from "@msm/shared/utils";
import { validatePromoCode } from "@/services/promo";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CartScreen() {
  const { items, updateQuantity, removeItem, totals } = useCartStore();
  const { storeConfig, loadStoreConfig } = useSettingsStore();
  const { subtotal, gst, deliveryFee, total, savings } = totals();

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoDescription, setPromoDescription] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");

  useEffect(() => {
    loadStoreConfig();
  }, []);

  const belowMinimum = subtotal < storeConfig.minimumOrderValue && items.length > 0;
  const qualifiesFreeDelivery =
    storeConfig.freeDeliveryThreshold > 0 &&
    subtotal >= storeConfig.freeDeliveryThreshold;

  const finalTotal = total - promoDiscount;
  const totalSavings =
    items.reduce((sum, item) => {
      if (item.discountPrice)
        return sum + (item.price - item.discountPrice) * item.quantity;
      return sum;
    }, 0) + promoDiscount;

  const handleApplyPromo = async () => {
    if (promoCode.trim().length < 3) {
      setPromoError("Enter a valid code");
      return;
    }
    setPromoLoading(true);
    setPromoError("");
    const result = await validatePromoCode(promoCode.trim(), subtotal);
    if (result.valid) {
      setPromoApplied(true);
      setPromoDiscount(result.discount);
      setPromoDescription(result.description);
    } else {
      setPromoError(result.error || "Invalid code");
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoDescription("");
    setPromoCode("");
    setPromoError("");
  };

  if (items.length === 0) {
    return (
      <EmptyState
        emoji="🛒"
        title="Your cart is empty"
        description="Add items from the store to get started"
        actionLabel="Browse Products"
        onAction={() => router.push("/(tabs)/categories")}
      />
    );
  }

  return (
    <View className="flex-1 bg-white pt-14">
      {/* Header */}
      <View className="px-4 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.push("/(tabs)/categories")}
            className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center"
          >
            <ArrowLeft size={16} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-micro font-black uppercase tracking-widest text-neutral-400">
              {items.length} item{items.length > 1 ? "s" : ""}
            </Text>
            <Text className="text-title font-bold text-neutral-900">Your cart</Text>
          </View>
        </View>
        <Text className="text-body font-bold text-neutral-900">
          {formatCurrency(subtotal)}
        </Text>
      </View>

      {/* Minimum order warning */}
      {belowMinimum && (
        <View className="mx-4 mb-3 rounded-xl bg-warning-50 border border-warning-100 p-3 flex-row items-start gap-2">
          <Info size={14} color="#B45309" />
          <Text className="text-caption font-semibold text-warning-700 flex-1">
            Minimum order value is {formatCurrency(storeConfig.minimumOrderValue)}.
            Add {formatCurrency(storeConfig.minimumOrderValue - subtotal)} more.
          </Text>
        </View>
      )}

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 320 }}
        renderItem={({ item }) => {
          const price = item.discountPrice || item.price;
          return (
            <Animated.View
              layout={Layout.springify()}
              exiting={FadeOutLeft.duration(200)}
              className="flex-row py-3 border-b border-neutral-50 items-center"
            >
              {/* Image */}
              <Pressable
                onPress={() => router.push(`/product/${item.productId}`)}
                className="w-14 h-14 bg-neutral-50 rounded-xl overflow-hidden mr-3"
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <ShoppingBag size={16} color="#9CA3AF" />
                  </View>
                )}
              </Pressable>

              {/* Details */}
              <View className="flex-1 min-w-0">
                <Text className="text-body font-semibold text-neutral-800" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-micro text-neutral-400">{item.unit}</Text>
                <View className="flex-row items-center mt-0.5">
                  <Text className="text-body font-bold text-neutral-900">
                    {formatCurrency(price * item.quantity)}
                  </Text>
                  {item.discountPrice && (
                    <Text className="text-micro text-neutral-400 line-through ml-2">
                      {formatCurrency(item.price * item.quantity)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Quantity Stepper */}
              <View className="flex-row items-center h-[30px] rounded-full bg-primary-900 mx-2">
                <Pressable
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-full items-center justify-center"
                >
                  <Minus size={12} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
                <Text className="w-5 text-center text-caption font-bold text-white">
                  {item.quantity}
                </Text>
                <Pressable
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-full items-center justify-center"
                >
                  <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              </View>

              {/* Remove */}
              <Pressable
                onPress={() => removeItem(item.productId)}
                className="h-7 w-7 rounded-full items-center justify-center ml-1"
              >
                <Trash2 size={14} color="#D1D5DB" />
              </Pressable>
            </Animated.View>
          );
        }}
      />

      {/* Bottom Summary */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 pt-4 pb-8">
        {/* Promo Code */}
        <View className="flex-row items-center gap-2 mb-3 bg-neutral-50 rounded-xl px-3 py-2">
          <Tag size={14} color="#9CA3AF" />
          {promoApplied ? (
            <View className="flex-1 flex-row items-center justify-between">
              <View>
                <Text className="text-caption font-semibold text-secondary-600">
                  {promoCode.toUpperCase()} applied
                </Text>
                <Text className="text-micro text-neutral-400">
                  {promoDescription} — Save {formatCurrency(promoDiscount)}
                </Text>
              </View>
              <Pressable onPress={removePromo}>
                <Text className="text-caption font-semibold text-error-500">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-1 flex-row items-center gap-2">
              <TextInput
                value={promoCode}
                onChangeText={(t) => { setPromoCode(t.toUpperCase()); setPromoError(""); }}
                placeholder="Apply coupon code"
                placeholderTextColor="#9CA3AF"
                className="flex-1 text-body font-medium text-neutral-800"
                autoCapitalize="characters"
              />
              <Pressable onPress={handleApplyPromo} disabled={promoLoading}>
                <Text className="text-caption font-bold text-primary-900">
                  {promoLoading ? "..." : "Apply"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
        {promoError ? (
          <Text className="text-micro text-error-500 mb-2 ml-1">{promoError}</Text>
        ) : null}

        {/* Savings banner */}
        {totalSavings > 0 && (
          <View className="bg-secondary-50 rounded-xl px-3 py-2 mb-3 border border-secondary-100">
            <Text className="text-caption font-semibold text-secondary-700">
              You're saving {formatCurrency(totalSavings)} on this order! 🎉
            </Text>
          </View>
        )}

        {/* Price breakdown */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-caption text-neutral-500">Subtotal</Text>
            <Text className="text-caption font-medium text-neutral-700">{formatCurrency(subtotal)}</Text>
          </View>
          {promoApplied && (
            <View className="flex-row justify-between mb-1">
              <Text className="text-caption text-neutral-500">Coupon</Text>
              <Text className="text-caption font-medium text-secondary-600">-{formatCurrency(promoDiscount)}</Text>
            </View>
          )}
          <View className="flex-row justify-between mb-1">
            <Text className="text-caption text-neutral-500">Delivery</Text>
            <Text className={`text-caption font-medium ${qualifiesFreeDelivery ? "text-secondary-600" : "text-neutral-700"}`}>
              {qualifiesFreeDelivery ? "FREE" : "At checkout"}
            </Text>
          </View>
          <View className="flex-row justify-between pt-2 border-t border-neutral-100 mt-1">
            <Text className="text-body font-bold text-neutral-900">Total</Text>
            <Text className="text-body font-bold text-neutral-900">{formatCurrency(finalTotal)}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Button
          onPress={() => router.push("/checkout")}
          disabled={belowMinimum}
          fullWidth
          size="lg"
        >
          {belowMinimum
            ? "Add more items"
            : `Proceed to Checkout — ${formatCurrency(finalTotal)}`}
        </Button>
      </View>
    </View>
  );
}
