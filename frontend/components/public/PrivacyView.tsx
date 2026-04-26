"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Shield, Eye, Lock, UserCheck, Globe, Mail } from "lucide-react";

const EFFECTIVE_DATE = "26 April 2025";
const COMPANY = "MediVerse AI";
const CONTACT = "privacy@mediverse.alokkumarsahu.in";

const sections = [
  {
    id: "overview",
    icon: Shield,
    title: "1. Overview",
    content: [
      `${COMPANY} ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data when you use the Platform at mediverse.alokkumarsahu.in.`,
      "This Policy applies to all users of the Platform regardless of location. By using MediVerse AI, you agree to the practices described below.",
      "We follow privacy-by-design principles: we collect the minimum data necessary to operate the Platform, and we never sell your personal data to third parties.",
    ],
  },
  {
    id: "what-we-collect",
    icon: Eye,
    title: "2. What We Collect",
    subsections: [
      {
        heading: "Account Data",
        items: [
          "Email address and password (hashed) — required for registration and authentication.",
          "Display name (optional) — used to personalise your dashboard.",
          "Account creation timestamp and last login date.",
        ],
      },
      {
        heading: "Usage & Analytics Data",
        items: [
          "Pages visited, module interactions, and feature usage — used to improve the Platform.",
          "Device type, browser, operating system, and approximate geographic region (country-level).",
          "Error logs and performance metrics — collected anonymously to diagnose issues.",
        ],
      },
      {
        heading: "Medical Upload Data",
        items: [
          "Images, signals, and documents you upload for analysis (e.g. chest X-rays, ECG CSVs, skin photographs).",
          "These are processed entirely in-memory and are NOT persistently stored after inference is complete.",
          "We do not link uploaded medical data to your account profile or any identifiable record.",
        ],
      },
    ],
  },
  {
    id: "what-we-dont-collect",
    icon: Lock,
    title: "3. What We Do NOT Collect",
    content: [
      "We do not collect payment card numbers or banking information — the Platform is currently free.",
      "We do not store, log, or retain uploaded medical images, ECG signals, prescription documents, or skin photographs beyond the duration of a single inference session.",
      "We do not build advertising profiles, sell data to data brokers, or share your data with third-party marketing platforms.",
      "We do not use your uploaded medical data to train or fine-tune our AI models. Training data is sourced exclusively from publicly available, peer-reviewed clinical datasets (NIH, MIT-BIH, HAM10000, PIMA Indians).",
    ],
  },
  {
    id: "how-we-use",
    icon: UserCheck,
    title: "4. How We Use Your Data",
    content: [
      "Account data is used to authenticate you, deliver the Platform, and communicate important service updates.",
      "Usage analytics (anonymised) help us understand how features are used and guide product development decisions.",
      "Error and performance logs are used solely for diagnosing technical issues and improving system reliability.",
      "We may use your email address to send transactional communications (e.g. password reset, account security alerts). We will only send marketing emails with your explicit consent, and you may opt out at any time.",
    ],
  },
  {
    id: "cookies",
    title: "5. Cookies & Tracking",
    content: [
      "We use essential cookies required for authentication (session tokens) and security (CSRF protection). These cannot be disabled without breaking core Platform functionality.",
      "We use anonymised analytics cookies to understand aggregate usage patterns. These do not contain personally identifiable information.",
      "We do not use third-party advertising cookies or tracking pixels.",
      "You can manage cookie preferences in your browser settings. Blocking essential cookies will prevent you from logging in.",
    ],
  },
  {
    id: "sharing",
    title: "6. Data Sharing & Third Parties",
    content: [
      "We do not sell, rent, or trade your personal data with any third party.",
      "We may share data with trusted service providers who process data on our behalf (e.g. cloud hosting, email delivery). These providers are bound by data processing agreements and are prohibited from using your data for their own purposes.",
      "We may disclose data if required by law, court order, or regulatory authority, or to protect the safety and rights of users and third parties.",
      "In the event of a business merger or acquisition, your data may be transferred to the successor entity, and you will be notified in advance.",
    ],
  },
  {
    id: "security",
    icon: Lock,
    title: "7. Security",
    content: [
      "All data in transit is encrypted using TLS 1.3. Passwords are hashed using bcrypt with a per-user salt — we never store plaintext passwords.",
      "Uploaded files are processed in isolated, ephemeral memory containers and are never written to persistent storage.",
      "We conduct periodic security audits and maintain responsible disclosure channels for vulnerability reports.",
      "Despite these measures, no system is completely immune to security risks. We encourage you to use a strong, unique password and enable two-factor authentication when available.",
    ],
  },
  {
    id: "retention",
    title: "8. Data Retention",
    content: [
      "Account data is retained for the lifetime of your account, plus 30 days following deletion (to handle disputes or legal obligations).",
      "Anonymised usage analytics are retained for up to 24 months before aggregation and deletion of individual records.",
      "Medical upload data (images, signals, documents) is not retained beyond the active inference session — typically less than 60 seconds.",
      "You may request deletion of your account and all associated personal data at any time by contacting us.",
    ],
  },
  {
    id: "your-rights",
    icon: UserCheck,
    title: "9. Your Rights",
    content: [
      "Depending on your jurisdiction, you may have the following rights regarding your personal data:",
      "Right of access — request a copy of the personal data we hold about you.",
      "Right to rectification — request correction of inaccurate or incomplete data.",
      "Right to erasure ('right to be forgotten') — request deletion of your personal data.",
      "Right to restriction — request that we limit processing of your data in certain circumstances.",
      "Right to data portability — receive your data in a structured, machine-readable format.",
      "Right to object — object to processing based on legitimate interests or for direct marketing.",
      `To exercise any of these rights, contact us at ${CONTACT}. We will respond within 30 days. Identity verification may be required.`,
    ],
  },
  {
    id: "international",
    icon: Globe,
    title: "10. International Transfers",
    content: [
      "MediVerse AI is hosted on infrastructure that may operate across multiple geographic regions. If your data is transferred outside your country of residence, we ensure appropriate safeguards are in place (e.g. Standard Contractual Clauses for EU data).",
      "If you are based in the European Economic Area (EEA), your data is processed in compliance with the General Data Protection Regulation (GDPR).",
    ],
  },
  {
    id: "children",
    title: "11. Children's Privacy",
    content: [
      "The Platform is not directed at individuals under the age of 18. We do not knowingly collect personal data from children.",
      "If we become aware that a child under 18 has provided personal data, we will delete it promptly. If you believe a child has registered, please contact us immediately.",
    ],
  },
  {
    id: "changes",
    title: "12. Changes to This Policy",
    content: [
      "We may update this Privacy Policy periodically to reflect changes in our practices or applicable law. The effective date at the top of this page indicates when the Policy was last revised.",
      "For material changes, we will notify registered users via email at least 14 days before the new Policy takes effect. Your continued use of the Platform after that date constitutes acceptance.",
    ],
  },
  {
    id: "contact-privacy",
    icon: Mail,
    title: "13. Contact & DPO",
    content: [
      `For privacy-related queries, requests, or complaints, contact our Privacy team at: ${CONTACT}`,
      "We aim to acknowledge all privacy requests within 5 business days and resolve them within 30 days.",
    ],
  },
];

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function PrivacyView() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />

      {/* Hero */}
      <section
        className="relative pt-[var(--navbar-height)] border-b border-border"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% -10%, hsl(196 88% 80% / 0.12) 0%, transparent 70%)",
        }}
      >
        <div
          className="max-w-3xl mx-auto px-6 md:px-10 text-center"
          style={{ paddingTop: "clamp(64px, 8vw, 100px)", paddingBottom: "clamp(48px, 6vw, 72px)" }}
        >
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeIn}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 mb-5"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))" }}
            >
              <Shield className="h-4 w-4 text-white" strokeWidth={2} />
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              Legal
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="font-bold tracking-tight"
            style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", letterSpacing: "-0.03em", lineHeight: 1.1 }}
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground mt-4 text-sm leading-relaxed"
          >
            Effective date: <strong className="text-foreground">{EFFECTIVE_DATE}</strong>.
            Your privacy matters — we collect the minimum data needed to run the Platform.
          </motion.p>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-16 flex-1">

        {/* Zero-retention highlight */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeIn}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
        >
          {[
            { icon: Lock, label: "Zero medical data retention", desc: "Uploads are never stored" },
            { icon: Shield, label: "No data sales", desc: "Your data is not a product" },
            { icon: UserCheck, label: "GDPR-aligned", desc: "Your rights are respected" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "hsl(196 88% 42% / 0.1)" }}
              >
                <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-semibold leading-snug">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Table of contents */}
        <motion.nav
          initial="hidden"
          animate="show"
          variants={fadeIn}
          transition={{ duration: 0.45, delay: 0.22 }}
          className="rounded-xl border border-border bg-card p-6 mb-12"
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-4">
            Contents
          </p>
          <ol className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </motion.nav>

        {/* Sections */}
        <div className="space-y-14">
          {sections.map((s, idx) => (
            <motion.section
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.25 + idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2
                className="font-bold mb-4 flex items-center gap-2.5"
                style={{ fontSize: "1.1rem", letterSpacing: "-0.018em" }}
              >
                {s.icon && (
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "hsl(196 88% 42% / 0.1)" }}
                  >
                    <s.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.8} />
                  </span>
                )}
                {s.title}
              </h2>

              {/* Subsections (for "What We Collect") */}
              {"subsections" in s && s.subsections ? (
                <div className="space-y-5 border-l-2 border-border pl-4">
                  {s.subsections.map((sub) => (
                    <div key={sub.heading}>
                      <p className="text-sm font-semibold mb-2 text-foreground">{sub.heading}</p>
                      <ul className="space-y-1.5">
                        {sub.items.map((item, k) => (
                          <li key={k} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-primary/50" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 border-l-2 border-border pl-4">
                  {(s.content ?? []).map((para, j) => (
                    <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </motion.section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">Last updated: {EFFECTIVE_DATE}</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-xs text-primary hover:underline">
              Terms &amp; Conditions
            </Link>
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Back to home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
