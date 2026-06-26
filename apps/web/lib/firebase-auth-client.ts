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
    if (!recaptchaVerifier) {
      initRecaptcha();
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
    const provider = new GoogleAuthProvider();
    provider.addScope("email");
    provider.addScope("profile");
    const result = await signInWithPopup(firebaseAuth, provider);
    const idToken = await result.user.getIdToken();
    return { ok: true, idToken };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Google sign-in failed";
    return { ok: false, error: message };
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
