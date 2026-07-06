import { create } from "zustand";
import type { User, AuthTokens } from "@msm/shared/types";
import { api, tokenStorage } from "../services/api";
import { fcmService } from "../services/fcm";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const STARTUP_AUTH_TIMEOUT_MS = 5000;

/** All roles allowed to use this app */
const STAFF_ROLES = [
  "ADMIN",
  "OWNER",
  "MANAGER",
  "STAFF",
  "PACKING_STAFF",
  "DELIVERY_PARTNER",
];

/** Map user role to the device token role for push targeting */
export function getDeviceTokenRole(userRole?: string): "admin" | "staff" {
  if (!userRole) return "staff";
  if (["ADMIN", "OWNER", "MANAGER"].includes(userRole)) return "admin";
  return "staff";
}

/** Get the route group for role-based navigation */
export function getRoleGroup(role: string): string {
  switch (role) {
    case "DELIVERY_PARTNER":
      return "(delivery)";
    case "PACKING_STAFF":
      return "(packing)";
    case "ADMIN":
    case "OWNER":
    case "MANAGER":
    case "STAFF":
    default:
      return "(admin)";
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Startup auth timed out")), ms)
    ),
  ]);
}

interface AuthState {
  user: User | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "loading",

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ status: "unauthenticated", user: null });
        return;
      }
      const { data } = await withTimeout(
        api.get("/auth/me"),
        STARTUP_AUTH_TIMEOUT_MS
      );
      // Verify this is a staff user (not a customer)
      if (!STAFF_ROLES.includes(data.user.role)) {
        await tokenStorage.clearTokens();
        set({ status: "unauthenticated", user: null });
        return;
      }
      set({ user: data.user, status: "authenticated" });

      // Register FCM token in background
      fcmService.registerToken(data.user.role).catch(() => null);
    } catch {
      await tokenStorage.clearTokens();
      set({ status: "unauthenticated", user: null });
    }
  },

  loginWithPhone: async (phone: string) => {
    await api.post("/auth/otp/send", { phone });
  },

  verifyOtp: async (phone: string, otp: string) => {
    const { data } = await api.post("/auth/login", { phone, otp });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };
    if (!STAFF_ROLES.includes(user.role)) {
      throw new Error("This app is for staff only. Customers should use the customer app.");
    }
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });

    // Register FCM token after successful login
    fcmService.registerToken(user.role).catch(() => null);
  },

  loginWithEmail: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };
    if (!STAFF_ROLES.includes(user.role)) {
      throw new Error("This app is for staff only.");
    }
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });

    // Register FCM token after successful login
    fcmService.registerToken(user.role).catch(() => null);
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await tokenStorage.clearTokens();
    set({ user: null, status: "unauthenticated" });
  },
}));
