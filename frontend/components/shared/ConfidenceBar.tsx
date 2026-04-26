"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: number;
  className?: string;
  index?: number;
}

export function MetricCard({
  id,
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  trend,
  className,
  index = 0,
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300",
        className
      )}
    >
      <div className="absolute inset-0 gradient-brand-soft opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>}
          {trend !== undefined && (
            <div className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-medium",
              trendPositive ? "text-green-500" : trendNegative ? "text-red-500" : "text-muted-foreground"
            )}>
              <TrendIcon className="h-3.5 w-3.5" />
              {trendPositive && "+"}{trend}% vs last month
            </div>
          )}
        </div>
        {Icon && (
          <div className="shrink-0 p-3 rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Confidence bar component ─────────────────────────────────────────────────
interface ConfidenceBarProps {
  value: number; // 0-1
  label?: string;
  className?: string;
}

export function ConfidenceBar({ value, label, className }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold">{pct}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}