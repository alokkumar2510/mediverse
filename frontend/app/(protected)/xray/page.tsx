import type { Metadata } from "next";
import { XrayAnalysis } from "@/components/modules/xray/XrayAnalysis";

export const metadata: Metadata = {
  title: "X-Ray Analysis — MediVerse AI",
  description:
    "AI-powered chest X-ray screening across 17 disease classes. Upload a JPEG/PNG and receive instant AI analysis.",
};

export default function XrayPage() {
  return <XrayAnalysis />;
}