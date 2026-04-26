"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TopNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { FileText, Shield, AlertTriangle, Scale } from "lucide-react";

const EFFECTIVE_DATE = "26 April 2025";
const COMPANY = "MediVerse AI";
const DOMAIN = "mediverse.alokkumarsahu.in";
const CONTACT = "legal@mediverse.alokkumarsahu.in";

const sections = [
  {
    id: "acceptance",
    icon: Scale,
    title: "1. Acceptance of Terms",
    content: [
      `By accessing or using ${COMPANY} ("Platform", "Service", "we", "us"), you agree to be bound by these Terms & Conditions ("Terms"). If you do not agree, please do not use the Platform.`,
      "These Terms apply to all visitors, registered users, and any other person who accesses or uses the Service.",
      "We reserve the right to update these Terms at any time. Continued use after changes constitutes acceptance of the revised Terms. Significant changes will be communicated via email or an in-app notice.",
    ],
  },
  {
    id: "description",
    icon: FileText,
    title: "2. Description of Service",
    content: [
      `${COMPANY} is an AI-assisted clinical screening platform providing preliminary diagnostic support across six modules: Chest X-Ray Analysis, ECG Rhythm Analysis, Skin Lesion Screening, Diabetes Risk Prediction, Prescription OCR, and Symptom Checking.`,
      "The Platform is intended for informational and educational purposes only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.",
      "Always consult a qualified healthcare professional before making any medical decisions. MediVerse AI outputs are preliminary screening indicators — not clinical conclusions.",
    ],
  },
  {
    id: "medical-disclaimer",
    icon: AlertTriangle,
    title: "3. Medical Disclaimer & Limitation",
    content: [
      "THE PLATFORM IS NOT A MEDICAL DEVICE. Results produced by the Platform are AI-generated preliminary assessments and carry inherent uncertainty.",
      "MediVerse AI does not provide medical diagnoses, treatment recommendations, or prescriptions. No doctor-patient relationship is formed through use of the Platform.",
      "Do not use the Platform in emergency situations. If you are experiencing a medical emergency, call your local emergency services (e.g. 112, 999, or 911) immediately.",
      "Model outputs include confidence scores and uncertainty indicators. Low-confidence results explicitly recommend professional clinical review. Users must interpret all outputs in consultation with a licensed clinician.",
    ],
  },
  {
    id: "eligibility",
    icon: Shield,
    title: "4. Eligibility & Account",
    content: [
      "You must be at least 18 years of age to create an account and use the Platform. By registering, you confirm that you meet this age requirement.",
      "You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.",
      "You must provide accurate, complete information during registration and keep it up to date. We reserve the right to suspend or terminate accounts that provide false information.",
      "One individual may not maintain more than one free-tier account. Attempts to circumvent usage limits via multiple accounts may result in permanent termination.",
    ],
  },
  {
    id: "uploads",
    title: "5. User Uploads & Data",
    content: [
      "When you upload medical images, signals, or documents to the Platform, you confirm that you have the legal right to process that data and that you have obtained all necessary consents from the individuals whose data is included.",
      "Uploaded files are processed entirely in memory. We do not persistently store uploaded medical images, ECG signals, skin photographs, or prescription documents on our servers after inference is complete.",
      "You retain full ownership of any data you upload. By uploading, you grant us a limited, temporary licence to process that data solely for the purpose of delivering the requested analysis.",
      "Do not upload data that you are not authorised to process, data belonging to minors, or any data that violates applicable data protection laws.",
    ],
  },
  {
    id: "prohibited",
    title: "6. Prohibited Conduct",
    content: [
      "You agree not to: (a) reverse-engineer, decompile, or attempt to extract the source code or model weights of the Platform; (b) use automated scripts, bots, or scrapers to access the Platform without written permission; (c) attempt to circumvent security measures or rate limits; (d) upload malicious files, code, or content designed to damage the Platform or other users; (e) use the Platform to conduct unlicensed medical practice or to provide clinical advice to third parties for commercial gain.",
      "Violation of these provisions may result in immediate account suspension, legal action, and reporting to relevant regulatory authorities.",
    ],
  },
  {
    id: "ip",
    title: "7. Intellectual Property",
    content: [
      `All content, design, code, branding, trademarks, and AI models on the Platform are the exclusive property of ${COMPANY} or its licensors and are protected by applicable intellectual property laws.`,
      "You are granted a limited, non-exclusive, non-transferable, revocable licence to use the Platform for its intended personal screening purposes. This licence does not permit commercial use, redistribution, or creation of derivative works.",
      "Feedback or suggestions you provide to us may be incorporated into the Platform without compensation or attribution to you.",
    ],
  },
  {
    id: "liability",
    title: "8. Limitation of Liability",
    content: [
      `TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${COMPANY.toUpperCase()} AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.`,
      "Our total aggregate liability for any claims arising from or related to the Platform shall not exceed the greater of: (a) the amount you paid us in the 12 months preceding the claim, or (b) £50 GBP.",
      "Some jurisdictions do not allow limitation of liability for certain damages. In such cases, our liability is limited to the minimum extent permitted by applicable law.",
    ],
  },
  {
    id: "indemnification",
    title: "9. Indemnification",
    content: [
      `You agree to indemnify, defend, and hold harmless ${COMPANY}, its affiliates, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including legal fees) arising from: (a) your violation of these Terms; (b) your use or misuse of the Platform; (c) your violation of any third-party rights; or (d) any data you submit to the Platform.`,
    ],
  },
  {
    id: "governing",
    title: "10. Governing Law & Disputes",
    content: [
      "These Terms are governed by and construed in accordance with the laws of England and Wales, without regard to conflict-of-law principles.",
      "Any disputes arising from these Terms or your use of the Platform shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to the exclusive jurisdiction of the courts of England and Wales.",
      "Nothing in this section prevents either party from seeking emergency injunctive relief from a competent court.",
    ],
  },
  {
    id: "contact-terms",
    title: "11. Contact",
    content: [
      `For questions about these Terms, please contact us at: ${CONTACT}`,
      `Registered service address: ${DOMAIN}`,
    ],
  },
];

const fadeIn = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function TermsView() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavbar />

      {/* Hero */}
      <section
        className="relative pt-[var(--navbar-height)] border-b border-border"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 60% at 50% -10%, hsl(196 88% 80% / 0.13) 0%, transparent 70%)",
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
              <FileText className="h-4 w-4 text-white" strokeWidth={2} />
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
            Terms &amp; Conditions
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeIn}
            transition={{ duration: 0.5, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
            className="text-muted-foreground mt-4 text-sm leading-relaxed"
          >
            Effective date: <strong className="text-foreground">{EFFECTIVE_DATE}</strong>.
            Please read these Terms carefully before using {COMPANY}.
          </motion.p>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-3xl mx-auto w-full px-6 md:px-10 py-16 flex-1">
        {/* Medical alert banner */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeIn}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="flex gap-3 rounded-xl border p-4 mb-12"
          style={{
            background: "rgba(245,158,11,0.06)",
            borderColor: "rgba(245,158,11,0.25)",
          }}
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "hsl(38,88%,54%)" }} />
          <p className="text-sm leading-relaxed" style={{ color: "hsl(38,60%,40%)" }}>
            <strong>Important:</strong> {COMPANY} is not a medical device and does not provide clinical diagnoses.
            Always consult a qualified healthcare professional for any medical decision.
          </p>
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
              transition={{ duration: 0.45, delay: 0.25 + idx * 0.04, ease: [0.16, 1, 0.3, 1] }}
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
              <div className="space-y-3 border-l-2 border-border pl-4">
                {s.content.map((para, j) => (
                  <p key={j} className="text-sm text-muted-foreground leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Last updated: {EFFECTIVE_DATE}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-primary hover:underline">
              Privacy Policy
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
