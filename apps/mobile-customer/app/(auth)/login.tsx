import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { ShoppingBag, Mail, Lock, Phone, ArrowRight, User } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { useGoogleAuth } from "@/services/google-auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { showToast } from "@/components/ui/Toast";

type Mode = "login" | "register" | "phone";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [name, setName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Phone login
  const [phone, setPhoneNumber] = useState("");

  const { loginWithEmail, register, loginWithPhone } = useAuthStore();
  const { signIn: googleSignIn, isLoading: googleLoading } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginWithEmail(email.trim(), password);
      showToast("Welcome back!", 'success');
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Please fill all required fields");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      showToast("Account created successfully!", 'success');
      router.replace("/(tabs)/home");
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginWithPhone(cleanPhone);
      router.push({ pathname: "/(auth)/otp", params: { phone: cleanPhone } });
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn();
    } catch {
      Alert.alert("Sign-in failed", "Could not sign in with Google");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero section */}
        <Animated.View
          entering={FadeInDown.duration(600)}
          className="bg-primary-900 px-6 pt-20 pb-10 rounded-b-3xl"
        >
          <View className="flex-row items-center mb-6">
            <View className="h-14 w-14 rounded-2xl bg-white items-center justify-center">
              <ShoppingBag size={28} color="#050505" />
            </View>
          </View>
          <Text className="text-micro font-black uppercase tracking-widest text-secondary-400">
            MSM Supermarket
          </Text>
          <Text className="text-display text-white mt-2">
            Fresh groceries,{"\n"}made easy.
          </Text>
          <Text className="text-body text-white/70 mt-3">
            Create your account, track orders, and checkout faster.
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          className="px-6 pt-8 pb-10"
        >
          {/* Mode Tabs */}
          <View className="flex-row bg-neutral-100 rounded-xl p-1 mb-6">
            {(["login", "register", "phone"] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setError(""); }}
                className={`flex-1 h-10 rounded-lg items-center justify-center ${
                  mode === m ? "bg-white shadow-sm" : ""
                }`}
              >
                <Text
                  className={`text-caption font-bold ${
                    mode === m ? "text-primary-900" : "text-neutral-400"
                  }`}
                >
                  {m === "login" ? "Login" : m === "register" ? "Sign Up" : "Phone"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Login Form */}
          {mode === "login" && (
            <View>
              <Input
                label="Email"
                placeholder="your@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                icon={<Mail size={16} color="#9CA3AF" />}
              />
              <View className="mt-4">
                <Input
                  label="Password"
                  placeholder="Enter password"
                  secureTextEntry
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                  icon={<Lock size={16} color="#9CA3AF" />}
                />
              </View>

              {error ? (
                <View className="mt-4 bg-error-50 rounded-xl p-3">
                  <Text className="text-caption text-error-700 font-medium">{error}</Text>
                </View>
              ) : null}

              <View className="mt-6">
                <Button onPress={handleLogin} loading={loading} fullWidth size="lg">
                  Login
                </Button>
              </View>

              <Pressable
                onPress={() => router.push("/(auth)/forgot-password")}
                className="mt-4 items-center"
              >
                <Text className="text-caption font-semibold text-neutral-500">
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <View>
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChangeText={setName}
                icon={<User size={16} color="#9CA3AF" />}
              />
              <View className="mt-4">
                <Input
                  label="Phone Number"
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  value={regPhone}
                  onChangeText={setRegPhone}
                  icon={<Phone size={16} color="#9CA3AF" />}
                />
              </View>
              <View className="mt-4">
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  icon={<Mail size={16} color="#9CA3AF" />}
                />
              </View>
              <View className="mt-4">
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  autoComplete="new-password"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  icon={<Lock size={16} color="#9CA3AF" />}
                />
              </View>

              {error ? (
                <View className="mt-4 bg-error-50 rounded-xl p-3">
                  <Text className="text-caption text-error-700 font-medium">{error}</Text>
                </View>
              ) : null}

              <View className="mt-6">
                <Button onPress={handleRegister} loading={loading} fullWidth size="lg">
                  Create Account
                </Button>
              </View>
            </View>
          )}

          {/* Phone Login */}
          {mode === "phone" && (
            <View>
              <Text className="text-heading font-bold text-neutral-900 mb-2">
                Login with phone
              </Text>
              <Text className="text-body text-neutral-500 mb-6">
                We'll send a 6-digit OTP to verify your number
              </Text>

              <Input
                label="Phone Number"
                placeholder="98765 43210"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={phone}
                onChangeText={setPhoneNumber}
                icon={<Phone size={16} color="#9CA3AF" />}
              />

              {error ? (
                <View className="mt-4 bg-error-50 rounded-xl p-3">
                  <Text className="text-caption text-error-700 font-medium">{error}</Text>
                </View>
              ) : null}

              <View className="mt-6">
                <Button onPress={handlePhoneLogin} loading={loading} fullWidth size="lg">
                  Send OTP
                </Button>
              </View>
            </View>
          )}

          {/* Divider */}
          <View className="flex-row items-center my-6">
            <View className="flex-1 h-px bg-neutral-200" />
            <Text className="mx-4 text-micro font-bold text-neutral-400 uppercase">
              or continue with
            </Text>
            <View className="flex-1 h-px bg-neutral-200" />
          </View>

          {/* Google Sign In */}
          <Button
            variant="outline"
            onPress={handleGoogleSignIn}
            loading={googleLoading}
            fullWidth
            size="lg"
            icon={<Text className="text-lg mr-1">G</Text>}
          >
            Google
          </Button>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
