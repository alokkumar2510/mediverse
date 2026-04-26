"use client";

import { useState, useCallback, useRef } from "react";
import {
  UploadCloud, FileText, AlertCircle, X, Activity,
  RefreshCcw, CheckCircle2, AlertTriangle, Info,
  Heart, Zap, TrendingUp, Shield, Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";

// ── Types ──────────────────────────────────────────────────────────────────────
interface EcgConditionProb {
  label: string;
  probability: number;
}

interface EcgResult {
  rhythm_type: string;
  confidence: number;
  all_probabilities: EcgConditionProb[];
  severity: string;
  recommendation: string;
  risk_flags: string[];
  needs_review: boolean;
  low_confidence: boolean;
  signal_quality: string;
  quality_warnings: string[];
  r_peaks: number[];
  heart_rate_bpm: number | null;
  model_version: string;
  is_demo: boolean;
  report_id: string | null;
  disclaimer: string;
}

// ── Waveform Visualizer ────────────────────────────────────────────────────────
function WaveformVisualization({
  quality,
  rPeaks,
  bpm,
  rhythmType,
}: {
  quality: string;
  rPeaks: number[];
  bpm: number | null;
  rhythmType: string;
}) {
  // Generate an SVG ECG-like waveform path based on rhythm type
  const generatePath = () => {
    const width = 1000;
    const mid = 50;
    let d = `M0 ${mid}`;
    const isAbnormal = rhythmType !== "Normal Sinus Rhythm";

    for (let x = 0; x < width; x += 200) {
      // P-wave
      d += ` Q ${x + 20} ${mid - 8} ${x + 40} ${mid}`;
      // PR segment
      d += ` L ${x + 60} ${mid}`;
      // QRS complex
      d += ` L ${x + 70} ${mid + (isAbnormal ? 15 : 10)}`;
      d += ` L ${x + 80} ${mid - (isAbnormal ? 40 : 35)}`;
      d += ` L ${x + 90} ${mid + (isAbnormal ? 20 : 15)}`;
      d += ` L ${x + 100} ${mid}`;
      // ST segment & T-wave
      d += ` Q ${x + 130} ${rhythmType === "ST/T Change" ? mid - 15 : mid - 5} ${x + 160} ${mid}`;
      d += ` L ${x + 200} ${mid}`;
    }
    return d;
  };

  const waveColor =
    rhythmType === "Normal Sinus Rhythm" ? "#10b981" :
    rhythmType === "Myocardial Infarction" || rhythmType === "ST/T Change" ? "#ef4444" :
    "#f97316";

  return (
    <div className="relative h-44 w-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
        {[1,2,3,4,5].map(i => (
          <line key={`h${i}`} x1="0" y1={`${i*20}%`} x2="100%" y2={`${i*20}%`}
            stroke="#4b5563" strokeWidth="0.5"/>
        ))}
        {[1,2,3,4,5,6,7,8,9].map(i => (
          <line key={`v${i}`} x1={`${i*11.1}%`} y1="0" x2={`${i*11.1}%`} y2="100%"
            stroke="#4b5563" strokeWidth="0.5"/>
        ))}
      </svg>

      {/* ECG Waveform */}
      <motion.svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <path
          d={generatePath()}
          fill="none"
          stroke={waveColor}
          strokeWidth="2"
          style={{ filter: `drop-shadow(0 0 4px ${waveColor}80)` }}
        />
        {/* R-peak markers */}
        {rPeaks.slice(0, 8).map((peak, i) => {
          const x = (peak / 1000) * 1000;
          return (
            <line key={i} x1={x} y1="15" x2={x} y2="85"
              stroke={waveColor} strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4"/>
          );
        })}
      </motion.svg>

      {/* Overlays */}
      <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
        <span className="text-xs bg-gray-900/90 text-gray-300 px-2 py-1 rounded border border-gray-700">
          Lead I
        </span>
        <span className={`text-xs px-2 py-1 rounded border font-medium ${
          quality === "good"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
        }`}>
          {quality}
        </span>
      </div>

      {bpm && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-gray-900/90 px-2.5 py-1 rounded border border-gray-700">
          <Heart className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-white font-mono font-bold">{bpm} bpm</span>
        </div>
      )}

      <div className="absolute bottom-3 right-3 text-xs text-gray-600">
        25 mm/s · 10 mm/mV
      </div>
    </div>
  );
}

// ── Confidence Ring ────────────────────────────────────────────────────────────
function ConfidenceRing({ value, severity }: { value: number; severity: string }) {
  const r = 40, circumference = 2 * Math.PI * r;
  const color =
    severity === "High" ? "#ef4444" :
    severity === "Moderate" ? "#f97316" : "#10b981";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="8"/>
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - value / 100) }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="text-center">
        <p className="text-lg font-bold text-white">{value.toFixed(0)}%</p>
        <p className="text-xs text-gray-400">conf.</p>
      </div>
    </div>
  );
}

// ── Results Component ──────────────────────────────────────────────────────────
function ECGResults({ result, onReset }: { result: EcgResult; onReset: () => void }) {
  const isHigh = result.severity === "High";
  const isMod  = result.severity === "Moderate";
  const isLow  = result.severity === "Low";

  const severityColor = isHigh ? "red" : isMod ? "orange" : "emerald";
  const severityBg    = `bg-${severityColor}-500/10`;
  const severityBorder = `border-${severityColor}-500/30`;
  const severityText   = `text-${severityColor}-400`;

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Disclaimer */}
      <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-yellow-400 mb-1">AI Screening Support Only</p>
          <p className="text-xs text-yellow-400/80">{result.disclaimer}</p>
        </div>
      </div>

      {result.is_demo && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 flex gap-2 items-center">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-xs text-blue-400">
            Demo mode — train the model with PTB-XL for production predictions.
          </p>
        </div>
      )}

      {/* Primary + Confidence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Rhythm Card */}
        <div className={`relative bg-gray-900 border rounded-xl p-5 overflow-hidden ${severityBorder}`}>
          <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-2xl opacity-15 bg-${severityColor}-500`} />
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-medium">
            Detected Rhythm
          </p>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <div className="flex items-center gap-2 mb-2">
                {isLow
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  : <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${severityText}`} />}
                <h2 className="text-xl font-bold text-white leading-tight">
                  {result.rhythm_type}
                </h2>
              </div>

              {/* Severity badge */}
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${severityBg} ${severityText}`}>
                {result.severity} Risk
              </span>

              {result.low_confidence && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400">
                  Low Confidence
                </span>
              )}
            </div>
            <ConfidenceRing value={result.confidence} severity={result.severity} />
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Signal Stats</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Heart, label: "Heart Rate",
                value: result.heart_rate_bpm ? `${result.heart_rate_bpm} bpm` : "N/A",
                color: result.heart_rate_bpm
                  ? (result.heart_rate_bpm < 60 || result.heart_rate_bpm > 100
                    ? "text-orange-400" : "text-emerald-400")
                  : "text-gray-500"
              },
              { icon: Activity, label: "Signal Quality", value: result.signal_quality, color: result.signal_quality === "good" ? "text-emerald-400" : "text-orange-400" },
              { icon: Zap, label: "R-Peaks", value: `${result.r_peaks.length}`, color: "text-blue-400" },
              { icon: Shield, label: "Model", value: result.model_version.split("-")[0], color: "text-purple-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waveform Visualization */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Signal Waveform
          </h3>
          <span className="text-xs text-gray-500">Lead I · Approx. visualization</span>
        </div>
        <WaveformVisualization
          quality={result.signal_quality}
          rPeaks={result.r_peaks}
          bpm={result.heart_rate_bpm}
          rhythmType={result.rhythm_type}
        />
        {result.quality_warnings.map((w, i) => (
          <div key={i} className="mt-2 flex gap-2 text-xs text-orange-400/80">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {w}
          </div>
        ))}
      </div>

      {/* Probabilities */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          All Class Probabilities
        </h3>
        <div className="space-y-3">
          {result.all_probabilities.map((p, i) => {
            const isTop = i === 0;
            const barColor = isTop
              ? (isLow ? "bg-emerald-500" : isHigh ? "bg-red-500" : "bg-orange-500")
              : "bg-blue-500/40";
            return (
              <div key={p.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${isTop ? "text-white" : "text-gray-400"}`}>
                    {p.label}
                  </span>
                  <span className={isTop ? "text-white font-bold" : "text-gray-500"}>
                    {p.probability.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${barColor}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(p.probability, 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Flags */}
      {result.risk_flags.length > 0 && (
        <div className={`bg-gray-900 border rounded-xl p-5 ${isHigh ? "border-red-500/30" : "border-orange-500/30"}`}>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 ${isHigh ? "text-red-400" : "text-orange-400"}`} />
            Risk Flags
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.risk_flags.map((flag, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                isHigh
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-orange-500/10 text-orange-400 border-orange-500/20"
              }`}>
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-400" />
          Clinical Recommendation
        </h3>
        <p className={`text-sm leading-relaxed p-3 rounded-lg border ${
          isHigh
            ? "text-red-300 bg-red-500/5 border-red-500/20"
            : isMod
            ? "text-orange-300 bg-orange-500/5 border-orange-500/20"
            : "text-emerald-300 bg-emerald-500/5 border-emerald-500/20"
        }`}>
          {result.recommendation}
        </p>
        {result.needs_review && (
          <div className={`mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
            isHigh
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          }`}>
            <Activity className="w-3.5 h-3.5" />
            {isHigh ? "🆘 Emergency or urgent clinical review required" : "📋 Cardiology review recommended"}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm font-medium border border-gray-700"
        >
          <RefreshCcw className="w-4 h-4" />
          Analyze Another Signal
        </button>
      </div>
    </motion.div>
  );
}

// ── Upload Form ────────────────────────────────────────────────────────────────
function ECGUploadForm({ onResult }: { onResult: (d: EcgResult) => void }) {
  const { accessToken } = useAuthStore();
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  const ACCEPT = [".csv", ".npy", ".txt"];

  const handleFile = (f: File) => {
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPT.includes(ext)) {
      setError("Only .csv, .npy, or .txt files are supported.");
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const authToken = accessToken ?? localStorage.getItem("mediverse_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ecg/analyze`,
        { method: "POST", headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}, body: formData },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed.");
      }
      onResult(await res.json());
    } catch (e: any) {
      setError(e.message || "Unexpected error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5 shadow-xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Dataset info banner */}
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-indigo-300 mb-1">
            PTB-XL Dataset · ResNet1D-34 Model
          </p>
          <p className="text-xs text-indigo-400/80">
            Trained on 21,837 real clinical ECGs. Detects 5 PTB-XL superclasses including
            Normal Sinus Rhythm, Myocardial Infarction, ST/T Changes, and Conduction Disturbances.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Upload ECG Signal</h2>
        <p className="text-sm text-gray-400">
          Supported formats: <code className="text-indigo-400">.csv</code>,{" "}
          <code className="text-indigo-400">.npy</code>,{" "}
          <code className="text-indigo-400">.txt</code> — 1 value per row (Lead I waveform)
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={() => setDragging(true)}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
          dragging
            ? "border-indigo-500 bg-indigo-500/5"
            : file
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file" accept={ACCEPT.join(",")}
          className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={loading}
        />
        <AnimatePresence mode="wait">
          {file ? (
            <motion.div key="file" className="flex flex-col items-center gap-2"
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileText className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-medium text-sm">{file.name}</p>
              <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); }}
                className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </motion.div>
          ) : (
            <motion.div key="empty" className="flex flex-col items-center gap-3 text-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                dragging ? "border-indigo-500 bg-indigo-500/10" : "border-gray-700 bg-gray-800"
              }`}>
                <UploadCloud className={`w-8 h-8 transition-colors ${dragging ? "text-indigo-400" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="text-white font-medium">Drop ECG file here</p>
                <p className="text-gray-500 text-sm">or click to browse</p>
              </div>
              <p className="text-gray-600 text-xs max-w-xs">
                PTB-XL format: 5000 samples at 500Hz, or ECG5000 (140 samples at 100Hz).
                Any CSV with one Lead I value per row is accepted.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="flex gap-2 items-start p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Supported datasets info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {[
          { name: "PTB-XL", size: "21,837 records", color: "indigo" },
          { name: "MIT-BIH", size: "48 records", color: "blue" },
          { name: "ECG5000", size: "5,000 samples", color: "purple" },
          { name: "Chapman", size: "10,646 records", color: "teal" },
        ].map(ds => (
          <div key={ds.name}
            className={`bg-${ds.color}-500/5 border border-${ds.color}-500/10 rounded-lg p-2 text-center`}>
            <p className={`font-semibold text-${ds.color}-400`}>{ds.name}</p>
            <p className="text-gray-500">{ds.size}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20 disabled:shadow-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            Analyzing ECG Signal...
          </>
        ) : (
          <>
            <Activity className="w-4 h-4" />
            Analyze ECG Signal
          </>
        )}
      </button>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ECGPageClient() {
  const [result, setResult] = useState<EcgResult | null>(null);

  return (
    <>
      {!result ? (
        <ECGUploadForm onResult={setResult} />
      ) : (
        <ECGResults result={result} onReset={() => setResult(null)} />
      )}
    </>
  );
}
