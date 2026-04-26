import type { Metadata } from "next";
import { SkinAnalysis } from "@/components/modules/skin/SkinAnalysis";

export const metadata: Metadata = {
  title: "Skin AI Screening — MediVerse AI",
  description:
    "AI-powered preliminary screening of skin lesions using EfficientNet-B3 trained on HAM10000/ISIC 2018. Upload a skin photo and get instant condition analysis.",
};

export default function SkinPage() {
  return <SkinAnalysis />;
}