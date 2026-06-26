import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";

let _adminApp: App | null = null;

function getFirebaseAdminApp(): App | null {
  if (_adminApp) return _adminApp;
  if (getApps().length > 0) {
    _adminApp = getApps()[0];
    return _adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    // Gracefully skip during build or when not configured
    return null;
  }

  let serviceAccount: object;
  try {
    serviceAccount = JSON.parse(serviceAccountKey);
  } catch {
    console.error("[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON");
    return null;
  }

  _adminApp = initializeApp({
    credential: cert(serviceAccount as Parameters<typeof cert>[0]),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });

  return _adminApp;
}

/**
 * Lazily get Firebase Admin Auth instance.
 * Returns null if Firebase is not configured.
 */
export function getAdminAuth() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getAuth(app);
}

/**
 * Lazily get Firebase Admin Messaging instance.
 * Returns null if Firebase is not configured.
 */
export function getAdminMessaging() {
  const app = getFirebaseAdminApp();
  if (!app) return null;
  return getMessaging(app);
}

// Legacy exports using Proxy for backward compatibility
// These only throw when actually accessed at runtime (not during build)
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    const auth = getAdminAuth();
    if (!auth) throw new Error("Firebase Admin Auth not configured - set FIREBASE_SERVICE_ACCOUNT_KEY");
    return (auth as Record<string, unknown>)[prop as string];
  }
});

export const adminMessaging = new Proxy({} as ReturnType<typeof getMessaging>, {
  get(_, prop) {
    const messaging = getAdminMessaging();
    if (!messaging) throw new Error("Firebase Admin Messaging not configured - set FIREBASE_SERVICE_ACCOUNT_KEY");
    return (messaging as Record<string, unknown>)[prop as string];
  }
});

export default getFirebaseAdminApp;
