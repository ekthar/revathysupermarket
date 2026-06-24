/**
 * Firebase Admin SDK integration for sending FCM push notifications.
 *
 * Dispatches high-priority data messages to registered device tokens.
 * Requires FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_KEY env vars.
 */

import { prisma } from "@/lib/prisma";

interface FcmPayload {
  eventId: string;
  orderId: string;
  orderNumber: string;
  deepLink?: string;
  type: string;
}

/**
 * Sends an FCM data message to all registered devices for a given user.
 * Returns true if at least one message was sent successfully.
 *
 * Falls back gracefully when Firebase credentials are not configured
 * (development environments).
 */
export async function sendFcmToUser(userId: string, payload: FcmPayload): Promise<boolean> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!projectId || !serviceAccountKey) {
    console.warn("[FCM] Firebase credentials not configured. Skipping push dispatch.");
    return false;
  }

  // Get all device tokens for the user
  const devices = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true, id: true },
  });

  if (devices.length === 0) {
    console.warn(`[FCM] No registered devices for user ${userId}`);
    return false;
  }

  let serviceAccount: { client_email: string; private_key: string };
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    console.error("[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY");
    return false;
  }

  // Get OAuth2 access token using service account
  const accessToken = await getFirebaseAccessToken(serviceAccount);
  if (!accessToken) return false;

  let anySuccess = false;
  const staleTokenIds: string[] = [];

  for (const device of devices) {
    const success = await sendToDevice(projectId, accessToken, device.token, payload);
    if (success) {
      anySuccess = true;
    } else {
      // Mark potentially stale tokens for cleanup
      staleTokenIds.push(device.id);
    }
  }

  // Clean up stale device tokens that returned errors
  if (staleTokenIds.length > 0) {
    await prisma.deviceToken.deleteMany({
      where: { id: { in: staleTokenIds } },
    }).catch(() => null);
  }

  return anySuccess;
}

/**
 * Sends a single FCM message to a device token using the HTTP v1 API.
 */
async function sendToDevice(
  projectId: string,
  accessToken: string,
  deviceToken: string,
  payload: FcmPayload
): Promise<boolean> {
  try {
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: deviceToken,
          data: {
            type: payload.type,
            eventId: payload.eventId,
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            deepLink: payload.deepLink || `msmsupermarket://delivery/order/${payload.orderId}`,
          },
          android: {
            priority: "high",
          },
          apns: {
            headers: {
              "apns-priority": "10",
            },
            payload: {
              aps: {
                "content-available": 1,
                "interruption-level": "time-sensitive",
              },
            },
          },
        },
      }),
    });

    if (response.ok) return true;

    const errorBody = await response.text().catch(() => "");
    // 404 or UNREGISTERED means the token is stale
    if (response.status === 404 || errorBody.includes("UNREGISTERED")) {
      return false;
    }

    console.error(`[FCM] Send failed (${response.status}): ${errorBody}`);
    return false;
  } catch (e) {
    console.error("[FCM] Network error sending to device:", e);
    return false;
  }
}

// Module-level cache for the Google OAuth access token (valid for ~1 hour).
// Reused across warm invocations to avoid redundant JWT-bearer exchanges.
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Gets a short-lived OAuth2 access token from Google using the service account.
 * Uses the JWT Bearer flow for server-to-server auth.
 * Caches the token in-memory and reuses it until 60 seconds before expiry.
 */
async function getFirebaseAccessToken(
  serviceAccount: { client_email: string; private_key: string }
): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Return cached token if still valid (with 60s safety margin)
    if (cachedAccessToken && now < cachedAccessToken.expiresAt - 60) {
      return cachedAccessToken.token;
    }

    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })).toString("base64url");

    const crypto = await import("crypto");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${payload}`);
    const signature = sign.sign(serviceAccount.private_key, "base64url");

    const jwt = `${header}.${payload}.${signature}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });

    if (!response.ok) {
      console.error("[FCM] OAuth token request failed:", response.status);
      return null;
    }

    const data = await response.json() as { access_token?: string; expires_in?: number };
    const accessToken = data.access_token || null;

    if (accessToken) {
      const expiresIn = data.expires_in ?? 3600;
      cachedAccessToken = { token: accessToken, expiresAt: now + expiresIn };
    }

    return accessToken;
  } catch (e) {
    console.error("[FCM] Failed to get access token:", e);
    return null;
  }
}
