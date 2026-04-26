"use client";

import { useState, useCallback } from "react";
import type { OcrPrescriptionResponse, OcrMedicine } from "@/types/ocr";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Edit3,
  Info,
  RotateCcw,
  Save,
  Shield,
  AlertCircle,
  Pill,
  Clock,
  Calendar,
  User,
  Stethoscope,
  FileText,
} from "lucide-react";

interface PrescriptionResultsProps {
  result: OcrPrescriptionResponse;
  fileName?: string;
  onReset: () => void;
}

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfidenceBadge({ value }: { value: number }) {
  const level = value >= 80 ? "high" : value >= 55 ? "medium" : "low";
  const styles = {
    high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    low: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const labels = { high: "High confidence", medium: "Medium confidence", low: "Low confidence" };
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${styles[level]}`}>
      {labels[level]} ({value.toFixed(0)}%)
    </span>
  );
}

// ── Medicine card (editable) ──────────────────────────────────────────────────
function MedicineCard({
  medicine,
  index,
  onUpdate,
}: {
  medicine: OcrMedicine;
  index: number;
  onUpdate: (idx: number, updated: OcrMedicine) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<OcrMedicine>(medicine);
  const [copied, setCopied] = useState(false);

  const save = () => {
    onUpdate(index, draft);
    setEditing(false);
  };

  const copyLine = () => {
    const text = [
      draft.name,
      draft.dosage && `${draft.dosage}`,
      draft.frequency,
      draft.timing,
      draft.duration && `for ${draft.duration}`,
    ]
      .filter(Boolean)
      .join(" · ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isLowConf = medicine.confidence < 0.75;

  return (
    <div
      className={`rounded-2xl border transition-all duration-200
        ${isLowConf
          ? "border-amber-500/30 bg-amber-500/5"
          : "border-white/10 bg-white/[0.03]"
        }
        ${editing ? "ring-1 ring-emerald-500/40" : "hover:border-white/20"}
      `}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        {/* Pill icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Pill className="w-5 h-5 text-emerald-400" />
        </div>

        {/* Name + category */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-medium focus:outline-none focus:border-emerald-500"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{draft.name}</span>
              {draft.raw_name.toLowerCase() !== draft.name.toLowerCase() && (
                <span className="text-xs text-slate-500 italic">
                  (OCR: &ldquo;{draft.raw_name}&rdquo;)
                </span>
              )}
              {isLowConf && (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" /> Verify
                </span>
              )}
            </div>
          )}
          {draft.category && (
            <p className="text-xs text-slate-500 mt-0.5">{draft.category}</p>
          )}
          {draft.brand_names && draft.brand_names.length > 0 && (
            <p className="text-xs text-slate-600 mt-0.5">
              Brands: {draft.brand_names.join(", ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={copyLine}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            title="Copy"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { if (editing) save(); else setEditing(true); }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
            title={editing ? "Save" : "Edit"}
          >
            {editing ? <Save className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Details grid */}
      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Dosage */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Dosage</p>
          {editing ? (
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
              value={draft.dosage || ""}
              placeholder="e.g. 500 mg"
              onChange={(e) => setDraft({ ...draft, dosage: e.target.value || null })}
            />
          ) : (
            <p className="text-sm text-white font-medium">{draft.dosage || <span className="text-slate-600">—</span>}</p>
          )}
        </div>

        {/* Frequency */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Frequency</p>
          {editing ? (
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
              value={draft.frequency || ""}
              placeholder="e.g. Twice daily"
              onChange={(e) => setDraft({ ...draft, frequency: e.target.value || null })}
            />
          ) : (
            <p className="text-sm text-white font-medium">{draft.frequency || <span className="text-slate-600">—</span>}</p>
          )}
        </div>

        {/* Timing */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Timing</p>
          {editing ? (
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
              value={draft.timing || ""}
              placeholder="e.g. After meals"
              onChange={(e) => setDraft({ ...draft, timing: e.target.value || null })}
            />
          ) : (
            <p className="text-sm text-white font-medium">{draft.timing || <span className="text-slate-600">—</span>}</p>
          )}
        </div>

        {/* Duration */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Duration</p>
          {editing ? (
            <input
              className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-emerald-500"
              value={draft.duration || ""}
              placeholder="e.g. 5 days"
              onChange={(e) => setDraft({ ...draft, duration: e.target.value || null })}
            />
          ) : (
            <p className="text-sm text-white font-medium">{draft.duration || <span className="text-slate-600">—</span>}</p>
          )}
        </div>
      </div>

      {/* Source line */}
      {medicine.source_line && (
        <div className="mx-4 mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
          <p className="text-xs text-slate-600 font-mono">&ldquo;{medicine.source_line}&rdquo;</p>
        </div>
      )}
    </div>
  );
}

// ── Main results view ─────────────────────────────────────────────────────────
export function PrescriptionResults({
  result: initialResult,
  fileName,
  onReset,
}: PrescriptionResultsProps) {
  const [result, setResult] = useState<OcrPrescriptionResponse>(initialResult);
  const [showRaw, setShowRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const updateMedicine = useCallback((idx: number, updated: OcrMedicine) => {
    setResult((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m, i) => (i === idx ? updated : m)),
    }));
  }, []);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription_ocr_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportText = () => {
    const lines = [
      "MediVerse AI — Prescription OCR Report",
      "=".repeat(42),
      fileName ? `File: ${fileName}` : "",
      result.date ? `Date: ${result.date}` : "",
      result.doctor_name ? `Doctor: ${result.doctor_name}` : "",
      result.patient_name ? `Patient: ${result.patient_name}` : "",
      "",
      "MEDICINES",
      "-".repeat(30),
      ...result.medicines.map(
        (m, i) =>
          `${i + 1}. ${m.name}` +
          (m.dosage ? ` — ${m.dosage}` : "") +
          (m.frequency ? ` — ${m.frequency}` : "") +
          (m.timing ? ` (${m.timing})` : "") +
          (m.duration ? ` — for ${m.duration}` : "")
      ),
      "",
      result.warnings.length ? "WARNINGS\n" + result.warnings.join("\n") : "",
      "",
      `Confidence: ${result.overall_confidence.toFixed(0)}%  |  Engine: ${result.ocr_engine}`,
      "",
      "Disclaimer: This is an AI-generated extraction. Always verify with the original prescription and consult a qualified pharmacist or physician.",
    ]
      .filter((l) => l !== undefined)
      .join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription_ocr_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAll = () => {
    const text = result.medicines
      .map(
        (m) =>
          `${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.frequency ? ` ${m.frequency}` : ""}${
            m.timing ? ` ${m.timing}` : ""
          }${m.duration ? ` for ${m.duration}` : ""}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasMedicines = result.medicines.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Summary bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            {hasMedicines ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
            <span className="font-semibold text-white">
              {hasMedicines ? `${result.medicine_count} Medicine${result.medicine_count !== 1 ? "s" : ""} Found` : "No Medicines Detected"}
            </span>
          </div>
          <ConfidenceBadge value={result.overall_confidence} />
          {result.ocr_engine && (
            <span className="text-xs text-slate-500">via {result.ocr_engine}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyAll}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm transition"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            Copy
          </button>
          <button
            onClick={exportText}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <Download className="w-4 h-4" /> TXT
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <Download className="w-4 h-4" /> JSON
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-sm transition"
          >
            <RotateCcw className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* ── Metadata row ── */}
      {(result.doctor_name || result.date || result.patient_name) && (
        <div className="flex flex-wrap gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
          {result.doctor_name && (
            <div className="flex items-center gap-2 text-sm">
              <Stethoscope className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Doctor:</span>
              <span className="text-white font-medium">Dr. {result.doctor_name}</span>
            </div>
          )}
          {result.patient_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Patient:</span>
              <span className="text-white font-medium">{result.patient_name}</span>
            </div>
          )}
          {result.date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-400">Date:</span>
              <span className="text-white font-medium">{result.date}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Warnings ── */}
      {result.warnings.length > 0 && (
        <div className="space-y-2">
          {result.warnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Medicine cards ── */}
      {hasMedicines ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Pill className="w-4 h-4" /> Extracted Medicines
          </h2>
          {result.medicines.map((m, i) => (
            <MedicineCard key={i} medicine={m} index={i} onUpdate={updateMedicine} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Pill className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-white font-medium">No medicines detected</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">
              The prescription may be too blurry or the handwriting too difficult to parse.
              Try a higher-quality image.
            </p>
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {result.notes.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> Prescription Notes
          </h2>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-1.5">
            {result.notes.map((n, i) => (
              <p key={i} className="text-sm text-slate-300">{n}</p>
            ))}
          </div>
        </div>
      )}

      {/* ── Raw OCR text (collapsible) ── */}
      {result.raw_text && (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition text-sm"
            onClick={() => setShowRaw((p) => !p)}
          >
            <span className="font-medium text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Raw OCR Text
            </span>
            {showRaw ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
          {showRaw && (
            <div className="px-4 py-4 bg-[#080d1a]">
              <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                {result.raw_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ── Disclaimer ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10 text-slate-500 text-xs">
        <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          <span className="font-semibold text-slate-400">Medical Disclaimer:</span> This is an AI-generated
          extraction for informational purposes only. Always verify extracted information against the
          original prescription. Consult a qualified pharmacist or physician before administering any medication.
        </p>
      </div>
    </div>
  );
}
