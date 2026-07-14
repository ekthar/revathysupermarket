import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { api } from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";
import { validateAddressForm } from "@msm/shared/utils/address-payment-validations";

const LABELS = ["Home", "Work", "Other"];

export default function EditAddressScreen() {
  const params = useLocalSearchParams<{
    id: string;
    label: string;
    houseName: string;
    street: string;
    landmark: string;
    pincode: string;
  }>();

  const [label, setLabel] = useState(params.label || "Home");
  const [houseName, setHouseName] = useState(params.houseName || "");
  const [street, setStreet] = useState(params.street || "");
  const [landmark, setLandmark] = useState(params.landmark || "");
  const [pincode, setPincode] = useState(params.pincode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setErrors({});

    // Validate using shared utility
    const validation = validateAddressForm({
      houseName: houseName.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      pincode: pincode.trim(),
    });

    if (!validation.valid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`/addresses/${params.id}`, {
        label,
        houseName: houseName.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
      });
      showToast("Address updated successfully.", "success");
      router.back();
    } catch (e: any) {
      setErrors({ form: e.response?.data?.error || "Failed to update address" });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Edit Address", headerTintColor: "#050505" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-white px-4 pt-4" keyboardShouldPersistTaps="handled">
          {/* Label Selection */}
          <Text className="text-body font-bold text-neutral-700 mb-2">Label</Text>
          <View className="flex-row mb-6">
            {LABELS.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLabel(l)}
                className={`px-4 py-2.5 rounded-full mr-2 border ${
                  label === l
                    ? "bg-primary-900 border-primary-900"
                    : "border-neutral-200"
                }`}
              >
                <Text
                  className={`text-caption font-bold ${
                    label === l ? "text-white" : "text-neutral-600"
                  }`}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="House/Flat/Building Name"
            value={houseName}
            onChangeText={setHouseName}
            placeholder="e.g. Flat 4B, Green Valley Apartments"
            error={errors.houseName}
            className="mb-4"
          />

          <Input
            label="Street/Area"
            value={street}
            onChangeText={setStreet}
            placeholder="e.g. MG Road, Ernakulam"
            error={errors.street}
            className="mb-4"
          />

          <Input
            label="Landmark"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near City Mall"
            error={errors.landmark}
            className="mb-4"
          />

          <Input
            label="Pincode"
            value={pincode}
            onChangeText={setPincode}
            placeholder="682001"
            keyboardType="number-pad"
            maxLength={6}
            error={errors.pincode}
            className="mb-4"
          />

          {errors.form && (
            <View className="bg-error-50 p-3 rounded-xl mb-4">
              <Text className="text-caption text-error-700">{errors.form}</Text>
            </View>
          )}

          <View className="mt-4 mb-10">
            <Button onPress={handleSave} loading={isLoading} fullWidth size="lg">
              Update Address
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
