"use client";
/**
 * Admin Users Page — search, filter, sort, suspend/activate, promote to admin.
 */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search, UserCheck, UserX, ShieldCheck, Shield, Download,
  RefreshCw, ChevronLeft, ChevronRight, Filter, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────
interface UserItem {
  id:            string;
  name:          string;
  email:         string;
  role:          string;
  is_active:     boolean;
  is_verified:   boolean;
  report_count:  number;
  created_at:    string;
  last_login_at: string | null;
}

interface ListResponse {
  items:       UserItem[];
  total:       number;
  page:        number;
  page_size:   number;
  total_pages: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Badge({ ok, labels }: { ok: boolean; labels: [string, string] }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
      ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
      {ok ? <CheckCircle2 className="w-2.5 h-2.5" /> : <UserX className="w-2.5 h-2.5" />}
      {ok ? labels[0] : labels[1]}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [data,      setData]      = useState<ListResponse | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [role,      setRole]      = useState<string>("");
  const [isActive,  setIsActive]  = useState<string>("");
  const [sortBy,    setSortBy]    = useState("created_at");
  const [sortDir,   setSortDir]   = useState("desc");
  const [page,      setPage]      = useState(1);
  const [toast,     setToast]     = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: 50, sort_by: sortBy, sort_dir: sortDir };
      if (search)   params.search    = search;
      if (role)     params.role      = role;
      if (isActive) params.is_active = isActive === "active";
      const r = await api.get("/admin/users", { params });
      setData(r.data);
    } finally { setLoading(false); }
  }, [page, search, role, isActive, sortBy, sortDir]);

  useEffect(() => { load(); }, [load]);

  const updateUser = async (id: string, patch: Record<string, any>, msg: string) => {
    setActing(id);
    try {
      const res = await api.patch(`/admin/users/${id}`, patch);
      setData(prev => prev ? {
        ...prev,
        items: prev.items.map(u => u.id === id ? { ...u, ...res.data } : u),
      } : prev);
      showToast(msg);
    } finally { setActing(null); }
  };

  const exportCsv = async () => {
    const res = await api.get("/admin/users/export", { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "mediverse_users.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-gray-800 border border-gray-700 px-4 py-2.5 rounded-xl shadow-xl text-sm text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `${data.total.toLocaleString()} users` : "Loading…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-xl border border-gray-700 text-gray-400 hover:bg-gray-800 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500" />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={isActive} onChange={e => { setIsActive(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Suspended</option>
        </select>
        <select value={`${sortBy}_${sortDir}`}
          onChange={e => { const [b, d] = e.target.value.split("_"); setSortBy(b); setSortDir(d); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-indigo-500">
          <option value="created_at_desc">Newest First</option>
          <option value="created_at_asc">Oldest First</option>
          <option value="last_login_at_desc">Last Login</option>
          <option value="name_asc">Name A-Z</option>
          <option value="email_asc">Email A-Z</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {["User", "Role", "Status", "Verified", "Reports", "Joined", "Last Login", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {data?.items.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full",
                        u.role === "admin" ? "bg-purple-500/15 text-purple-400" : "bg-gray-800 text-gray-400")}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge ok={u.is_active} labels={["Active", "Suspended"]} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge ok={u.is_verified} labels={["Verified", "Unverified"]} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{u.report_count}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(u.created_at).toLocaleDateString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("en-GB") : "Never"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Suspend / activate */}
                        <button disabled={acting === u.id}
                          onClick={() => updateUser(u.id, { is_active: !u.is_active },
                            u.is_active ? "User suspended" : "User activated")}
                          title={u.is_active ? "Suspend" : "Activate"}
                          className={cn("p-1.5 rounded-lg transition-all",
                            u.is_active ? "text-red-400 hover:bg-red-500/10" : "text-emerald-400 hover:bg-emerald-500/10")}>
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        {/* Promote / demote admin */}
                        <button disabled={acting === u.id}
                          onClick={() => updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" },
                            u.role === "admin" ? "Admin revoked" : "Promoted to admin")}
                          title={u.role === "admin" ? "Revoke Admin" : "Make Admin"}
                          className={cn("p-1.5 rounded-lg transition-all",
                            u.role === "admin" ? "text-purple-400 hover:bg-purple-500/10" : "text-gray-500 hover:bg-gray-700")}>
                          {u.role === "admin" ? <Shield className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
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
