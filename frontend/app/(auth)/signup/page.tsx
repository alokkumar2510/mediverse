"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2,
  ShieldCheck, Check,
} from "lucide-react";

// ── Schema ─────────────────────────────────────────────────────────────────────
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "One uppercase letter required")
      .regex(/\d/, "One number required")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "One special character required"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ── Password strength ──────────────────────────────────────────────────────────
function getPasswordStrength(pw: string) {
  let s = 0;
  if (pw.length >= 8)  s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw))    s++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) s++;
  if (pw.length >= 12)  s++;
  if (s <= 2) return { label: "Weak",   color: "bg-rose-500",   width: "25%"  };
  if (s === 3) return { label: "Fair",   color: "bg-amber-400",  width: "50%"  };
  if (s === 4) return { label: "Good",   color: "bg-primary",    width: "75%"  };
  return              { label: "Strong", color: "bg-emerald-500", width: "100%" };
}

const checks = [
  { label: "8 characters",     test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number",           test: (p: string) => /\d/.test(p) },
  { label: "Special char",     test: (p: string) => /[!@#$%^&*()]/.test(p) },
];

// ── Why sign up callouts ────────────────────────────────────────────────────────
const perks = [
  "Free forever for personal screening use",
  "6 clinical AI modules, one account",
  "Exportable PDF reports",
  "HIPAA-aligned, zero data sharing",
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const { register: doRegister, isLoading, getApiErrorMessage } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch("password") ?? "";
  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    try {
      await doRegister({ name: data.name, email: data.email, password: data.password });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  // Shared input class builder
  const inputClass = (hasError: boolean) => `
    w-full bg-background border rounded-xl px-4 py-2.5 text-[0.88rem]
    placeholder:text-muted-foreground/40 outline-none transition-all
    focus:border-primary/50 focus:ring-2 focus:ring-primary/15
    ${hasError ? "border-destructive/60" : "border-border"}
  `;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left panel — value proposition ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[460px] shrink-0 relative overflow-hidden surface-1 border-r border-border/60 flex-col justify-between p-12">
        {/* Subtle top gradient */}
        <div
          className="pointer-events-none absolute top-0 left-0 right-0 h-48 opacity-30"
          style={{
            background: "linear-gradient(180deg, hsl(196,88%,88%) 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-16">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] gradient-brand">
              <Activity className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-bold text-[0.9rem] tracking-tight">
              Medi<span className="text-gradient">Verse</span>
            </span>
          </Link>

          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Free account
            </p>
            <h2
              className="font-bold tracking-tight mb-4"
              style={{ fontSize: "clamp(1.6rem, 2.5vw, 2rem)", letterSpacing: "-0.025em" }}
            >
              Start screening<br />
              <span className="font-serif italic font-normal text-muted-foreground">
                in 60 seconds.
              </span>
            </h2>
            <p className="text-[0.85rem] text-muted-foreground leading-relaxed">
              MediVerse AI puts clinical-grade AI diagnostics in your hands —
              no waitlist, no commitment.
            </p>
          </div>

          <ul className="space-y-3">
            {perks.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                </span>
                <span className="text-[0.82rem] text-foreground/80">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground/50" />
          <p className="text-[0.72rem] text-muted-foreground/50">
            Your data stays yours. Always.
          </p>
        </div>
      </div>

      {/* ── Right panel — form ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="flex h-7 w-7 items-center justify-center rounded-[8px] gradient-brand">
              <Activity className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-bold text-[0.9rem]">
              Medi<span className="text-gradient">Verse</span>
            </span>
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.025em" }}>
              Create account
            </h1>
            <p className="text-[0.85rem] text-muted-foreground mt-1.5">
              Free forever for personal use
            </p>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3 mb-5 text-destructive text-[0.8rem]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-[0.8rem] font-medium" htmlFor="reg-name">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="Dr. Priya Sharma"
                {...register("name")}
                className={inputClass(!!errors.name)}
              />
              {errors.name && (
                <p className="text-destructive text-[0.75rem] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[0.8rem] font-medium" htmlFor="reg-email">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@clinic.com"
                {...register("email")}
                className={inputClass(!!errors.email)}
              />
              {errors.email && (
                <p className="text-destructive text-[0.75rem] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-[0.8rem] font-medium" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={inputClass(!!errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {passwordValue.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${strength.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: strength.width }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {checks.map(({ label, test }) => (
                      <div key={label} className="flex items-center gap-1.5">
                        <span className={`h-3 w-3 rounded-full flex items-center justify-center shrink-0 ${test(passwordValue) ? "bg-emerald-500" : "bg-muted"}`}>
                          {test(passwordValue) && <Check className="h-1.5 w-1.5 text-white" strokeWidth={4} />}
                        </span>
                        <span className={`text-[10px] ${test(passwordValue) ? "text-foreground/70" : "text-muted-foreground/50"}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="text-destructive text-[0.75rem] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-[0.8rem] font-medium" htmlFor="reg-confirm">
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("confirmPassword")}
                  className={inputClass(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-[0.75rem] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              id="signup-submit-btn"
              disabled={isLoading}
              className="
                w-full gradient-brand text-white font-semibold
                py-2.5 rounded-xl text-[0.88rem] shadow-brand/30 shadow-sm
                transition-all duration-150 mt-2
                hover:opacity-90 hover:shadow-brand/50 hover:shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[0.82rem] text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline underline-offset-3">
              Sign in
            </Link>
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-8 text-[0.7rem] text-muted-foreground/50">
            <ShieldCheck className="h-3 w-3" />
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-3">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-3">Privacy Policy</Link>
          </div>
        </motion.div>
      </div>

    </div>
  );
}