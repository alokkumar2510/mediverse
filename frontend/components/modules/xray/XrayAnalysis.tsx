"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload,
  X,
  Loader2,
  AlertTriangle,
  ScanLine,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Info,
  Zap,
} from "lucide-react";
import type { XrayAnalysisResponse } from "@/types/xray";
import { XrayResults } from "./XrayResults";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB   = 10;
const API_URL  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type State = "idle" | "preview" | "analyzing" | "done" | "error";

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFile, disabled }: { onFile: (f: File) => void; disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = useCallback((f: File | undefined) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      alert("Please upload a JPEG, PNG, or WEBP image.");
      return;
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-3xl p-14 text-center cursor-pointer
        transition-all duration-300 group
        ${dragging
          ? "border-cyan-400 bg-cyan-500/10 scale-[1.01]"
          : "border-white/15 bg-white/[0.02] hover:border-cyan-400/60 hover:bg-cyan-500/5"
        }
        ${disabled ? "pointer-events-none opacity-50" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPTED.join(",")}
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {/* Animated scanner lines */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent animate-[scan_3s_ease-in-out_infinite]" />
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-24 h-24 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center group-hover:border-cyan-400/50 transition-all duration-300">
          <ScanLine className="w-10 h-10 text-cyan-400" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">AI</span>
          </div>
        </div>
        <div>
          <p className="text-white font-semibold text-lg">Drop chest X-ray here</p>
          <p className="text-slate-400 text-sm mt-1">
            or{" "}
            <span className="text-cyan-400 font-medium underline underline-offset-2">
              browse files
            </span>
          </p>
        </div>
        <p className="text-xs text-slate-500">JPEG · PNG · WEBP &nbsp;·&nbsp; Max {MAX_MB} MB</p>
      </div>
    </div>
  );
}

// ── Analyzing overlay steps ───────────────────────────────────────────────────
const STEPS = ["Image quality check", "AI inference", "TTA (5 rounds)", "Grad-CAM"];

// ── Main component ────────────────────────────────────────────────────────────
export function XrayAnalysis() {
  const [state,   setState]   = useState<State>("idle");
  const [file,    setFile]    = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result,  setResult]  = useState<XrayAnalysisResponse | null>(null);
  const [error,   setError]   = useState("");
  const [step,    setStep]    = useState(0);

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
    setStep(0);
  }, [preview]);

  const analyze = useCallback(async () => {
    if (!file) return;
    setState("analyzing");
    setError("");
    setStep(0);

    // Animate steps
    const stepTimer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);

    try {
      const form  = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("access_token") ?? "";
      const res   = await fetch(`${API_URL}/api/xray/analyze?heatmap=true`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
        body:    form,
      });

      clearInterval(stepTimer);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data: XrayAnalysisResponse = await res.json();
      setResult(data);
      setState("done");
    } catch (e: unknown) {
      clearInterval(stepTimer);
      setError(e instanceof Error ? e.message : "Unknown error");
      setState("error");
    }
  }, [file]);

  // ── Done ──
  if (state === "done" && result) {
    return (
      <XrayResults
        result={result}
        previewUrl={preview!}
        fileName={file?.name}
        onReset={reset}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <ScanLine className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Chest X-Ray AI</h1>
            <p className="text-slate-400 text-sm">
              AI screening across 17 disease classes
            </p>
          </div>
        </div>
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {[
            { icon: <Sparkles className="w-3 h-3" />, text: "Multi-Model Ensemble" },
            { icon: <Zap className="w-3 h-3" />,      text: "17 Disease Classes" },
            { icon: <ScanLine className="w-3 h-3" />, text: "Grad-CAM Heatmap" },
          ].map((b) => (
            <span
              key={b.text}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
            >
              {b.icon} {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* Medical disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/8 border border-amber-500/25">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/80">
          <span className="font-semibold text-amber-300">Screening Tool Only.</span>{" "}
          This AI analyzes chest X-rays for 17 conditions but is NOT a medical diagnosis.
          Results require correlation with clinical findings. Always consult a qualified
          radiologist or physician for interpretation.
        </p>
      </div>

      {/* Upload / Preview */}
      {state === "idle" ? (
        <UploadZone onFile={handleFile} disabled={false} />
      ) : (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black min-h-72">
          {preview && (
            <img
              src={preview}
              alt="X-ray preview"
              className="w-full max-h-96 object-contain"
              style={{ filter: "grayscale(100%) contrast(1.1)" }}
            />
          )}
          {/* Analyzing overlay */}
          {state === "analyzing" && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-5">
              {/* Scanner animation */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border border-cyan-500/15 border-t-cyan-300/50 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                <ScanLine className="absolute inset-0 m-auto w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Analyzing X-ray...</p>
                <p className="text-slate-400 text-sm mt-1">{STEPS[step]}</p>
              </div>
              {/* Step indicators */}
              <div className="flex gap-1.5">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full transition-all duration-500 ${
                      i <= step ? "w-8 bg-cyan-400" : "w-4 bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          {state !== "analyzing" && (
            <button
              onClick={reset}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70
                hover:bg-red-500/80 text-white flex items-center justify-center transition"
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
              bg-gradient-to-r from-cyan-600 to-blue-600
              hover:from-cyan-500 hover:to-blue-500
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 shadow-lg shadow-cyan-500/25"
          >
            <ScanLine className="w-4 h-4" /> Analyze X-Ray
          </button>
        </div>
      )}

      {/* Tips + detectable conditions */}
      {state === "idle" && (
        <>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" /> X-Ray Upload Tips
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { e: "🩻", t: "PA View",        d: "Posteroanterior view is ideal" },
                { e: "💡", t: "Good Exposure",   d: "Avoid overexposed or too dark films" },
                { e: "📐", t: "Full Chest",      d: "Include both lung fields completely" },
                { e: "🔍", t: "High Res",        d: "Min 512×512 px for best accuracy" },
              ].map((tip) => (
                <div key={tip.t} className="p-3 rounded-xl bg-white/[0.02] border border-white/8 space-y-1">
                  <p className="text-xl">{tip.e}</p>
                  <p className="text-white text-xs font-semibold">{tip.t}</p>
                  <p className="text-slate-500 text-xs">{tip.d}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              17 Conditions Screened
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              {[
                { code: "Pneumonia",          risk: "High",     dot: "bg-red-500" },
                { code: "Tuberculosis",       risk: "High",     dot: "bg-red-500" },
                { code: "Cardiomegaly",       risk: "High",     dot: "bg-red-500" },
                { code: "Pneumothorax",       risk: "High",     dot: "bg-red-500" },
                { code: "Edema",              risk: "High",     dot: "bg-red-500" },
                { code: "Mass",               risk: "High",     dot: "bg-red-500" },
                { code: "Effusion",           risk: "Moderate", dot: "bg-amber-500" },
                { code: "Atelectasis",        risk: "Moderate", dot: "bg-amber-500" },
                { code: "Emphysema",          risk: "Moderate", dot: "bg-amber-500" },
                { code: "Fibrosis",           risk: "Moderate", dot: "bg-amber-500" },
                { code: "Nodule",             risk: "Moderate", dot: "bg-amber-500" },
                { code: "Consolidation",      risk: "Moderate", dot: "bg-amber-500" },
                { code: "Pleural Thickening", risk: "Moderate", dot: "bg-amber-500" },
                { code: "Infiltration",       risk: "Moderate", dot: "bg-amber-500" },
                { code: "Scoliosis",          risk: "Low",      dot: "bg-emerald-500" },
                { code: "Hernia",             risk: "Low",      dot: "bg-emerald-500" },
                { code: "No Finding",         risk: "Low",      dot: "bg-emerald-500" },
              ].map((c) => (
                <div key={c.code} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                  <div>
                    <p className="text-slate-300 font-medium">{c.code}</p>
                    <p className="text-slate-600">{c.risk} risk</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
