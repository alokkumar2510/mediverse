"use client";

import { motion } from "framer-motion";
import { LucideIcon, SearchX, FileX, WifiOff, ShieldOff } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyVariant = "default" | "search" | "reports" | "offline" | "forbidden";

const variantConfig: Record<EmptyVariant, { icon: LucideIcon; title: string; description: string }> = {
  default:   { icon: FileX,     title: "Nothing here yet",          description: "Start by using one of the AI modules above." },
  search:    { icon: SearchX,   title: "No results found",           description: "Try different keywords or clear your filters." },
  reports:   { icon: FileX,     title: "No reports yet",             description: "Run a scan from any AI module to generate your first report." },
  offline:   { icon: WifiOff,   title: "You're offline",             description: "Check your connection and try again." },
  forbidden: { icon: ShieldOff, title: "Access restricted",          description: "You don't have permission to view this page." },
};

interface EmptyStateProps {
  variant?: EmptyVariant;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  variant = "default",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center gap-4 py-20 px-6",
        className
      )}
    >
      <div className="p-5 rounded-2xl bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-semibold text-lg">{title ?? config.title}</h3>
        <p className="text-sm text-muted-foreground">{description ?? config.description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}