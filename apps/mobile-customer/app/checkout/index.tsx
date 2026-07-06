import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, Stack } from "expo-router";
import { ArrowLeft, Check, MapPin, Clock, CreditCard } from "lucide-react-native";
import { useCartStore } from "@/stores/cart";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { DELIVERY_SLOTS, PAYMENT_METHODS } from "@msm/shared/constants";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

export default function CheckoutScreen() {
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<{ id: string; label: string; detail: string }[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const orderPlacedRef = useRef(false); // Prevent duplicate submissions
  const { items, totals, clearCart } = useCartStore();
  const { subtotal, gst, deliveryFee, total } = totals();

  useEffect(() => {
    api.get("/addresses").then(({ data }) => {
      const items = data.items || data.addresses || data || [];
      setAddresses(items);
    }).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, []);
  const stepTitles = ["Address", "Payment", "Review"];
  const stepIcons = [MapPin, CreditCard, Check];

  const handlePlaceOrder = async () => {
    // Guard: prevent duplicate submission
    if (orderPlacedRef.current || isPlacing) return;
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setError("");
    setIsPlacing(true);
    orderPlacedRef.current = true;

    try {
      const { data } = await api.post("/orders", {
        paymentMethod,
        deliveryMode: selectedSlot >= 0 ? "SCHEDULED" : "ASAP",
        addressId: addresses[selectedAddress].id,
        scheduledSlot:
          selectedSlot >= 0 ? DELIVERY_SLOTS[selectedSlot].time : undefined,
        promoCode: promoApplied ? promoCode : undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });
      await clearCart();
      showToast("Order placed successfully!", 'success');
      router.replace("/(tabs)/orders");
    } catch (e: any) {
      orderPlacedRef.current = false; // Allow retry on failure
      const msg = e.response?.data?.error || "Order could not be placed. Please try again.";

      if (e.response?.status === 429) {
        setError("Too many attempts. Please wait a moment.");
      } else if (e.response?.status === 503) {
        setError("Ordering system is temporarily busy. Please try again.");
      } else {
        setError(msg);
      }
    } finally {
      setIsPlacing(false);
    }
  };

  const canProceed = () => {
    if (step === 0) return addresses.length > 0;
    if (step === 1) return !!paymentMethod;
    return items.length > 0;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-14 pb-3">
          <Pressable
            onPress={() => step > 0 ? setStep(step - 1) : router.back()}
            className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={16} color="#374151" />
          </Pressable>
          <Text className="text-title font-bold text-neutral-900">Checkout</Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row px-6 py-3 items-center">
          {stepTitles.map((title, i) => {
            const StepIcon = stepIcons[i];
            return (
              <View key={i} className="flex-row items-center flex-1">
                <View className="items-center">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      i <= step ? "bg-primary-900" : "bg-neutral-200"
                    }`}
                  >
                    {i < step ? (
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Text
                        className={`text-micro font-black ${
                          i <= step ? "text-white" : "text-neutral-500"
                        }`}
                      >
                        {i + 1}
                      </Text>
                    )}
                  </View>
                  <Text className={`text-micro mt-1 font-semibold ${
                    i <= step ? "text-primary-900" : "text-neutral-400"
                  }`}>{title}</Text>
                </View>
                {i < 2 && (
                  <View
                    className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full ${
                      i < step ? "bg-primary-900" : "bg-neutral-200"
                    }`}
                  />
                )}
              </View>
            );
          })}
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Delivery Address
              </Text>
              {loadingAddresses ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#050505" />
                </View>
              ) : addresses.length === 0 ? (
                <View className="py-8 items-center gap-3">
                  <Text className="text-body text-neutral-400 text-center">No saved addresses. Add one in your account.</Text>
                  <Pressable onPress={() => router.push("/(tabs)/account")} className="bg-primary-900 px-5 py-2.5 rounded-xl">
                    <Text className="text-white font-bold text-caption">Go to Account</Text>
                  </Pressable>
                </View>
              ) : addresses.map((addr, i) => (
                <Pressable
                  key={addr.id}
                  onPress={() => setSelectedAddress(i)}
                  className={`p-4 rounded-xl mb-3 border ${
                    selectedAddress === i
                      ? "border-primary-900 bg-neutral-50"
                      : "border-neutral-200"
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                      selectedAddress === i ? "border-primary-900" : "border-neutral-300"
                    }`}>
                      {selectedAddress === i && (
                        <View className="w-2.5 h-2.5 rounded-full bg-primary-900" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-neutral-800">
                        {addr.label}
                      </Text>
                      <Text className="text-caption text-neutral-500 mt-0.5">
                        {addr.detail}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}

              <Text className="text-body font-bold text-neutral-900 mb-3 mt-5">
                Delivery Slot
              </Text>
              <View className="flex-row flex-wrap">
                {DELIVERY_SLOTS.map((slot, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedSlot(selectedSlot === i ? -1 : i)}
                    className={`px-3 py-2.5 rounded-xl mr-2 mb-2 border ${
                      selectedSlot === i
                        ? "bg-primary-900 border-primary-900"
                        : "border-neutral-200"
                    }`}
                  >
                    <Text
                      className={`text-caption font-bold ${
                        selectedSlot === i ? "text-white" : "text-neutral-700"
                      }`}
                    >
                      {slot.label}
                    </Text>
                    <Text
                      className={`text-micro ${
                        selectedSlot === i ? "text-white/70" : "text-neutral-400"
                      }`}
                    >
                      {slot.time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          )}

          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Payment Method
              </Text>
              {PAYMENT_METHODS.map((method) => (
                <Pressable
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl mb-3 border flex-row items-center ${
                    paymentMethod === method.id
                      ? "border-primary-900 bg-neutral-50"
                      : "border-neutral-200"
                  }`}
                >
                  <Text className="flex-1 font-medium text-neutral-800">
                    {method.label}
                  </Text>
                  <View
                    className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                      paymentMethod === method.id
                        ? "border-primary-900"
                        : "border-neutral-300"
                    }`}
                  >
                    {paymentMethod === method.id && (
                      <View className="w-2.5 h-2.5 rounded-full bg-primary-900" />
                    )}
                  </View>
                </Pressable>
              ))}

              <Text className="text-body font-bold text-neutral-900 mb-3 mt-5">
                Promo Code
              </Text>
              <View className="flex-row">
                <TextInput
                  value={promoCode}
                  onChangeText={(t) => { setPromoCode(t.toUpperCase()); setPromoError(""); }}
                  placeholder="Enter code"
                  placeholderTextColor="#9CA3AF"
                  className="flex-1 h-12 border border-neutral-200 rounded-xl px-4 mr-2 bg-neutral-50 text-body font-medium text-neutral-900"
                  editable={!promoApplied}
                  autoCapitalize="characters"
                />
                <Pressable
                  onPress={async () => {
                    if (promoApplied) {
                      setPromoApplied(false);
                      setPromoCode("");
                      setPromoError("");
                      return;
                    }
                    if (!promoCode.trim()) { setPromoError("Enter a promo code"); return; }
                    setPromoLoading(true);
                    setPromoError("");
                    try {
                      const { data } = await api.post("/promo-codes/validate", { code: promoCode.trim(), subtotal });
                      if (data.valid) { setPromoApplied(true); }
                      else { setPromoError(data.error || "Invalid or expired code"); }
                    } catch {
                      setPromoError("Could not validate code. Try again.");
                    } finally {
                      setPromoLoading(false);
                    }
                  }}
                  className="bg-primary-900 h-12 px-5 rounded-xl justify-center"
                  disabled={promoLoading}
                >
                  {promoLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text className="text-white font-bold text-caption">
                      {promoApplied ? "Remove" : "Apply"}
                    </Text>
                  )}
                </Pressable>
              </View>
              {promoError ? <Text className="text-micro text-red-500 mt-1.5">{promoError}</Text> : null}
              {promoApplied ? <Text className="text-micro text-green-600 mt-1.5">Promo code applied!</Text> : null}
            </Animated.View>
          )}

          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Order Summary
              </Text>
              <View className="bg-neutral-50 rounded-xl p-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">Subtotal</Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">GST (5%)</Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {formatCurrency(gst)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-caption text-neutral-500">Delivery</Text>
                  <Text className={`text-caption font-medium ${deliveryFee === 0 ? "text-secondary-600" : "text-neutral-700"}`}>
                    {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                  </Text>
                </View>
                <View className="border-t border-neutral-200 pt-2.5 flex-row justify-between">
                  <Text className="text-body font-bold text-neutral-900">Total</Text>
                  <Text className="text-body font-bold text-neutral-900">
                    {formatCurrency(total)}
                  </Text>
                </View>
              </View>

              {/* Order Details */}
              <View className="mt-4 bg-neutral-50 rounded-xl p-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">Address</Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {addresses[selectedAddress].label}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">Delivery</Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {selectedSlot >= 0 ? DELIVERY_SLOTS[selectedSlot].label : "ASAP (as soon as possible)"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-caption text-neutral-500">Payment</Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Error display */}
        {error ? (
          <View className="mx-6 mb-2 bg-error-50 rounded-xl p-3">
            <Text className="text-caption font-medium text-error-700">{error}</Text>
          </View>
        ) : null}

        {/* Bottom Action */}
        <View className="px-6 py-4 pb-8 border-t border-neutral-100">
          <Button
            onPress={step < 2 ? () => { setError(""); setStep(step + 1); } : handlePlaceOrder}
            disabled={isPlacing || !canProceed()}
            loading={isPlacing}
            fullWidth
            size="lg"
          >
            {step < 2 ? "Continue" : `Place Order — ${formatCurrency(total)}`}
          </Button>
        </View>
      </View>
    </>
  );
}
