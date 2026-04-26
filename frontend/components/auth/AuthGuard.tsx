"use client";

/**
 * AuthGuard — client-side route protection component.
 *
 * Use inside protected page layouts to guard against edge cases
 * where the Next.js middleware token extraction fails
 * (e.g., token stored only in JS memory after hard refresh).
 *
 * Usage:
 *   <AuthGuard role="admin">
 *     <AdminDashboard />
 *   </AuthGuard>
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { isTokenExpired } from "@/lib/auth";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If provided, user must have this exact role */
  role?: "user" | "admin";
  /** Redirect target on auth failure (default: /login) */
  redirectTo?: string;
}

export function AuthGuard({ children, role, redirectTo = "/login" }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, accessToken, isLoading, user } = useAuthStore();

  const isTokenValid = accessToken ? !isTokenExpired(accessToken) : false;
  const authorized = isAuthenticated && isTokenValid;

  useEffect(() => {
    if (isLoading) return; // Wait until hydration

    if (!authorized) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`${redirectTo}?next=${next}`);
      return;
    }

    if (role && user?.role !== role) {
      router.replace("/dashboard?error=forbidden");
    }
  }, [authorized, isLoading, role, user, router, redirectTo]);

  // Show spinner during hydration / redirect
  if (isLoading || !authorized || (role && user?.role !== role)) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

// ── AdminGuard shortcut ───────────────────────────────────────────────────────
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard role="admin">{children}</AuthGuard>;
}
