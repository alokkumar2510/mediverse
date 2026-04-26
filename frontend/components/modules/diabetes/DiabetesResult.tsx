"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RiskFactor {
  factor: string;
  value: number;
  impact: "high" | "moderate" | "low";
  advice: string | null;
}

export interface DiabetesPredictResponse {
  risk_pct: number;
  risk_tier: "low" | "moderate" | "high";
  confidence: number;
  top_risk_factors: RiskFactor[];
  suggestions: string[];
  screening_recommended: boolean;
  model_version: string;
  algorithm: string;
  disclaimer: string;
}

// ── Tier config ───────────────────────────────────────────────────────────────
const TIER_CONFIG = {
  low: {
    label: "Low Risk",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    ring: "ring-emerald-500/20",
    gaugeFill: "#34d399",
    icon: ShieldCheck,
    description: "Your biomarkers suggest a low risk of Type 2 diabetes at this time.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    ring: "ring-amber-500/20",
    gaugeFill: "#fbbf24",
    icon: AlertTriangle,
    description: "You have elevated risk factors. Lifestyle changes can significantly reduce this.",
  },
  high: {
    label: "High Risk",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    ring: "ring-red-500/20",
    gaugeFill: "#f87171",
    icon: ShieldAlert,
    description: "Your risk is high. Please consult a physician for a full clinical evaluation.",
  },
} as const;

const IMPACT_COLORS = {
  high: "text-red-400 bg-red-500/10",
  moderate: "text-amber-400 bg-amber-500/10",
  low: "text-emerald-400 bg-emerald-500/10",
};

// ── Gauge ─────────────────────────────────────────────────────────────────────
function RiskGauge({ pct, tier }: { pct: number; tier: "low" | "moderate" | "high" }) {
  const { gaugeFill } = TIER_CONFIG[tier];
  const radius = 72;
  const circumference = Math.PI * radius; // half circle
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center" aria-label={`Risk gauge: ${pct}%`}>
      <svg viewBox="0 0 160 90" className="w-48 overflow-visible" role="img">
        {/* Background arc */}
        <path
          d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className="text-border"
        />
        {/* Colored arc */}
        <motion.path
          d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none"
          stroke={gaugeFill}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - strokeDash }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
        />
        {/* Zone markers */}
        {[30, 60].map((pct) => {
          const angle = (pct / 100) * Math.PI;
          const x = 80 - 70 * Math.cos(angle);
          const y = 80 - 70 * Math.sin(angle);
          return (
            <circle key={pct} cx={x} cy={y} r="3" fill="hsl(var(--background))" className="text-border" />
          );
        })}
      </svg>

      {/* Center text */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="text-4xl font-black tabular-nums"
          style={{ color: gaugeFill }}
        >
          {pct}
          <span className="text-xl font-bold">%</span>
        </motion.span>
      </div>

      {/* Labels */}
      <div className="flex justify-between w-full max-w-[12rem] mt-1 px-1">
        <span className="text-[10px] text-emerald-400 font-medium">Low</span>
        <span className="text-[10px] text-amber-400 font-medium">Moderate</span>
        <span className="text-[10px] text-red-400 font-medium">High</span>
      </div>
    </div>
  );
}

// ── Risk factor bar ───────────────────────────────────────────────────────────
function RiskFactorBar({ factor, index }: { factor: RiskFactor; index: number }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      className="rounded-xl border border-border/50 bg-card/40 overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
        aria-expanded={expanded}
        id={`risk-factor-${index}`}
      >
        <span
          className={cn(
            "shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold",
            IMPACT_COLORS[factor.impact]
          )}
        >
          {factor.impact.toUpperCase()}
        </span>
        <span className="flex-1 text-sm font-medium truncate">{factor.factor}</span>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          {factor.value}
        </span>
        {factor.advice ? (
          expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )
        ) : null}
      </button>

      {factor.advice && expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="px-4 pb-3 text-xs text-muted-foreground border-t border-border/30 pt-2.5"
        >
          {factor.advice}
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DiabetesResultProps {
  result: DiabetesPredictResponse;
  onReset: () => void;
}

export function DiabetesResult({ result, onReset }: DiabetesResultProps) {
  const tier = TIER_CONFIG[result.risk_tier];
  const TierIcon = tier.icon;
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const visibleSuggestions = showAllSuggestions
    ? result.suggestions
    : result.suggestions.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
      id="diabetes-result"
    >
      {/* Top: Score card */}
      <div
        className={cn(
          "rounded-2xl border p-6 flex flex-col sm:flex-row items-center gap-6",
          tier.bg,
          tier.border
        )}
      >
        <RiskGauge pct={result.risk_pct} tier={result.risk_tier} />

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <TierIcon className={cn("h-5 w-5", tier.color)} />
            <h2 className={cn("text-xl font-bold", tier.color)}>{tier.label}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm">{tier.description}</p>

          <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
            <div className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1 bg-card/60 border border-border/50">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium">{result.confidence}% confidence</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1 bg-card/60 border border-border/50">
              <BadgeCheck className="h-3 w-3 text-violet-400" />
              <span className="font-medium">{result.algorithm}</span>
            </div>
            {result.screening_recommended && (
              <div className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Stethoscope className="h-3 w-3" />
                <span className="font-medium">Screening recommended</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top risk factors */}
      {result.top_risk_factors.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold">Top Risk Factors</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              Tap to see advice
            </span>
          </div>
          <div className="space-y-2">
            {result.top_risk_factors.map((f, i) => (
              <RiskFactorBar key={f.factor} factor={f} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Prevention advice */}
      {result.suggestions.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold">Prevention Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {visibleSuggestions.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400/70 shrink-0" />
                {s}
              </motion.li>
            ))}
          </ul>
          {result.suggestions.length > 4 && (
            <button
              type="button"
              id="diabetes-show-more-btn"
              onClick={() => setShowAllSuggestions((v) => !v)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1 mt-1"
            >
              {showAllSuggestions ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Show{" "}
                  {result.suggestions.length - 4} more
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-border/40 bg-card/20 px-4 py-3">
        <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
      </div>

      {/* Reset */}
      <motion.button
        type="button"
        id="diabetes-retry-btn"
        onClick={onReset}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card/40 px-6 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
      >
        <RefreshCcw className="h-4 w-4" />
        Run a new assessment
      </motion.button>
    </motion.div>
  );
}
