/**
 * Auth API library — all calls to /api/auth/* backend endpoints.
 * Uses the Axios instance from lib/api.ts (has 401 refresh interceptor).
 */
import { api } from "./api";
import { useAuthStore } from "@/stores/authStore";
import type {
  ForgotPasswordPayload,
  LoginCredentials,
  LogoutPayload,
  RegisterCredentials,
  ResetPasswordPayload,
  TokenResponse,
  User,
  VerifyEmailPayload,
} from "@/types/auth";

const AUTH = "/api/auth";

// ── Core auth calls ───────────────────────────────────────────────────────────

export async function loginUser(credentials: LoginCredentials): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(`${AUTH}/login`, credentials);
  return data;
}

export async function registerUser(credentials: RegisterCredentials): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>(`${AUTH}/register`, credentials);
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>(`${AUTH}/me`);
  return data;
}

export async function logoutUser(payload?: LogoutPayload): Promise<void> {
  const store = useAuthStore.getState();
  await api
    .post(`${AUTH}/logout`, {
      refresh_token: payload?.refresh_token ?? store.refreshToken,
      logout_all: payload?.logout_all ?? false,
    })
    .catch(() => {}); // Never throw on logout
  // Note: clearAuth() is called by useAuth.logout() after this returns
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${AUTH}/forgot-password`, payload);
  return data;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${AUTH}/reset-password`, payload);
  return data;
}

// ── Email verification ────────────────────────────────────────────────────────

export async function verifyEmail(payload: VerifyEmailPayload): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${AUTH}/verify-email`, payload);
  return data;
}

export async function sendVerificationEmail(): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>(`${AUTH}/send-verification`);
  return data;
}

// ── Cookie helpers ─────────────────────────────────────────────────────────────

/** Extract JWT exp (seconds) without any library. */
function getJwtExp(token: string): number | null {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/** Write the access token to a cookie so the Edge middleware can read it. */
export function updateAuthCookies(accessToken: string): void {
  if (typeof document === "undefined") return;
  const exp = getJwtExp(accessToken);
  const maxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 0) : 3600;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `mv_access_token=${accessToken}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Expire the cookie on logout. */
function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "mv_access_token=; Path=/; Max-Age=0; SameSite=Lax";
}

// ── Auth state helpers ────────────────────────────────────────────────────────

export function storeAuth(response: TokenResponse): void {
  useAuthStore.getState().setAuth(response.user, response.access_token, response.refresh_token);
  // Sync cookie so Edge middleware sees the token on the very next navigation
  updateAuthCookies(response.access_token);
}

export function clearAuth(): void {
  useAuthStore.getState().logout();
  clearAuthCookie();
}

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function isTokenExpired(token: string): boolean {
  try {
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    // Add 10-second buffer to avoid edge-case race conditions
    return payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

export { getApiErrorMessage } from "./api";