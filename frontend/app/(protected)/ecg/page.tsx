import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { ModulePageShell } from "@/components/modules/ModulePageShell";
import ECGPageClient from "@/components/ecg/ECGPageClient";

export const metadata: Metadata = {
  title: "ECG Analysis — MediVerse AI",
  description:
    "AI-powered ECG rhythm analysis using ResNet1D trained on PTB-XL (21,837 clinical records). "
    + "Detect Normal Sinus Rhythm, Myocardial Infarction, ST/T Changes, and Conduction Disturbances.",
};

export default function EcgPage() {
  return (
    <ModulePageShell
      iconNode={
        <div className="p-3.5 rounded-2xl bg-red-500/10">
          <Heart className="h-7 w-7 text-red-500" />
        </div>
      }
      title="ECG Analysis"
      badge="Wave 2 · Live"
      badgeBg="bg-red-500/10 text-red-400"
      description="Upload a 1D ECG signal (.csv / .npy / .txt). Our ResNet1D model — trained on PTB-XL
        21,837 clinical records — screens for cardiac rhythm abnormalities and provides
        confidence-calibrated clinical recommendations."
    >
      <ECGPageClient />
    </ModulePageShell>
  );
}