import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diabetes Risk Assessment — MediVerse AI",
  description:
    "AI-powered Type 2 diabetes risk scoring from clinical biomarkers. Powered by XGBoost trained on the PIMA Indians Diabetes Dataset.",
};

export default function DiabetesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
