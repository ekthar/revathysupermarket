import { create } from "zustand";
import type { User, AuthTokens } from "@msm/shared/types";
import { api, tokenStorage } from "../services/api";

// ============================================
// Auth State
// ============================================

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const STARTUP_AUTH_TIMEOUT_MS = 5000;

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

  // Actions
  initialize: () => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",

  initialize: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ status: "unauthenticated", user: null });
        return;
      }

      // Validate token by fetching profile
      const { data } = await withTimeout(
        api.get("/auth/me"),
        STARTUP_AUTH_TIMEOUT_MS
      );
      set({ user: data.user, status: "authenticated" });
    } catch {
      // Token invalid or expired
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

    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
  },

  loginWithGoogle: async (idToken: string) => {
    const { data } = await api.post("/auth/google", { idToken });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };

    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors during logout
    }
    await tokenStorage.clearTokens();
    set({ user: null, status: "unauthenticated" });
  },

  setUser: (user: User) => set({ user }),
}));
