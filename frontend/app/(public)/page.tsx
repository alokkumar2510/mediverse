import type { Metadata } from "next";
import { LandingPage } from "@/components/public/LandingPage";

export const metadata: Metadata = {
  title: "MediVerse AI — AI-Powered Healthcare Screening",
  description:
    "Get instant AI-assisted medical analysis for X-ray, ECG, skin, diabetes, prescriptions, and symptoms — all in one secure platform.",
};

export default function HomePage() {
  return <LandingPage />;
}