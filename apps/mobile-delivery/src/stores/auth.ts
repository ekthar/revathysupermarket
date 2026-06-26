import { create } from "zustand";
import type { User, AuthTokens } from "@msm/shared/types";
import { api, tokenStorage } from "../services/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  initialize: () => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
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
      const { data } = await api.get("/auth/me");
      // Verify this is a delivery partner
      if (data.user.role !== "DELIVERY_PARTNER") {
        await tokenStorage.clearTokens();
        set({ status: "unauthenticated", user: null });
        return;
      }
      set({ user: data.user, status: "authenticated" });
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
    if (user.role !== "DELIVERY_PARTNER") {
      throw new Error("This app is for delivery partners only");
    }
    await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    try { await api.post("/auth/logout"); } catch {}
    await tokenStorage.clearTokens();
    set({ user: null, status: "unauthenticated" });
  },
}));
