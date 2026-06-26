import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Warn during development if Firebase env vars are missing
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0 && typeof window !== "undefined") {
  console.warn(
    `[Firebase] Missing environment variables for: ${missingKeys.join(", ")}.\n` +
    "Google sign-in and other Firebase features will not work.\n" +
    "Create a .env.local file with your NEXT_PUBLIC_FIREBASE_* values."
  );
}

// Initialize Firebase only if minimum required config is present
let app: ReturnType<typeof initializeApp> | null = null;
let firebaseAuth: Auth | null = null;

if (firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  firebaseAuth = getAuth(app);
} else if (typeof window !== "undefined") {
  console.error(
    "[Firebase] Cannot initialize — apiKey, authDomain, or projectId is missing.\n" +
    "Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, and NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local"
  );
}

export { firebaseAuth };

// Messaging (only available in browser with service worker support)
export async function getFirebaseMessaging() {
  if (typeof window === "undefined" || !app) return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
}

export default app;
