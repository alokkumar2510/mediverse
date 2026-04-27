import type { Metadata } from "next";
import { PricingView } from "@/components/public/PricingView";

export const metadata: Metadata = {
  title: "Pricing — MediVerse AI",
  description:
    "Simple, transparent pricing for MediVerse AI. Start free with 5 analyses per month across all 6 clinical AI modules. Upgrade to Pro for unlimited access.",
};

export default function PricingPage() {
  return <PricingView />;
}