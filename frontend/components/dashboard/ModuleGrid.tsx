import Link from "next/link";
const MODULES = [
  { href: "/xray", label: "X-Ray", desc: "Chest X-ray analysis" },
  { href: "/ecg", label: "ECG", desc: "Heart rhythm analysis" },
  { href: "/skin", label: "Skin", desc: "Skin condition detection" },
  { href: "/diabetes", label: "Diabetes", desc: "Risk prediction" },
  { href: "/prescription", label: "Prescription OCR", desc: "Medicine extraction" },
  { href: "/symptoms", label: "Symptom Checker", desc: "NLP triage" },
];
export function ModuleGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {MODULES.map((m) => (
        <Link key={m.href} href={m.href} className="border rounded-lg p-4 bg-card hover:border-primary transition-colors">
          <p className="font-semibold">{m.label}</p>
          <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
        </Link>
      ))}
    </div>
  );
}