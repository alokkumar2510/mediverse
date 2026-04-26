"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  Activity, Radiation, Heart, Scan, FlaskConical, FileText,
  MessageSquare, ArrowRight, ShieldCheck, Zap, Star, Lock,
  ChevronRight, Users, TrendingUp, Clock,
} from "lucide-react";

/* ────────── Data ────────────────────────────────────────────────────────────── */

const modules = [
  {
    icon: Radiation,
    label: "Chest X-Ray",
    cap: "17 diseases detected",
    desc: "EfficientNet-B4 ensemble trained on NIH ChestX-ray14 dataset.",
    color: "hsl(196, 88%, 42%)",
    accent: "bg-sky-500/8 border-sky-200/60 dark:border-sky-800/40",
    href: "/xray",
    id: "module-xray",
  },
  {
    icon: Heart,
    label: "ECG Analysis",
    cap: "Real-time rhythm",
    desc: "CNN-LSTM pipeline on MIT-BIH Arrhythmia Database signals.",
    color: "hsl(350, 82%, 58%)",
    accent: "bg-rose-500/8 border-rose-200/60 dark:border-rose-800/40",
    href: "/ecg",
    id: "module-ecg",
  },
  {
    icon: Scan,
    label: "Skin Lesion",
    cap: "7 lesion classes",
    desc: "EfficientNet-B3 on HAM10000 with Grad-CAM saliency maps.",
    color: "hsl(28, 88%, 56%)",
    accent: "bg-orange-500/8 border-orange-200/60 dark:border-orange-800/40",
    href: "/skin",
    id: "module-skin",
  },
  {
    icon: FlaskConical,
    label: "Diabetes Risk",
    cap: "SHAP explainability",
    desc: "Calibrated XGBoost with 6 clinical biomarkers. PIMA dataset.",
    color: "hsl(262, 72%, 60%)",
    accent: "bg-violet-500/8 border-violet-200/60 dark:border-violet-800/40",
    href: "/diabetes",
    id: "module-diabetes",
  },
  {
    icon: FileText,
    label: "Prescription OCR",
    cap: "Structured extraction",
    desc: "Vision + NLP pipeline — medicines, doses, warnings in seconds.",
    color: "hsl(158, 50%, 44%)",
    accent: "bg-emerald-500/8 border-emerald-200/60 dark:border-emerald-800/40",
    href: "/prescription",
    id: "module-prescription",
  },
  {
    icon: MessageSquare,
    label: "Symptom Checker",
    cap: "NLP triage engine",
    desc: "Differential diagnosis & specialist routing in natural language.",
    color: "hsl(38, 88%, 54%)",
    accent: "bg-amber-500/8 border-amber-200/60 dark:border-amber-800/40",
    href: "/symptoms",
    id: "module-symptoms",
  },
];

const trustStats = [
  { value: "6",      label: "Diagnostic modules",  icon: Activity },
  { value: "<3s",    label: "Median analysis time", icon: Clock },
  { value: "HIPAA",  label: "Security compliant",   icon: ShieldCheck },
  { value: "99.9%",  label: "Platform uptime",      icon: TrendingUp },
];

const pillars = [
  {
    icon: Zap,
    title: "Instant inference",
    desc: "Quantised ONNX models return clinical-grade results in under 3 seconds on modest hardware.",
  },
  {
    icon: Lock,
    title: "Privacy by design",
    desc: "Your images and records never leave your session. Zero telemetry. End-to-end HTTPS.",
  },
  {
    icon: Star,
    title: "Research-grade models",
    desc: "Every model trained on publicly peer-reviewed clinical datasets. Confidence scores included.",
  },
  {
    icon: Users,
    title: "Specialist-ready reports",
    desc: "Structured PDF exports doctors actually read. Not walls of raw probability outputs.",
  },
];

/* ────────── Animation variants ─────────────────────────────────────────────── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.52, ease: [0.16, 1, 0.3, 1], delay: i * 0.07 },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ────────── Component ───────────────────────────────────────────────────────── */

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY    = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const heroOpac = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />

      {/* ───────────────────────────────────────────────────────────
          HERO — asymmetric editorial layout, not centered sameness
      ─────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative hero-bg grain overflow-hidden pt-[var(--navbar-height)]"
        style={{ minHeight: "calc(100svh - 0px)" }}
      >
        {/* Subtle grid lines — architectural not decorative */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--border) / 0.4) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--border) / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, black 30%, transparent 100%)",
          }}
        />

        <motion.div
          className="relative max-w-[1160px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center"
          style={{ paddingTop: "clamp(80px, 12vw, 140px)", paddingBottom: "clamp(80px, 10vw, 120px)" }}
        >
          {/* Left — copy */}
          <motion.div style={{ y: heroY, opacity: heroOpac }}>
            {/* Label */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={0}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full gradient-brand">
                <Activity className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                Healthcare AI Platform
              </span>
            </motion.div>

            {/* Headline — editorial weight contrast */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={1}
              className="font-bold tracking-tight"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 4rem)", lineHeight: 1.1 }}
            >
              Medical intelligence,{" "}
              <br className="hidden sm:block" />
              <span className="font-serif italic font-normal text-gradient-hero">
                finally accessible.
              </span>
            </motion.h1>

            {/* Body */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={2}
              className="mt-7 text-[1.05rem] leading-relaxed text-muted-foreground max-w-[480px]"
            >
              Six clinical AI modules — chest X-ray, ECG, dermatology, metabolic
              risk, prescription parsing, symptom triage — in one secure platform.
              Results in under three seconds.
            </motion.p>

            {/* CTA row */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={3}
              className="mt-10 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                id="hero-cta-primary"
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold gradient-brand text-white shadow-brand text-[0.9rem] hover:opacity-90 transition-opacity"
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/features"
                id="hero-cta-secondary"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-[0.9rem] text-foreground border border-border hover:bg-accent transition-colors"
              >
                Explore modules
              </Link>
            </motion.div>

            {/* Social proof micro-copy */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="mt-8 text-xs text-muted-foreground/70"
            >
              No credit card · HIPAA-aligned · Models trained on peer-reviewed data
            </motion.p>
          </motion.div>

          {/* Right — product visualisation card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
            className="hidden lg:block"
          >
            <HeroProductCard />
          </motion.div>
        </motion.div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          TRUST BAR
      ─────────────────────────────────────────────────────────── */}
      <section className="border-y border-border/60 surface-1">
        <div className="max-w-[1160px] mx-auto px-6 md:px-10 py-7">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border/60">
            {trustStats.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="flex items-center gap-3.5 px-0 md:px-8 first:pl-0 last:pr-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xl font-bold tracking-tight text-foreground leading-none">{value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-none">{label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          MODULES — intentional non-uniform layout
      ─────────────────────────────────────────────────────────── */}
      <section id="modules" className="py-28 px-6 md:px-10 max-w-[1160px] mx-auto w-full">
        {/* Section header — left-aligned, editorial */}
        <div className="mb-16 max-w-lg">
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
            Diagnostic modules
          </p>
          <h2 className="font-bold mb-4" style={{ letterSpacing: "-0.025em" }}>
            Six AI screens,<br />
            <span className="text-muted-foreground font-normal">one platform.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Each module is an independent, production-grade inference engine —
            not a demo. Trained on real clinical datasets, validated against
            published benchmarks.
          </p>
        </div>

        {/* Bento-style grid — varied column spans for visual rhythm */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {modules.map(({ icon: Icon, label, cap, desc, color, accent, href, id }, i) => (
            <motion.div
              key={label}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={href}
                id={id}
                className={`group block h-full p-6 rounded-2xl border bg-card transition-shadow duration-200 hover:shadow-md ${accent}`}
              >
                <div
                  className="inline-flex p-2.5 rounded-xl mb-5"
                  style={{ backgroundColor: `${color}12` }}
                >
                  <Icon
                    className="h-5 w-5"
                    style={{ color }}
                    strokeWidth={1.8}
                  />
                </div>
                <p className="text-[10px] font-semibold tracking-widest uppercase mb-1"
                   style={{ color }}>
                  {cap}
                </p>
                <h3 className="font-semibold text-[1.05rem] mb-2 text-foreground">
                  {label}
                </h3>
                <p className="text-[0.8rem] text-muted-foreground leading-relaxed">
                  {desc}
                </p>
                <div className="mt-5 flex items-center gap-1 text-[0.78rem] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                     style={{ color }}>
                  Open module <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          WHY MEDIVERSE — 4 pillars, editorial rhythm
      ─────────────────────────────────────────────────────────── */}
      <section className="py-28 border-t border-border/60 surface-1">
        <div className="max-w-[1160px] mx-auto px-6 md:px-10">
          {/* Asymmetric layout: heading left, pillars right */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-16 items-start">
            {/* Left sticky heading */}
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                Why it matters
              </p>
              <h2 className="font-bold mb-4">
                Built for real clinical use cases.
              </h2>
              <p className="text-muted-foreground leading-relaxed text-[0.95rem]">
                We obsess over two things: accuracy and trust. Every decision in
                the product — from model choice to UI copy — exists to serve
                clinicians and patients honestly.
              </p>
              <Link
                href="/about"
                id="why-learn-more"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Our methodology <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Right pillar cards */}
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {pillars.map(({ icon: Icon, title, desc }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  custom={i}
                  className="p-6 rounded-2xl border border-border/60 bg-card shadow-xs"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 mb-4">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <h4 className="font-semibold text-[0.95rem] mb-2">{title}</h4>
                  <p className="text-[0.82rem] text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────
          CTA — minimal, confident, not salesy
      ─────────────────────────────────────────────────────────── */}
      <section className="py-28 px-6 md:px-10">
        <div className="max-w-[1160px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl gradient-brand p-px"
          >
            <div className="relative rounded-[23px] overflow-hidden bg-gradient-to-br from-[hsl(196,88%,40%)] to-[hsl(196,95%,28%)] px-8 md:px-16 py-16 md:py-20 text-white">
              {/* Background texture */}
              <div
                className="pointer-events-none absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 80% 20%, white 0%, transparent 50%)`,
                }}
              />
              <div className="relative max-w-xl">
                <p className="text-xs font-semibold tracking-widest uppercase opacity-70 mb-4">
                  Start today
                </p>
                <h2 className="font-bold text-white mb-5" style={{ letterSpacing: "-0.025em" }}>
                  Your first analysis is free.
                </h2>
                <p className="text-white/75 text-[0.95rem] leading-relaxed mb-8">
                  No sign-up friction, no credit card, no waitlist. Upload a scan
                  and get a structured AI report in seconds.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/signup"
                    id="bottom-cta-btn"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-white text-[hsl(196,88%,34%)] text-[0.9rem] hover:bg-white/95 transition-colors shadow-xl"
                  >
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/login"
                    id="bottom-cta-signin"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white/90 border border-white/25 hover:bg-white/10 transition-colors text-[0.9rem]"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Hero Product Card ────────────────────────────────────────────────────────
   A "living" UI mockup — what the product actually looks like
──────────────────────────────────────────────────────────────────────────── */

function HeroProductCard() {
  return (
    <motion.div
      className="animate-float relative"
      style={{ perspective: "1200px" }}
    >
      {/* Outer glow */}
      <div className="absolute inset-0 -z-10 blur-2xl opacity-30 rounded-3xl gradient-brand scale-90 translate-y-6" />

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        {/* Mock header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-accent/30">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-background border border-border text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-primary" strokeWidth={2} />
              mediverse.alokkumarsahu.in
            </div>
          </div>
        </div>

        {/* Mock X-ray result */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg gradient-brand flex items-center justify-center">
              <Radiation className="h-3.5 w-3.5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold">Chest X-Ray Analysis</p>
              <p className="text-[10px] text-muted-foreground">Completed · 2.1s</p>
            </div>
            <span className="ml-auto chip bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Normal
            </span>
          </div>

          {/* Confidence bars */}
          <div className="space-y-2.5">
            {[
              { label: "No Finding", pct: 94, color: "bg-emerald-500" },
              { label: "Atelectasis", pct: 4, color: "bg-amber-400" },
              { label: "Pneumonia", pct: 2, color: "bg-rose-400" },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                  <span className="text-[10px] font-medium">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.6 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border/60 my-4" />

          {/* AI suggestion chip */}
          <div className="rounded-xl bg-primary/6 border border-primary/15 p-3">
            <p className="text-[10px] font-semibold text-primary mb-1">Clinical note</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              No radiological abnormality detected. Recommend annual follow-up.
              This is a screening aid — not a diagnosis.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
