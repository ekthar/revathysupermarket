/**
 * Native Biometric — Face ID / Fingerprint authentication via Capacitor.
 *
 * Provides biometric login on native apps:
 * - iOS: Face ID or Touch ID
 * - Android: Fingerprint, Face Unlock, or Iris
 *
 * Falls back gracefully on web (always returns unavailable).
 *
 * Usage:
 *   import { canUseBiometric, authenticateWithBiometric } from "@/lib/native-biometric";
 *
 *   if (await canUseBiometric()) {
 *     const success = await authenticateWithBiometric("Log in to Revathy Supermarket");
 *     if (success) { ... }
 *   }
 */

import { isNative } from "@/lib/native-bridge";

export type BiometricType = "face" | "fingerprint" | "iris" | "none";

/**
 * Check if biometric authentication is available on this device.
 */
export async function canUseBiometric(): Promise<boolean> {
  if (!isNative) return false;

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { NativeBiometric } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable === true;
  } catch {
    return false;
  }
}

/**
 * Get the type of biometric available (face, fingerprint, iris).
 */
export async function getBiometricType(): Promise<BiometricType> {
  if (!isNative) return "none";

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { NativeBiometric, BiometryType } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );
    const result = await NativeBiometric.isAvailable();
    if (!result.isAvailable) return "none";

    switch (result.biometryType) {
      case BiometryType.FACE_ID:
      case BiometryType.FACE_AUTHENTICATION:
        return "face";
      case BiometryType.TOUCH_ID:
      case BiometryType.FINGERPRINT:
        return "fingerprint";
      case BiometryType.IRIS_AUTHENTICATION:
        return "iris";
      default:
        return "fingerprint"; // Default to fingerprint for unknown types
    }
  } catch {
    return "none";
  }
}

/**
 * Prompt biometric authentication.
 *
 * Shows the system Face ID / fingerprint dialog.
 * Returns true if authenticated successfully, false otherwise.
 *
 * @param reason - Explanation shown to user (e.g., "Log in to your account")
 */
export async function authenticateWithBiometric(
  reason: string = "Verify your identity"
): Promise<boolean> {
  if (!isNative) return false;

  try {
    // @ts-ignore — only available in Capacitor native shell
    const { NativeBiometric } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );

    await NativeBiometric.verifyIdentity({
      reason,
      title: "Biometric Login",
      subtitle: "Use Face ID or fingerprint to continue",
      description: reason,
      useFallback: true, // Allow PIN/pattern as fallback
      maxAttempts: 3,
    });

    // verifyIdentity() resolves if successful, rejects if failed
    return true;
  } catch {
    return false;
  }
}

/**
 * Store credentials in the native secure keychain/keystore (biometric-protected).
 */
export async function setSecureCredentials(
  server: string,
  username: string,
  password: string
): Promise<void> {
  if (!isNative) return;

  try {
    // @ts-ignore
    const { NativeBiometric } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );
    await NativeBiometric.setCredentials({ server, username, password });
  } catch {}
}

/**
 * Retrieve stored credentials from the native secure keychain/keystore.
 */
export async function getSecureCredentials(
  server: string
): Promise<{ username: string; password: string } | null> {
  if (!isNative) return null;

  try {
    // @ts-ignore
    const { NativeBiometric } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );
    const credentials = await NativeBiometric.getCredentials({ server });
    return credentials;
  } catch {
    return null;
  }
}

/**
 * Delete stored credentials from the native keychain/keystore.
 */
export async function deleteSecureCredentials(server: string): Promise<void> {
  if (!isNative) return;

  try {
    // @ts-ignore
    const { NativeBiometric } = await import(
      /* webpackIgnore: true */ "capacitor-native-biometric"
    );
    await NativeBiometric.deleteCredentials({ server });
  } catch {}
}
