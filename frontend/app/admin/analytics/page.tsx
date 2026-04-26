"use client";
/**
 * Admin Analytics — 30-day charts: reports, signups, latency, errors, module breakdown.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Zap, AlertTriangle, Cpu } from "lucide-react";

interface Analytics {
  module_breakdown:  Array<{ module_type: string; count: number; pct: number }>;
  daily_reports_30d: Array<{ date: string; count: number }>;
  daily_signups_30d: Array<{ date: string; count: number }>;
  latency_trend_30d: Array<{ date: string; avg_ms: number }>;
  error_trend_30d:   Array<{ date: string; count: number }>;
  top_endpoints:     Array<{ endpoint: string; count: number }>;
}

import { api } from "@/lib/api";

const MOD_COLORS: Record<string, string> = {
  xray: "#3b82f6", ecg: "#ef4444", skin: "#f97316",
  diabetes: "#8b5cf6", prescription: "#10b981", symptoms: "#eab308",
};

// ── Bar chart ──────────────────────────────────────────────────────────────────
function BarChart({
  data, color = "#6366f1", label,
}: { data: Array<{ date: string; count: number }>; color?: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{label}</h3>
      <div className="flex items-end gap-0.5 h-28">
        {data.map((d, i) => {
          const h = Math.round((d.count / max) * 100);
          const show = i % 7 === 0;
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group">
              <div className="relative w-full" style={{ height: "100px" }}>
                <div className="absolute bottom-0 w-full" style={{ height: `${Math.max(h, 2)}%` }}>
                  <motion.div
                    className="w-full h-full rounded-t-sm transition-colors cursor-default"
                    style={{ background: color, opacity: 0.5 }}
                    whileHover={{ opacity: 0.9 }}
                    title={`${d.date}: ${d.count}`}
                    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                    transition={{ delay: i * 0.01 }}
                  />
                </div>
              </div>
              {show && (
                <span className="text-[8px] text-gray-600">{d.date.slice(5)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Line-style area chart ──────────────────────────────────────────────────────
function LineChart({
  data, color = "#06b6d4", label, unit = "",
}: { data: Array<{ date: string; avg_ms: number }>; color?: string; label: string; unit?: string }) {
  const values = data.map(d => d.avg_ms);
  const max = Math.max(...values, 1);
  const w = 100, h = 80;
  const pts = values.map((v, i) =>
    `${(i / Math.max(values.length - 1, 1)) * w},${h - (v / max) * h}`
  ).join(" ");

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">{label}</h3>
      {values.length === 0 ? (
        <p className="text-sm text-gray-600">No data yet.</p>
      ) : (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-24" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon
            points={`0,${h} ${pts} ${w},${h}`}
            fill={`url(#grad-${label})`}
          />
          <polyline
            fill="none" stroke={color} strokeWidth={1.5}
            strokeLinejoin="round" points={pts}
          />
        </svg>
      )}
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  );
}

// ── Module donut ───────────────────────────────────────────────────────────────
function ModuleDonut({ data }: { data: Array<{ module_type: string; count: number; pct: number }> }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  let cumAngle = -90;

  const paths = data.map(d => {
    const angle = (d.count / Math.max(total, 1)) * 360;
    const start = cumAngle;
    cumAngle += angle;
    const r = 36, cx = 50, cy = 50;
    const toRad = (a: number) => (a * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + angle));
    const y2 = cy + r * Math.sin(toRad(start + angle));
    const large = angle > 180 ? 1 : 0;
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`, color: MOD_COLORS[d.module_type] ?? "#6366f1", label: d.module_type, pct: d.pct };
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5" /> Module Breakdown
      </h3>
      <div className="flex gap-6 items-center">
        <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
          {paths.map((p, i) => (
            <motion.path key={i} d={p.d} fill={p.color} opacity={0.85}
              initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: i * 0.1 }} />
          ))}
          <circle cx="50" cy="50" r="22" fill="#111827" />
          <text x="50" y="53" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
            {total.toLocaleString()}
          </text>
          <text x="50" y="62" textAnchor="middle" fill="#6b7280" fontSize="5">total</text>
        </svg>
        <div className="flex-1 space-y-2">
          {data.map(d => (
            <div key={d.module_type} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: MOD_COLORS[d.module_type] ?? "#6366f1" }} />
              <span className="text-xs text-gray-400 capitalize flex-1">{d.module_type}</span>
              <span className="text-xs text-gray-500">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics").then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex justify-center py-32">
      <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
    </div>;
  }
  if (!data) return <div className="p-8 text-gray-500">Failed to load analytics.</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" /> Analytics
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">30-day platform trends</p>
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={data.daily_reports_30d}  color="#6366f1" label="Daily Reports (30d)" />
        <BarChart data={data.daily_signups_30d}  color="#10b981" label="Daily Signups (30d)" />
        <LineChart data={data.latency_trend_30d} color="#06b6d4" label="API Latency Trend (30d)" unit="ms" />
        <BarChart
          data={data.error_trend_30d.map(d => ({ date: d.date, count: d.count }))}
          color="#ef4444" label="Daily Errors (30d)"
        />
      </div>

      {/* Module donut + top endpoints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ModuleDonut data={data.module_breakdown} />
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Top Endpoints (30d)</h3>
          <div className="space-y-2">
            {data.top_endpoints.length === 0 && <p className="text-sm text-gray-600">No data yet.</p>}
            {data.top_endpoints.map((e, i) => {
              const max = data.top_endpoints[0]?.count ?? 1;
              return (
                <div key={e.endpoint} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-mono truncate">{e.endpoint}</span>
                    <span className="text-gray-500 ml-2 flex-shrink-0">{e.count}</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full">
                    <motion.div className="h-full bg-indigo-500/50 rounded-full"
                      initial={{ width: 0 }} animate={{ width: `${Math.round(e.count / max * 100)}%` }}
                      transition={{ delay: i * 0.05 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
