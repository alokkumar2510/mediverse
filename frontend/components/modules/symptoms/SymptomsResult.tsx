"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Info,
  PhoneCall,
  RefreshCcw,
  Stethoscope,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIProviderBadge, AITemporaryDisclaimer, AIConfidenceBar } from "@/components/shared/AIProviderBadge";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Condition {
  name: string;
  probability: number;
  icd_hint?: string;
}

export interface SymptomCheckResult {
  conditions: Condition[];
  urgency_score: number;
  urgency_label: string;
  specialist: string;
  disclaimer: string;
}

// ── Urgency config ─────────────────────────────────────────────────────────────
const URGENCY_CONFIG = {
  routine: {
    label: "Routine Follow-up",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: CheckCircle2,
    description: "Your symptoms appear non-urgent. Schedule an appointment at your convenience.",
  },
  urgent: {
    label: "Seek Care Soon",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertTriangle,
    description: "Your symptoms warrant medical attention within 24–48 hours.",
  },
  emergency: {
    label: "Emergency — Seek Care Now",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: PhoneCall,
    description: "⚠️ Your symptoms may require immediate emergency care. Call 112/911 if severe.",
  },
} as const;

function getUrgencyConfig(label: string) {
  if (label === "emergency") return URGENCY_CONFIG.emergency;
  if (label === "urgent") return URGENCY_CONFIG.urgent;
  return URGENCY_CONFIG.routine;
}

// ── Condition item ─────────────────────────────────────────────────────────────
function ConditionItem({ cond, index }: { cond: Condition; index: number }) {
  const pct = Math.min(100, Math.max(0, cond.probability * 100));
  const color =
    pct > 60 ? "bg-red-500" : pct > 30 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.07 * index }}
      className="flex items-center gap-3"
    >
      <div className="w-5 text-xs text-muted-foreground font-mono text-right shrink-0">
        {index + 1}.
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{cond.name}</span>
          {cond.icd_hint && (
            <span className="text-xs text-muted-foreground font-mono">
              {cond.icd_hint}
            </span>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 * index }}
            className={cn("h-full rounded-full", color)}
          />
        </div>
      </div>
      <span className="text-xs font-semibold text-muted-foreground w-10 text-right shrink-0">
        {pct.toFixed(0)}%
      </span>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
interface SymptomsResultProps {
  result: SymptomCheckResult;
  onReset: () => void;
}

export function SymptomsResult({ result, onReset }: SymptomsResultProps) {
  const urgency = getUrgencyConfig(result.urgency_label);
  const UrgencyIcon = urgency.icon;

  // Average confidence from top condition
  const avgConf = result.conditions.length > 0
    ? result.conditions[0].probability * 100
    : 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
      id="symptom-result"
    >
      {/* AI badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Triage Result</h2>
        <AIProviderBadge providerLabel="AI Inference (Temporary)" />
      </div>

      {/* Urgency banner */}
      <div
        className={cn(
          "rounded-2xl border p-5 flex items-start gap-4",
          urgency.bg,
          urgency.border
        )}
      >
        <div
          className={cn(
            "p-2.5 rounded-xl shrink-0",
            urgency.bg,
            urgency.border,
            "border"
          )}
        >
          <UrgencyIcon className={cn("h-5 w-5", urgency.color)} />
        </div>
        <div className="space-y-1">
          <p className={cn("font-bold text-base", urgency.color)}>
            {urgency.label}
          </p>
          <p className="text-sm text-muted-foreground">{urgency.description}</p>
        </div>
      </div>

      {/* Specialist + urgency score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Recommended Specialist</span>
          </div>
          <p className="text-sm font-semibold">{result.specialist}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/30 p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Zap className="h-3.5 w-3.5" />
            <span>Urgency Score</span>
          </div>
          <p className={cn("text-sm font-semibold", urgency.color)}>
            {result.urgency_score} / 5
          </p>
        </div>
      </div>

      {/* Confidence */}
      <AIConfidenceBar confidence={avgConf} label="AI Assessment Confidence" />

      {/* Possible conditions */}
      {result.conditions.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/30 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-violet-400" />
            <h3 className="text-sm font-semibold">Possible Conditions</h3>
            <span className="ml-auto text-xs text-muted-foreground">
              AI likelihood estimate
            </span>
          </div>
          <div className="space-y-3">
            {result.conditions.slice(0, 5).map((c, i) => (
              <ConditionItem key={c.name} cond={c} index={i} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-400" />
            Probabilities are AI estimates, not clinical diagnoses. Multiple
            conditions may overlap.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <AITemporaryDisclaimer />

      {/* Reset */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          type="button"
          id="symptom-retry-btn"
          onClick={onReset}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card/40 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
        >
          <RefreshCcw className="h-4 w-4" />
          Check again
        </motion.button>

        <motion.a
          href="https://www.nhp.gov.in/" target="_blank" rel="noopener noreferrer"
          id="symptom-find-doctor-link"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
        >
          Find a Doctor
          <ArrowRight className="h-4 w-4" />
        </motion.a>
      </div>
    </motion.div>
  );
}
