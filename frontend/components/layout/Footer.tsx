"use client";

import Link from "next/link";
import { Activity, Github, Twitter, Linkedin } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features",  href: "/features" },
    { label: "Pricing",   href: "/pricing"  },
    { label: "About",     href: "/about"    },
    { label: "Contact",   href: "/contact"  },
  ],
  "AI Modules": [
    { label: "X-Ray Analysis",  href: "/xray"         },
    { label: "ECG Analysis",    href: "/ecg"           },
    { label: "Skin Diagnosis",  href: "/skin"          },
    { label: "Diabetes Risk",   href: "/diabetes"      },
    { label: "Prescription OCR",href: "/prescription"  },
    { label: "Symptom Checker", href: "/symptoms"      },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Use",   href: "/terms"   },
  ],
};

const socials = [
  { icon: Github,   href: "https://github.com/alokkumar2510",   label: "GitHub"   },
  { icon: Twitter,  href: "https://twitter.com/alok_chintu",    label: "Twitter"  },
  { icon: Linkedin, href: "https://linkedin.com/",              label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer id="site-footer" className="border-t border-border/60 surface-1 mt-auto">
      <div className="max-w-[1160px] mx-auto px-6 md:px-10 py-14">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-[200px_1fr_1fr_1fr] gap-10 mb-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <span className="flex h-7 w-7 items-center justify-center rounded-[8px] gradient-brand shadow-brand/30 shadow-sm">
                <Activity className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </span>
              <span className="font-bold text-[0.9rem] tracking-tight">
                Medi<span className="text-gradient">Verse</span>
              </span>
            </Link>
            <p className="text-[0.8rem] text-muted-foreground leading-relaxed max-w-[180px]">
              Clinical AI screening that respects your privacy and your time.
            </p>
            <div className="flex gap-2 mt-5">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 mb-3.5">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[0.8rem] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.72rem] text-muted-foreground/60">
            © {new Date().getFullYear()} MediVerse AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[0.72rem] text-muted-foreground/60 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              All systems operational
            </span>
            <p className="text-[0.72rem] text-muted-foreground/60">
              Built by Alok Kumar Sahu
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}