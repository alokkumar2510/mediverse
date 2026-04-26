import type { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your MediVerse AI health overview and recent analyses.",
};

export default function DashboardPage() {
  return <DashboardView />;
}