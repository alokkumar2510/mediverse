/**
 * QuickActions — module launch cards for the dashboard.
 * Full hover animation, icon, description, keyboard accessible.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Radiation, Heart, Scan, FlaskConical,
  FileText, MessageSquare, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/xray",
    label: "X-Ray Analysis",
    desc: "Chest & bone screening",
    icon: Radiation,
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "group-hover:border-blue-500/30",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    glow: "group-hover:shadow-blue-500/10",
  },
  {
    href: "/ecg",
    label: "ECG Analysis",
    desc: "Heart rhythm analysis",
    icon: Heart,
    gradient: "from-red-500/20 to-red-600/5",
    border: "group-hover:border-red-500/30",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    glow: "group-hover:shadow-red-500/10",
  },
  {
    href: "/skin",
    label: "Skin Analysis",
    desc: "Dermatology screening",
    icon: Scan,
    gradient: "from-orange-500/20 to-orange-600/5",
    border: "group-hover:border-orange-500/30",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    glow: "group-hover:shadow-orange-500/10",
  },
  {
    href: "/diabetes",
    label: "Diabetes Check",
    desc: "Risk score prediction",
    icon: FlaskConical,
    gradient: "from-purple-500/20 to-purple-600/5",
    border: "group-hover:border-purple-500/30",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-500",
    glow: "group-hover:shadow-purple-500/10",
  },
  {
    href: "/prescription",
    label: "Prescription OCR",
    desc: "Read & digitize prescriptions",
    icon: FileText,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border: "group-hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    href: "/symptoms",
    label: "Symptom Checker",
    desc: "AI-powered triage",
    icon: MessageSquare,
    gradient: "from-yellow-500/20 to-yellow-600/5",
    border: "group-hover:border-yellow-500/30",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-500",
    glow: "group-hover:shadow-yellow-500/10",
  },
];

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const card = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function QuickActions() {
  return (
    <section aria-labelledby="quick-actions-heading">
      <h2 id="quick-actions-heading" className="text-base font-semibold mb-4">
        Run an Analysis
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {actions.map(({ href, label, desc, icon: Icon, gradient, border, iconBg, iconColor, glow }) => (
          <motion.div key={href} variants={card}>
            <Link
              href={href}
              id={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className={cn(
                "group relative flex flex-col gap-3 p-5 rounded-2xl border border-border bg-card",
                "hover:shadow-xl transition-all duration-300 overflow-hidden",
                border, glow
              )}
            >
              {/* Gradient overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity", gradient)} />

              <div className="relative flex items-center justify-between">
                <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110 duration-300", iconBg)}>
                  <Icon className={cn("h-5 w-5", iconColor)} />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
              </div>

              <div className="relative">
                <p className="font-semibold text-sm leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
