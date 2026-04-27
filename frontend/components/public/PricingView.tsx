"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Check, X, Zap, Building2, GraduationCap, ArrowRight,
  ShieldCheck, Activity, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* ── Animation helpers ──────────────────────────────────────────────────────── */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 },
  }),
};

/* ── Data ───────────────────────────────────────────────────────────────────── */
const plans = [
  {
    id: "free",
    icon: GraduationCap,
    name: "Free",
    tagline: "For individuals & students",
    monthly: 0,
    annual: 0,
    highlight: false,
    cta: "Get started",
    ctaHref: "/signup",
    color: "hsl(196,60%,50%)",
    features: [
      { label: "5 analyses per month", included: true },
      { label: "All 6 AI modules", included: true },
      { label: "PDF report export", included: true },
      { label: "Analysis history (7 days)", included: true },
      { label: "Priority processing", included: false },
      { label: "Unlimited analyses", included: false },
      { label: "Team workspaces", included: false },
      { label: "API access", included: false },
      { label: "Dedicated support", included: false },
    ],
  },
  {
    id: "pro",
    icon: Zap,
    name: "Pro",
    tagline: "For clinicians & researchers",
    monthly: 29,
    annual: 23,
    highlight: true,
    badge: "Most popular",
    cta: "Start Pro trial",
    ctaHref: "/signup?plan=pro",
    color: "hsl(196,88%,42%)",
    features: [
      { label: "Unlimited analyses", included: true },
      { label: "All 6 AI modules", included: true },
      { label: "PDF report export", included: true },
      { label: "Full analysis history", included: true },
      { label: "Priority processing", included: true },
      { label: "API access (1 000 req/mo)", included: true },
      { label: "Team workspaces", included: false },
      { label: "Custom model fine-tuning", included: false },
      { label: "Dedicated support", included: false },
    ],
  },
  {
    id: "enterprise",
    icon: Building2,
    name: "Enterprise",
    tagline: "For hospitals & health systems",
    monthly: null,
    annual: null,
    highlight: false,
    cta: "Contact sales",
    ctaHref: "/contact",
    color: "hsl(262,72%,60%)",
    features: [
      { label: "Unlimited analyses", included: true },
      { label: "All 6 AI modules", included: true },
      { label: "Custom PDF branding", included: true },
      { label: "Full audit trail", included: true },
      { label: "Priority processing", included: true },
      { label: "Unlimited API access", included: true },
      { label: "Team workspaces", included: true },
      { label: "Custom model fine-tuning", included: true },
      { label: "Dedicated support", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Is MediVerse AI a medical device?",
    a: "No. MediVerse AI is a clinical decision-support tool, not an FDA-cleared medical device. All outputs are intended to assist — not replace — qualified clinicians. Always confirm results with a licensed healthcare professional.",
  },
  {
    q: "How is patient data handled?",
    a: "Uploaded images are processed in memory only and never persisted to disk after analysis completes. We use HTTPS end-to-end, zero telemetry, and no third-party analytics. Each session is fully isolated.",
  },
  {
    q: "Can I cancel my Pro plan anytime?",
    a: "Yes. Cancel anytime from your account settings. You retain Pro access until the end of the current billing period — no surprise charges.",
  },
  {
    q: "What does 'API access' mean for Pro users?",
    a: "Pro subscribers receive a personal API key to call any MediVerse module programmatically (up to 1 000 requests/month). Ideal for integrating with EMR systems or research workflows.",
  },
  {
    q: "Do you offer academic or NGO discounts?",
    a: "Yes. Reach out via our contact page with your institution email. We offer 50 % off Pro for verified academic researchers and qualifying non-profits.",
  },
  {
    q: "What's included in Enterprise support?",
    a: "Enterprise plans include a dedicated customer success manager, a 99.9 % SLA, on-premise deployment options, custom HIPAA BAA signing, and priority engineering escalation.",
  },
];

/* ── Component ───────────────────────────────────────────────────────────────── */
export function PricingView() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />
      <main className="flex-1 pt-[var(--navbar-height)]">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden border-b border-border/60 py-24 px-6 md:px-10">
          {/* Subtle radial glow */}
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(ellipse 70% 50% at 50% 0%, hsl(196 88% 42% / 0.08) 0%, transparent 70%)",
            }}
          />
          <div className="max-w-[1160px] mx-auto text-center">
            <motion.p
              variants={fadeUp} initial="hidden" animate="show" custom={0}
              className="text-xs font-semibold tracking-widest uppercase text-primary mb-4"
            >
              Simple, transparent pricing
            </motion.p>
            <motion.h1
              variants={fadeUp} initial="hidden" animate="show" custom={1}
              className="font-bold tracking-tight mb-5"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.2rem)", lineHeight: 1.1 }}
            >
              Start free.<br />
              <span className="text-muted-foreground font-normal font-serif italic">
                Scale when you need to.
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp} initial="hidden" animate="show" custom={2}
              className="text-muted-foreground text-[1rem] max-w-[480px] mx-auto mb-8"
            >
              Every plan includes all six AI diagnostic modules.
              No hidden fees, no credit-card required to start.
            </motion.p>

            {/* Billing toggle */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="show" custom={3}
              className="inline-flex items-center gap-3 p-1 rounded-xl border border-border bg-accent/30 text-sm"
            >
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-1.5 rounded-lg font-medium transition-colors ${
                  !annual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  annual ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Annual
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  −20%
                </span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing cards ── */}
        <section className="py-20 px-6 md:px-10">
          <div className="max-w-[1160px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className={`relative flex flex-col rounded-2xl border p-8 transition-shadow ${
                    plan.highlight
                      ? "border-primary/60 shadow-xl shadow-primary/10 bg-card ring-1 ring-primary/20"
                      : "border-border bg-card hover:shadow-md"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide gradient-brand text-white shadow-sm">
                      {plan.badge}
                    </span>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: `${plan.color}18` }}
                    >
                      <plan.icon className="h-5 w-5" style={{ color: plan.color }} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="font-bold text-[1rem]">{plan.name}</p>
                      <p className="text-[0.75rem] text-muted-foreground">{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-7">
                    {plan.monthly === null ? (
                      <p className="text-3xl font-bold tracking-tight">Custom</p>
                    ) : plan.monthly === 0 ? (
                      <p className="text-3xl font-bold tracking-tight">Free</p>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className="text-3xl font-bold tracking-tight">
                          ${annual ? plan.annual : plan.monthly}
                        </span>
                        <span className="text-muted-foreground text-sm mb-1">/month</span>
                      </div>
                    )}
                    {plan.monthly !== null && plan.monthly > 0 && annual && (
                      <p className="text-[0.72rem] text-muted-foreground mt-1">
                        Billed ${(plan.annual! * 12).toFixed(0)}/year
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(({ label, included }) => (
                      <li key={label} className="flex items-center gap-2.5 text-[0.82rem]">
                        {included ? (
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" strokeWidth={2.5} />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 shrink-0" strokeWidth={2} />
                        )}
                        <span className={included ? "text-foreground" : "text-muted-foreground/50"}>
                          {label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.ctaHref}
                    id={`pricing-cta-${plan.id}`}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-[0.88rem] transition-all ${
                      plan.highlight
                        ? "gradient-brand text-white shadow-md shadow-primary/20 hover:opacity-90"
                        : "border border-border hover:bg-accent text-foreground"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Trust row */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={0}
              className="mt-10 flex flex-wrap justify-center items-center gap-6 text-[0.78rem] text-muted-foreground"
            >
              {[
                "No credit card required",
                "Cancel anytime",
                "HIPAA-aligned architecture",
                "99.9% uptime SLA",
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" strokeWidth={2} />
                  {t}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Feature comparison table ── */}
        <section className="py-20 px-6 md:px-10 border-t border-border/60 surface-1">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">
                Full comparison
              </p>
              <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Everything in every plan
              </h2>
            </motion.div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-[0.83rem]">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left px-6 py-4 font-semibold text-muted-foreground w-[40%]">Feature</th>
                    {plans.map((p) => (
                      <th key={p.id} className="px-6 py-4 font-semibold text-center">
                        <span style={{ color: p.color }}>{p.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "AI diagnostic modules", values: ["All 6", "All 6", "All 6"] },
                    { label: "Monthly analyses", values: ["5", "Unlimited", "Unlimited"] },
                    { label: "PDF report exports", values: [true, true, true] },
                    { label: "Analysis history", values: ["7 days", "Unlimited", "Unlimited"] },
                    { label: "Priority processing", values: [false, true, true] },
                    { label: "API access", values: [false, "1 000 req/mo", "Unlimited"] },
                    { label: "Team workspaces", values: [false, false, true] },
                    { label: "Custom branding on PDFs", values: [false, false, true] },
                    { label: "HIPAA BAA", values: [false, false, true] },
                    { label: "SLA guarantee", values: [false, false, "99.9%"] },
                    { label: "Dedicated support", values: [false, false, true] },
                  ].map(({ label, values }, ri) => (
                    <tr
                      key={label}
                      className={`border-b border-border/40 ${ri % 2 === 0 ? "" : "bg-accent/10"}`}
                    >
                      <td className="px-6 py-3.5 text-muted-foreground">{label}</td>
                      {values.map((v, ci) => (
                        <td key={ci} className="px-6 py-3.5 text-center font-medium">
                          {v === true ? (
                            <Check className="h-4 w-4 text-emerald-500 mx-auto" strokeWidth={2.5} />
                          ) : v === false ? (
                            <X className="h-4 w-4 text-muted-foreground/25 mx-auto" strokeWidth={2} />
                          ) : (
                            <span className="text-foreground">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="py-20 px-6 md:px-10">
          <div className="max-w-[760px] mx-auto">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">FAQ</p>
              <h2 className="font-bold tracking-tight" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
                Questions we hear often
              </h2>
            </motion.div>

            <div className="space-y-3">
              {faqs.map(({ q, a }, i) => (
                <motion.div
                  key={q}
                  variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left hover:bg-accent/40 transition-colors"
                  >
                    <span className="font-medium text-[0.9rem]">{q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5 text-[0.84rem] text-muted-foreground leading-relaxed border-t border-border/40 pt-4">
                      {a}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="py-20 px-6 md:px-10 border-t border-border/60">
          <div className="max-w-[1160px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden rounded-3xl gradient-brand p-px"
            >
              <div className="relative rounded-[23px] bg-gradient-to-br from-[hsl(196,88%,40%)] to-[hsl(196,95%,28%)] px-8 md:px-16 py-16 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 0%, transparent 50%)" }}
                />
                <div className="relative max-w-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="h-5 w-5 opacity-80" strokeWidth={2} />
                    <span className="text-xs font-semibold tracking-widest uppercase opacity-70">
                      MediVerse AI
                    </span>
                  </div>
                  <h2 className="font-bold text-white mb-3" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)" }}>
                    Your first 5 analyses are free.
                  </h2>
                  <p className="text-white/75 text-[0.95rem] leading-relaxed">
                    No card. No commitment. Just upload and get results.
                  </p>
                </div>
                <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    href="/signup"
                    id="pricing-bottom-cta"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-white text-[hsl(196,88%,34%)] text-[0.9rem] hover:bg-white/95 transition-colors shadow-xl"
                  >
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white/90 border border-white/25 hover:bg-white/10 transition-colors text-[0.9rem]"
                  >
                    Talk to sales
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
