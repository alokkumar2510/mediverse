import type { Metadata } from "next";
import { MessageSquare } from "lucide-react";
import { ModulePageShell } from "@/components/modules/ModulePageShell";
import { SymptomsModule } from "@/components/modules/symptoms/SymptomsModule";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Symptom Checker — MediVerse AI",
  description:
    "AI triage assistant — describe your symptoms and receive preliminary differential diagnoses, urgency assessment, and specialist recommendations.",
};

export default function SymptomsPage() {
  return (
    <ModulePageShell
      iconNode={
        <div className="p-3.5 rounded-2xl bg-violet-500/10">
          <MessageSquare className="h-7 w-7 text-violet-400" />
        </div>
      }
      title="AI Symptom Checker"
      description="Describe your symptoms in plain language. Our AI-powered triage assistant generates a preliminary differential diagnosis, urgency level, and specialist recommendation — powered by temporary AI while custom models are in training."
      badgeBg="bg-violet-500/10 text-violet-400"
    >
      <SymptomsModule />
    </ModulePageShell>
  );
}