/**
 * Empty + Error state components — consistent across all dashboard sections.
 */
import { motion } from "framer-motion";
import { FileX2, RefreshCw, Wifi, AlertTriangle, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ── Generic empty state ────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  className?: string;
}

export function EmptyState({
  icon: Icon = FileX2,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="font-semibold text-base mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-5">
          {action.href ? (
            <Link
              href={action.href}
              className="px-4 py-2 rounded-xl text-sm font-medium gradient-brand text-white shadow-sm hover:shadow-md transition-shadow"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="px-4 py-2 rounded-xl text-sm font-medium gradient-brand text-white shadow-sm hover:shadow-md transition-shadow"
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── No-reports empty state ─────────────────────────────────────────────────────

export function NoReportsState() {
  return (
    <EmptyState
      icon={FileX2}
      title="No analyses yet"
      description="Run your first AI health module to see results here."
      action={{ label: "Start an analysis", href: "/xray" }}
    />
  );
}

// ── Error state ────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  offline?: boolean;
}

export function ErrorState({
  message = "Something went wrong loading this section.",
  onRetry,
  offline = false,
}: ErrorStateProps) {
  const Icon = offline ? Wifi : AlertTriangle;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-destructive/70" />
      </div>
      <h3 className="font-semibold text-base mb-1">
        {offline ? "You're offline" : "Failed to load"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </motion.div>
  );
}
