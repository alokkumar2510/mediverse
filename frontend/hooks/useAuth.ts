"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import {
  loginUser,
  registerUser,
  logoutUser,
  storeAuth,
  clearAuth,
  fetchMe,
  forgotPassword,
  resetPassword,
  verifyEmail,
  sendVerificationEmail,
  getApiErrorMessage,
} from "@/lib/auth";
import type {
  ForgotPasswordPayload,
  LoginCredentials,
  RegisterCredentials,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      store.setLoading(true);
      try {
        const response = await loginUser(credentials);
        storeAuth(response);
        router.push("/dashboard");
        return response;
      } finally {
        store.setLoading(false);
      }
    },
    [router, store]
  );

  const register = useCallback(
    async (data: RegisterCredentials) => {
      store.setLoading(true);
      try {
        const response = await registerUser(data);
        storeAuth(response);
        router.push("/dashboard");
        return response;
      } finally {
        store.setLoading(false);
      }
    },
    [router, store]
  );

  const logout = useCallback(
    async (opts?: { all?: boolean }) => {
      await logoutUser({ logout_all: opts?.all });
      clearAuth();
      router.push("/login");
    },
    [router]
  );

  const refreshUser = useCallback(async () => {
    const updated = await fetchMe();
    useAuthStore.getState().setUser(updated);
    return updated;
  }, []);

  const sendForgotPassword = useCallback(
    async (payload: ForgotPasswordPayload) => {
      return forgotPassword(payload);
    },
    []
  );

  const doResetPassword = useCallback(
    async (payload: ResetPasswordPayload) => {
      const result = await resetPassword(payload);
      router.push("/login?reset=1");
      return result;
    },
    [router]
  );

  const doVerifyEmail = useCallback(
    async (payload: VerifyEmailPayload) => {
      return verifyEmail(payload);
    },
    []
  );

  const doSendVerification = useCallback(async () => {
    return sendVerificationEmail();
  }, []);

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    isAdmin: store.isAdmin(),
    accessToken: store.accessToken,

    // Actions
    login,
    register,
    logout,
    refreshUser,
    sendForgotPassword,
    doResetPassword,
    doVerifyEmail,
    doSendVerification,
    getApiErrorMessage,
  };
}