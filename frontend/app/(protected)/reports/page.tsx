"use client";
/**
 * Reports History Page — premium SaaS table with search, filter, sort, star, PDF.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Search, Star, StarOff,
  Download, Trash2, RefreshCw, Filter, ChevronDown,
  ChevronUp, Archive, Activity, Radiation, Heart,
  Scan, FlaskConical, FileText, MessageSquare, SlidersHorizontal,
  GitCompare, X, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  module_type: string;
  title: string | null;
  confidence: number | null;
  status: string;
  is_starred: boolean;
  is_archived: boolean;
  tags: string[];
  created_at: string;
}
interface ListResponse {
  items: Report[];
  total: number;
  page: number;
  total_pages: number;
}

// ── Module config ──────────────────────────────────────────────────────────────
const MOD: Record<string, { label: string; Icon: typeof Activity; color: string; bg: string }> = {
  xray:         { label: "X-Ray",        Icon: Radiation,     color: "text-blue-400",   bg: "bg-blue-500/10"   },
  ecg:          { label: "ECG",          Icon: Heart,         color: "text-red-400",    bg: "bg-red-500/10"    },
  skin:         { label: "Skin",         Icon: Scan,          color: "text-orange-400", bg: "bg-orange-500/10" },
  diabetes:     { label: "Diabetes",     Icon: FlaskConical,  color: "text-purple-400", bg: "bg-purple-500/10" },
  prescription: { label: "Prescription", Icon: FileText,      color: "text-emerald-400",bg: "bg-emerald-500/10"},
  symptoms:     { label: "Symptoms",     Icon: MessageSquare, color: "text-yellow-400", bg: "bg-yellow-500/10" },
};
const ALL_MODS = ["all", ...Object.keys(MOD)] as const;
type Mod = typeof ALL_MODS[number];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtConf(v: number | null) {
  if (v == null) return null;
  return v <= 1 ? Math.round(v * 100) : Math.round(v);
}
function ConfBar({ v }: { v: number | null }) {
  const pct = fmtConf(v);
  if (pct == null) return <span className="text-xs text-gray-500">—</span>;
  const col = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div className={cn("h-full rounded-full", col)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums">{pct}%</span>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="divide-y divide-gray-800">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="w-9 h-9 rounded-xl bg-gray-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-800 rounded w-48 animate-pulse" />
            <div className="h-2.5 bg-gray-800/60 rounded w-24 animate-pulse" />
          </div>
          <div className="hidden md:flex gap-6">
            <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-20 animate-pulse" />
            <div className="h-3 bg-gray-800 rounded w-16 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function Empty({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
        <Activity className="w-8 h-8 text-gray-600" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">
        {filtered ? "No matching reports" : "No reports yet"}
      </h3>
      <p className="text-sm text-gray-500 max-w-xs">
        {filtered
          ? "Try adjusting your filters or search query."
          : "Run an AI analysis from any module to see results here."}
      </p>
      {!filtered && (
        <Link href="/dashboard"
          className="mt-5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}

// ── Compare bar ────────────────────────────────────────────────────────────────
function CompareBar({ selected, onClear, onCompare }: {
  selected: string[]; onClear: () => void; onCompare: () => void;
}) {
  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 border border-indigo-500/30 rounded-2xl px-5 py-3 shadow-2xl shadow-indigo-500/20"
        >
          <span className="text-sm text-white font-medium">
            {selected.length} selected
          </span>
          {selected.length === 2 && (
            <button onClick={onCompare}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
              <GitCompare className="w-3.5 h-3.5" /> Compare
            </button>
          )}
          {selected.length < 2 && (
            <span className="text-xs text-gray-400">Select one more to compare</span>
          )}
          <button onClick={onClear} className="p-1 text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

export default function ReportsPage() {
  const [data, setData]           = useState<ListResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [modFilter, setMod]       = useState<Mod>("all");
  const [search, setSearch]       = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy]       = useState("date");
  const [sortDir, setSortDir]     = useState<"asc"|"desc">("desc");
  const [page, setPage]           = useState(1);
  const [starredOnly, setStarred] = useState(false);
  const [compareIds, setCompare]  = useState<string[]>([]);
  const [toasting, setToasting]   = useState<string | null>(null);
  const searchTimer = useRef<NodeJS.Timeout>();

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
  }, [search]);

  const fetch = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(PAGE_SIZE),
        sort_by: sortBy,
        sort_dir: sortDir,
        ...(modFilter !== "all" ? { module_type: modFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(starredOnly ? { starred_only: "true" } : {}),
      });
      const res = await api.get(`/reports?${params}`);
      setData(res.data);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [page, modFilter, debouncedSearch, sortBy, sortDir, starredOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  const toast = (msg: string) => { setToasting(msg); setTimeout(() => setToasting(null), 2500); };

  const toggleStar = async (id: string, current: boolean) => {
    try {
      await api.patch(`/reports/${id}`, { is_starred: !current });
      setData(d => d ? { ...d, items: d.items.map(r => r.id === id ? { ...r, is_starred: !current } : r) } : d);
      toast(current ? "Removed from starred" : "Added to starred ⭐");
    } catch { toast("Failed to update"); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this report permanently?")) return;
    try {
      await api.delete(`/reports/${id}`);
      setData(d => d ? { ...d, items: d.items.filter(r => r.id !== id), total: d.total - 1 } : d);
      toast("Report deleted");
    } catch { toast("Delete failed"); }
  };

  const downloadPdf = async (id: string, title: string) => {
    try {
      const res = await api.get(`/reports/${id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a   = document.createElement("a");
      a.href = url; a.download = `mediverse-${id.slice(0, 8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast("PDF downloaded ✓");
    } catch { toast("PDF generation failed"); }
  };

  const toggleCompare = (id: string) => {
    setCompare(prev =>
      prev.includes(id) ? prev.filter(x => x !== id)
      : prev.length < 2 ? [...prev, id]
      : prev
    );
  };

  const total = data?.total ?? 0;
  const totalPages = data?.total_pages ?? 0;
  const reports = data?.items ?? [];
  const isFiltered = modFilter !== "all" || !!debouncedSearch || starredOnly;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Toast */}
      <AnimatePresence>
        {toasting && (
          <motion.div
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl shadow-xl text-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toasting}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"
              className="p-2 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Reports</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {total > 0 ? `${total} analyses stored securely` : "All AI analyses stored securely"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setStarred(s => !s)}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
                starredOnly ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400" : "border-gray-700 text-gray-400 hover:bg-gray-800")}>
              <Star className="w-3.5 h-3.5" /> Starred
            </button>
            <button onClick={fetch}
              className="p-2 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors" title="Refresh">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer">
              <option value="date">Sort: Date</option>
              <option value="confidence">Sort: Confidence</option>
              <option value="module">Sort: Module</option>
            </select>
            <button onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              className="p-2.5 rounded-xl border border-gray-700 hover:bg-gray-800 transition-colors" title="Toggle direction">
              {sortDir === "desc" ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Module filter chips */}
        <div className="flex gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-500 self-center shrink-0" />
          {ALL_MODS.map(m => {
            const cfg = m === "all" ? null : MOD[m];
            return (
              <button key={m}
                onClick={() => { setMod(m); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                  modFilter === m
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                    : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                )}>
                {cfg?.label ?? "All"}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
          {/* Column headers */}
          {!loading && reports.length > 0 && (
            <div className="hidden md:grid grid-cols-[36px_1fr_120px_100px_100px_auto] gap-4 px-5 py-3 border-b border-gray-800 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <span />
              <span>Report</span>
              <span>Module</span>
              <span>Confidence</span>
              <span>Date</span>
              <span>Actions</span>
            </div>
          )}

          {loading ? <Skeleton />
          : error ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <p className="text-gray-400">Failed to load reports</p>
              <button onClick={fetch} className="text-sm text-indigo-400 hover:text-indigo-300">Retry</button>
            </div>
          ) : reports.length === 0 ? <Empty filtered={isFiltered} />
          : (
            <div className="divide-y divide-gray-800/60">
              {reports.map((r, i) => {
                const mod = MOD[r.module_type] ?? { label: r.module_type, Icon: Activity, color: "text-gray-400", bg: "bg-gray-800" };
                const Icon = mod.Icon;
                const pct = fmtConf(r.confidence);
                const isCompareSelected = compareIds.includes(r.id);

                return (
                  <motion.div key={r.id}
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                    className={cn(
                      "grid grid-cols-[36px_1fr] md:grid-cols-[36px_1fr_120px_100px_100px_auto] items-center gap-4 px-5 py-4 hover:bg-gray-800/40 transition-colors group",
                      isCompareSelected && "bg-indigo-500/5 border-l-2 border-l-indigo-500"
                    )}>

                    {/* Module icon */}
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", mod.bg)}>
                      <Icon className={cn("w-4 h-4", mod.color)} />
                    </div>

                    {/* Title + status */}
                    <div className="min-w-0">
                      <Link href={`/reports/${r.id}`}
                        className="text-sm font-medium text-white hover:text-indigo-300 transition-colors truncate block">
                        {r.title ?? `${mod.label} Analysis`}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn("text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full",
                          r.status === "completed" ? "bg-emerald-500/10 text-emerald-400"
                          : r.status === "failed" ? "bg-red-500/10 text-red-400"
                          : "bg-amber-500/10 text-amber-400")}>
                          {r.status}
                        </span>
                        {r.is_starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                        {r.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[10px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                        <span className="text-xs text-gray-600 md:hidden">{fmtDate(r.created_at)}</span>
                      </div>
                    </div>

                    {/* Module badge */}
                    <span className={cn("hidden md:inline-flex px-2.5 py-1 rounded-xl text-xs font-semibold w-fit", mod.bg, mod.color)}>
                      {mod.label}
                    </span>

                    {/* Confidence */}
                    <div className="hidden md:block"><ConfBar v={r.confidence} /></div>

                    {/* Date */}
                    <span className="hidden md:block text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(r.created_at)}
                    </span>

                    {/* Actions */}
                    <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/reports/${r.id}`}
                        className="px-2.5 py-1.5 rounded-lg text-xs border border-gray-700 hover:border-indigo-500/50 hover:bg-gray-800 transition-all text-gray-300">
                        Open
                      </Link>
                      <button onClick={() => downloadPdf(r.id, r.title ?? "")} title="Download PDF"
                        className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggleStar(r.id, r.is_starred)} title={r.is_starred ? "Unstar" : "Star"}
                        className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors">
                        {r.is_starred
                          ? <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          : <Star className="w-3.5 h-3.5 text-gray-500" />}
                      </button>
                      <button onClick={() => toggleCompare(r.id)} title="Select for compare"
                        className={cn("p-1.5 rounded-lg border transition-colors",
                          isCompareSelected ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-gray-700 text-gray-500 hover:bg-gray-800")}>
                        <GitCompare className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteReport(r.id)} title="Delete"
                        className="p-1.5 rounded-lg border border-gray-700 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors text-gray-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} reports</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-xl text-sm border border-gray-700 hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page + i - 2;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={cn("w-8 h-8 rounded-xl text-sm border transition-all",
                      pg === page ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-gray-700 text-gray-400 hover:bg-gray-800")}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl text-sm border border-gray-700 hover:bg-gray-800 disabled:opacity-30 transition-colors flex items-center gap-1.5">
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compare floating bar */}
      <CompareBar
        selected={compareIds}
        onClear={() => setCompare([])}
        onCompare={() => {
          if (compareIds.length === 2)
            window.location.href = `/reports/compare?a=${compareIds[0]}&b=${compareIds[1]}`;
        }}
      />
    </div>
  );
}