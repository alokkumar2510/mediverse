"use client";

import { useState } from "react";
import { SymptomsInput } from "./SymptomsInput";
import { SymptomsResult, type SymptomCheckResult } from "./SymptomsResult";
import { apiPost, getApiErrorMessage } from "@/lib/api";

type Phase = "input" | "loading" | "result" | "error";

export function SymptomsModule() {
  const [phase, setPhase] = useState<Phase>("input");
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string) {
    setPhase("loading");
    setError(null);
    try {
      const data = await apiPost<SymptomCheckResult>("/api/symptom/check", {
        text,
      });
      setResult(data);
      setPhase("result");
    } catch (err) {
      setError(getApiErrorMessage(err));
      setPhase("error");
    }
  }

  function reset() {
    setPhase("input");
    setResult(null);
    setError(null);
  }

  if (phase === "error") {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 space-y-3">
        <p className="text-sm text-red-400 font-semibold">⚠️ Analysis Failed</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <button
          type="button"
          id="symptom-error-retry"
          onClick={reset}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← Try again
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return <SymptomsResult result={result} onReset={reset} />;
  }

  return (
    <SymptomsInput
      onSubmit={handleSubmit}
      isLoading={phase === "loading"}
    />
  );
}
