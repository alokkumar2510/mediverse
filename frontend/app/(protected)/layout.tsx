"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { LoadingState } from "@/components/shared/LoadingSpinner";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router          = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Checking authentication…" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}