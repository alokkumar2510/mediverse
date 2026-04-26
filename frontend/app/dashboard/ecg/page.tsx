"use client";

import { useState } from "react";
import { Activity, ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ECGUploadForm } from "@/components/ecg/ECGUploadForm";
import { ECGResultsView } from "@/components/ecg/ECGResultsView";

export default function ECGDashboardPage() {
  const [result, setResult] = useState<any | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">ECG AI Analysis</h1>
              <p className="text-slate-400 mt-1">
                Upload a 10-second ECG signal array to screen for arrhythmias.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {!result ? (
            <div className="space-y-6">
              <ECGUploadForm onAnalysisComplete={setResult} />
              
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  How it works
                </h3>
                <ol className="list-decimal list-inside space-y-3 text-slate-400 text-sm">
                  <li><strong>Upload your data:</strong> Provide a <code>.csv</code> or <code>.npy</code> file containing 1D ECG signal data.</li>
                  <li><strong>Signal Processing:</strong> The AI applies a bandpass filter (0.5-40Hz) to remove baseline wander and noise.</li>
                  <li><strong>ResNet1D Inference:</strong> A PyTorch 1D Convolutional model runs inference locally or via backend.</li>
                  <li><strong>Clinical Assessment:</strong> Get a multi-class rhythm prediction (e.g. Normal, MI, Arrhythmia) with confidence scores.</li>
                </ol>
              </div>
            </div>
          ) : (
            <ECGResultsView result={result} onReset={() => setResult(null)} />
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-500" />
              Dataset & Model
            </h3>
            <div className="space-y-4 text-sm text-slate-400">
              <div>
                <strong className="text-slate-300 block mb-1">Training Data</strong>
                <p>Trained on PTB-XL (21,837 clinical 12-lead ECGs) combined with mapping strategies for Arrhythmia and Conduction disturbances.</p>
              </div>
              <div>
                <strong className="text-slate-300 block mb-1">Architecture</strong>
                <p>ResNet1D-34 optimized via ONNX Runtime. Mixed-precision trained on RTX 4050 6GB.</p>
              </div>
              <div>
                <strong className="text-slate-300 block mb-1">Limitations</strong>
                <p>Designed for Lead I or Lead II rhythm screening. Not to be used as a definitive clinical diagnosis device.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-blue-400 font-medium mb-2">Premium Module</h3>
            <p className="text-slate-300 text-sm mb-4">
              This module represents production-grade machine learning applied to physiological time-series data.
            </p>
            <div className="h-1 w-full bg-blue-500/20 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
