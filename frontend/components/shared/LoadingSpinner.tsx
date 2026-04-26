"use client";

import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  variant?: "spinner" | "skeleton" | "pulse";
}

export function LoadingState({ message, className, variant = "spinner" }: LoadingStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}
      role="status"
      aria-live="polite"
    >
      {variant === "spinner" && (
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <span className="absolute inset-0 rounded-full border-2 border-t-primary animate-spin" />
        </div>
      )}
      {variant === "pulse" && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

// ─── Skeleton primitives ─────────────────────────────────────────────────────
export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-md h-4", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border p-5 space-y-3", className)}>
      <SkeletonLine className="w-2/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-4/5" />
      <div className="flex gap-2 pt-2">
        <SkeletonLine className="w-20 h-8 rounded-lg" />
        <SkeletonLine className="w-20 h-8 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}