"use client";
/**
 * Admin Feedback Page — view, search, filter, mark open/reviewed/closed.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Star, CheckCircle2, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface FeedbackItem {
  id:         string;
  user_id:    string;
  user_email: string;
  rating:     number | null;
  message:    string | null;
  status:     string;
  created_at: string;
}
interface ListRes { items: FeedbackItem[]; total: number; total_pages: number; page: number }

const STATUS_COLORS: Record<string, string> = {
  open:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  reviewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  closed:   "bg-gray-700 text-gray-400 border-gray-600",
};

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={cn("w-3 h-3", n <= rating ? "text-amber-400 fill-amber-400" : "text-gray-700")} />
      ))}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [data,    setData]    = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [page,    setPage]    = useState(1);
  const [acting,  setActing]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: 50 };
      if (search) params.search = search;
      if (status) params.status = status;
      const r = await api.get("/admin/feedback", { params });
      setData(r.data);
    } finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, s: string) => {
    setActing(id);
    try {
      await api.patch(`/admin/feedback/${id}`, { status: s });
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(f => f.id === id ? { ...f, status: s } : f),
      } : prev);
    } finally { setActing(null); }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" /> Feedback
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{data?.total.toLocaleString() ?? "—"} total submissions</p>
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
            placeholder="Search message…"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
        </div>
        <div className="flex gap-1.5">
          {["", "open", "reviewed", "closed"].map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-medium transition-all capitalize",
                status === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}>
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
        </div>}
        {!loading && data?.items.map((f, i) => (
          <motion.div key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="text-sm font-medium text-white">{f.user_email}</span>
                  <Stars rating={f.rating} />
                  <span className={cn("text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border", STATUS_COLORS[f.status] ?? STATUS_COLORS.open)}>
                    {f.status}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(f.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {f.message || <span className="italic text-gray-600">No message</span>}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 flex-shrink-0">
                {f.status !== "reviewed" && (
                  <button onClick={() => updateStatus(f.id, "reviewed")} disabled={acting === f.id}
                    title="Mark Reviewed"
                    className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-all">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {f.status !== "closed" && (
                  <button onClick={() => updateStatus(f.id, "closed")} disabled={acting === f.id}
                    title="Close"
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-700 transition-all">
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                {f.status !== "open" && (
                  <button onClick={() => updateStatus(f.id, "open")} disabled={acting === f.id}
                    title="Reopen"
                    className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-all text-xs font-medium px-2">
                    Reopen
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {!loading && data?.items.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
            No feedback found.
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
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
  );
}
