"use client";

import { Activity, AlertTriangle, CheckCircle2, Info, ChevronRight, RefreshCcw } from "lucide-react";

export function ECGResultsView({ result, onReset }: { result: any; onReset: () => void }) {
  const isHighRisk = result.severity === "High";
  const isModerateRisk = result.severity === "Moderate";
  const isNormal = result.severity === "Low";
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Disclaimer */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3 text-yellow-400/90 text-sm">
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-yellow-500 mb-1">AI Screening Support Only</p>
          <p>{result.disclaimer}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Result Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
          {/* Background Gradient based on risk */}
          <div 
            className={`absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-10 blur-3xl ${
              isHighRisk ? "bg-red-500" : isModerateRisk ? "bg-orange-500" : "bg-emerald-500"
            }`}
          />
          
          <h3 className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-wider">Primary Rhythm</h3>
          
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white">{result.rhythm_type}</h2>
                {isNormal ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <AlertTriangle className={`w-6 h-6 ${isHighRisk ? "text-red-500" : "text-orange-500"}`} />
                )}
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <span className={`px-2.5 py-1 rounded-full font-medium ${
                  result.confidence >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                  result.confidence >= 60 ? "bg-blue-500/10 text-blue-400" :
                  "bg-orange-500/10 text-orange-400"
                }`}>
                  {result.confidence.toFixed(1)}% Confidence
                </span>
                {result.low_confidence && (
                  <span className="bg-red-500/10 text-red-400 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Low Confidence
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-slate-400 text-sm font-medium mb-1">Recommendation</h4>
              <p className="text-white text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                {result.recommendation}
              </p>
            </div>
            
            {result.needs_review && (
              <div className="flex items-center gap-2 text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                <Activity className="w-4 h-4" />
                Clinical review required
              </div>
            )}
          </div>
        </div>

        {/* Detailed Probabilities */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Class Probabilities
          </h3>
          
          <div className="space-y-4">
            {result.all_probabilities.map((prob: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-300">{prob.label}</span>
                  <span className="text-slate-400">{prob.probability.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      idx === 0 
                        ? (isNormal ? "bg-emerald-500" : isHighRisk ? "bg-red-500" : "bg-orange-500") 
                        : "bg-blue-500/50"
                    }`}
                    style={{ width: `${prob.probability}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Waveform Visualization Mock */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Signal Overview
        </h3>
        <div className="h-40 w-full bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          {/* CSS based mock waveform */}
          <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-50 stroke-indigo-500 fill-none stroke-2">
            <path d="M0 50 Q 50 50 100 50 Q 110 30 120 50 Q 130 90 140 50 Q 150 10 160 50 Q 200 50 250 50 Q 260 30 270 50 Q 280 90 290 50 Q 300 10 310 50 Q 350 50 400 50 Q 410 30 420 50 Q 430 90 440 50 Q 450 10 460 50 Q 500 50 550 50 Q 560 30 570 50 Q 580 90 590 50 Q 600 10 610 50 Q 650 50 700 50 Q 710 30 720 50 Q 730 90 740 50 Q 750 10 760 50 Q 800 50 850 50 Q 860 30 870 50 Q 880 90 890 50 Q 900 10 910 50 Q 950 50 1000 50" />
          </svg>
          <div className="absolute top-4 left-4 flex gap-3">
             <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded">Quality: {result.signal_quality}</span>
             <span className="text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded">Lead I</span>
          </div>
          <p className="text-slate-500 text-sm mt-12 z-10">Waveform visualization is approximate for MVP</p>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <RefreshCcw className="w-4 h-4" />
          Analyze Another Signal
        </button>
      </div>
    </div>
  );
}
