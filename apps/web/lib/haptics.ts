/**
 * Haptics — unified haptic feedback for native (Capacitor) and web.
 *
 * Uses @capacitor/haptics when running in a native shell for Taptic Engine
 * quality feedback. Falls back to navigator.vibrate() on web.
 *
 * The public API remains the same whether native or web:
 *   import { haptic, hapticSuccess, hapticSelection } from "@/lib/haptics";
 */

import { hapticImpact, hapticNotification, hapticSelection as nativeSelection } from "@/lib/native-bridge";

/**
 * General-purpose haptic feedback.
 * @param type - Intensity level: "light" (tap), "medium" (action), "heavy" (destructive)
 */
export function haptic(type: "light" | "medium" | "heavy" = "light"): void {
  hapticImpact(type);
}

/** Success haptic — order placed, action completed */
export function hapticSuccess(): void {
  hapticNotification("success");
}

/** Warning haptic — low stock, approaching limit */
export function hapticWarning(): void {
  hapticNotification("warning");
}

/** Error haptic — failed action, validation error */
export function hapticError(): void {
  hapticNotification("error");
}

/** Selection haptic — picker tick, scroll snap, tab change */
export function hapticSelection(): void {
  nativeSelection();
}
