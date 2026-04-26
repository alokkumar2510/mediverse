import type { Metadata } from "next";
import FeaturesView from "@/components/public/FeaturesView";

export const metadata: Metadata = {
  title: "Features — AI Diagnostic Modules",
  description:
    "Explore all six clinical AI modules in MediVerse AI: Chest X-Ray, ECG, Skin Lesion, Diabetes Risk, Prescription OCR, and Symptom Checker.",
};

export default function FeaturesPage() {
  return <FeaturesView />;
}