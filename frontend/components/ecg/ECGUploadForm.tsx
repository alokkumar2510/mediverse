"use client";

import { useState } from "react";
import { UploadCloud, AlertCircle, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export function ECGUploadForm({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
  const { accessToken } = useAuthStore();
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.npy')) {
        setError("Only .csv or .npy files are supported for ECG analysis.");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const authToken = accessToken ?? localStorage.getItem("mediverse_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ecg/analyze`, {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Analysis failed");
      }

      const data = await res.json();
      onAnalysisComplete(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4">Upload ECG Signal</h2>
      <p className="text-slate-400 text-sm mb-6">
        Upload a 1D ECG signal file (.csv or .npy) containing recorded lead data. 
        Ensure the data is properly formatted (1 value per row for CSV).
      </p>

      <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-900/50 hover:bg-slate-800/50 transition-colors cursor-pointer group relative">
        <input
          type="file"
          accept=".csv,.npy"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-blue-500 mb-3" />
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-slate-400 text-xs mt-1">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <UploadCloud className="w-12 h-12 text-slate-500 mb-3 group-hover:text-blue-500 transition-colors" />
            <p className="text-white font-medium">Click or drag file to upload</p>
            <p className="text-slate-500 text-xs mt-1">Supported formats: .csv, .npy</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Signal"
          )}
        </button>
      </div>
    </div>
  );
}
