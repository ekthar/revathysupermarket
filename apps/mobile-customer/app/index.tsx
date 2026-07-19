import { useCallback, useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/auth";
import { OnboardingScreen, hasSeenOnboarding } from "@/components/onboarding/OnboardingScreen";

export default function Index() {
  const { status } = useAuthStore();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    hasSeenOnboarding().then((seen) => {
      if (!seen) {
        setShowOnboarding(true);
      }
      setCheckingOnboarding(false);
    });
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  // Show loading while checking onboarding + auth state
  if (checkingOnboarding || status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#059669" size="large" />
      </View>
    );
  }

  // Show beautiful onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // After onboarding: go to home (guest or authenticated)
  return (
    <Redirect
      href={status === "authenticated" ? "/(tabs)/home" : "/(tabs)/home"}
    />
  );
}
