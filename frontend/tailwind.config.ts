import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  // Force-generate all /8 and /6 opacity variants used throughout the codebase
  safelist: [
    { pattern: /bg-(primary|destructive|muted|accent|card|secondary|border)\/(5|6|8|10|15|20|25|30|40|50|60|70|80|90)/ },
    { pattern: /bg-(sky|rose|orange|amber|violet|emerald|indigo|red|slate|cyan|yellow|green|blue|purple)-(400|500|600|700|800|900)\/(5|6|8|10|15|20|30|40|50|60|70|80)/ },
    { pattern: /border-(sky|rose|orange|amber|violet|emerald|indigo|red|slate|cyan|primary|destructive)-(200|300|400|500|600|700|800|900)\/(5|6|8|10|15|20|25|30|40|50|60)/ },
    { pattern: /text-(muted-foreground|primary|destructive|foreground)\/(5|6|8|10|15|20|30|40|50|60|70|80|90)/ },
    { pattern: /text-(amber|rose|red|green|emerald|sky|blue|violet|slate|orange|yellow|indigo)-(300|400|500|600|700|800)\/(5|6|8|10|15|20|30|40|50|60|70|80)/ },
    { pattern: /from-(red|violet|slate|emerald|sky|amber|rose)-(400|500|600|700|800)\/(5|6|8|10|20|30|40|50|60|70|80)/ },
    { pattern: /to-(red|violet|slate|emerald|sky|amber|rose)-(400|500|600|700|800)\/(5|6|8|10|20|30|40|50|60|70|80)/ },
    { pattern: /border-(border|white|primary|destructive)\/(5|6|8|10|15|20|25|30|40|50|60)/ },
    { pattern: /bg-(white|black|background)\/(5|6|8|10|20|30|40|50|60|70|80|90)/ },
  ],
  theme: {
    // ── DO NOT put overrides here — it replaces all Tailwind defaults ──────────
    // Everything must go inside `extend`
    extend: {
      // ── Colors (shadcn/ui CSS-variable pattern) ───────────────────────────────
      colors: {
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },

      // ── Border radius (shadcn uses --radius CSS var) ──────────────────────────
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "calc(var(--radius) + 4px)",
        "2xl":"calc(var(--radius) + 8px)",
        "3xl":"calc(var(--radius) + 16px)",
      },

      // ── Font families — use CSS variables set by next/font ────────────────────
      fontFamily: {
        sans:  ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        mono:  ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },

      // ── ADDITIVE font sizes (keep all Tailwind defaults, add extras) ──────────
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1.2" }],
      },

      // ── ADDITIVE spacing ─────────────────────────────────────────────────────
      spacing: {
        "4.5": "1.125rem",
        "13":  "3.25rem",
        "15":  "3.75rem",
        "18":  "4.5rem",
        "22":  "5.5rem",
        "26":  "6.5rem",
        "30":  "7.5rem",
      },

      // ── ADDITIVE letter spacing ───────────────────────────────────────────────
      letterSpacing: {
        tightest: "-0.04em",
        tighter:  "-0.03em",
        snug:     "-0.015em",
        wide:     "0.04em",
        wider:    "0.08em",
        widest:   "0.12em",
      },

      // ── Box shadows (map to CSS variables) ───────────────────────────────────
      boxShadow: {
        xs:    "var(--shadow-xs)",
        brand: "var(--shadow-brand)",
      },

      // ── Custom easing functions ───────────────────────────────────────────────
      transitionTimingFunction: {
        spring:     "cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-in":"cubic-bezier(0.34, 1.56, 0.64, 1)",
      },

      // ── Keyframes / animations (shadcn accordion) ────────────────────────────
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease both",
        "fade-up":        "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        shimmer:          "shimmer 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;