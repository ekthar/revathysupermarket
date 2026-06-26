import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useCartStore } from "@/stores/cart";
import { api } from "@/services/api";
import { formatCurrency } from "@msm/shared/utils";
import { DELIVERY_SLOTS, PAYMENT_METHODS } from "@msm/shared/constants";

export default function CheckoutScreen() {
  const [step, setStep] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(-1);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const { items, totals, clearCart } = useCartStore();
  const { subtotal, gst, deliveryFee, total } = totals();

  const addresses = [
    { id: "1", label: "Home", detail: "Flat 4B, Green Valley Apt, MG Road" },
    { id: "2", label: "Work", detail: "Technopark Phase 3, Kazhakkoottam" },
  ];
  const stepTitles = ["Address & Slot", "Payment", "Review"];

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    try {
      await api.post("/orders", {
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
      router.replace("/(tabs)/orders");
    } catch {}
    setIsPlacing(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Step Indicator */}
      <View className="flex-row px-6 py-4 items-center">
        {stepTitles.map((title, i) => (
          <View key={i} className="flex-row items-center flex-1">
            <View
              className={`w-7 h-7 rounded-full items-center justify-center ${
                i <= step ? "bg-primary-600" : "bg-slate-200"
              }`}
            >
              {i < step ? (
                <Text className="text-white text-xs">✓</Text>
              ) : (
                <Text
                  className={`text-xs font-sans-bold ${
                    i <= step ? "text-white" : "text-slate-500"
                  }`}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            {i < 2 && (
              <View
                className={`flex-1 h-0.5 mx-1 ${
                  i < step ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            )}
          </View>
        ))}
      </View>

      <ScrollView className="flex-1 px-6">
        {step === 0 && (
          <View>
            <Text className="text-base font-heading text-slate-900 mb-3">
              Delivery Address
            </Text>
            {addresses.map((addr, i) => (
              <Pressable
                key={addr.id}
                onPress={() => setSelectedAddress(i)}
                className={`p-4 rounded-xl mb-3 border ${
                  selectedAddress === i
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200"
                }`}
              >
                <Text className="font-sans-semibold text-slate-800">
                  {addr.label}
                </Text>
                <Text className="text-sm text-slate-500 mt-1">
                  {addr.detail}
                </Text>
              </Pressable>
            ))}

            <Text className="text-base font-heading text-slate-900 mb-3 mt-4">
              Delivery Slot
            </Text>
            <View className="flex-row flex-wrap">
              {DELIVERY_SLOTS.map((slot, i) => (
                <Pressable
                  key={i}
                  onPress={() => setSelectedSlot(selectedSlot === i ? -1 : i)}
                  className={`px-3 py-2 rounded-lg mr-2 mb-2 border ${
                    selectedSlot === i
                      ? "bg-primary-600 border-primary-600"
                      : "border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-xs font-sans-medium ${
                      selectedSlot === i ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {slot.label}
                  </Text>
                  <Text
                    className={`text-xs ${
                      selectedSlot === i ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {slot.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text className="text-base font-heading text-slate-900 mb-3">
              Payment Method
            </Text>
            {PAYMENT_METHODS.map((method) => (
              <Pressable
                key={method.id}
                onPress={() => setPaymentMethod(method.id)}
                className={`p-4 rounded-xl mb-3 border flex-row items-center ${
                  paymentMethod === method.id
                    ? "border-primary-500 bg-primary-50"
                    : "border-slate-200"
                }`}
              >
                <Text className="flex-1 font-sans-medium text-slate-800">
                  {method.label}
                </Text>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    paymentMethod === method.id
                      ? "border-primary-600"
                      : "border-slate-300"
                  }`}
                >
                  {paymentMethod === method.id && (
                    <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                  )}
                </View>
              </Pressable>
            ))}

            <Text className="text-base font-heading text-slate-900 mb-3 mt-4">
              Promo Code
            </Text>
            <View className="flex-row">
              <TextInput
                value={promoCode}
                onChangeText={setPromoCode}
                placeholder="Enter code"
                className="flex-1 h-12 border border-slate-200 rounded-xl px-4 mr-2"
                editable={!promoApplied}
              />
              <Pressable
                onPress={() => setPromoApplied(!promoApplied)}
                className="bg-primary-600 h-12 px-4 rounded-xl justify-center"
              >
                <Text className="text-white font-sans-medium text-sm">
                  {promoApplied ? "Remove" : "Apply"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text className="text-base font-heading text-slate-900 mb-3">
              Order Summary
            </Text>
            <View className="bg-slate-50 rounded-xl p-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-slate-500">Subtotal</Text>
                <Text className="text-sm text-slate-700">
                  {formatCurrency(subtotal)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-1">
                <Text className="text-sm text-slate-500">GST (5%)</Text>
                <Text className="text-sm text-slate-700">
                  {formatCurrency(gst)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-slate-500">Delivery</Text>
                <Text className="text-sm text-slate-700">
                  {deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee)}
                </Text>
              </View>
              <View className="border-t border-slate-200 pt-2 flex-row justify-between">
                <Text className="text-base font-heading">Total</Text>
                <Text className="text-base font-heading">
                  {formatCurrency(total)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View className="px-6 py-4 pb-8 border-t border-slate-100">
        <Pressable
          onPress={step < 2 ? () => setStep(step + 1) : handlePlaceOrder}
          disabled={isPlacing}
          className={`h-14 rounded-xl items-center justify-center ${
            isPlacing ? "bg-primary-400" : "bg-primary-600"
          }`}
        >
          {isPlacing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-base font-sans-bold">
              {step < 2 ? "Continue" : `Place Order — ${formatCurrency(total)}`}
            </Text>
          )}
        </Pressable>
        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)} className="mt-3 items-center">
            <Text className="text-primary-600 font-sans-medium text-sm">
              ← Back
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
