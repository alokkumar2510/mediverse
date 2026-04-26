"use client";
/**
 * Compare Report Page — side-by-side diff of two reports.
 */
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus,
  Calendar, Shield, AlertTriangle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface CompareResult {
  report_a: any;
  report_b: any;
  same_module: boolean;
  delta_confidence: number | null;
  delta_days: number;
  summary: string;
}

const MOD_LABELS: Record<string, { label: string; color: string }> = {
  xray:         { label: "X-Ray",        color: "#3b82f6" },
  ecg:          { label: "ECG",          color: "#ef4444" },
  skin:         { label: "Skin",         color: "#f97316" },
  diabetes:     { label: "Diabetes",     color: "#8b5cf6" },
  prescription: { label: "Prescription", color: "#10b981" },
  symptoms:     { label: "Symptoms",     color: "#eab308" },
};

const SKIP = new Set(["disclaimer", "is_demo", "report_id", "r_peaks"]);

function fmtPct(v: number | null) {
  if (v == null) return null;
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
}

function ReportColumn({ report, label }: { report: any; label: string }) {
  const mod = MOD_LABELS[report.module_type] ?? { label: report.module_type, color: "#6366f1" };
  const pct = fmtPct(report.confidence);
  const confColor = pct == null ? "" : pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";

  const rows: Array<{ key: string; val: any }> = [];
  const PRIO = ["rhythm_type","prediction","risk_level","severity","heart_rate_bpm","recommendation","risk_flags"];
  const shown = new Set<string>();
  for (const key of PRIO) {
    const v = report.result_json[key];
    if (v != null) { rows.push({ key, val: v }); shown.add(key); }
  }
  for (const [k, v] of Object.entries(report.result_json)) {
    if (!shown.has(k) && !SKIP.has(k) && !k.endsWith("_base64")) rows.push({ key: k, val: v });
  }

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Column header */}
        <div className="px-5 py-4 border-b border-gray-800"
          style={{ background: `${mod.color}08`, borderTop: `3px solid ${mod.color}` }}>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
          <h3 className="text-base font-bold text-white mt-1 truncate">
            {report.title ?? `${mod.label} Analysis`}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            {pct != null && (
              <span className={cn("flex items-center gap-1 font-semibold ml-2", confColor)}>
                <Shield className="w-3 h-3" />{pct}%
              </span>
            )}
          </div>
          <Link href={`/reports/${report.id}`}
            className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            View full report <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Result rows */}
        <div className="p-5 space-y-2">
          {rows.map(({ key, val }) => (
            <div key={key} className="flex gap-3 py-2 border-b border-gray-800/50 last:border-0">
              <dt className="w-32 flex-shrink-0 text-xs text-gray-500 font-medium uppercase tracking-wide pt-0.5">
                {key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
              </dt>
              <dd className="flex-1 text-sm text-gray-200 break-words">
                {Array.isArray(val) ? val.join(", ") || "—" : String(val)}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparePageInner() {
  const params            = useSearchParams();
  const aId               = params.get("a") ?? "";
  const bId               = params.get("b") ?? "";
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [idA, setIdA]       = useState(aId);
  const [idB, setIdB]       = useState(bId);

  const compare = async () => {
    if (!idA || !idB) { setError("Please provide both report IDs."); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.post("/reports/compare", { report_id_a: idA, report_id_b: idB });
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Compare failed.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (aId && bId) compare(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const delta = result?.delta_confidence;
  const deltaDir = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "same";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/reports" className="p-2 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GitCompare className="w-6 h-6 text-indigo-400" /> Compare Reports
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">Side-by-side analysis comparison</p>
          </div>
        </div>

        {/* ID input form (if no params pre-filled) */}
        {(!aId || !bId) && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-400">Enter Report IDs to compare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ label: "Report A", val: idA, set: setIdA }, { label: "Report B", val: idB, set: setIdB }].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="text-xs text-gray-500 uppercase tracking-wide">{label}</label>
                  <input value={val} onChange={e => set(e.target.value)} placeholder="UUID..."
                    className="mt-1 w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
            </div>
            <button onClick={compare} disabled={loading || !idA || !idB}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <GitCompare className="w-4 h-4" />}
              Compare
            </button>
            {error && (
              <div className="flex gap-2 text-sm text-red-400"><AlertTriangle className="w-4 h-4" />{error}</div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Results */}
        {result && (
          <motion.div className="space-y-5" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Summary banner */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4 flex flex-wrap items-center gap-4">
              <GitCompare className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <p className="flex-1 text-sm text-indigo-200">{result.summary}</p>

              {delta != null && (
                <div className={cn("flex items-center gap-1.5 text-sm font-semibold",
                  deltaDir === "up" ? "text-emerald-400" : deltaDir === "down" ? "text-red-400" : "text-gray-400")}>
                  {deltaDir === "up" ? <TrendingUp className="w-4 h-4" />
                    : deltaDir === "down" ? <TrendingDown className="w-4 h-4" />
                    : <Minus className="w-4 h-4" />}
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}% confidence
                </div>
              )}

              <span className="text-xs text-gray-500">
                {result.delta_days} days between reports
              </span>
            </div>

            {/* Side by side */}
            <div className="flex flex-col md:flex-row gap-5">
              <ReportColumn report={result.report_a} label="Report A" />
              <div className="flex-shrink-0 flex md:flex-col items-center justify-center gap-2 py-4">
                <div className="w-px h-full md:h-auto md:w-full bg-gray-800 hidden md:block" />
                <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0">
                  VS
                </div>
                <div className="w-px h-full md:h-auto md:w-full bg-gray-800 hidden md:block" />
              </div>
              <ReportColumn report={result.report_b} label="Report B" />
            </div>

            {/* Disclaimer */}
            {!result.same_module && (
              <div className="flex gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                These reports are from different modules. Statistical comparison may not be meaningful.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <ComparePageInner />
    </Suspense>
  );
}
