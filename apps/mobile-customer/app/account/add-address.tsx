import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { api } from "@/services/api";
import { addressSchema } from "@msm/shared/schemas";

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
    const result = addressSchema.safeParse({
      label,
      houseName,
      street,
      landmark,
      pincode,
      latitude: 0,
      longitude: 0,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/addresses", {
        label,
        houseName,
        street,
        landmark,
        pincode,
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
      <Stack.Screen options={{ headerShown: true, title: "Add Address" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-white px-5 pt-4">
          {/* Label Selection */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-2">
            Label
          </Text>
          <View className="flex-row mb-5">
            {LABELS.map((l) => (
              <Pressable
                key={l}
                onPress={() => setLabel(l)}
                className={`px-4 py-2 rounded-full mr-2 border ${
                  label === l
                    ? "bg-primary-600 border-primary-600"
                    : "border-slate-200"
                }`}
              >
                <Text
                  className={`text-sm font-sans-medium ${
                    label === l ? "text-white" : "text-slate-600"
                  }`}
                >
                  {l}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* House Name */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            House/Flat/Building Name
          </Text>
          <TextInput
            value={houseName}
            onChangeText={setHouseName}
            placeholder="e.g. Flat 4B, Green Valley Apartments"
            className="h-12 border border-slate-200 rounded-xl px-4 mb-1 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />
          {errors.houseName && (
            <Text className="text-xs text-red-500 mb-3">{errors.houseName}</Text>
          )}
          <View className="mb-4" />

          {/* Street */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Street/Area
          </Text>
          <TextInput
            value={street}
            onChangeText={setStreet}
            placeholder="e.g. MG Road, Ernakulam"
            className="h-12 border border-slate-200 rounded-xl px-4 mb-1 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />
          {errors.street && (
            <Text className="text-xs text-red-500 mb-3">{errors.street}</Text>
          )}
          <View className="mb-4" />

          {/* Landmark */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Landmark (optional)
          </Text>
          <TextInput
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near City Mall"
            className="h-12 border border-slate-200 rounded-xl px-4 mb-4 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />

          {/* Pincode */}
          <Text className="text-sm font-sans-semibold text-slate-700 mb-1">
            Pincode
          </Text>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            placeholder="682001"
            keyboardType="number-pad"
            maxLength={6}
            className="h-12 border border-slate-200 rounded-xl px-4 mb-1 bg-slate-50"
            placeholderTextColor="#94a3b8"
          />
          {errors.pincode && (
            <Text className="text-xs text-red-500 mb-3">{errors.pincode}</Text>
          )}

          {errors.form && (
            <View className="mt-4 bg-red-50 p-3 rounded-xl">
              <Text className="text-sm text-red-600">{errors.form}</Text>
            </View>
          )}

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            className={`h-14 rounded-xl items-center justify-center mt-8 mb-10 ${
              isLoading ? "bg-primary-400" : "bg-primary-600"
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-sans-bold">
                Save Address
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
