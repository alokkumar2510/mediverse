"use client";

import { useState, useCallback, useRef } from "react";
import type { OcrPrescriptionResponse, OcrMedicine } from "@/types/ocr";
import { PrescriptionResults } from "@/components/modules/prescription/PrescriptionResults";
import { FileText, Upload, Camera, AlertCircle, Loader2, X, CheckCircle2, FileImage } from "lucide-react";

// ── Accepted formats ──────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/tiff", "application/pdf"];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function getFileIcon(mime: string) {
  if (mime === "application/pdf") return <FileText className="w-6 h-6 text-red-400" />;
  return <FileImage className="w-6 h-6 text-blue-400" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PrescriptionOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OcrPrescriptionResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setResult(null);
  };

  const handleFile = useCallback((f: File) => {
    setError(null);
    setResult(null);

    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError(`Unsupported format: ${f.type || "unknown"}. Please upload JPEG, PNG, WEBP, TIFF, or PDF.`);
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError(`File too large (${formatBytes(f.size)}). Maximum allowed is ${MAX_SIZE_MB} MB.`);
      return;
    }

    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null); // PDF — no preview
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);

      const token = localStorage.getItem("mediverse_token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ocr/prescription`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data: OcrPrescriptionResponse = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* ── Header ── */}
      <div className="relative border-b border-white/10 bg-gradient-to-r from-emerald-950/60 via-[#0a0f1e] to-[#0a0f1e] px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
              <FileText className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Prescription OCR</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                AI-powered extraction of medicines, dosages, and instructions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {["EasyOCR Engine", "WHO Drug Database", "Fuzzy Medicine Matching", "PDF Support"].map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* ── Upload area ── */}
        {!result && (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${dragging
                  ? "border-emerald-400 bg-emerald-500/10 scale-[1.01]"
                  : file
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-white/20 bg-white/[0.02] hover:border-emerald-500/40 hover:bg-emerald-500/5"
                }`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => !file && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={onInputChange}
              />

              {file ? (
                <div className="p-6 flex items-center gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {formatBytes(file.size)} · {file.type || "Unknown type"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-emerald-400 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready to analyse</span>
                    </div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                    onClick={(e) => { e.stopPropagation(); resetState(); }}
                    title="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-14 px-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Drop prescription here or click to browse</p>
                    <p className="text-slate-400 text-sm mt-1">
                      JPEG · PNG · WEBP · TIFF · PDF &mdash; up to {MAX_SIZE_MB} MB
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/25 transition"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    >
                      <Upload className="w-4 h-4" /> Browse files
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm hover:bg-white/10 transition"
                      onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                    >
                      <Camera className="w-4 h-4" /> Use camera
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: "📸", title: "Clear Photo", desc: "Good lighting, flat surface, no glare" },
                { icon: "🔍", title: "High Resolution", desc: "300 DPI+ for best handwriting accuracy" },
                { icon: "📄", title: "Full Page", desc: "Include doctor header and all medicine lines" },
              ].map((tip) => (
                <div key={tip.title} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="text-xl">{tip.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{tip.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className={`w-full py-4 rounded-2xl font-semibold text-base transition-all duration-200
                ${file && !uploading
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.01]"
                  : "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analysing prescription…
                </span>
              ) : (
                "Extract Medicines & Dosages"
              )}
            </button>
          </div>
        )}

        {/* ── Results ── */}
        {result && (
          <PrescriptionResults
            result={result}
            fileName={file?.name}
            onReset={resetState}
          />
        )}
      </div>
    </div>
  );
}
