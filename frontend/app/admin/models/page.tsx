"use client";
/**
 * Admin AI Models page — current deployed versions, accuracy metrics, activate/deactivate.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, CheckCircle2, XCircle, RefreshCw, Shield, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface ModelVersion {
  id:            string;
  module_type:   string;
  version:       string;
  description:   string | null;
  artifact_path: string | null;
  accuracy:      number | null;
  auc_roc:       number | null;
  precision:     number | null;
  recall:        number | null;
  framework:     string | null;
  is_active:     boolean;
  released_at:   string | null;
  created_at:    string;
}

const MOD_COLORS: Record<string, string> = {
  xray: "#3b82f6", ecg: "#ef4444", skin: "#f97316",
  diabetes: "#8b5cf6", prescription: "#10b981", symptoms: "#eab308",
};
const FRAMEWORK_BADGE: Record<string, string> = {
  onnx:      "bg-blue-500/10 text-blue-400",
  xgboost:   "bg-orange-500/10 text-orange-400",
  sklearn:   "bg-emerald-500/10 text-emerald-400",
  pytorch:   "bg-red-500/10 text-red-400",
};

function MetricPill({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null;
  const pct = value <= 1 ? Math.round(value * 100) : Math.round(value);
  const color = pct >= 85 ? "text-emerald-400" : pct >= 70 ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex flex-col items-center">
      <span className={cn("text-base font-bold", color)}>{pct}%</span>
      <span className="text-[9px] text-gray-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function AdminModelsPage() {
  const [models,  setModels]  = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting,  setActing]  = useState<string | null>(null);
  const [toast,   setToast]   = useState<string | null>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const load = () => {
    setLoading(true);
    api.get("/admin/models").then(r => setModels(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const toggle = async (model: ModelVersion) => {
    setActing(model.id);
    try {
      const res = await api.patch(`/admin/models/${model.id}`, { is_active: !model.is_active });
      setModels(prev => prev.map(m =>
        m.module_type === model.module_type
          ? { ...m, is_active: m.id === model.id ? res.data.is_active : false }
          : m
      ));
      showToast(model.is_active ? "Model deactivated" : `${model.module_type} v${model.version} is now active`);
    } finally { setActing(null); }
  };

  // Group by module
  const grouped: Record<string, ModelVersion[]> = {};
  for (const m of models) {
    if (!grouped[m.module_type]) grouped[m.module_type] = [];
    grouped[m.module_type].push(m);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl shadow-xl text-sm text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" /> AI Model Registry
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage deployed model versions per module</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      )}

      {!loading && Object.entries(grouped).map(([module, versions]) => {
        const color = MOD_COLORS[module] ?? "#6366f1";
        return (
          <div key={module} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Module header */}
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2"
              style={{ borderTop: `3px solid ${color}` }}>
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <h2 className="text-sm font-bold text-white capitalize">{module}</h2>
              <span className="ml-auto text-xs text-gray-500">{versions.length} version(s)</span>
            </div>

            {/* Versions */}
            <div className="divide-y divide-gray-800/50">
              {versions.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  className={cn("px-5 py-4 flex flex-wrap items-center gap-4 transition-colors",
                    m.is_active ? "bg-indigo-500/3" : "hover:bg-gray-800/20")}>

                  {/* Active badge */}
                  <div className="flex-shrink-0">
                    {m.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-800 text-gray-500 border border-gray-700 rounded-lg text-[10px] font-semibold uppercase">
                        Inactive
                      </span>
                    )}
                  </div>

                  {/* Version + framework */}
                  <div className="flex-shrink-0">
                    <p className="text-sm font-bold text-white">v{m.version}</p>
                    {m.framework && (
                      <span className={cn("text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded", FRAMEWORK_BADGE[m.framework] ?? "bg-gray-800 text-gray-400")}>
                        {m.framework}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="flex-1 text-xs text-gray-400 min-w-32">
                    {m.description ?? "—"}
                  </p>

                  {/* Metrics */}
                  <div className="flex gap-4">
                    <MetricPill label="Acc"  value={m.accuracy}  />
                    <MetricPill label="AUC"  value={m.auc_roc}   />
                    <MetricPill label="Prec" value={m.precision} />
                    <MetricPill label="Rec"  value={m.recall}    />
                  </div>

                  {/* Dates */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-600">Added</p>
                    <p className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString("en-GB")}</p>
                  </div>

                  {/* Toggle */}
                  <button onClick={() => toggle(m)} disabled={acting === m.id}
                    className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex-shrink-0",
                      m.is_active
                        ? "border border-red-500/30 text-red-400 hover:bg-red-500/10"
                        : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    )}>
                    {m.is_active ? "Deactivate" : "Activate"}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      {!loading && Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No model versions registered yet.</p>
          <p className="text-xs mt-1">Train models and register them via the ML pipeline.</p>
        </div>
      )}
    </div>
  );
}
