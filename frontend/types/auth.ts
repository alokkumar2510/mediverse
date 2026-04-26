/**
 * Auth type contracts — single source of truth for frontend.
 * Must match backend schemas/auth.py exactly.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number; // seconds
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface LogoutPayload {
  refresh_token?: string;
  logout_all?: boolean;
}

// Alias kept for backward compat
export type AuthResponse = TokenResponse;