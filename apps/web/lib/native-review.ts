/**
 * Native In-App Review — prompt users to rate the app without leaving.
 *
 * Uses the system's native review dialog:
 * - iOS: StoreKit's SKStoreReviewController
 * - Android: Google Play In-App Review API
 *
 * Apple & Google guidelines:
 * - Don't prompt too frequently (max 3x per year on iOS)
 * - Only prompt after a positive experience (order delivered, Nth order)
 * - Don't condition functionality on the review
 * - The system may choose NOT to show the dialog (rate-limited by OS)
 *
 * Usage:
 *   import { maybeRequestReview } from "@/lib/native-review";
 *   // After successful order delivery:
 *   maybeRequestReview();
 */

import { isNative } from "@/lib/native-bridge";

const REVIEW_STORAGE_KEY = "native-review-state";
const MIN_ORDERS_BEFORE_PROMPT = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60; // Don't ask more than every 60 days
const MAX_PROMPTS_TOTAL = 5;

interface ReviewState {
  orderCount: number;
  lastPromptedAt: number | null;
  totalPrompts: number;
}

function getReviewState(): ReviewState {
  try {
    const saved = localStorage.getItem(REVIEW_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { orderCount: 0, lastPromptedAt: null, totalPrompts: 0 };
}

function saveReviewState(state: ReviewState): void {
  try {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Increment the order count. Call after each successful order delivery.
 */
export function trackOrderForReview(): void {
  const state = getReviewState();
  state.orderCount++;
  saveReviewState(state);
}

/**
 * Check if conditions are met and prompt for review if appropriate.
 *
 * Conditions:
 * 1. Running in native app (not web)
 * 2. User has completed at least N orders
 * 3. Enough time has passed since last prompt (60 days)
 * 4. Haven't exceeded max total prompts
 *
 * Returns true if review dialog was requested (OS may still not show it).
 */
export async function maybeRequestReview(): Promise<boolean> {
  if (!isNative) return false;

  const state = getReviewState();

  // Check conditions
  if (state.orderCount < MIN_ORDERS_BEFORE_PROMPT) return false;
  if (state.totalPrompts >= MAX_PROMPTS_TOTAL) return false;

  if (state.lastPromptedAt) {
    const daysSinceLastPrompt =
      (Date.now() - state.lastPromptedAt) / (1000 * 60 * 60 * 24);
    if (daysSinceLastPrompt < MIN_DAYS_BETWEEN_PROMPTS) return false;
  }

  // All conditions met — request review
  const shown = await requestNativeReview();

  if (shown) {
    state.lastPromptedAt = Date.now();
    state.totalPrompts++;
    saveReviewState(state);
  }

  return shown;
}

/**
 * Directly request the native review dialog.
 * The OS may choose not to show it (rate-limited).
 */
async function requestNativeReview(): Promise<boolean> {
  try {
    // @ts-ignore — only available in Capacitor native shell
    const { RateApp } = await import(/* webpackIgnore: true */ "capacitor-rate-app");
    await RateApp.requestReview();
    return true;
  } catch {
    // Plugin not available — try the @capacitor-community alternative
    try {
      // @ts-ignore
      const { InAppReview } = await import(
        /* webpackIgnore: true */ "@capacitor-community/in-app-review"
      );
      await InAppReview.requestReview();
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Reset review state (for testing purposes).
 */
export function resetReviewState(): void {
  try {
    localStorage.removeItem(REVIEW_STORAGE_KEY);
  } catch {}
}
