"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Shield,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
  Info,
  Activity,
  FileText,
} from "lucide-react";
import type { SkinAnalysisResponse, SkinConditionProb } from "@/types/skin";
import { HIGH_RISK_CODES, CONDITION_META } from "@/types/skin";

interface SkinResultsProps {
  result: SkinAnalysisResponse;
  previewUrl: string;
  fileName?: string;
  onReset: () => void;
}

// ── Confidence gauge ──────────────────────────────────────────────────────────
function ConfidenceGauge({ value }: { value: number }) {
  const level =
    value >= 80 ? "high" : value >= 55 ? "medium" : "low";
  const colors = {
    high:   { bar: "from-emerald-500 to-emerald-400", text: "text-emerald-400" },
    medium: { bar: "from-amber-500   to-amber-400",   text: "text-amber-400"   },
    low:    { bar: "from-red-500     to-red-400",     text: "text-red-400"     },
  };
  const c = colors[level];
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">Model Confidence</span>
        <span className={`font-bold text-sm ${c.text}`}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${c.bar} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ code }: { code: string }) {
  const meta = CONDITION_META[code] ?? { riskLevel: "low", icon: "🟢" };
  const styles = {
    high:     "bg-red-500/15    text-red-400    border-red-500/30",
    moderate: "bg-amber-500/15  text-amber-400  border-amber-500/30",
    low:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${styles[meta.riskLevel]}`}
    >
      {meta.icon} {meta.riskLevel.charAt(0).toUpperCase() + meta.riskLevel.slice(1)} risk
    </span>
  );
}

// ── Probability bar chart ─────────────────────────────────────────────────────
function ProbabilityChart({ probs }: { probs: SkinConditionProb[] }) {
  return (
    <div className="space-y-2">
      {probs.map((p) => {
        const isHighRisk = HIGH_RISK_CODES.has(p.code);
        const barColor = isHighRisk
          ? "from-red-500/80 to-red-400/60"
          : p.probability > 30
          ? "from-violet-500/80 to-violet-400/60"
          : "from-slate-600/80 to-slate-500/60";

        return (
          <div key={p.code} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                {isHighRisk && (
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                )}
                {p.label}
              </span>
              <span className={`font-semibold ${isHighRisk ? "text-red-400" : "text-slate-400"}`}>
                {p.probability.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                style={{ width: `${Math.min(p.probability, 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main results view ─────────────────────────────────────────────────────────
export function SkinResults({
  result,
  previewUrl,
  fileName,
  onReset,
}: SkinResultsProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showProbs,   setShowProbs]   = useState(false);
  const [showRaw,     setShowRaw]     = useState(false);

  const isHighRisk = HIGH_RISK_CODES.has(result.condition_code);
  const urgentBanner = isHighRisk || result.needs_dermatologist;

  const exportReport = () => {
    const lines = [
      "MediVerse AI — Skin Lesion Screening Report",
      "=".repeat(45),
      fileName ? `File: ${fileName}` : "",
      `Model: EfficientNet-B3 (HAM10000/ISIC 2018)`,
      `Version: ${result.model_version}`,
      "",
      "RESULT",
      "-".repeat(30),
      `Condition: ${result.condition_label} (${result.condition_code})`,
      `Confidence: ${result.confidence.toFixed(1)}%`,
      `Severity: ${result.severity}`,
      `Needs dermatologist: ${result.needs_dermatologist ? "YES" : "No"}`,
      `Image quality: ${result.image_quality}`,
      "",
      "CARE SUGGESTIONS",
      ...result.care_suggestions.map((s, i) => `${i + 1}. ${s}`),
      "",
      "ALL PROBABILITIES",
      ...result.all_probabilities.map(
        (p) => `  ${p.label.padEnd(30)} ${p.probability.toFixed(2)}%`
      ),
      "",
      "DISCLAIMER",
      result.disclaimer,
    ]
      .filter(Boolean)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `skin_screening_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-white">Analysis Complete</span>
          {result.report_id && (
            <span className="text-xs text-slate-500">#{result.report_id}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <RotateCcw className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* ── Urgent alert ── */}
      {urgentBanner && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Dermatologist Review Recommended</p>
            <p className="text-red-400/70 text-sm mt-0.5">
              {isHighRisk
                ? "The detected condition is associated with elevated clinical risk. Please schedule an appointment with a board-certified dermatologist."
                : "The AI confidence is low or the lesion shows concerning features. A professional evaluation is advised."}
            </p>
          </div>
        </div>
      )}

      {/* ── Low confidence warning ── */}
      {result.low_confidence && !urgentBanner && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-amber-300/80 text-sm">
            Confidence is below the reliable threshold. Try a clearer, better-lit photo.
            {result.tta_uncertainty > 0.1 && " The model shows high uncertainty across augmented views."}
          </p>
        </div>
      )}

      {/* ── Quality warnings ── */}
      {result.quality_warnings.length > 0 && (
        <div className="space-y-2">
          {result.quality_warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-amber-300 text-sm"
            >
              <Info className="w-4 h-4 flex-shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}

      {/* ── Main card ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: image + heatmap toggle */}
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square">
            <img
              src={
                showHeatmap && result.heatmap_b64
                  ? `data:image/png;base64,${result.heatmap_b64}`
                  : previewUrl
              }
              alt="Skin lesion"
              className="w-full h-full object-contain"
            />
            {result.heatmap_b64 && (
              <button
                onClick={() => setShowHeatmap((p) => !p)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 text-xs text-white border border-white/20 hover:bg-violet-600 transition"
              >
                {showHeatmap ? "📷 Original" : "🔥 Grad-CAM"}
              </button>
            )}
            {showHeatmap && !result.heatmap_b64 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <p className="text-slate-400 text-sm text-center px-4">
                  Grad-CAM requires the trained checkpoint.
                  <br />
                  Run training first.
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 text-center">
            Image quality: <span className="capitalize text-slate-400">{result.image_quality}</span>
            {result.heatmap_b64 && " · Grad-CAM available"}
          </p>
        </div>

        {/* Right: prediction */}
        <div className="space-y-4">
          {/* Condition */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                  Predicted Condition
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {result.condition_label}
                </h2>
                <p className="text-slate-500 text-sm font-mono mt-0.5">
                  {result.condition_code}
                </p>
              </div>
              <RiskBadge code={result.condition_code} />
            </div>

            <ConfidenceGauge value={result.confidence} />

            {/* Severity */}
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
                Severity Assessment
              </p>
              <p className="text-sm text-slate-300">{result.severity}</p>
            </div>
          </div>

          {/* Care suggestions */}
          {result.care_suggestions.length > 0 && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-3.5 h-3.5" /> Care Guidance
              </p>
              <ul className="space-y-2">
                {result.care_suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── Probability chart ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition text-sm"
          onClick={() => setShowProbs((p) => !p)}
        >
          <span className="font-medium text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> All Condition Probabilities
          </span>
          {showProbs ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        {showProbs && (
          <div className="px-4 py-4 bg-[#080d1a]">
            <ProbabilityChart probs={result.all_probabilities} />
          </div>
        )}
      </div>

      {/* ── Uncertainty ── */}
      {result.tta_uncertainty > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/8 text-xs text-slate-500">
          <Activity className="w-4 h-4" />
          TTA uncertainty (σ): {result.tta_uncertainty.toFixed(4)}
          {result.tta_uncertainty > 0.12
            ? " — High variance (model unsure)"
            : " — Stable prediction"}
        </div>
      )}

      {/* ── Raw JSON (dev) ── */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <button
          className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition text-sm"
          onClick={() => setShowRaw((p) => !p)}
        >
          <span className="font-medium text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Raw API Response
          </span>
          {showRaw ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
        {showRaw && (
          <div className="px-4 py-4 bg-[#080d1a]">
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed overflow-auto max-h-60">
              {JSON.stringify({ ...result, heatmap_b64: result.heatmap_b64 ? "[base64 omitted]" : null }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-slate-500 text-xs">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-400">Medical Disclaimer:</span>{" "}
          {result.disclaimer}
        </p>
      </div>
    </div>
  );
}
