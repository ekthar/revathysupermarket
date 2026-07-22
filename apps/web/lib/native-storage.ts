/**
 * Native Secure Storage — encrypted key-value storage via Capacitor Preferences.
 *
 * On native:
 * - iOS: Uses the iOS Keychain (encrypted, persists across reinstalls)
 * - Android: Uses EncryptedSharedPreferences (AES-256, hardware-backed keystore)
 *
 * On web: Falls back to localStorage (not encrypted, but acceptable for dev).
 *
 * Use this for:
 * - Auth tokens (session, refresh)
 * - User preferences that should persist
 * - Sensitive data (NOT passwords — use native-biometric.ts for those)
 *
 * Usage:
 *   import { secureGet, secureSet, secureRemove } from "@/lib/native-storage";
 *
 *   await secureSet("auth-token", token);
 *   const token = await secureGet("auth-token");
 *   await secureRemove("auth-token");
 */

import { isNative } from "@/lib/native-bridge";

/**
 * Store a value securely.
 */
export async function secureSet(key: string, value: string): Promise<void> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Preferences } = await import(/* webpackIgnore: true */ "@capacitor/preferences");
      await Preferences.set({ key, value });
      return;
    } catch {}
  }

  // Fallback: localStorage
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/**
 * Retrieve a securely stored value.
 */
export async function secureGet(key: string): Promise<string | null> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Preferences } = await import(/* webpackIgnore: true */ "@capacitor/preferences");
      const result = await Preferences.get({ key });
      return result.value;
    } catch {}
  }

  // Fallback: localStorage
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Remove a securely stored value.
 */
export async function secureRemove(key: string): Promise<void> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Preferences } = await import(/* webpackIgnore: true */ "@capacitor/preferences");
      await Preferences.remove({ key });
      return;
    } catch {}
  }

  // Fallback: localStorage
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Clear all securely stored data (e.g., on logout).
 */
export async function secureClear(): Promise<void> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Preferences } = await import(/* webpackIgnore: true */ "@capacitor/preferences");
      await Preferences.clear();
      return;
    } catch {}
  }

  // Fallback: don't clear all localStorage (other things may be stored there)
}

/**
 * Get all keys in secure storage.
 */
export async function secureKeys(): Promise<string[]> {
  if (isNative) {
    try {
      // @ts-ignore — only available in Capacitor native shell
      const { Preferences } = await import(/* webpackIgnore: true */ "@capacitor/preferences");
      const result = await Preferences.keys();
      return result.keys;
    } catch {}
  }

  return [];
}
