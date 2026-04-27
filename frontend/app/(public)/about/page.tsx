import type { Metadata } from "next";
import { AboutView } from "@/components/public/AboutView";

export const metadata: Metadata = {
  title: "About — MediVerse AI",
  description:
    "Learn about the mission, founder, and technology behind MediVerse AI — a bootstrapped, privacy-first healthcare AI platform built by Alok Kumar Sahu.",
};

export default function AboutPage() {
  return <AboutView />;
}