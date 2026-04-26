/**
 * StatWidget — Premium KPI card.
 * Clean data hierarchy: label → value → sub-metric.
 */
"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatWidgetProps {
  id: string;
  index?: number;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  loading?: boolean;
}

export function StatWidget({
  id,
  index = 0,
  icon: Icon,
  iconBg    = "bg-primary/8",
  iconColor = "text-primary",
  label,
  value,
  sub,
  trend,
  loading = false,
}: StatWidgetProps) {
  const TrendIcon  = trend == null ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend == null ? "" : trend > 0 ? "text-emerald-500" : trend < 0 ? "text-rose-500" : "text-muted-foreground";

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      className="relative rounded-2xl border border-border bg-card p-4 overflow-hidden hover:border-primary/20 hover:shadow-md transition-all duration-200 group"
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <p className="text-[0.75rem] font-semibold text-muted-foreground leading-none">{label}</p>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl shrink-0", iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", iconColor)} strokeWidth={1.8} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        {loading ? (
          <span className="skeleton h-7 w-16 rounded-lg inline-block" />
        ) : (
          <span
            className="font-bold tracking-tight leading-none"
            style={{ fontSize: "clamp(1.5rem, 3vw, 1.75rem)", letterSpacing: "-0.03em" }}
          >
            {value}
          </span>
        )}

        {TrendIcon && !loading && (
          <div className={cn("flex items-center gap-0.5 text-[10px] font-semibold mb-0.5", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trend!)}%
          </div>
        )}
      </div>

      {/* Sub label */}
      {sub && !loading && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-none">{sub}</p>
      )}

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}