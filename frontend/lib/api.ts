import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const isProd = process.env.NODE_ENV === "production";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || (isProd ? "https://api.mediverse.alokkumarsahu.in" : "http://localhost:8000");

// ─── Primary API instance ───────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 120_000, // Increased to 120s for Render cold starts
});

// ─── Multipart instance (file uploads) ──────────────────────────────────────
export const apiUpload = axios.create({
  baseURL: API_BASE,
  timeout: 120_000,
});

let isRefreshing = false;
let failQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failQueue = [];
}

// ─── Request interceptor: attach Bearer token ───────────────────────────────
function attachToken(config: InternalAxiosRequestConfig) {
  // Guard: useAuthStore relies on localStorage which is unavailable in
  // SSR / Cloudflare edge context — wrap in try/catch to prevent crashing.
  try {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No localStorage in edge runtime — token will be missing, which is fine
    // for unauthenticated endpoints (login/register).
  }
  return config;
}

api.interceptors.request.use(attachToken);
apiUpload.interceptors.request.use(attachToken);

// ─── Response interceptor: token refresh on 401 ─────────────────────────────
async function handle401(error: AxiosError) {
  const original = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  if (error.response?.status !== 401 || original._retry) {
    return Promise.reject(error);
  }

  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failQueue.push({ resolve, reject });
    })
      .then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      })
      .catch(Promise.reject.bind(Promise));
  }

  original._retry = true;
  isRefreshing = true;

  let refreshToken: string | null = null;
  let setTokens: ((a: string, r: string) => void) | null = null;
  let logout: (() => void) | null = null;

  try {
    const state = useAuthStore.getState();
    refreshToken = state.refreshToken;
    setTokens = state.setTokens;
    logout = state.logout;
  } catch {
    // Edge runtime — can't access store
    isRefreshing = false;
    return Promise.reject(error);
  }

  if (!refreshToken) {
    if (logout) logout();
    if (typeof window !== "undefined") window.location.href = "/login";
    return Promise.reject(error);
  }

  try {
    const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const newAccessToken: string = data.access_token;
    const newRefreshToken: string = data.refresh_token ?? refreshToken;
    setTokens?.(newAccessToken, newRefreshToken);
    // Keep the cookie in sync so the Edge middleware sees the new token
    const { updateAuthCookies } = await import("@/lib/auth");
    updateAuthCookies(newAccessToken);
    processQueue(null, newAccessToken);
    original.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(original);
  } catch (refreshError) {
    processQueue(refreshError, null);
    if (logout) logout();
    if (typeof window !== "undefined") window.location.href = "/login";
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use((res) => res, handle401);
apiUpload.interceptors.response.use((res) => res, handle401);

// ─── Typed helper methods ────────────────────────────────────────────────────
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<T>(url, { params }).then((r) => r.data);

export const apiPost = <T>(url: string, data?: unknown) =>
  api.post<T>(url, data).then((r) => r.data);

export const apiPut = <T>(url: string, data?: unknown) =>
  api.put<T>(url, data).then((r) => r.data);

export const apiDelete = <T>(url: string) =>
  api.delete<T>(url).then((r) => r.data);

export const apiPostForm = <T>(url: string, formData: FormData) =>
  apiUpload
    .post<T>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // No response at all = genuine network/CORS/cold-start issue
    if (!error.response) {
      return "Unable to reach the server. Please check your connection or try again in a moment.";
    }

    const data = error.response.data;

    // FastAPI / Pydantic validation errors (422)
    const detail = data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => {
          const field = d.loc?.slice(1).join(" → ") ?? "";
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .join(". ");
    }

    // Custom error shape from our exception handlers
    const errors = data?.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      return errors.map((e: { message?: string }) => e.message).filter(Boolean).join(". ");
    }

    // HTTP-level message fallback
    if (data?.message) return data.message;

    return error.message || "An unexpected error occurred.";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}