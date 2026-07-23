"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Fingerprint, ScanFace } from "lucide-react";
import { springs, tapScale } from "@/lib/motion";
import {
  canUseBiometric,
  getBiometricType,
  authenticateWithBiometric,
  getSecureCredentials,
  type BiometricType,
} from "@/lib/native-biometric";
import { haptic } from "@/lib/haptics";

const CREDENTIAL_SERVER = "revathy-supermarket-auth";

/**
 * BiometricLoginButton — Face ID / Fingerprint sign-in for returning users.
 *
 * Shown only when:
 * 1. Running in native Capacitor shell
 * 2. Device has biometric hardware available
 * 3. User has previously stored credentials via biometric enrollment
 *
 * Flow:
 * 1. User taps "Sign in with Face ID/Fingerprint"
 * 2. Native biometric dialog appears (Face ID, Touch ID, etc.)
 * 3. If verified: retrieve stored session token from keychain
 * 4. Auto-sign-in via NextAuth credential provider
 *
 * This eliminates the need for OTP or Google OAuth on every login for
 * returning native app users — matching the Apple/banking app experience.
 */
export function BiometricLoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [available, setAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>("none");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check biometric availability on mount
  useEffect(() => {
    (async () => {
      const isAvailable = await canUseBiometric();
      if (!isAvailable) return;

      // Also check if we have stored credentials
      const creds = await getSecureCredentials(CREDENTIAL_SERVER);
      if (!creds) return; // No stored credentials — don't show button

      const type = await getBiometricType();
      setBiometricType(type);
      setAvailable(true);
    })();
  }, []);

  const handleBiometricLogin = useCallback(async () => {
    setLoading(true);
    setError("");
    haptic("medium");

    try {
      // Step 1: Verify biometric
      const reason = biometricType === "face"
        ? "Verify your face to sign in"
        : "Use your fingerprint to sign in";

      const verified = await authenticateWithBiometric(reason);
      if (!verified) {
        setError("Verification failed. Try again or use Google sign-in.");
        setLoading(false);
        return;
      }

      // Step 2: Retrieve stored credentials
      const creds = await getSecureCredentials(CREDENTIAL_SERVER);
      if (!creds) {
        setError("Saved credentials not found. Please sign in with Google.");
        setLoading(false);
        return;
      }

      // Step 3: Sign in with stored token via NextAuth
      const result = await signIn("credentials", {
        redirect: false,
        token: creds.password, // We store the session token as "password"
        type: "biometric",
      });

      if (result?.ok) {
        haptic("light");
        window.location.href = callbackUrl;
      } else {
        setError("Session expired. Please sign in with Google to re-enable biometric.");
      }
    } catch {
      setError("Something went wrong. Please try Google sign-in.");
    } finally {
      setLoading(false);
    }
  }, [biometricType, callbackUrl]);

  // Don't render if biometric not available or no stored credentials
  if (!available) return null;

  const icon = biometricType === "face"
    ? <ScanFace className="h-5 w-5" />
    : <Fingerprint className="h-5 w-5" />;

  const label = biometricType === "face"
    ? "Sign in with Face ID"
    : "Sign in with Fingerprint";

  return (
    <div className="w-full">
      <motion.button
        type="button"
        onClick={handleBiometricLogin}
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={tapScale.primary}
        transition={springs.snappy}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-neutral-900 dark:bg-white text-base font-semibold text-white dark:text-neutral-900 shadow-lg transition-all disabled:opacity-60"
      >
        {loading ? (
          <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          icon
        )}
        {loading ? "Verifying..." : label}
      </motion.button>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center text-xs text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ─── Enrollment Utility ───────────────────────────────────────────────────────
// Called after successful sign-in to offer biometric enrollment

export { CREDENTIAL_SERVER };
