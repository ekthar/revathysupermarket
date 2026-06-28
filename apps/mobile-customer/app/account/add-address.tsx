import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { api } from "@/services/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const LABELS = ["Home", "Work", "Other"];

export default function AddAddressScreen() {
  const [label, setLabel] = useState("Home");
  const [houseName, setHouseName] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async () => {
    setErrors({});
    const fieldErrors: Record<string, string> = {};
    if (!houseName.trim()) fieldErrors.houseName = "Required";
    if (!street.trim()) fieldErrors.street = "Required";
    if (!pincode.trim() || pincode.length < 6) fieldErrors.pincode = "Enter valid 6-digit pincode";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/addresses", {
        label,
        houseName: houseName.trim(),
        street: street.trim(),
        landmark: landmark.trim(),
        pincode: pincode.trim(),
        latitude: 8.644361,
        longitude: 76.843472,
      });
      router.back();
    } catch (e: any) {
      setErrors({ form: e.response?.data?.error || "Failed to save address" });
    }
    setIsLoading(false);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Add Address", headerTintColor: "#050505" }} />
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
            label="Landmark (optional)"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near City Mall"
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
              Save Address
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
