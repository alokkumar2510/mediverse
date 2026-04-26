/**
 * Shared ModulePageShell — wraps all AI module pages with consistent layout.
 * Accepts upload area + results panel as children.
 */
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulePageShellProps {
  iconNode: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  badgeBg?: string;
  children: React.ReactNode;
}

export function ModulePageShell({
  iconNode,
  title,
  description,
  badge = "Wave 2",
  badgeBg = "bg-primary/10 text-primary",
  children,
}: ModulePageShellProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start gap-4"
      >
        <Link
          href="/dashboard"
          id="module-back-btn"
          className="mt-1 p-2 rounded-xl border border-border hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="shrink-0">
            {iconNode}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", badgeBg)}>
                {badge}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">{description}</p>
          </div>
        </div>
      </motion.div>

      {children}
    </div>
  );
}

// ── Coming-soon placeholder card ───────────────────────────────────────────────

interface ComingSoonCardProps {
  features: string[];
  timeline?: string;
}

export function ComingSoonCard({ features, timeline = "Wave 2 — In development" }: ComingSoonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border-2 border-dashed border-border bg-card/40 p-10 flex flex-col items-center text-center gap-6"
    >
      <div className="space-y-1">
        <p className="font-semibold text-base">Module in Development</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          {timeline}. This module will be fully interactive once ready.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md text-left">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      <Link
        href="/dashboard"
        className="px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow hover:shadow-md transition-shadow"
      >
        Back to Dashboard
      </Link>
    </motion.div>
  );
}
