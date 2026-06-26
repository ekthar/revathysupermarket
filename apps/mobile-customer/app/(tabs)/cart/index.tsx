import { View, Text, Pressable, FlatList, Image } from "react-native";
import { router } from "expo-router";
import { useCartStore } from "@/stores/cart";
import { formatCurrency } from "@msm/shared/utils";
import { CART_CONSTANTS } from "@msm/shared/constants";

export default function CartScreen() {
  const { items, updateQuantity, removeItem, totals } = useCartStore();
  const { subtotal, gst, deliveryFee, total, savings } = totals();

  if (items.length === 0) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-5xl mb-4">🛒</Text>
        <Text className="text-xl font-heading text-slate-900 mb-2">
          Your cart is empty
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-6">
          Browse products and add them to your cart
        </Text>
        <Pressable
          onPress={() => router.push("/(tabs)/home")}
          className="bg-primary-600 px-8 py-3 rounded-xl"
        >
          <Text className="text-white font-sans-bold">Shop Now</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-14">
      {/* Header */}
      <View className="px-5 pb-3 flex-row justify-between items-center">
        <Text className="text-xl font-heading text-slate-900">Cart</Text>
        <Text className="text-sm text-slate-400">
          {items.length} item{items.length > 1 ? "s" : ""}
        </Text>
      </View>

      {/* Cart Items */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
        renderItem={({ item }) => (
          <View className="flex-row py-4 border-b border-slate-50">
            {/* Image */}
            <View className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden mr-3">
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text>🛒</Text>
                </View>
              )}
            </View>

            {/* Details */}
            <View className="flex-1">
              <Text className="text-sm font-sans-medium text-slate-800" numberOfLines={1}>
                {item.name}
              </Text>
              <Text className="text-xs text-slate-400">{item.unit}</Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-sm font-sans-bold text-slate-900">
                  {formatCurrency((item.discountPrice || item.price) * item.quantity)}
                </Text>
                {item.discountPrice && (
                  <Text className="text-xs text-slate-400 line-through ml-2">
                    {formatCurrency(item.price * item.quantity)}
                  </Text>
                )}
              </View>
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center bg-slate-50 rounded-lg px-1 self-center">
              <Pressable
                onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                className="w-8 h-8 items-center justify-center"
              >
                <Text className="text-primary-600 font-sans-bold">−</Text>
              </Pressable>
              <Text className="w-6 text-center text-sm font-sans-bold">
                {item.quantity}
              </Text>
              <Pressable
                onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                className="w-8 h-8 items-center justify-center"
              >
                <Text className="text-primary-600 font-sans-bold">+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Bottom Summary & Checkout */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-4 pb-8">
        {/* Savings banner */}
        {savings > 0 && (
          <View className="bg-green-50 rounded-xl px-4 py-2 mb-3 flex-row items-center">
            <Text className="text-sm text-green-700 font-sans-medium">
              You're saving {formatCurrency(savings)} on this order! 🎉
            </Text>
          </View>
        )}

        {/* Price breakdown */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-slate-500">Subtotal</Text>
            <Text className="text-sm text-slate-700">{formatCurrency(subtotal)}</Text>
          </View>
          <View className="flex-row justify-between mb-1">
            <Text className="text-sm text-slate-500">GST (5%)</Text>
            <Text className="text-sm text-slate-700">{formatCurrency(gst)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-slate-500">Delivery</Text>
            <Text className={`text-sm ${deliveryFee === 0 ? "text-green-600 font-sans-medium" : "text-slate-700"}`}>
              {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
            </Text>
          </View>
          {deliveryFee > 0 && (
            <Text className="text-xs text-slate-400 mb-2">
              Add {formatCurrency(CART_CONSTANTS.FREE_DELIVERY_THRESHOLD - subtotal)} more for free delivery
            </Text>
          )}
          <View className="flex-row justify-between pt-2 border-t border-slate-100">
            <Text className="text-base font-heading text-slate-900">Total</Text>
            <Text className="text-base font-heading text-slate-900">
              {formatCurrency(total)}
            </Text>
          </View>
        </View>

        {/* Checkout Button */}
        <Pressable
          onPress={() => router.push("/checkout")}
          className="bg-primary-600 h-14 rounded-xl items-center justify-center"
        >
          <Text className="text-white text-base font-sans-bold">
            Proceed to Checkout — {formatCurrency(total)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
