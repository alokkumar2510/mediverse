"use client";
/**
 * Admin Audit Logs — paginated request log table with endpoint + error filters.
 */
import { useEffect, useState, useCallback } from "react";
import { ScrollText, Search, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface LogItem {
  id:          string;
  user_id:     string | null;
  endpoint:    string;
  method:      string;
  status_code: number | null;
  latency_ms:  number | null;
  ip_address:  string | null;
  created_at:  string;
}
interface ListRes { items: LogItem[]; total: number; total_pages: number; page: number }

function StatusBadge({ code }: { code: number | null }) {
  if (!code) return <span className="text-gray-600">—</span>;
  const color = code < 300 ? "text-emerald-400 bg-emerald-500/10" :
                code < 400 ? "text-blue-400 bg-blue-500/10" :
                code < 500 ? "text-amber-400 bg-amber-500/10" :
                             "text-red-400 bg-red-500/10";
  return <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded", color)}>{code}</span>;
}

const METHOD_COLORS: Record<string, string> = {
  GET:    "text-emerald-400", POST:   "text-blue-400",
  PATCH:  "text-amber-400",   DELETE: "text-red-400",
};

export default function AdminLogsPage() {
  const [data,       setData]       = useState<ListRes | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [page,       setPage]       = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: 100 };
      if (search)     params.endpoint    = search;
      if (errorsOnly) params.errors_only = true;
      const r = await api.get("/admin/logs", { params });
      setData(r.data);
    } finally { setLoading(false); }
  }, [page, search, errorsOnly]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-indigo-400" /> Audit Logs
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.total.toLocaleString() ?? "—"} total requests logged</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex-1 min-w-48 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by endpoint…"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
        </div>
        <button onClick={() => { setErrorsOnly(e => !e); setPage(1); }}
          className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
            errorsOnly ? "bg-red-500/15 text-red-400 border-red-500/30" : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700")}>
          <AlertTriangle className="w-3.5 h-3.5" /> Errors Only
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {["Time", "Method", "Endpoint", "Status", "Latency", "IP", "User"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {data?.items.map((l, i) => (
                  <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.005 }}
                    className={cn("hover:bg-gray-800/30 transition-colors",
                      l.status_code && l.status_code >= 500 ? "bg-red-500/5" : "")}>
                    <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap font-mono">
                      {new Date(l.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      <span className="block text-[10px] text-gray-700">
                        {new Date(l.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold">
                      <span className={METHOD_COLORS[l.method] ?? "text-gray-400"}>{l.method}</span>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <span className="text-xs text-gray-300 font-mono truncate block">{l.endpoint}</span>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge code={l.status_code} /></td>
                    <td className="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">
                      {l.latency_ms != null ? `${l.latency_ms}ms` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 font-mono">{l.ip_address ?? "—"}</td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-600 font-mono">
                      {l.user_id ? l.user_id.slice(0, 8) + "…" : "anon"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && data?.items.length === 0 && (
          <div className="text-center py-12 text-gray-600">No logs match your filters.</div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 text-sm text-gray-400">
            <span>Page {data.page} of {data.total_pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(data.total_pages, p + 1))} disabled={page >= data.total_pages}
                className="p-1.5 rounded-lg border border-gray-700 hover:bg-gray-800 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
