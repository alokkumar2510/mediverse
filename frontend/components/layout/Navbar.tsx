"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Menu, X, Bell, User, Settings, LogOut,
  Shield, CheckCheck, Clock, AlertCircle, Info, ChevronRight,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/stores/uiStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { cn, getInitials } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/lib/dashboard";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DASHBOARD_PREFIXES = [
  "/dashboard", "/xray", "/ecg", "/skin", "/diabetes",
  "/prescription", "/symptoms", "/reports", "/settings", "/profile", "/admin",
];

function isDashboardPath(pathname: string) {
  return DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
}

function notifIcon(type: Notification["type"]) {
  const base = "w-3.5 h-3.5";
  const map = {
    info:    <Info className={`${base} text-sky-400`} />,
    success: <CheckCheck className={`${base} text-emerald-400`} />,
    warning: <AlertCircle className={`${base} text-amber-400`} />,
    error:   <AlertCircle className={`${base} text-rose-400`} />,
    report:  <Activity className={`${base} text-primary`} />,
  };
  return map[type] ?? map.info;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Public nav links ─────────────────────────────────────────────────────────

const publicLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing"  },
  { href: "/about",    label: "About"    },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TopNavbar() {
  const pathname = usePathname();
  const router   = useRouter();

  const { user, isAuthenticated, logout }             = useAuth();
  const { sidebarOpen, toggleSidebar }                = useUIStore();
  const { notifications, unreadCount, loadNotifications, markRead, markAllRead } =
    useDashboardStore();

  const isDashboard = isDashboardPath(pathname);

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);

  // Scroll detection for header shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleLogout() {
    setUserOpen(false);
    await logout();
    router.replace("/login");
  }

  const dropdownAnim: import("framer-motion").HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: -6, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit:    { opacity: 0, y: -6, scale: 0.97 },
    transition: { duration: 0.14, ease: "easeOut" as const },
  };

  return (
    <header
      id="top-navbar"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[var(--navbar-height)]",
        "flex items-center justify-between px-5 md:px-8 gap-4",
        "transition-all duration-300",
        scrolled
          ? "glass border-b border-border/60 shadow-sm"
          : "bg-transparent border-b border-transparent"
      )}
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-2 min-w-0">
        {isDashboard && (
          <button
            id="sidebar-toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
            className="p-2 -ml-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
          >
            {sidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        )}

        <Link href={isDashboard ? "/dashboard" : "/"} id="navbar-logo"
          className="flex items-center gap-2.5 group shrink-0">
          {/* Logo mark */}
          <span className="flex h-7 w-7 items-center justify-center rounded-[8px] gradient-brand shadow-brand/40 shadow-sm">
            <Activity className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-bold text-[0.95rem] tracking-tight hidden sm:block">
            Medi<span className="text-gradient">Verse</span>
          </span>
        </Link>

        {/* Public nav links */}
        {!isDashboard && (
          <nav className="hidden md:flex items-center gap-0.5 ml-5">
            {publicLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm transition-colors",
                  pathname === href
                    ? "text-foreground font-medium bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* ── Centre: search (dashboard only) ── */}
      {isDashboard && (
        <div className="hidden md:flex flex-1 max-w-[280px] mx-4">
          <div className="relative w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              id="global-search"
              type="text"
              placeholder="Search reports, modules…"
              className="w-full bg-accent/50 border border-border rounded-lg pl-8 pr-4 py-1.5 text-[0.8rem] placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-medium text-muted-foreground/50 border border-border rounded px-1 py-0.5">
              ⌘K
            </kbd>
          </div>
        </div>
      )}

      {/* ── Right ── */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        {isAuthenticated && user ? (
          <>
            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                id="notifications-btn"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
                className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    {...dropdownAnim}
                    className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
                      <span className="font-semibold text-[0.82rem]">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllRead()}
                          className="text-[0.72rem] text-primary hover:opacity-70 transition-opacity flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" /> Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto scrollbar-thin">
                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell className="w-7 h-7 mx-auto mb-2 text-muted-foreground/20" />
                          <p className="text-[0.78rem] text-muted-foreground">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            onClick={() => !n.is_read && markRead(n.id)}
                            className={cn(
                              "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/60",
                              !n.is_read && "bg-primary/4"
                            )}
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-accent shrink-0">
                              {notifIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-[0.8rem] font-medium truncate", !n.is_read && "text-foreground")}>
                                {n.title}
                              </p>
                              {n.body && (
                                <p className="text-[0.72rem] text-muted-foreground mt-0.5 line-clamp-2">
                                  {n.body}
                                </p>
                              )}
                              <p className="text-[0.68rem] text-muted-foreground/60 mt-1 flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5" /> {timeAgo(n.created_at)}
                              </p>
                            </div>
                            {!n.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User menu */}
            <div ref={userRef} className="relative ml-0.5">
              <button
                id="user-menu-btn"
                aria-label="User menu"
                onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-accent transition-colors group"
              >
                <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center ring-2 ring-primary/20">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-white">{getInitials(user.name)}</span>
                  )}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[0.8rem] font-medium leading-none">{user.name.split(" ")[0]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 capitalize">{user.role}</p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground/50 hidden lg:block transition-transform group-hover:translate-x-0.5" />
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    {...dropdownAnim}
                    className="absolute right-0 top-full mt-2 w-52 bg-popover border border-border rounded-2xl overflow-hidden shadow-xl z-50"
                  >
                    <div className="px-4 py-3 border-b border-border/60">
                      <p className="font-semibold text-[0.85rem] truncate">{user.name}</p>
                      <p className="text-[0.72rem] text-muted-foreground mt-0.5 truncate">{user.email}</p>
                      <span className="inline-flex mt-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-primary/10 text-primary">
                        {user.role}
                      </span>
                    </div>
                    <div className="p-1.5">
                      {[
                        { href: "/profile",  icon: User,     label: "Profile"  },
                        { href: "/settings", icon: Settings, label: "Settings" },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </Link>
                      ))}
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] hover:bg-accent transition-colors text-violet-500"
                        >
                          <Shield className="h-3.5 w-3.5" /> Admin Console
                        </Link>
                      )}
                    </div>
                    <div className="p-1.5 border-t border-border/60">
                      <button
                        id="logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[0.82rem] text-destructive hover:bg-destructive/8 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 ml-1">
            <Link
              href="/login"
              id="navbar-login-btn"
              className="px-4 py-2 text-[0.85rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              id="navbar-signup-btn"
              className="px-4 py-2 rounded-lg text-[0.85rem] font-semibold gradient-brand text-white shadow-brand/30 shadow-sm hover:opacity-90 transition-opacity"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}