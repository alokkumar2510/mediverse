/**
 * Skeleton components for loading states across the dashboard.
 * Matches the exact shape of the real content to prevent layout shift.
 */
import { cn } from "@/lib/utils";

// ── Primitive ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-muted/50",
        className
      )}
    />
  );
}

// ── Stat Card Skeleton ─────────────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function StatCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Table Row Skeleton ─────────────────────────────────────────────────────────

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-border/50 last:border-0">
      <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-5 w-12" />
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );
}

export function ActivityTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Quick Action Card Skeleton ─────────────────────────────────────────────────

export function QuickActionSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-36" />
    </div>
  );
}

export function QuickActionSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <QuickActionSkeleton key={i} />
      ))}
    </div>
  );
}

// ── Chart Skeleton ─────────────────────────────────────────────────────────────

export function ChartSkeleton({ height = "h-48" }: { height?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 space-y-3", height)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </div>
      <div className="flex-1 flex items-end gap-2 pt-4 h-32">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1" style={{ height: `${20 + (i * 7) % 80}%` }}>
            <Skeleton className="h-full rounded-t-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
