/**
 * Cloudflare Turnstile verification for bot/abuse protection.
 * 
 * Triggered on:
 * - Signup when rate limiter remaining < 2
 * - OTP request when rate limiter remaining < 2
 * - Checkout when rate limiter remaining < 2
 * 
 * Set TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY in env.
 * When not configured, verification is skipped (dev-friendly).
 */

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/**
 * Verify a Turnstile token server-side.
 */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // If Turnstile is not configured, pass through
  if (!secretKey) {
    return { success: true };
  }

  if (!token || token.trim().length === 0) {
    return { success: false, errorCodes: ["missing-input-response"] };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (remoteIp) {
      formData.append("remoteip", remoteIp);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      return { success: false, errorCodes: ["verification-request-failed"] };
    }

    const data = await response.json() as {
      success: boolean;
      "error-codes"?: string[];
    };

    return {
      success: data.success,
      errorCodes: data["error-codes"],
    };
  } catch {
    // Network error — fail open in non-production, closed in production
    if (process.env.NODE_ENV === "production") {
      return { success: false, errorCodes: ["network-error"] };
    }
    return { success: true };
  }
}

/**
 * Check if Turnstile verification should be required.
 * Triggered when rate limit remaining is critically low.
 */
export function shouldRequireTurnstile(remaining: number): boolean {
  const configured = Boolean(process.env.TURNSTILE_SECRET_KEY);
  return configured && remaining < 2;
}
