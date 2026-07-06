import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router, Stack } from "expo-router";
import { ArrowLeft, Check, MapPin, CreditCard, Navigation, Gift } from "lucide-react-native";
import { useCartStore } from "@/stores/cart";
import { useSettingsStore } from "@/stores/settings";
import { api } from "@/services/api";
import {
  getCurrentLocation,
  getDeliveryFeePreview,
  isWithinDeliveryRadius,
  reverseGeocode,
} from "@/services/location";
import { formatCurrency } from "@msm/shared/utils";
import { PAYMENT_METHODS, LOYALTY_CONFIG } from "@msm/shared/constants";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

interface Address {
  id: string;
  label: string;
  detail: string;
  latitude?: number;
  longitude?: number;
}

interface DeliverySlot {
  time: string;
  label: string;
}

export default function CheckoutScreen() {
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState(0);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsAddressIndex, setGpsAddressIndex] = useState(-1);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(-1);
  const [deliveryFeePreview, setDeliveryFeePreview] = useState<number | null>(null);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState<{ points: number } | null>(null);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState("");
  const orderPlacedRef = useRef(false);

  const { items, totals, clearCart } = useCartStore();
  const storeConfig = useSettingsStore((s) => s.storeConfig);
  const { subtotal } = totals();

  const gstRate = storeConfig.gstRatePercent / 100;
  const gstAmount = subtotal * gstRate;
  const displayDeliveryFee =
    deliveryFeePreview ??
    (subtotal >= storeConfig.freeDeliveryThreshold
      ? 0
      : storeConfig.deliveryFee);
  const isUsingGps = gpsAddressIndex >= 0 && selectedAddress === gpsAddressIndex;

  const loyaltyPointsAvailable = loyaltyData?.points ?? 0;
  const maxLoyaltyDiscount = subtotal * (LOYALTY_CONFIG.maxRedemptionPercent / 100);
  const maxRedeemablePoints = Math.floor(maxLoyaltyDiscount / LOYALTY_CONFIG.pointValueRupees);
  const actualRedeemablePoints = Math.min(loyaltyPointsAvailable, maxRedeemablePoints);
  const loyaltyDiscountAmount = actualRedeemablePoints * LOYALTY_CONFIG.pointValueRupees;

  const walletSufficient =
    walletBalance === null
      ? true
      : walletBalance >= subtotal + gstAmount + displayDeliveryFee - (useLoyalty ? loyaltyDiscountAmount : 0);

  const finalTotal = subtotal + gstAmount + displayDeliveryFee - (useLoyalty ? loyaltyDiscountAmount : 0);

  // ---- Load data ----

  useEffect(() => {
    api
      .get("/addresses")
      .then(({ data }) => {
        const items = data.items || data.addresses || data || [];
        setAddresses(items);
      })
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, []);

  useEffect(() => {
    setLoadingSlots(true);
    api
      .get("/delivery-slots")
      .then(({ data }) => {
        setDeliverySlots(data.items || data.slots || data || []);
      })
      .catch(() => {
        setDeliverySlots([]);
      })
      .finally(() => setLoadingSlots(false));
  }, []);

  // ---- Delivery fee preview on address change ----

  useEffect(() => {
    const fetchFee = async () => {
      let lat: number | null = null;
      let lng: number | null = null;

      if (isUsingGps && gpsCoords) {
        lat = gpsCoords.latitude;
        lng = gpsCoords.longitude;
      } else if (selectedAddress >= 0 && selectedAddress < addresses.length) {
        const addr = addresses[selectedAddress];
        if (addr.latitude != null && addr.longitude != null) {
          lat = addr.latitude;
          lng = addr.longitude;
        }
      }

      if (lat !== null && lng !== null && subtotal > 0) {
        setLoadingDeliveryFee(true);
        try {
          const fee = await getDeliveryFeePreview(lat, lng, subtotal);
          setDeliveryFeePreview(fee);
        } finally {
          setLoadingDeliveryFee(false);
        }
      } else {
        setDeliveryFeePreview(null);
      }
    };

    fetchFee();
  }, [selectedAddress, gpsCoords, isUsingGps, addresses, subtotal]);

  // ---- Fetch wallet / loyalty on payment step ----

  useEffect(() => {
    if (step !== 1) return;
    if (paymentMethod === "WALLET") {
      setLoadingWallet(true);
      api
        .get("/wallet")
        .then(({ data }) => {
          setWalletBalance(Number(data.balance ?? data.amount ?? 0));
        })
        .catch(() => {
          setWalletBalance(null);
        })
        .finally(() => setLoadingWallet(false));
    }
    setLoadingLoyalty(true);
    api
      .get("/loyalty")
      .then(({ data }) => {
        setLoyaltyData({ points: Number(data.points ?? data.available ?? 0) });
      })
      .catch(() => {
        setLoyaltyData(null);
      })
      .finally(() => setLoadingLoyalty(false));
  }, [step]);

  // ---- GPS handler ----

  const handleUseCurrentLocation = useCallback(async () => {
    setDetectingLocation(true);
    setError("");
    try {
      const coords = await getCurrentLocation();
      if (!coords) {
        showToast("Could not detect location. Please check permissions.", "error");
        return;
      }
      const storeCoords = {
        latitude: storeConfig.storeLatitude,
        longitude: storeConfig.storeLongitude,
      };
      const withinRadius = isWithinDeliveryRadius(
        coords,
        storeCoords,
        storeConfig.deliveryRadiusKm,
      );
      if (!withinRadius) {
        setError("Your location is outside our delivery area.");
        return;
      }
      const addressText = await reverseGeocode(coords);
      const detail = addressText || `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      const filtered = addresses.filter((a) => a.id !== "gps_current");
      const gpsEntry: Address = {
        id: "gps_current",
        label: "Current Location",
        detail,
      };
      const updated = [gpsEntry, ...filtered];
      setAddresses(updated);
      setGpsCoords(coords);
      setGpsAddressIndex(0);
      setSelectedAddress(0);
      showToast("Location detected!", "success");
    } catch {
      showToast("Could not detect location. Please try again.", "error");
    } finally {
      setDetectingLocation(false);
    }
  }, [addresses, storeConfig]);

  // ---- Place order ----

  const handlePlaceOrder = async () => {
    if (orderPlacedRef.current || isPlacing) return;
    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }
    if (paymentMethod === "WALLET" && !walletSufficient) {
      setError("Insufficient wallet balance");
      return;
    }

    setError("");
    setIsPlacing(true);
    orderPlacedRef.current = true;

    try {
      const payload: Record<string, any> = {
        paymentMethod,
        deliveryMode: selectedSlot >= 0 ? "SCHEDULED" : "ASAP",
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        scheduledSlot:
          selectedSlot >= 0 && deliverySlots[selectedSlot]
            ? deliverySlots[selectedSlot].time
            : undefined,
        promoCode: promoApplied ? promoCode : undefined,
      };

      if (isUsingGps && gpsCoords) {
        payload.deliveryLatitude = gpsCoords.latitude;
        payload.deliveryLongitude = gpsCoords.longitude;
      } else if (addresses[selectedAddress]) {
        payload.addressId = addresses[selectedAddress].id;
      }

      if (deliveryFeePreview != null) {
        payload.deliveryFee = deliveryFeePreview;
      }

      if (useLoyalty && actualRedeemablePoints > 0) {
        payload.loyaltyPoints = actualRedeemablePoints;
      }

      const { data } = await api.post("/orders", payload);
      await clearCart();
      (router as any).replace({
        pathname: "/checkout/success",
        params: { orderId: data.id ?? data.orderId ?? "" },
      });
    } catch (e: any) {
      orderPlacedRef.current = false;
      const msg =
        e.response?.data?.error || "Order could not be placed. Please try again.";
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

  // ---- Step navigation helpers ----

  const canProceed = () => {
    if (step === 0) return addresses.length > 0 && !detectingLocation;
    if (step === 1) {
      if (!paymentMethod) return false;
      if (paymentMethod === "WALLET" && !walletSufficient) return false;
      return true;
    }
    return items.length > 0;
  };

  const stepTitles = ["Address", "Payment", "Review"];
  const stepIcons = [MapPin, CreditCard, Check];

  // ---- Render ----

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-14 pb-3">
          <Pressable
            onPress={() => (step > 0 ? setStep(step - 1) : router.back())}
            className="h-9 w-9 rounded-full bg-neutral-100 items-center justify-center mr-3"
          >
            <ArrowLeft size={16} color="#374151" />
          </Pressable>
          <Text className="text-title font-bold text-neutral-900">Checkout</Text>
        </View>

        {/* Step Indicator */}
        <View className="flex-row px-6 py-3 items-center">
          {stepTitles.map((title, i) => (
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
                <Text
                  className={`text-micro mt-1 font-semibold ${
                    i <= step ? "text-primary-900" : "text-neutral-400"
                  }`}
                >
                  {title}
                </Text>
              </View>
              {i < 2 && (
                <View
                  className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full ${
                    i < step ? "bg-primary-900" : "bg-neutral-200"
                  }`}
                />
              )}
            </View>
          ))}
        </View>

        <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
          {/* ==================== STEP 0 — Address ==================== */}
          {step === 0 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Delivery Address
              </Text>

              {/* GPS Detection */}
              <Pressable
                onPress={handleUseCurrentLocation}
                disabled={detectingLocation}
                className="flex-row items-center p-4 rounded-xl mb-4 bg-primary-900/5 border border-primary-200"
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color="#050505" style={{ marginRight: 12 }} />
                ) : (
                  <View className="w-9 h-9 rounded-full bg-primary-900 items-center justify-center mr-3">
                    <Navigation size={16} color="#FFFFFF" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="font-bold text-neutral-800">
                    {detectingLocation ? "Detecting location..." : "Use Current Location"}
                  </Text>
                  <Text className="text-caption text-neutral-500 mt-0.5">
                    {detectingLocation
                      ? "Please wait..."
                      : "Auto-detect your address via GPS"}
                  </Text>
                </View>
              </Pressable>

              {loadingAddresses ? (
                <View className="py-8 items-center">
                  <ActivityIndicator color="#050505" />
                </View>
              ) : addresses.length === 0 ? (
                <View className="py-8 items-center gap-3">
                  <Text className="text-body text-neutral-400 text-center">
                    No saved addresses. Use GPS above or add one in your account.
                  </Text>
                  <Pressable
                    onPress={() => router.push("/(tabs)/account")}
                    className="bg-primary-900 px-5 py-2.5 rounded-xl"
                  >
                    <Text className="text-white font-bold text-caption">
                      Go to Account
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Text className="text-caption font-semibold text-neutral-500 mb-2">
                    Saved Addresses
                  </Text>
                  {addresses.map((addr, i) => (
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
                        <View
                          className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                            selectedAddress === i
                              ? "border-primary-900"
                              : "border-neutral-300"
                          }`}
                        >
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
                </>
              )}

              {/* Delivery Slots */}
              <Text className="text-body font-bold text-neutral-900 mb-3 mt-5">
                Delivery Slot
              </Text>
              {loadingSlots ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#050505" />
                </View>
              ) : (
                <View className="flex-row flex-wrap">
                  <Pressable
                    onPress={() => setSelectedSlot(-1)}
                    className={`px-3 py-2.5 rounded-xl mr-2 mb-2 border ${
                      selectedSlot === -1
                        ? "bg-primary-900 border-primary-900"
                        : "border-neutral-200"
                    }`}
                  >
                    <Text
                      className={`text-caption font-bold ${
                        selectedSlot === -1 ? "text-white" : "text-neutral-700"
                      }`}
                    >
                      ASAP
                    </Text>
                    <Text
                      className={`text-micro ${
                        selectedSlot === -1 ? "text-white/70" : "text-neutral-400"
                      }`}
                    >
                      As soon as possible
                    </Text>
                  </Pressable>
                  {deliverySlots.map((slot, i) => (
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
              )}

              {/* Delivery fee indicator */}
              {loadingDeliveryFee ? (
                <View className="flex-row items-center py-2 mt-2">
                  <ActivityIndicator size="small" color="#050505" />
                  <Text className="text-caption text-neutral-400 ml-2">
                    Calculating delivery fee...
                  </Text>
                </View>
              ) : deliveryFeePreview != null ? (
                <View className="flex-row items-center py-2 mt-2">
                  <Text className="text-caption text-neutral-500">
                    Delivery fee:{" "}
                    <Text
                      className={`font-bold ${
                        deliveryFeePreview === 0
                          ? "text-secondary-600"
                          : "text-neutral-700"
                      }`}
                    >
                      {deliveryFeePreview === 0
                        ? "FREE"
                        : formatCurrency(deliveryFeePreview)}
                    </Text>
                    {deliveryFeePreview > 0 &&
                      subtotal < storeConfig.freeDeliveryThreshold && (
                        <Text className="text-neutral-400">
                          {" — "}
                          Add{" "}
                          {formatCurrency(
                            storeConfig.freeDeliveryThreshold - subtotal
                          )}{" "}
                          for free delivery
                        </Text>
                      )}
                  </Text>
                </View>
              ) : null}
            </Animated.View>
          )}

          {/* ==================== STEP 1 — Payment ==================== */}
          {step === 1 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Payment Method
              </Text>
              {PAYMENT_METHODS.map((method) => {
                const isWallet = method.id === "WALLET";
                const insufficient = isWallet && !walletSufficient && walletBalance !== null;
                return (
                  <Pressable
                    key={method.id}
                    onPress={() => {
                      setPaymentMethod(method.id);
                      if (isWallet) {
                        setLoadingWallet(true);
                        api
                          .get("/wallet")
                          .then(({ data }) => {
                            setWalletBalance(Number(data.balance ?? data.amount ?? 0));
                          })
                          .catch(() => setWalletBalance(null))
                          .finally(() => setLoadingWallet(false));
                      }
                    }}
                    className={`p-4 rounded-xl mb-3 border flex-row items-center ${
                      paymentMethod === method.id
                        ? "border-primary-900 bg-neutral-50"
                        : "border-neutral-200"
                    } ${insufficient ? "opacity-50" : ""}`}
                  >
                    <View className="flex-1">
                      <Text className="font-medium text-neutral-800">
                        {method.label}
                      </Text>
                      {isWallet && (
                        <View className="mt-1">
                          {loadingWallet ? (
                            <View className="flex-row items-center">
                              <ActivityIndicator
                                size="small"
                                color="#050505"
                              />
                              <Text className="text-caption text-neutral-400 ml-1.5">
                                Checking balance...
                              </Text>
                            </View>
                          ) : walletBalance !== null ? (
                            <Text
                              className={`text-caption ${
                                insufficient
                                  ? "text-error-500"
                                  : "text-neutral-500"
                              }`}
                            >
                              Balance: {formatCurrency(walletBalance)}
                              {insufficient && " (insufficient)"}
                            </Text>
                          ) : (
                            <Text className="text-caption text-error-500">
                              Could not load balance
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
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
                );
              })}

              {/* Loyalty Redemption */}
              <View className="mt-6 bg-neutral-50 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <View className="w-9 h-9 rounded-full bg-secondary-500/10 items-center justify-center mr-3">
                      <Gift size={16} color="#B8860B" />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-neutral-800">
                        Use Loyalty Points
                      </Text>
                      {loadingLoyalty ? (
                        <View className="flex-row items-center mt-0.5">
                          <ActivityIndicator size="small" color="#050505" />
                          <Text className="text-caption text-neutral-400 ml-1.5">
                            Loading...
                          </Text>
                        </View>
                      ) : loyaltyData ? (
                        <Text className="text-caption text-neutral-500 mt-0.5">
                          {loyaltyPointsAvailable} points available
                          {loyaltyPointsAvailable > 0 &&
                            ` — redeem up to ${formatCurrency(loyaltyDiscountAmount)}`}
                        </Text>
                      ) : (
                        <Text className="text-caption text-error-500 mt-0.5">
                          Could not load loyalty data
                        </Text>
                      )}
                    </View>
                  </View>
                  {loyaltyData && loyaltyPointsAvailable > 0 && (
                    <Switch
                      value={useLoyalty}
                      onValueChange={setUseLoyalty}
                      trackColor={{ false: "#D1D5DB", true: "#B8860B" }}
                      thumbColor={useLoyalty ? "#FFFFFF" : "#F9FAFB"}
                    />
                  )}
                </View>
                {useLoyalty && loyaltyPointsAvailable > 0 && (
                  <View className="border-t border-neutral-200 pt-2 mt-1">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-caption text-neutral-500">
                        Points redeemed
                      </Text>
                      <Text className="text-caption font-medium text-neutral-700">
                        {actualRedeemablePoints}
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <Text className="text-caption text-neutral-500">
                        Discount
                      </Text>
                      <Text className="text-caption font-bold text-secondary-600">
                        -{formatCurrency(loyaltyDiscountAmount)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Promo Code */}
              <Text className="text-body font-bold text-neutral-900 mb-3 mt-5">
                Promo Code
              </Text>
              <View className="flex-row">
                <TextInput
                  value={promoCode}
                  onChangeText={(t) => {
                    setPromoCode(t.toUpperCase());
                    setPromoError("");
                  }}
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
                    if (!promoCode.trim()) {
                      setPromoError("Enter a promo code");
                      return;
                    }
                    setPromoLoading(true);
                    setPromoError("");
                    try {
                      const { data } = await api.post("/promo-codes/validate", {
                        code: promoCode.trim(),
                        subtotal,
                      });
                      if (data.valid) {
                        setPromoApplied(true);
                      } else {
                        setPromoError(data.error || "Invalid or expired code");
                      }
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
              {promoError ? (
                <Text className="text-micro text-red-500 mt-1.5">
                  {promoError}
                </Text>
              ) : null}
              {promoApplied ? (
                <Text className="text-micro text-green-600 mt-1.5">
                  Promo code applied!
                </Text>
              ) : null}
            </Animated.View>
          )}

          {/* ==================== STEP 2 — Review ==================== */}
          {step === 2 && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text className="text-body font-bold text-neutral-900 mb-3">
                Order Summary
              </Text>
              <View className="bg-neutral-50 rounded-xl p-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">
                    Subtotal
                  </Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">
                    GST ({storeConfig.gstRatePercent}%)
                  </Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {formatCurrency(gstAmount)}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-caption text-neutral-500">
                    Delivery
                  </Text>
                  {loadingDeliveryFee ? (
                    <ActivityIndicator size="small" color="#050505" />
                  ) : (
                    <Text
                      className={`text-caption font-medium ${
                        displayDeliveryFee === 0
                          ? "text-secondary-600"
                          : "text-neutral-700"
                      }`}
                    >
                      {displayDeliveryFee === 0
                        ? "FREE"
                        : formatCurrency(displayDeliveryFee)}
                    </Text>
                  )}
                </View>
                {useLoyalty && loyaltyDiscountAmount > 0 && (
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-caption text-neutral-500">
                      Loyalty discount
                    </Text>
                    <Text className="text-caption font-bold text-secondary-600">
                      -{formatCurrency(loyaltyDiscountAmount)}
                    </Text>
                  </View>
                )}
                <View className="border-t border-neutral-200 pt-2.5 flex-row justify-between">
                  <Text className="text-body font-bold text-neutral-900">
                    Total
                  </Text>
                  <Text className="text-body font-bold text-neutral-900">
                    {formatCurrency(finalTotal)}
                  </Text>
                </View>
              </View>

              {/* Order Details */}
              <View className="mt-4 bg-neutral-50 rounded-xl p-4">
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">
                    Address
                  </Text>
                  <Text className="text-caption font-medium text-neutral-700 text-right flex-1 ml-4">
                    {addresses[selectedAddress]?.label}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-1.5">
                  <Text className="text-caption text-neutral-500">
                    Delivery
                  </Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {selectedSlot >= 0 && deliverySlots[selectedSlot]
                      ? deliverySlots[selectedSlot].label
                      : "ASAP (as soon as possible)"}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-caption text-neutral-500">
                    Payment
                  </Text>
                  <Text className="text-caption font-medium text-neutral-700">
                    {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label}
                  </Text>
                </View>
              </View>

              {useLoyalty && loyaltyDiscountAmount > 0 && (
                <View className="mt-3 bg-secondary-50 rounded-xl p-3">
                  <Text className="text-caption font-medium text-secondary-700">
                    🎉 You're saving {formatCurrency(loyaltyDiscountAmount)} with
                    loyalty points!
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </ScrollView>

        {/* Error display */}
        {error ? (
          <View className="mx-6 mb-2 bg-error-50 rounded-xl p-3">
            <Text className="text-caption font-medium text-error-700">
              {error}
            </Text>
          </View>
        ) : null}

        {/* Bottom Action */}
        <View className="px-6 py-4 pb-8 border-t border-neutral-100">
          <Button
            onPress={
              step < 2
                ? () => {
                    setError("");
                    setStep(step + 1);
                  }
                : handlePlaceOrder
            }
            disabled={isPlacing || !canProceed()}
            loading={isPlacing}
            fullWidth
            size="lg"
          >
            {step < 2
              ? "Continue"
              : `Place Order — ${formatCurrency(finalTotal)}`}
          </Button>
        </View>
      </View>
    </>
  );
}
