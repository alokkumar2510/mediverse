"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity, ClipboardList, TrendingUp, Zap,
  Brain, CalendarCheck, Target, ArrowRight,
  Radiation, Heart, Scan, FlaskConical, FileText, MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardStore } from "@/stores/dashboardStore";
import { StatWidget } from "@/components/dashboard/StatWidget";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentReports";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { StatCardSkeletonGrid } from "@/components/shared/Skeletons";

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function fmtConf(v: number | null) {
  if (v == null) return "—";
  return `${Math.round(v * 100)}%`;
}

function fmtModule(m: string | null) {
  if (!m) return "—";
  const labels: Record<string, string> = {
    xray: "X-Ray", ecg: "ECG", skin: "Skin",
    diabetes: "Diabetes", prescription: "Rx OCR", symptoms: "Symptom",
  };
  return labels[m] ?? m;
}

/* ── Animation ───────────────────────────────────────────────────────────────── */

const fadeUp: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: "easeOut", delay: i * 0.06 },
  }),
};


/* ── Quick module links ───────────────────────────────────────────────────────── */

const quickModules = [
  { href: "/xray",         icon: Radiation,      label: "X-Ray",      color: "hsl(196,88%,42%)" },
  { href: "/ecg",          icon: Heart,          label: "ECG",         color: "hsl(350,82%,58%)" },
  { href: "/skin",         icon: Scan,           label: "Skin",        color: "hsl(28,88%,56%)"  },
  { href: "/diabetes",     icon: FlaskConical,   label: "Diabetes",    color: "hsl(262,72%,60%)" },
  { href: "/prescription", icon: FileText,       label: "Rx OCR",      color: "hsl(158,50%,44%)" },
  { href: "/symptoms",     icon: MessageSquare,  label: "Symptoms",    color: "hsl(38,88%,54%)"  },
];

/* ── Component ───────────────────────────────────────────────────────────────── */

export function DashboardView() {
  const { user } = useAuth();
  const {
    summary, activity, metrics,
    loadingSummary, loadingActivity, loadingMetrics,
    loadAll,
  } = useDashboardStore();

  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    loadAll().catch(() => setActivityError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8 pb-12">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <p className="text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>
            {greeting()}, {firstName}
          </h1>
          <p className="text-[0.85rem] text-muted-foreground mt-1">
            Here&apos;s your health intelligence overview.
          </p>
        </div>

        {summary?.last_scan_at && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card text-[0.8rem] text-muted-foreground shrink-0 shadow-xs">
            <CalendarCheck className="h-3.5 w-3.5 text-primary" />
            Last scan:{" "}
            <span className="text-foreground font-medium">
              {new Date(summary.last_scan_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short",
              })}
            </span>
          </div>
        )}
      </motion.div>

      {/* ── KPI widgets ── */}
      {loadingSummary && !summary ? (
        <StatCardSkeletonGrid count={4} />
      ) : (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          variants={{ show: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
          initial="hidden"
          animate="show"
        >
          <StatWidget
            id="kpi-total"
            index={0}
            icon={Activity}
            label="Total Analyses"
            value={summary?.total_reports ?? "—"}
            sub="Lifetime"
          />
          <StatWidget
            id="kpi-month"
            index={1}
            icon={CalendarCheck}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-500"
            label="This Month"
            value={summary?.reports_this_month ?? "—"}
            sub="Analyses"
          />
          <StatWidget
            id="kpi-confidence"
            index={2}
            icon={Target}
            iconBg="bg-violet-500/10"
            iconColor="text-violet-500"
            label="Avg Confidence"
            value={fmtConf(summary?.avg_confidence ?? null)}
            sub="All reports"
          />
          <StatWidget
            id="kpi-last-module"
            index={3}
            icon={Brain}
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
            label="Last Module"
            value={fmtModule(summary?.last_module_type ?? null)}
            sub={summary?.plan === "free" ? "Free plan" : "Pro plan"}
          />
        </motion.div>
      )}

      {/* ── Quick module launcher ── */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.05 } }, hidden: {} }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 sm:grid-cols-6 gap-2.5"
      >
        {quickModules.map(({ href, icon: Icon, label, color }, i) => (
          <motion.div
            key={href}
            variants={fadeUp}
            custom={i}
          >
            <Link
              href={href}
              className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div
                className="h-9 w-9 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: `${color}12` }}
              >
                <Icon className="h-4.5 w-4.5" style={{ color }} strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                {label}
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Chart + health score ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ActivityChart metrics={metrics} loading={loadingMetrics && !metrics} />
        </div>

        {/* Health Score card — coming soon, but premium not placeholder-ish */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[0.8rem] font-semibold">Health Score</p>
              <p className="text-[0.72rem] text-muted-foreground mt-0.5">Aggregate risk profile</p>
            </div>
            <div className="h-8 w-8 rounded-xl bg-primary/8 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" strokeWidth={1.8} />
            </div>
          </div>

          {/* Donut placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="relative h-28 w-28">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="hsl(var(--muted))" strokeWidth="10" />
                <circle cx="50" cy="50" r="40" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset="175.8" /* ~30% */
                  strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xl font-bold tracking-tight">—</p>
                <p className="text-[9px] text-muted-foreground">pending</p>
              </div>
            </div>

            <div className="w-full space-y-1.5">
              {["X-Ray", "ECG", "Skin", "Diabetes", "Other"].map((m, i) => (
                <div key={m} className="flex items-center gap-2">
                  <div className={`h-1 flex-1 rounded-full ${i < 2 ? "bg-primary" : "bg-muted"}`} />
                  <span className="text-[9px] text-muted-foreground w-12 text-right truncate">{m}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Complete 3+ modules to unlock
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Quick actions ── */}
      <QuickActions />

      {/* ── Recent activity ── */}
      <RecentActivity
        data={activity}
        loading={loadingActivity && activity.length === 0}
        error={activityError}
        onRetry={() => {
          setActivityError(false);
          loadAll().catch(() => setActivityError(true));
        }}
      />

      {/* ── Footer tip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-primary/5 border border-primary/10"
      >
        <ClipboardList className="h-4 w-4 text-primary shrink-0" />
        <p className="text-[0.8rem] text-muted-foreground">
          <span className="font-semibold text-foreground">Tip:</span>{" "}
          All analyses are saved in{" "}
          <Link href="/reports" className="text-primary hover:underline underline-offset-3">
            My Reports
          </Link>{" "}
          and can be exported as PDF.
        </p>
        <Link href="/reports" className="ml-auto shrink-0 flex items-center gap-1 text-[0.78rem] text-primary hover:underline underline-offset-3 font-medium">
          View reports <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>

    </div>
  );
}
