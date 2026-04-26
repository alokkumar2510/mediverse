import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Primary API instance ───────────────────────────────────────────────────
export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
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
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
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

  const { refreshToken, setTokens, logout } = useAuthStore.getState();

  if (!refreshToken) {
    logout();
    if (typeof window !== "undefined") window.location.href = "/login";
    return Promise.reject(error);
  }

  try {
    const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, {
      refresh_token: refreshToken,
    });
    const newAccessToken: string = data.access_token;
    const newRefreshToken: string = data.refresh_token ?? refreshToken;
    setTokens(newAccessToken, newRefreshToken);
    processQueue(null, newAccessToken);
    original.headers.Authorization = `Bearer ${newAccessToken}`;
    return api(original);
  } catch (refreshError) {
    processQueue(refreshError, null);
    logout();
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
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(". ");
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}