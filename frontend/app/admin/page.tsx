"use client";
/**
 * Admin Dashboard — Overview page with KPI cards + trend sparklines.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, FileText, Activity, AlertTriangle, TrendingUp, Clock,
  Cpu, Calendar, Star, UserCheck, UserPlus, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Stats {
  total_users:       number;
  active_users_7d:   number;
  active_users_30d:  number;
  total_reports:     number;
  reports_today:     number;
  most_used_module:  string | null;
  avg_latency_ms:    number | null;
  failed_requests:   number;
  error_rate_pct:    number;
  new_users_7d:      number;
  new_users_30d:     number;
  module_breakdown:  Array<{ module_type: string; count: number; pct: number }>;
  daily_reports_14d: Array<{ date: string; count: number }>;
  daily_signups_14d: Array<{ date: string; count: number }>;
  latency_trend_7d:  Array<{ date: string; avg_ms: number }>;
}

// ── Mini sparkline ─────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max  = Math.max(...data, 1);
  const w    = 80;
  const h    = 28;
  const pts  = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color, sparkData, sparkColor, trend,
}: {
  label:       string;
  value:       string | number;
  sub?:        string;
  icon:        any;
  color:       string;
  sparkData?:  number[];
  sparkColor?: string;
  trend?:      "up" | "down" | "neutral";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && (
            <p className={cn("text-xs mt-1 font-medium",
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-gray-500")}>
              {sub}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="p-2 rounded-xl" style={{ background: `${color}15` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          {sparkData && <Sparkline data={sparkData} color={sparkColor ?? color} />}
        </div>
      </div>
    </motion.div>
  );
}

// ── Module bar ─────────────────────────────────────────────────────────────────
const MOD_COLORS: Record<string, string> = {
  xray:         "#3b82f6",
  ecg:          "#ef4444",
  skin:         "#f97316",
  diabetes:     "#8b5cf6",
  prescription: "#10b981",
  symptoms:     "#eab308",
};

function ModuleBar({ module_type, count, pct }: { module_type: string; count: number; pct: number }) {
  const color = MOD_COLORS[module_type] ?? "#6366f1";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-gray-300 capitalize font-medium">{module_type}</span>
        <span className="text-gray-500">{count.toLocaleString()} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminOverviewPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats").then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return <div className="p-8 text-gray-500">Failed to load stats.</div>;

  const reportTrend = stats.daily_reports_14d.map(d => d.count);
  const signupTrend = stats.daily_signups_14d.map(d => d.count);
  const latencyTrend = stats.latency_trend_7d.map(d => d.avg_ms);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Overview</h1>
        <p className="text-sm text-gray-400 mt-1">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Users" value={stats.total_users.toLocaleString()}
          sub={`+${stats.new_users_7d} this week`} trend="up"
          icon={Users} color="#6366f1" sparkData={signupTrend} />

        <KpiCard label="Active Users (7d)" value={stats.active_users_7d.toLocaleString()}
          sub={`${stats.active_users_30d.toLocaleString()} in 30 days`}
          icon={UserCheck} color="#10b981" />

        <KpiCard label="Total Reports" value={stats.total_reports.toLocaleString()}
          sub={`${stats.reports_today} today`} trend="up"
          icon={FileText} color="#3b82f6" sparkData={reportTrend} sparkColor="#3b82f6" />

        <KpiCard label="New Users (7d)" value={stats.new_users_7d.toLocaleString()}
          sub={`${stats.new_users_30d} this month`} trend="up"
          icon={UserPlus} color="#8b5cf6" />

        <KpiCard label="Most Used Module"
          value={stats.most_used_module ? stats.most_used_module.toUpperCase() : "—"}
          icon={Star} color="#f59e0b" />

        <KpiCard label="Avg API Latency"
          value={stats.avg_latency_ms != null ? `${stats.avg_latency_ms} ms` : "—"}
          sub="7-day average" icon={Zap} color="#06b6d4"
          sparkData={latencyTrend} sparkColor="#06b6d4" />

        <KpiCard label="Failed Requests"
          value={stats.failed_requests.toLocaleString()}
          sub={`${stats.error_rate_pct}% error rate`}
          trend={stats.error_rate_pct > 1 ? "down" : "neutral"}
          icon={AlertTriangle} color="#ef4444" />

        <KpiCard label="Reports Today"
          value={stats.reports_today.toLocaleString()}
          icon={Calendar} color="#f97316" />
      </div>

      {/* Module breakdown + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Cpu className="w-4 h-4" /> Module Usage
          </h2>
          <div className="space-y-4">
            {stats.module_breakdown.length === 0 && (
              <p className="text-sm text-gray-600">No data yet.</p>
            )}
            {stats.module_breakdown.map(m => (
              <ModuleBar key={m.module_type} {...m} />
            ))}
          </div>
        </div>

        {/* 14-day report chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Reports — Last 14 Days
          </h2>
          <div className="flex items-end gap-1 h-32">
            {reportTrend.length === 0 && <p className="text-sm text-gray-600 self-center">No data yet.</p>}
            {reportTrend.map((v, i) => {
              const max = Math.max(...reportTrend, 1);
              const h   = Math.round((v / max) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="w-full relative">
                    <motion.div
                      className="w-full rounded-t-sm bg-indigo-500/40 hover:bg-indigo-500/70 transition-colors cursor-default"
                      style={{ height: `${h}%` }}
                      title={`${stats.daily_reports_14d[i]?.date}: ${v}`}
                      initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                      transition={{ delay: i * 0.02 }}
                    />
                  </div>
                  {i % 4 === 0 && (
                    <span className="text-[9px] text-gray-600 -rotate-45 origin-top-left">
                      {stats.daily_reports_14d[i]?.date?.slice(5) ?? ""}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform health strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Error Rate",    value: `${stats.error_rate_pct}%`,  ok: stats.error_rate_pct  < 1,   icon: AlertTriangle },
          { label: "Avg Latency",   value: stats.avg_latency_ms ? `${stats.avg_latency_ms}ms` : "—", ok: (stats.avg_latency_ms ?? 0) < 500, icon: Clock },
          { label: "Active / Total",value: `${stats.active_users_7d} / ${stats.total_users}`, ok: true, icon: TrendingUp },
        ].map(({ label, value, ok, icon: Icon }) => (
          <div key={label} className={cn(
            "flex items-center gap-3 p-4 rounded-xl border",
            ok ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"
          )}>
            <Icon className={cn("w-4 h-4 flex-shrink-0", ok ? "text-emerald-400" : "text-red-400")} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-sm font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
