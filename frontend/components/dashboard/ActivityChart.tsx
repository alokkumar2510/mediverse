/**
 * ActivityChart — 30-day report bar chart and module breakdown ring.
 * Pure CSS + SVG — no external chart library required.
 */
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/dashboard";
import { ChartSkeleton } from "@/components/shared/Skeletons";

// ── Module colours ─────────────────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  xray:         "#3b82f6",
  ecg:          "#ef4444",
  skin:         "#f97316",
  diabetes:     "#a855f7",
  prescription: "#10b981",
  symptoms:     "#eab308",
};

const MODULE_LABELS: Record<string, string> = {
  xray: "X-Ray", ecg: "ECG", skin: "Skin",
  diabetes: "Diabetes", prescription: "Prescription", symptoms: "Symptoms",
};

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { date: string; count: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  // Fill 30 days (some may be missing)
  const days = useMemo(() => {
    const map = Object.fromEntries(data.map((d) => [d.date, d.count]));
    const result: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push({ date: key, count: map[key] ?? 0 });
    }
    return result;
  }, [data]);

  return (
    <div className="flex items-end gap-[3px] h-24 w-full">
      {days.map(({ date, count }, i) => {
        const height = count === 0 ? 4 : Math.max((count / maxCount) * 100, 8);
        return (
          <motion.div
            key={date}
            title={`${date}: ${count} report${count !== 1 ? "s" : ""}`}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.012, duration: 0.3 }}
            style={{ height: `${height}%` }}
            className={cn(
              "flex-1 rounded-t-sm origin-bottom transition-colors cursor-default",
              count > 0 ? "bg-primary hover:bg-primary/80" : "bg-muted/40 hover:bg-muted/70"
            )}
          />
        );
      })}
    </div>
  );
}

// ── Module donut ──────────────────────────────────────────────────────────────

function ModuleBreakdown({ byModule }: { byModule: Record<string, number> }) {
  const total = Object.values(byModule).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {Object.entries(byModule)
        .sort((a, b) => b[1] - a[1])
        .map(([mod, count]) => (
          <div key={mod} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: MODULE_COLORS[mod] ?? "#6366f1" }}
            />
            <span className="text-xs text-muted-foreground">
              {MODULE_LABELS[mod] ?? mod}
              <span className="ml-1 text-foreground font-medium">{count}</span>
            </span>
          </div>
        ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface ActivityChartProps {
  metrics: DashboardMetrics | null;
  loading?: boolean;
}

export function ActivityChart({ metrics, loading }: ActivityChartProps) {
  const total30 = metrics?.daily_reports.reduce((a, b) => a + b.count, 0) ?? 0;

  if (loading) return <ChartSkeleton />;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Analyses (Last 30 Days)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{total30} total</p>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
          30d
        </span>
      </div>

      {metrics && metrics.daily_reports.length > 0 ? (
        <>
          <BarChart data={metrics.daily_reports} />
          <ModuleBreakdown byModule={metrics.by_module} />
        </>
      ) : (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
          No data yet
        </div>
      )}
    </div>
  );
}
