"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  Camera,
  X,
  Loader2,
  AlertTriangle,
  Microscope,
  ZoomIn,
  ShieldAlert,
  CheckCircle2,
  Info,
  Sparkles,
} from "lucide-react";
import type { SkinAnalysisResponse } from "@/types/skin";
import { SkinResults } from "./SkinResults";

// ── Constants ─────────────────────────────────────────────────────────────────
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB   = 10;
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type AnalysisState = "idle" | "preview" | "analyzing" | "done" | "error";

// ── Tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  { icon: "💡", title: "Good Lighting",     desc: "Natural daylight or bright room — no flash directly on skin" },
  { icon: "📏", title: "Close-Up",          desc: "Fill the frame with the lesion — 5–10 cm away" },
  { icon: "🔍", title: "In Focus",          desc: "Tap to focus on the lesion before capturing" },
  { icon: "🩺", title: "Full Lesion",       desc: "Include a few mm of surrounding normal skin" },
];

// ── Upload button ─────────────────────────────────────────────────────────────
function UploadZone({
  onFile,
  disabled,
}: {
  onFile: (f: File) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      if (!ACCEPTED.includes(f.type)) {
        alert("Please upload a JPEG, PNG, or WEBP image.");
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        alert(`File is too large. Maximum size is ${MAX_MB} MB.`);
        return;
      }
      onFile(f);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files[0]);
      }}
      className={`
        relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 cursor-pointer
        ${dragging
          ? "border-violet-400 bg-violet-500/10"
          : "border-white/20 bg-white/[0.02] hover:border-violet-400/60 hover:bg-violet-500/5"
        }
        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED.join(",")}
        onChange={(e) => handle(e.target.files?.[0])}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
          <Upload className="w-9 h-9 text-violet-400" />
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Drop skin photo here</p>
          <p className="text-slate-400 text-sm mt-1">
            or{" "}
            <span className="text-violet-400 font-medium underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-500">
          JPEG · PNG · WEBP &nbsp;·&nbsp; Max {MAX_MB} MB
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function SkinAnalysis() {
  const [state, setState]     = useState<AnalysisState>("idle");
  const [file, setFile]       = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult]   = useState<SkinAnalysisResponse | null>(null);
  const [error, setError]     = useState<string>("");

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState("preview");
    setResult(null);
    setError("");
  }, []);

  const reset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setState("idle");
    setResult(null);
    setError("");
  }, [preview]);

  const analyze = useCallback(async () => {
    if (!file) return;
    setState("analyzing");
    setError("");

    try {
      const form = new FormData();
      form.append("file", file);

      const token = localStorage.getItem("access_token") ?? "";
      const res = await fetch(`${API_URL}/api/skin/analyze`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data: SkinAnalysisResponse = await res.json();
      setResult(data);
      setState("done");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setState("error");
    }
  }, [file]);

  // ── DONE state ──────────────────────────────────────────────────────────────
  if (state === "done" && result) {
    return (
      <SkinResults
        result={result}
        previewUrl={preview!}
        fileName={file?.name}
        onReset={reset}
      />
    );
  }

  // ── MAIN UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
            <Microscope className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Skin AI Screening</h1>
            <p className="text-slate-400 text-sm">
              AI-powered preliminary analysis of skin lesions
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <Sparkles className="w-3 h-3" />, text: "EfficientNet-B3" },
            { icon: <ZoomIn className="w-3 h-3" />,    text: "HAM10000 · ISIC 2018" },
            { icon: <ShieldAlert className="w-3 h-3" />, text: "Grad-CAM Heatmap" },
          ].map((b) => (
            <span
              key={b.text}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300"
            >
              {b.icon}
              {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* Medical disclaimer banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/80">
          <span className="font-semibold text-amber-300">Screening Tool Only.</span>{" "}
          This AI screens for 7 dermatological conditions but is NOT a diagnosis.
          The model was trained on dermoscopic (clinical) images — smartphone
          photos may yield lower accuracy. Always consult a board-certified
          dermatologist for any skin concern.
        </p>
      </div>

      {/* Upload / Preview zone */}
      {state === "idle" ? (
        <UploadZone onFile={handleFile} disabled={false} />
      ) : (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black">
          {/* Preview image */}
          {preview && (
            <img
              src={preview}
              alt="Skin photo preview"
              className="w-full max-h-80 object-contain"
            />
          )}
          {/* Overlay when analyzing */}
          {state === "analyzing" && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                <Microscope className="absolute inset-0 m-auto w-7 h-7 text-violet-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Analyzing lesion...</p>
                <p className="text-slate-400 text-sm mt-1">
                  Running EfficientNet-B3 with TTA
                </p>
              </div>
              <div className="flex gap-1">
                {["Quality check", "Inference", "Grad-CAM"].map((step, i) => (
                  <span
                    key={step}
                    className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Remove button */}
          {state !== "analyzing" && (
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 hover:bg-red-500/80 text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {state === "error" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">Analysis failed</p>
            <p className="text-red-400/70 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* File info + CTA */}
      {(state === "preview" || state === "error") && file && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-white text-sm font-medium">{file.name}</p>
              <p className="text-slate-500 text-xs">
                {(file.size / 1024).toFixed(0)} KB &nbsp;·&nbsp; {file.type}
              </p>
            </div>
          </div>
          <button
            onClick={analyze}
            disabled={false}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-violet-600 to-purple-600
              hover:from-violet-500 hover:to-purple-500
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-violet-500/25"
          >
            <Microscope className="w-4 h-4" /> Analyze Skin Lesion
          </button>
        </div>
      )}


      {/* Tips */}
      {state === "idle" && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-3.5 h-3.5" /> Photo Tips for Best Results
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIPS.map((t) => (
              <div
                key={t.title}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1"
              >
                <p className="text-xl">{t.icon}</p>
                <p className="text-white text-xs font-semibold">{t.title}</p>
                <p className="text-slate-500 text-xs">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* What we detect */}
      {state === "idle" && (
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            7 Conditions Screened
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { code: "nv",    label: "Melanocytic Nevi",    risk: "Low",      dot: "bg-emerald-500" },
              { code: "bkl",   label: "Benign Keratosis",    risk: "Low",      dot: "bg-emerald-500" },
              { code: "df",    label: "Dermatofibroma",      risk: "Low",      dot: "bg-emerald-500" },
              { code: "vasc",  label: "Vascular Lesion",     risk: "Low",      dot: "bg-yellow-500" },
              { code: "akiec", label: "Actinic Keratoses",   risk: "Moderate", dot: "bg-amber-500" },
              { code: "bcc",   label: "Basal Cell Carcinoma",risk: "High",     dot: "bg-red-500" },
              { code: "mel",   label: "Melanoma",            risk: "High",     dot: "bg-red-500" },
            ].map((c) => (
              <div key={c.code} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                <div>
                  <p className="text-slate-300 font-medium">{c.label}</p>
                  <p className="text-slate-600">{c.risk} risk</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
