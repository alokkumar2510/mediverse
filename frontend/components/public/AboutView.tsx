"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Github, Twitter, Linkedin, Mail, Globe,
  Activity, Heart, Zap, ShieldCheck, Users, Star,
  ArrowRight, Code2, Brain, Stethoscope, Youtube,
} from "lucide-react";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* ── Animation ───────────────────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

/* ── Data ────────────────────────────────────────────────────────────────────── */
const founder = {
  name: "Alok Kumar Sahu",
  title: "Founder & AI Engineer",
  location: "India 🇮🇳",
  bio: [
    "I built MediVerse AI to make clinical-grade diagnostic tools accessible to everyone — not just institutions with million-dollar infrastructure budgets.",
    "Healthcare AI is full of hype. Most tools are demos that collapse in production. I wanted to build something real: models trained on peer-reviewed datasets, explainable outputs, and a UI that a clinician would actually use.",
    "I'm a full-stack engineer and AI researcher with a focus on medical imaging, signal processing, and production-grade ML deployment. MediVerse is my attempt to close the gap between academic research and real-world clinical utility.",
  ],
  stack: ["Python", "FastAPI", "PyTorch", "ONNX", "Next.js", "PostgreSQL", "Docker"],
  socials: [
    {
      icon: Github,
      label: "GitHub",
      handle: "@alokkumar2510",
      href: "https://github.com/alokkumar2510",
      color: "#6e5494",
    },
    {
      icon: Twitter,
      label: "Twitter / X",
      handle: "@alok_chintu",
      href: "https://twitter.com/alok_chintu",
      color: "#1DA1F2",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      handle: "Alok Kumar Sahu",
      href: "https://linkedin.com/in/alok-kumar-sahu",
      color: "#0A66C2",
    },
    {
      icon: Mail,
      label: "Email",
      handle: "alokkumarsahu2100@gmail.com",
      href: "mailto:alokkumarsahu2100@gmail.com",
      color: "hsl(196,88%,42%)",
    },
    {
      icon: Globe,
      label: "Platform",
      handle: "mediverse.alokkumarsahu.in",
      href: "https://alokkumarsahu.in",
      color: "hsl(158,50%,44%)",
    },
  ],
};

const mission = [
  {
    icon: Heart,
    title: "Democratise diagnostics",
    desc: "World-class clinical AI should not be locked behind enterprise contracts. We make it free to start.",
    color: "hsl(350,82%,58%)",
  },
  {
    icon: ShieldCheck,
    title: "Radical transparency",
    desc: "Every model is trained on public, peer-reviewed datasets. Confidence scores and limitations are shown — always.",
    color: "hsl(196,88%,42%)",
  },
  {
    icon: Zap,
    title: "Speed without compromise",
    desc: "Clinical decisions cannot wait. Our ONNX-optimised pipeline returns results in under 3 seconds.",
    color: "hsl(38,88%,54%)",
  },
  {
    icon: Users,
    title: "Built for clinicians",
    desc: "We designed for real workflows — structured PDF exports, clear uncertainty bands, actionable clinical notes.",
    color: "hsl(262,72%,60%)",
  },
];

const timeline = [
  {
    date: "Jan 2025",
    title: "Idea & research",
    desc: "Identified the gap between academic ML research and real clinical deployment. Started exploring MIT-BIH, NIH ChestX-ray14, and HAM10000 datasets.",
  },
  {
    date: "Mar 2025",
    title: "First prototype",
    desc: "Built a working chest X-ray classifier using EfficientNet-B4. Deployed on a personal server, tested with real radiologists.",
  },
  {
    date: "Jun 2025",
    title: "Platform v0.1",
    desc: "Expanded to all 6 modules. Built the FastAPI backend, PostgreSQL schema, and Next.js frontend from scratch.",
  },
  {
    date: "Sep 2025",
    title: "Supabase & Auth",
    desc: "Migrated to Supabase for production-grade auth and database. Implemented JWT refresh, RBAC, and HIPAA-aligned data handling.",
  },
  {
    date: "Apr 2026",
    title: "Public beta launch",
    desc: "Launched MediVerse AI publicly on mediverse.alokkumarsahu.in. Deployed backend on Render with gunicorn + uvicorn workers.",
  },
];

const techStack = [
  { icon: Brain, label: "PyTorch + ONNX", desc: "Model training & optimised inference" },
  { icon: Code2, label: "FastAPI + Python", desc: "Async production API" },
  { icon: Stethoscope, label: "Clinical Datasets", desc: "MIT-BIH, NIH, HAM10000, PIMA" },
  { icon: Star, label: "Next.js 14", desc: "App Router, Server Components" },
];

/* ── Component ───────────────────────────────────────────────────────────────── */
export function AboutView() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />
      <main className="flex-1 pt-[var(--navbar-height)]">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/60 py-24 px-6 md:px-10">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(196 88% 42% / 0.07) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-[1160px] mx-auto text-center">
            <motion.p
              variants={fadeUp} initial="hidden" animate="show" custom={0}
              className="text-xs font-semibold tracking-widest uppercase text-primary mb-4"
            >
              Our story
            </motion.p>
            <motion.h1
              variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="font-bold tracking-tight mb-6"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", lineHeight: 1.1 }}
            >
              Clinical AI that exists<br />
              <span className="text-muted-foreground font-normal font-serif italic">
                to serve patients, not investors.
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="text-muted-foreground text-[1.02rem] max-w-[560px] mx-auto leading-relaxed"
            >
              MediVerse AI is an independent, bootstrapped healthcare AI platform.
              No VC funding. No data selling. Just honest technology.
            </motion.p>
          </div>
        </section>

        {/* ── Mission pillars ── */}
        <section className="py-20 px-6 md:px-10">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">What we believe</p>
              <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Our core principles
              </h2>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {mission.map(({ icon: Icon, title, desc, color }, i) => (
                <motion.div
                  key={title}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="p-6 rounded-2xl border border-border/60 bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                    style={{ background: `${color}15` }}>
                    <Icon className="h-5 w-5" style={{ color }} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-semibold text-[0.95rem] mb-2">{title}</h3>
                  <p className="text-[0.81rem] text-muted-foreground leading-relaxed">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Founder section ── */}
        <section className="py-20 px-6 md:px-10 border-t border-border/60 surface-1">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-14"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">The person behind it</p>
              <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Meet the founder
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 items-start">
              {/* Left: Photo + quick social links */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
                className="flex flex-col items-center lg:items-start"
              >
                {/* Avatar */}
                <div className="relative mb-6">
                  <div className="absolute -inset-1 rounded-2xl gradient-brand blur-md opacity-25" />
                  <div className="relative h-56 w-56 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl">
                    <Image
                      src="/founder.png"
                      alt="Alok Kumar Sahu — Founder of MediVerse AI"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Status badge */}
                  <div className="absolute -bottom-3 -right-3 flex items-center gap-1.5 bg-background border border-border rounded-xl px-3 py-1.5 shadow-md text-[0.72rem] font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Open to work
                  </div>
                </div>

                <h3 className="font-bold text-xl tracking-tight">{founder.name}</h3>
                <p className="text-primary font-medium text-[0.88rem] mt-0.5">{founder.title}</p>
                <p className="text-muted-foreground text-[0.8rem] mt-1">{founder.location}</p>

                {/* Stack chips */}
                <div className="flex flex-wrap gap-1.5 mt-5">
                  {founder.stack.map((s) => (
                    <span key={s}
                      className="px-2.5 py-1 rounded-lg text-[0.72rem] font-medium bg-primary/8 text-primary border border-primary/15">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Social links */}
                <div className="mt-6 space-y-2.5 w-full max-w-xs">
                  {founder.socials.map(({ icon: Icon, label, handle, href, color }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("mailto") ? undefined : "_blank"}
                      rel="noopener noreferrer"
                      id={`founder-social-${label.toLowerCase().replace(/\s|\//g, "-")}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                        style={{ background: `${color}18` }}>
                        <Icon className="h-4 w-4" style={{ color }} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.72rem] text-muted-foreground font-medium">{label}</p>
                        <p className="text-[0.8rem] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {handle}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0 -translate-x-1 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all" />
                    </a>
                  ))}
                </div>
              </motion.div>

              {/* Right: Bio + timeline */}
              <motion.div
                variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
              >
                {/* Bio paragraphs */}
                <div className="space-y-5 mb-12">
                  {founder.bio.map((para, i) => (
                    <p key={i} className="text-[0.97rem] leading-relaxed text-muted-foreground">
                      {para}
                    </p>
                  ))}
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-6">
                    Project timeline
                  </p>
                  <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-[7px] top-0 bottom-0 w-px bg-border/60" />
                    <div className="space-y-8">
                      {timeline.map(({ date, title, desc }, i) => (
                        <motion.div
                          key={date}
                          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                          className="relative pl-7"
                        >
                          {/* Dot */}
                          <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background shadow-sm" />
                          <p className="text-[0.72rem] font-bold text-primary uppercase tracking-wider mb-1">{date}</p>
                          <p className="font-semibold text-[0.92rem] mb-1">{title}</p>
                          <p className="text-[0.81rem] text-muted-foreground leading-relaxed">{desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Tech stack deep-dive ── */}
        <section className="py-20 px-6 md:px-10">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-12"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">Under the hood</p>
              <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                How it's built
              </h2>
              <p className="text-muted-foreground text-[0.95rem] mt-3 max-w-[520px] leading-relaxed">
                Every component is selected for clinical reliability, not hype.
                Quantised ONNX for inference. Async FastAPI for scale. Supabase for data integrity.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {techStack.map(({ icon: Icon, label, desc }, i) => (
                <motion.div
                  key={label}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="p-6 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 mb-4">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                  </div>
                  <p className="font-semibold text-[0.92rem] mb-1">{label}</p>
                  <p className="text-[0.78rem] text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Architecture summary banner */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {[
                { label: "Backend", detail: "FastAPI + Gunicorn + Uvicorn Workers on Render", icon: Code2 },
                { label: "Frontend", detail: "Next.js 14 App Router on Cloudflare Pages", icon: Globe },
                { label: "Database", detail: "Supabase PostgreSQL + Alembic migrations", icon: ShieldCheck },
              ].map(({ label, detail, icon: Icon }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/8 shrink-0 mt-0.5">
                    <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="font-semibold text-[0.88rem] mb-0.5">{label}</p>
                    <p className="text-[0.78rem] text-muted-foreground leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 px-6 md:px-10 border-t border-border/60">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-4">Get involved</p>
              <h2 className="font-bold tracking-tight mb-5" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Try it. It's free.
              </h2>
              <p className="text-muted-foreground text-[0.95rem] mb-8 max-w-md mx-auto">
                No waitlist, no credit card. Upload a scan and see clinical AI in action.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/signup"
                  id="about-cta-signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold gradient-brand text-white shadow-md shadow-primary/20 hover:opacity-90 transition-opacity text-[0.9rem]"
                >
                  Create free account <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://github.com/alokkumar2510"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="about-cta-github"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold border border-border hover:bg-accent transition-colors text-[0.9rem]"
                >
                  <Github className="h-4 w-4" /> View on GitHub
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
