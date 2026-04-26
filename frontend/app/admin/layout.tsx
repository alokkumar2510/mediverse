"use client";
/**
 * Admin layout — wraps all /admin/* pages.
 * Guards: role === "admin" required (checked client-side + API enforces server-side).
 * Renders premium dark sidebar navigation.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, BarChart3, FileText, MessageSquare,
  Cpu, Activity, ScrollText, Shield, LogOut, Menu, X,
  ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const NAV = [
  { href: "/admin",           label: "Overview",     icon: LayoutDashboard },
  { href: "/admin/users",     label: "Users",        icon: Users           },
  { href: "/admin/analytics", label: "Analytics",    icon: BarChart3       },
  { href: "/admin/feedback",  label: "Feedback",     icon: MessageSquare   },
  { href: "/admin/models",    label: "AI Models",    icon: Cpu             },
  { href: "/admin/logs",      label: "Audit Logs",   icon: ScrollText      },
  { href: "/admin/health",    label: "System Health",icon: Activity        },
];

function NavItem({ href, label, icon: Icon, active }: {
  href: string; label: string; icon: any; active: boolean;
}) {
  return (
    <Link href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
        active
          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
          : "text-gray-400 hover:text-white hover:bg-gray-800/80"
      )}>
      <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
      {label}
      {active && <ChevronRight className="w-3 h-3 ml-auto text-indigo-400/60" />}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const logout    = useAuthStore(s => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Client-side guard
  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  if (!user || user.role !== "admin") return null;

  const Sidebar = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">MediVerse</p>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavItem key={item.href} {...item} active={
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
          } />
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-800/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
          </div>
          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full px-1.5 py-0.5 font-semibold uppercase">
            Admin
          </span>
        </div>
        <button onClick={() => { logout(); router.push("/login"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
        <Link href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-white hover:bg-gray-800 transition-all">
          <Zap className="w-3.5 h-3.5" /> Back to App
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col bg-gray-900 border-r border-gray-800 fixed inset-y-0 left-0 z-30">
        {Sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 inset-y-0 w-56 bg-gray-900 border-r border-gray-800 z-50">
            {Sidebar}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg text-gray-400 hover:bg-gray-800">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white">Admin Console</span>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
