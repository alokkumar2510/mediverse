"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Radiation, Heart, Scan, FlaskConical, FileText, MessageSquare,
  ArrowRight, ShieldCheck, Zap, Brain, Target, BarChart3,
  CheckCircle, Activity, Lock, Clock, TrendingUp, Layers,
  Cpu, Database, GitBranch,
} from "lucide-react";

/* ── Data ──────────────────────────────────────────────────────────────────── */

const modules = [
  {
    id: "xray",
    icon: Radiation,
    label: "Chest X-Ray Analysis",
    tagline: "17 diseases. One image. Under 3 seconds.",
    desc: "Our EfficientNet-B4 ensemble, trained on the NIH ChestX-ray14 dataset (112,000+ images), screens for 17 thoracic conditions including pneumonia, cardiomegaly, pleural effusion, and pneumothorax. Grad-CAM saliency maps show exactly which regions drove the prediction.",
    color: "hsl(196,88%,42%)",
    bg: "rgba(8,159,189,0.06)",
    border: "rgba(8,159,189,0.15)",
    href: "/xray",
    highlights: ["EfficientNet-B4 + DenseNet121 ensemble", "NIH ChestX-ray14 (112k+ images)", "Grad-CAM region heatmaps", "Per-disease confidence scores"],
    badge: "Imaging AI",
  },
  {
    id: "ecg",
    icon: Heart,
    label: "ECG Rhythm Analysis",
    tagline: "Arrhythmia detection. Signal-level intelligence.",
    desc: "A hybrid CNN-LSTM trained on MIT-BIH Arrhythmia Database classifies 5 rhythm classes from 1D ECG signals. The pipeline handles raw CSV uploads, applies a Butterworth bandpass filter, and segments individual beats before inference.",
    color: "hsl(350,82%,58%)",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.15)",
    href: "/ecg",
    highlights: ["CNN-LSTM hybrid architecture", "MIT-BIH Arrhythmia Database", "1D signal preprocessing pipeline", "5-class rhythm classification"],
    badge: "Signal AI",
  },
  {
    id: "skin",
    icon: Scan,
    label: "Skin Lesion Screening",
    tagline: "7 lesion classes. Dermatoscopy-grade analysis.",
    desc: "EfficientNet-B3 fine-tuned on HAM10000 (10,000 dermatoscopy images) classifies seven lesion types including melanoma, basal cell carcinoma, and benign keratosis. Grad-CAM visualization highlights the diagnostic region within the uploaded image.",
    color: "hsl(28,88%,56%)",
    bg: "rgba(249,115,22,0.06)",
    border: "rgba(249,115,22,0.15)",
    href: "/skin",
    highlights: ["EfficientNet-B3 + TTA inference", "HAM10000 dermatoscopy dataset", "7 lesion type classification", "Interactive Grad-CAM overlay"],
    badge: "Dermatology AI",
  },
  {
    id: "diabetes",
    icon: FlaskConical,
    label: "Diabetes Risk Prediction",
    tagline: "6 biomarkers. Calibrated risk score. SHAP explained.",
    desc: "A calibrated XGBoost model trained on PIMA Indians Diabetes Dataset takes six clinical inputs (glucose, BMI, insulin, age, blood pressure, pregnancies) and returns a probability-calibrated risk score with SHAP feature importance charts for full explainability.",
    color: "hsl(262,72%,60%)",
    bg: "rgba(139,92,246,0.06)",
    border: "rgba(139,92,246,0.15)",
    href: "/diabetes",
    highlights: ["Calibrated XGBoost classifier", "SHAP feature importance", "6 clinical biomarker inputs", "Risk band categorisation"],
    badge: "Clinical ML",
  },
  {
    id: "prescription",
    icon: FileText,
    label: "Prescription OCR",
    tagline: "Handwritten Rx. Structured in seconds.",
    desc: "A Vision + NLP pipeline extracts medication names, dosages, frequencies, and clinical warnings from uploaded prescription images — including handwritten doctor notes. Outputs a structured JSON report with drug interaction flags.",
    color: "hsl(158,50%,44%)",
    bg: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.15)",
    href: "/prescription",
    highlights: ["Vision + NLP dual pipeline", "Handwritten and printed Rx", "Dosage & frequency extraction", "Drug interaction flags"],
    badge: "Document AI",
  },
  {
    id: "symptoms",
    icon: MessageSquare,
    label: "Symptom Checker",
    tagline: "Natural language. Differential diagnosis. Specialist routing.",
    desc: "Describe symptoms in plain English. Our NLP triage engine generates a ranked differential diagnosis list with specialist routing recommendations, urgency triage, and follow-up question prompts — powered by a fine-tuned medical language model.",
    color: "hsl(38,88%,54%)",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.15)",
    href: "/symptoms",
    highlights: ["Medical NLP triage engine", "Differential diagnosis ranking", "Specialist routing logic", "Urgency classification"],
    badge: "Clinical NLP",
  },
];

const pillars = [
  {
    icon: Zap,
    title: "Sub-3s inference",
    desc: "ONNX Runtime-optimised models quantised to INT8. Every module returns a result in under 3 seconds, even on commodity hardware.",
  },
  {
    icon: Lock,
    title: "Zero data retention",
    desc: "Uploaded files are processed in memory and never written to disk. No user images are stored, logged, or used for retraining.",
  },
  {
    icon: Brain,
    title: "Research-grade datasets",
    desc: "Every model is trained on peer-reviewed, publicly available clinical datasets. No synthetic data, no unlabelled scrapes.",
  },
  {
    icon: Target,
    title: "Confidence-aware outputs",
    desc: "All predictions include calibrated probability scores. Low-confidence results trigger explicit clinical-review recommendations.",
  },
  {
    icon: BarChart3,
    title: "Explainable by default",
    desc: "Grad-CAM saliency maps, SHAP charts, and per-feature attribution are included in every diagnostic report — not add-ons.",
  },
  {
    icon: GitBranch,
    title: "Structured PDF exports",
    desc: "Every report exports as a structured PDF with findings, confidence scores, and recommended next steps formatted for clinical handoff.",
  },
];

const techStack = [
  { label: "Model format", value: "ONNX Runtime (INT8 quantised)", icon: Cpu },
  { label: "Inference backend", value: "Python FastAPI + ONNX RT", icon: Layers },
  { label: "Training datasets", value: "NIH, MIT-BIH, HAM10000, PIMA", icon: Database },
  { label: "Frontend", value: "Next.js 14 + Framer Motion", icon: Activity },
  { label: "Security", value: "HTTPS / HIPAA-aligned / Zero retention", icon: ShieldCheck },
  { label: "Uptime SLO", value: "99.9% (monitored)", icon: TrendingUp },
];

/* ── Animation ─────────────────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
  }),
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export default function FeaturesView() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative pt-[var(--navbar-height)] overflow-hidden"
        style={{
          background: "hsl(var(--background))",
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 60% -10%, hsl(196 88% 80% / 0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at -5% 70%, hsl(196 70% 80% / 0.12) 0%, transparent 60%)
          `,
        }}
      >
        {/* Subtle grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
            maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, black 20%, transparent 100%)",
          }}
        />

        <div
          className="relative max-w-5xl mx-auto px-6 md:px-10 text-center"
          style={{ paddingTop: "clamp(80px, 10vw, 120px)", paddingBottom: "clamp(60px, 8vw, 96px)" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-brand">
              <Activity className="h-2.5 w-2.5 text-white" strokeWidth={3} />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Platform Features
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, letterSpacing: "-0.03em" }}
          >
            Six clinical AI modules.{" "}
            <br className="hidden sm:block" />
            <span
              className="font-serif font-normal italic"
              style={{ color: "hsl(var(--primary))" }}
            >
              One unified platform.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground mt-5 max-w-xl mx-auto"
            style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.05rem)", lineHeight: 1.75 }}
          >
            Each module is powered by a production-grade model trained on peer-reviewed clinical
            datasets — delivering specialist-quality analysis with full explainability.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8"
          >
            <Link
              href="/signup"
              id="features-hero-cta"
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:opacity-90"
              style={{ background: "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))", boxShadow: "0 4px 20px hsl(196 88% 42% / 0.3)" }}
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent"
            >
              View pricing
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Module cards ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto w-full px-6 md:px-10 py-20">
        <div className="space-y-6">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.id}
                id={`feature-${mod.id}`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                className="group relative rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
                style={{
                  background: mod.bg,
                  borderColor: mod.border,
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">
                  {/* Left content */}
                  <div className="p-7 md:p-9">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: mod.bg, border: `1px solid ${mod.border}` }}
                      >
                        <Icon className="h-5 w-5" style={{ color: mod.color }} strokeWidth={1.8} />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Badge + label */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[10px] font-semibold tracking-widest uppercase rounded-full px-2 py-0.5"
                            style={{
                              color: mod.color,
                              background: mod.bg,
                              border: `1px solid ${mod.border}`,
                            }}
                          >
                            {mod.badge}
                          </span>
                        </div>

                        <h2
                          className="font-bold mb-1"
                          style={{ fontSize: "clamp(1.1rem, 2vw, 1.3rem)", letterSpacing: "-0.02em", color: "hsl(var(--foreground))" }}
                        >
                          {mod.label}
                        </h2>
                        <p className="text-sm font-medium mb-3" style={{ color: mod.color }}>
                          {mod.tagline}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                          {mod.desc}
                        </p>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mod.highlights.map((h) => (
                        <div key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle
                            className="h-3.5 w-3.5 shrink-0"
                            style={{ color: mod.color }}
                            strokeWidth={2.5}
                          />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right CTA */}
                  <div className="flex items-center border-t md:border-t-0 md:border-l p-6 md:p-9" style={{ borderColor: mod.border }}>
                    <Link
                      href={mod.href}
                      id={`feature-${mod.id}-cta`}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all whitespace-nowrap group-hover:shadow-md"
                      style={{
                        background: mod.color,
                        color: "white",
                        boxShadow: `0 2px 12px ${mod.color}33`,
                      }}
                    >
                      Try module
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Platform pillars ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-20">
          <div className="text-center mb-14">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs font-semibold tracking-widest uppercase text-primary"
            >
              Platform architecture
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-bold mt-2 tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.025em" }}
            >
              Built for clinical trust
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14, duration: 0.5 }}
              className="text-muted-foreground text-sm mt-3 max-w-lg mx-auto leading-relaxed"
            >
              Every architectural decision prioritises accuracy, explainability, and privacy — not engagement metrics.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pillars.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.3 + i * 0.07 }}
                  className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-4" style={{ background: "hsl(196 88% 42% / 0.1)" }}>
                    <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ fontSize: "0.95rem", letterSpacing: "-0.015em" }}>
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Tech specs table ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-center">
          {/* Left copy */}
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">
              Under the hood
            </span>
            <h2
              className="font-bold mt-2 mb-4 tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.025em" }}
            >
              Production-grade stack,<br />
              <span className="font-serif font-normal italic text-muted-foreground">not a weekend project.</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              MediVerse AI runs quantised ONNX models through a FastAPI inference server, with full
              Grad-CAM computation and SHAP explainability baked into each response — not bolted on afterward.
            </p>

            <div className="flex items-center gap-2 mt-6">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">HIPAA-aligned · End-to-end HTTPS · Zero data sharing</span>
            </div>
          </div>

          {/* Right specs */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {techStack.map(({ label, value, icon: Icon }, i) => (
              <div
                key={label}
                className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0"
                style={{ background: i % 2 === 0 ? "transparent" : "hsl(var(--muted) / 0.3)" }}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: "hsl(196 88% 42% / 0.1)" }}>
                  <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="text-sm font-medium text-foreground truncate">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 md:px-10 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 mx-auto"
              style={{ background: "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))", boxShadow: "0 4px 24px hsl(196 88% 42% / 0.3)" }}
            >
              <Clock className="h-6 w-6 text-white" strokeWidth={1.8} />
            </div>
            <h2
              className="font-bold mb-4 tracking-tight"
              style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.025em" }}
            >
              Ready to run your first analysis?
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Free forever for personal screening. No card required. Your first result in under
              60 seconds.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/signup"
                id="features-bottom-cta"
                className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
                style={{
                  background: "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))",
                  boxShadow: "0 4px 20px hsl(196 88% 42% / 0.3)",
                }}
              >
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3 text-sm font-medium text-foreground transition-all hover:bg-accent"
              >
                Back to home
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              No credit card · No waitlist · HIPAA-aligned
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
