"use client";

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

/**
 * Initialize invisible reCAPTCHA for phone auth.
 * Must be called once before sendOtp, typically on component mount.
 * The containerId should be a hidden div in the DOM.
 */
export function initRecaptcha(containerId = "recaptcha-container") {
  if (recaptchaVerifier) return;
  if (!firebaseAuth) {
    console.warn("[Firebase] Cannot init reCAPTCHA — Firebase Auth not configured.");
    return;
  }
  recaptchaVerifier = new RecaptchaVerifier(firebaseAuth, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved - allow signInWithPhoneNumber
    },
  });
}

/**
 * Send OTP via Firebase Phone Auth (uses Firebase free tier - 10K SMS/month free)
 */
export async function sendFirebaseOtp(phoneNumber: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!firebaseAuth) {
      return { ok: false, error: "Firebase is not configured. Please contact support." };
    }
    if (!recaptchaVerifier) {
      initRecaptcha();
    }
    if (!recaptchaVerifier) {
      return { ok: false, error: "Could not initialize verification. Please refresh and try again." };
    }
    // Format: +91XXXXXXXXXX
    const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber : `+91${phoneNumber}`;
    confirmationResult = await signInWithPhoneNumber(firebaseAuth, formattedPhone, recaptchaVerifier!);
    return { ok: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send OTP";
    // Reset recaptcha on error
    recaptchaVerifier = null;
    return { ok: false, error: message };
  }
}

/**
 * Verify OTP and get Firebase ID token for NextAuth sign-in
 */
export async function verifyFirebaseOtp(otp: string): Promise<{ ok: boolean; idToken?: string; error?: string }> {
  if (!confirmationResult) {
    return { ok: false, error: "No OTP request found. Please request a new code." };
  }
  try {
    const credential = await confirmationResult.confirm(otp);
    const idToken = await credential.user.getIdToken();
    return { ok: true, idToken };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Invalid OTP code";
    return { ok: false, error: message };
  }
}

/**
 * Sign in with Google via Firebase popup and get ID token
 */
export async function signInWithGoogleFirebase(): Promise<{ ok: boolean; idToken?: string; error?: string }> {
  try {
    // Validate Firebase is properly configured before attempting sign-in
    if (!firebaseAuth || !firebaseAuth.app?.options?.apiKey) {
      console.error("[Google Sign-In] Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* environment variables.");
      return {
        ok: false,
        error: "Google sign-in is not configured. Please contact support.",
      };
    }

    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");

    console.log("[Google Sign-In] Opening popup...");
    const result = await signInWithPopup(firebaseAuth, provider);
    console.log("[Google Sign-In] Popup completed, getting ID token...");

    const idToken = await result.user.getIdToken();
    console.log("[Google Sign-In] ID token obtained successfully.");
    return { ok: true, idToken };
  } catch (error: unknown) {
    // Firebase auth errors have a 'code' property with specific error types
    const firebaseError = error as { code?: string; message?: string };
    const code = firebaseError.code ?? "";
    const rawMessage = firebaseError.message ?? "Google sign-in failed";

    console.error("[Google Sign-In] Error:", code, rawMessage);

    // Map Firebase error codes to user-friendly messages
    let userMessage: string;
    switch (code) {
      case "auth/popup-closed-by-user":
        userMessage = "Sign-in cancelled. Try again when ready.";
        break;
      case "auth/popup-blocked":
        userMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site.";
        break;
      case "auth/cancelled-popup-request":
        userMessage = "Another sign-in is already in progress.";
        break;
      case "auth/network-request-failed":
        userMessage = "Network error. Please check your internet connection.";
        break;
      case "auth/invalid-api-key":
        userMessage = "Google sign-in is misconfigured. Please contact support.";
        break;
      case "auth/unauthorized-domain":
        userMessage = "This domain is not authorized for Google sign-in. Please contact support.";
        break;
      case "auth/operation-not-allowed":
        userMessage = "Google sign-in is not enabled. Please contact support.";
        break;
      default:
        userMessage = rawMessage.includes("Firebase")
          ? "Google sign-in failed. Please try again."
          : rawMessage;
    }

    return { ok: false, error: userMessage };
  }
}

/**
 * Clean up recaptcha verifier (call on unmount)
 */
export function cleanupRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
