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
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; email: string; password: string }) => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; email?: string }) => Promise<void>;
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
        api.get("/mobile/v1/auth/me"),
        STARTUP_AUTH_TIMEOUT_MS
      );
      set({ user: data.user, status: "authenticated" });
    } catch {
      // Token invalid or expired
      await tokenStorage.clearTokens();
      set({ status: "unauthenticated", user: null });
    }
  },

  loginWithEmail: async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };

    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
  },

  register: async (registerData) => {
    // Create account
    const { data: regData } = await api.post("/register", registerData);

    // Auto-login after registration
    const { data } = await api.post("/auth/login", {
      email: registerData.email,
      password: registerData.password,
    });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };

    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
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
    const { data } = await api.post("/mobile/v1/auth/google", { idToken });
    const { user, tokens } = data as { user: User; tokens: AuthTokens };

    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
  },

  forgotPassword: async (email: string) => {
    await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, password: string) => {
    await api.post("/auth/reset-password", { token, password });
  },

  updateProfile: async (profileData) => {
    const { data } = await api.patch("/account/profile", profileData);
    if (data.user) {
      set({ user: data.user });
    }
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
