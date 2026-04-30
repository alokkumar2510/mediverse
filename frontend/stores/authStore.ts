/**
 * Zustand Auth Store — single source of truth for auth state.
 *
 * Persists to localStorage with selective field partializing.
 * Never exposes sensitive raw tokens outside of this store.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;

  // Selectors
  isAdmin: () => boolean;
}

const STORAGE_KEY = "mediverse-auth-v2";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false }),

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      isAdmin: () => get().user?.role === "admin",
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        // In SSR / Cloudflare edge context there is no window/localStorage.
        // Return a no-op storage so Zustand persist doesn't throw.
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
            length: 0,
            clear: () => undefined,
            key: () => null,
          } as unknown as Storage;
        }
        return localStorage;
      }),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);