"use client";
/**
 * Admin System Health — live health checks for DB, API, ML services, storage.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCw, CheckCircle2, XCircle, Clock, Zap, Database, Cpu, Server, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface HealthCheck {
  name:       string;
  status:     "healthy" | "degraded" | "down";
  latency_ms: number | null;
  detail:     string;
  icon:       any;
}

const STATUS_CONFIG = {
  healthy:  { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Healthy",  icon: CheckCircle2 },
  degraded: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20",   label: "Degraded", icon: Clock },
  down:     { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20",     label: "Down",     icon: XCircle },
};

export default function AdminHealthPage() {
  const [checks,    setChecks]    = useState<HealthCheck[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [statsData, setStatsData] = useState<any>(null);

  const runChecks = async () => {
    setLoading(true);
    const results: HealthCheck[] = [];

    // 1. API health
    try {
      const t0 = Date.now();
      await api.get("/health");
      results.push({ name: "API Server", status: "healthy", latency_ms: Date.now() - t0, detail: "FastAPI responding normally", icon: Server });
    } catch {
      results.push({ name: "API Server", status: "down", latency_ms: null, detail: "API did not respond", icon: Server });
    }

    // 2. Admin stats (tests DB)
    try {
      const t0 = Date.now();
      const r = await api.get("/admin/stats");
      setStatsData(r.data);
      results.push({ name: "PostgreSQL DB", status: "healthy", latency_ms: Date.now() - t0, detail: `${r.data.total_users} users, ${r.data.total_reports} reports indexed`, icon: Database });
    } catch {
      results.push({ name: "PostgreSQL DB", status: "down", latency_ms: null, detail: "Database query failed", icon: Database });
    }

    // 3. Models endpoint
    try {
      const t0 = Date.now();
      const r = await api.get("/admin/models");
      const active = r.data.filter((m: any) => m.is_active).length;
      results.push({ name: "ML Model Registry", status: "healthy", latency_ms: Date.now() - t0, detail: `${r.data.length} versions registered, ${active} active`, icon: Cpu });
    } catch {
      results.push({ name: "ML Model Registry", status: "degraded", latency_ms: null, detail: "Model registry unreachable", icon: Cpu });
    }

    // 4. Logs (usage log table)
    try {
      const t0 = Date.now();
      await api.get("/admin/logs", { params: { page: 1, page_size: 1 } });
      results.push({ name: "Usage Log Service", status: "healthy", latency_ms: Date.now() - t0, detail: "Request logging active", icon: Activity });
    } catch {
      results.push({ name: "Usage Log Service", status: "degraded", latency_ms: null, detail: "Could not query usage logs", icon: Activity });
    }

    setChecks(results);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => { runChecks(); }, []);

  const allOk = checks.every(c => c.status === "healthy");
  const anyDown = checks.some(c => c.status === "down");
  const overallStatus = anyDown ? "down" : allOk ? "healthy" : "degraded";
  const overallCfg = STATUS_CONFIG[overallStatus];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-400" /> System Health
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {lastCheck ? `Last checked ${lastCheck.toLocaleTimeString("en-GB")}` : "Checking…"}
          </p>
        </div>
        <button onClick={runChecks} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 rounded-xl text-sm transition-all disabled:opacity-50">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className={cn("flex items-center gap-4 p-5 rounded-2xl border", overallCfg.bg, overallCfg.border)}>
        <overallCfg.icon className={cn("w-8 h-8", overallCfg.color)} />
        <div>
          <p className={cn("text-lg font-bold", overallCfg.color)}>
            {overallStatus === "healthy" ? "All Systems Operational" :
             overallStatus === "degraded" ? "Some Systems Degraded" :
             "System Outage Detected"}
          </p>
          <p className="text-sm text-gray-400">
            {checks.filter(c => c.status === "healthy").length}/{checks.length} services healthy
          </p>
        </div>
      </motion.div>

      {/* Service checks */}
      <div className="space-y-3">
        {loading && !checks.length && (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}
        {checks.map((c, i) => {
          const cfg = STATUS_CONFIG[c.status];
          const StatusIcon = cfg.icon;
          return (
            <motion.div key={c.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
              <div className={cn("p-2.5 rounded-xl border", cfg.bg, cfg.border)}>
                <c.icon className={cn("w-5 h-5", cfg.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.detail}</p>
              </div>
              {c.latency_ms != null && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Zap className="w-3.5 h-3.5" /> {c.latency_ms}ms
                </div>
              )}
              <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold", cfg.bg, cfg.border, cfg.color)}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Platform stats strip */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Users",    value: statsData.total_users,    icon: Activity },
            { label: "Total Reports",  value: statsData.total_reports,  icon: HardDrive },
            { label: "Error Rate",     value: `${statsData.error_rate_pct}%`, icon: XCircle },
            { label: "Avg Latency",    value: statsData.avg_latency_ms ? `${statsData.avg_latency_ms}ms` : "—", icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex gap-2 items-center">
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-bold text-white">{value?.toLocaleString?.() ?? value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
