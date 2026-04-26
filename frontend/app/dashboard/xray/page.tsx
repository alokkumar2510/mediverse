import type { Metadata } from "next";
import { XrayAnalysis } from "@/components/modules/xray/XrayAnalysis";

export const metadata: Metadata = {
  title: "Chest X-Ray AI | MediVerse AI",
  description:
    "AI-powered chest X-ray screening across 17 disease classes including Pneumonia, Tuberculosis, Cardiomegaly, Pneumothorax, and more. Powered by EfficientNet-B4 and Grad-CAM visualization.",
  keywords: ["chest x-ray", "AI radiology", "pneumonia detection", "tuberculosis screening", "medical AI"],
};

export default function XrayPage() {
  return (
    <main className="min-h-screen bg-[#060b16]">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <XrayAnalysis />
      </div>
    </main>
  );
}
