"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { ModulePageShell } from "@/components/modules/ModulePageShell";
import { DiabetesForm, type DiabetesFormValues } from "@/components/modules/diabetes/DiabetesForm";
import {
  DiabetesResult,
  type DiabetesPredictResponse,
} from "@/components/modules/diabetes/DiabetesResult";
import { apiPost, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function DiabetesPage() {
  const [result, setResult] = useState<DiabetesPredictResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(values: DiabetesFormValues) {
    setIsLoading(true);
    try {
      const data = await apiPost<DiabetesPredictResponse>(
        "/api/diabetes/predict",
        values
      );
      setResult(data);
    } catch (err) {
      toast({ title: "Prediction failed", description: getApiErrorMessage(err), variant: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
  }

  return (
    <ModulePageShell
      iconNode={
        <div className="p-3.5 rounded-2xl bg-violet-500/10">
          <FlaskConical className="h-7 w-7 text-violet-500" />
        </div>
      }
      title="Diabetes Risk Assessment"
      badge="Live"
      badgeBg="bg-violet-500/10 text-violet-400"
      description="Enter your clinical biomarkers to receive an AI-calculated Type 2 diabetes risk score. Powered by XGBoost trained on the PIMA Indians Diabetes Dataset."
    >
      {result ? (
        <DiabetesResult result={result} onReset={handleReset} />
      ) : (
        <DiabetesForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}
    </ModulePageShell>
  );
}