"use client";
/**
 * Report Detail Page — shows full analysis result + PDF download + star + delete.
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, Download, Trash2, Star, StarOff, Tag,
  Calendar, Shield, Activity, AlertTriangle, CheckCircle2,
  FileText, ChevronRight, Edit3, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  module_type: string;
  title: string | null;
  result_json: Record<string, any>;
  confidence: number | null;
  status: string;
  is_starred: boolean;
  is_archived: boolean;
  tags: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Module config ──────────────────────────────────────────────────────────────
const MOD_LABELS: Record<string, { label: string; color: string }> = {
  xray:         { label: "Chest X-Ray Analysis",    color: "#3b82f6" },
  ecg:          { label: "ECG Rhythm Analysis",     color: "#ef4444" },
  skin:         { label: "Skin Lesion Screening",   color: "#f97316" },
  diabetes:     { label: "Diabetes Risk Assessment",color: "#8b5cf6" },
  prescription: { label: "Prescription OCR",        color: "#10b981" },
  symptoms:     { label: "Symptom Analysis",        color: "#eab308" },
};

// ── Result field renderer ──────────────────────────────────────────────────────
const SKIP_KEYS = new Set([
  "disclaimer", "is_demo", "report_id", "all_probabilities",
  "r_peaks", "grad_cam_base64", "heatmap_base64",
]);
const PRIORITY = [
  ["rhythm_type",    "Rhythm Detected"],
  ["prediction",     "Prediction"],
  ["risk_level",     "Risk Level"],
  ["severity",       "Severity"],
  ["heart_rate_bpm", "Heart Rate"],
  ["signal_quality", "Signal Quality"],
  ["recommendation", "Recommendation"],
  ["risk_flags",     "Risk Flags"],
  ["medications",    "Medications"],
  ["conditions",     "Conditions"],
  ["diseases",       "Detected Conditions"],
  ["body_part",      "Body Part"],
];

function ResultValue({ value, field }: { value: any; field: string }) {
  if (value === null || value === undefined) return <span className="text-gray-500">—</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-500">None</span>;
    if (field === "risk_flags") {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((v, i) => (
            <span key={i} className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium">
              {v}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-xs">{String(v)}</span>
        ))}
      </div>
    );
  }
  if (typeof value === "boolean") {
    return value
      ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Yes</span>
      : <span className="text-gray-500">No</span>;
  }
  if (field === "recommendation") {
    return <p className="text-sm text-gray-200 leading-relaxed">{String(value)}</p>;
  }
  if (typeof value === "number") {
    return <span className="font-mono text-white">{value}</span>;
  }
  return <span className="text-gray-200">{String(value)}</span>;
}

function ResultRow({ label, value, field }: { label: string; value: any; field: string }) {
  return (
    <div className="flex gap-4 py-3 border-b border-gray-800/60 last:border-0">
      <dt className="w-40 flex-shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="flex-1 min-w-0">
        <ResultValue value={value} field={field} />
      </dd>
    </div>
  );
}

// ── Notes editor ──────────────────────────────────────────────────────────────
function NotesEditor({ reportId, initial, onSave }: {
  reportId: string; initial: string | null; onSave: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal]         = useState(initial ?? "");

  const save = async () => {
    await api.patch(`/reports/${reportId}`, { notes: val });
    onSave(val);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <p className="flex-1 text-sm text-gray-400 italic min-h-[24px]">
          {val || "No clinical notes added."}
        </p>
        <button onClick={() => setEditing(true)} className="text-gray-600 hover:text-indigo-400 transition-colors">
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea value={val} onChange={e => setVal(e.target.value)} rows={3}
        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-indigo-500" />
      <div className="flex gap-2">
        <button onClick={save} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors">
          <Check className="w-3 h-3" /> Save
        </button>
        <button onClick={() => setEditing(false)} className="px-3 py-1.5 border border-gray-700 rounded-lg text-xs text-gray-400 hover:bg-gray-800 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Tag editor ────────────────────────────────────────────────────────────────
function TagEditor({ reportId, initial, onSave }: {
  reportId: string; initial: string[]; onSave: (t: string[]) => void;
}) {
  const [tags, setTags] = useState(initial);
  const [input, setInput] = useState("");

  const add = async (tag: string) => {
    if (!tag.trim() || tags.includes(tag)) return;
    const next = [...tags, tag.trim()];
    await api.patch(`/reports/${reportId}`, { tags: next });
    setTags(next); onSave(next); setInput("");
  };
  const remove = async (tag: string) => {
    const next = tags.filter(t => t !== tag);
    await api.patch(`/reports/${reportId}`, { tags: next });
    setTags(next); onSave(next);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(t => (
          <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-xs">
            {t}
            <button onClick={() => remove(t)} className="hover:text-red-400 transition-colors"><X className="w-2.5 h-2.5" /></button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-gray-600">No tags</span>}
      </div>
      <div className="flex gap-1.5">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && add(input)}
          placeholder="Add tag…"
          className="flex-1 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
        <button onClick={() => add(input)} className="px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs text-gray-400 hover:bg-gray-700 transition-colors">
          + Add
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportDetailPage() {
  const params         = useParams<{ id: string }>();
  const router         = useRouter();
  const [report, setReport]   = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    api.get(`/reports/${params.id}`)
      .then(r => setReport(r.data))
      .finally(() => setLoading(false));
  }, [params.id]);

  const toggleStar = async () => {
    if (!report) return;
    await api.patch(`/reports/${report.id}`, { is_starred: !report.is_starred });
    setReport(r => r ? { ...r, is_starred: !r.is_starred } : r);
    showToast(report.is_starred ? "Removed from starred" : "Starred ⭐");
  };

  const downloadPdf = async () => {
    try {
      const res = await api.get(`/reports/${params.id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a"); a.href = url;
      a.download = `mediverse-${params.id.slice(0, 8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
      showToast("PDF downloaded ✓");
    } catch { showToast("PDF generation failed"); }
  };

  const deleteReport = async () => {
    if (!confirm("Delete this report? This cannot be undone.")) return;
    await api.delete(`/reports/${params.id}`);
    router.push("/reports");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="w-12 h-12 text-gray-600" />
        <p className="text-gray-400">Report not found</p>
        <Link href="/reports" className="text-indigo-400 text-sm hover:text-indigo-300">← Back to Reports</Link>
      </div>
    );
  }

  const mod = MOD_LABELS[report.module_type] ?? { label: report.module_type, color: "#6366f1" };
  const pct = report.confidence != null
    ? (report.confidence <= 1 ? Math.round(report.confidence * 100) : Math.round(report.confidence))
    : null;
  const confColor = pct == null ? "text-gray-400" : pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";

  // Build result rows
  const shown = new Set<string>();
  const rows: Array<{ key: string; label: string; value: any }> = [];
  for (const [key, label] of PRIORITY) {
    const v = report.result_json[key];
    if (v !== undefined && v !== null) { rows.push({ key, label, value: v }); shown.add(key); }
  }
  for (const [key, value] of Object.entries(report.result_json)) {
    if (!shown.has(key) && !SKIP_KEYS.has(key) && !key.endsWith("_base64")) {
      rows.push({ key, label: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), value });
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl shadow-xl text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </motion.div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/reports" className="hover:text-white transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Reports
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-300">{report.title ?? "Report Detail"}</span>
        </div>

        {/* Header card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border"
                  style={{ color: mod.color, borderColor: `${mod.color}30`, background: `${mod.color}10` }}>
                  {mod.label}
                </span>
                <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full",
                  report.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-800 text-gray-400")}>
                  {report.status}
                </span>
              </div>
              <h1 className="text-2xl font-bold mb-1 truncate">
                {report.title ?? `${mod.label} Report`}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />
                  {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {pct !== null && (
                  <span className={cn("flex items-center gap-1.5 font-semibold", confColor)}>
                    <Shield className="w-3.5 h-3.5" />{pct}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={toggleStar} title={report.is_starred ? "Unstar" : "Star"}
                className={cn("p-2.5 rounded-xl border transition-all",
                  report.is_starred ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400" : "border-gray-700 text-gray-500 hover:bg-gray-800")}>
                <Star className={cn("w-4 h-4", report.is_starred && "fill-yellow-400")} />
              </button>
              <button onClick={downloadPdf}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button onClick={deleteReport} title="Delete report"
                className="p-2.5 rounded-xl border border-gray-700 text-gray-500 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Confidence bar */}
          {pct !== null && (
            <div className="mt-5 pt-4 border-t border-gray-800">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>AI Confidence</span>
                <span className={confColor + " font-semibold"}>{pct}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500")}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Analysis Results
          </h2>
          <dl className="divide-y divide-gray-800/60">
            {rows.map(({ key, label, value }) => (
              <ResultRow key={key} label={label} value={value} field={key} />
            ))}
          </dl>
        </motion.div>

        {/* Tags + Notes */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags
            </h3>
            <TagEditor
              reportId={report.id}
              initial={report.tags}
              onSave={t => setReport(r => r ? { ...r, tags: t } : r)}
            />
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Clinical Notes
            </h3>
            <NotesEditor
              reportId={report.id}
              initial={report.notes}
              onSave={n => setReport(r => r ? { ...r, notes: n } : r)}
            />
          </div>
        </motion.div>

        {/* Disclaimer */}
        {report.result_json.disclaimer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex gap-3 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400/80 leading-relaxed">{report.result_json.disclaimer}</p>
          </motion.div>
        )}

        {/* Back + Compare */}
        <div className="flex items-center justify-between pt-2">
          <Link href="/reports"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> All Reports
          </Link>
          <Link href={`/reports/compare?a=${report.id}`}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            Compare with another →
          </Link>
        </div>
      </div>
    </div>
  );
}