"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Radiation, Heart, Scan, FlaskConical,
  FileText, MessageSquare, ClipboardList, Settings, User,
  Shield, X, Activity, type LucideIcon,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* ── Navigation structure ────────────────────────────────────────────────────── */

type NavItem = { href: string; label: string; icon: LucideIcon; id: string; color?: string };
type NavSection = { section: string; items: NavItem[] };

const navItems: NavSection[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard",    label: "Dashboard",       icon: LayoutDashboard, id: "nav-dashboard" },
    ],
  },
  {
    section: "AI Modules",
    items: [
      { href: "/xray",         label: "X-Ray Analysis",  icon: Radiation,       id: "nav-xray",      color: "text-sky-500"     },
      { href: "/ecg",          label: "ECG Analysis",    icon: Heart,           id: "nav-ecg",       color: "text-rose-500"    },
      { href: "/skin",         label: "Skin Analysis",   icon: Scan,            id: "nav-skin",      color: "text-orange-500"  },
      { href: "/diabetes",     label: "Diabetes Risk",   icon: FlaskConical,    id: "nav-diabetes",  color: "text-violet-500"  },
      { href: "/prescription", label: "Prescription OCR",icon: FileText,        id: "nav-rx",        color: "text-emerald-500" },
      { href: "/symptoms",     label: "Symptom Checker", icon: MessageSquare,   id: "nav-symptoms",  color: "text-amber-500"   },
    ],
  },
  {
    section: "Records",
    items: [
      { href: "/reports",      label: "My Reports",      icon: ClipboardList,   id: "nav-reports"  },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/profile",      label: "Profile",         icon: User,            id: "nav-profile"  },
      { href: "/settings",     label: "Settings",        icon: Settings,        id: "nav-settings" },
    ],
  },
];


interface SidebarNavProps {
  className?: string;
}

export function SidebarNav({ className }: SidebarNavProps) {
  const pathname                        = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { user }                        = useAuth();
  const isAdmin                         = user?.role === "admin";

  function close() { setSidebarOpen(false); }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={close}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        id="dashboard-sidebar"
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320, mass: 0.8 }}
        className={cn(
          "fixed left-0 top-[var(--navbar-height)] z-40",
          "h-[calc(100dvh-var(--navbar-height))]",
          "w-[var(--sidebar-width)] flex flex-col",
          "bg-card border-r border-border/60",
          "overflow-y-auto scrollbar-thin",
          className
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full py-4">

          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-[6px] gradient-brand">
                <Activity className="h-3 w-3 text-white" strokeWidth={2.5} />
              </span>
              <span className="font-bold text-sm tracking-tight">
                Medi<span className="text-gradient">Verse</span>
              </span>
            </div>
            <button
              onClick={close}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Nav sections */}
          <nav className="flex-1 px-3 space-y-5">
            {navItems.map(({ section, items }) => (
              <div key={section}>
                <p className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50 select-none">
                  {section}
                </p>
                <ul className="space-y-0.5">
                  {items.map(({ href, label, icon: Icon, id, color }) => {
                    const isActive =
                      pathname === href || pathname.startsWith(`${href}/`);

                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          id={id}
                          onClick={() => {
                            if (window.innerWidth < 768) close();
                          }}
                          className={cn(
                            "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.82rem] font-medium transition-all duration-150 group",
                            isActive
                              ? "text-primary bg-primary/8"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/70"
                          )}
                        >
                          {/* Active pill */}
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active-pill"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full gradient-brand"
                              transition={{ type: "spring", damping: 28, stiffness: 380 }}
                            />
                          )}

                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-primary"
                                : color ?? "text-muted-foreground group-hover:text-foreground"
                            )}
                            strokeWidth={isActive ? 2.2 : 1.8}
                          />
                          <span className="truncate">{label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Admin link — at bottom */}
          {isAdmin && (
            <div className="px-3 pt-3 mt-2 border-t border-border/60">
              <Link
                href="/admin"
                id="nav-admin"
                onClick={() => {
                  if (window.innerWidth < 768) close();
                }}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[0.82rem] font-medium transition-all",
                  pathname.startsWith("/admin")
                    ? "text-violet-600 dark:text-violet-400 bg-violet-500/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/70"
                )}
              >
                <Shield className="h-4 w-4 text-violet-500" strokeWidth={1.8} />
                Admin Console
              </Link>
            </div>
          )}

          {/* User info footer */}
          {user && (
            <div className="px-3 pt-3 pb-1 mt-2 border-t border-border/60">
              <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-accent/40">
                <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[0.78rem] font-semibold truncate leading-none">{user.name}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 truncate capitalize">{user.role} plan</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.aside>
    </>
  );
}