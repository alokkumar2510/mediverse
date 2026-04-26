/**
 * RecentActivity — last 10 reports table with module badge, confidence bar, open button.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Radiation, Heart, Scan, FlaskConical,
  FileText, MessageSquare, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ActivityItem } from "@/lib/dashboard";
import { NoReportsState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/EmptyState";
import { ActivityTableSkeleton } from "@/components/shared/Skeletons";

// ── Module config ──────────────────────────────────────────────────────────────

const MODULE_CONFIG: Record<string, { label: string; icon: typeof Activity; badge: string }> = {
  xray:         { label: "X-Ray",       icon: Radiation,    badge: "bg-blue-500/10 text-blue-500"    },
  ecg:          { label: "ECG",         icon: Heart,        badge: "bg-red-500/10 text-red-500"      },
  skin:         { label: "Skin",        icon: Scan,         badge: "bg-orange-500/10 text-orange-500"},
  diabetes:     { label: "Diabetes",    icon: FlaskConical, badge: "bg-purple-500/10 text-purple-500"},
  prescription: { label: "Prescription",icon: FileText,     badge: "bg-emerald-500/10 text-emerald-500"},
  symptoms:     { label: "Symptoms",    icon: MessageSquare,badge: "bg-yellow-500/10 text-yellow-500"},
};

function getModule(type: string) {
  return MODULE_CONFIG[type] ?? { label: type, icon: Activity, badge: "bg-muted text-muted-foreground" };
}

// ── Confidence bar ─────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums">{pct}%</span>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    failed:    "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", map[status] ?? "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface RecentActivityProps {
  data: ActivityItem[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function RecentActivity({ data, loading, error, onRetry }: RecentActivityProps) {
  return (
    <section aria-labelledby="recent-activity-heading">
      <div className="flex items-center justify-between mb-4">
        <h2 id="recent-activity-heading" className="text-base font-semibold">
          Recent Activity
        </h2>
        <Link
          href="/reports"
          className="text-xs text-primary hover:text-primary/70 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <ActivityTableSkeleton rows={5} />
        ) : error ? (
          <ErrorState onRetry={onRetry} />
        ) : data.length === 0 ? (
          <NoReportsState />
        ) : (
          <div>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border/60 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span>Module</span>
              <span>Report</span>
              <span>Confidence</span>
              <span>Date</span>
              <span />
            </div>

            {/* Data rows */}
            {data.map((row, i) => {
              const mod = getModule(row.module_type);
              const Icon = mod.icon;
              const date = new Date(row.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              });
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-5 py-4 border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors"
                >
                  {/* Module icon */}
                  <div className={cn("p-2 rounded-xl", mod.badge.split(" ")[0])}>
                    <Icon className={cn("h-4 w-4", mod.badge.split(" ")[1])} />
                  </div>

                  {/* Title + status */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{row.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-semibold", mod.badge)}>
                        {mod.label}
                      </span>
                      <StatusBadge status={row.status} />
                      <span className="text-xs text-muted-foreground sm:hidden">{date}</span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="hidden sm:block">
                    <ConfidenceBar value={row.confidence} />
                  </div>

                  {/* Date */}
                  <span className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap">{date}</span>

                  {/* Open */}
                  <Link
                    href={`/reports/${row.id}`}
                    id={`open-report-${row.id}`}
                    className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-accent hover:border-primary/30 transition-all"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}