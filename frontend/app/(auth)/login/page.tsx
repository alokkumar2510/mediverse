"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState, Suspense, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity, Eye, EyeOff, Loader2, AlertCircle, CheckCircle,
  ShieldCheck, Radiation, Heart, Scan,
} from "lucide-react";

/* ── Schema ──────────────────────────────────────────────────────────────────── */
const loginSchema = z.object({
  email:    z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ── Inner component (uses useSearchParams) ──────────────────────────────────── */
function LoginForm() {
  const { login, isLoading, getApiErrorMessage } = useAuth();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "1";

  const [showPassword, setShowPassword] = useState(false);
  const [serverError,  setServerError]  = useState<string | null>(null);
  const [isSlowLoad, setIsSlowLoad] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => setIsSlowLoad(true), 4000);
    } else {
      setIsSlowLoad(false);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try { await login(data); }
    catch (err) { setServerError(getApiErrorMessage(err)); }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "hsl(var(--background))" }}>

      {/* ── LEFT PANEL — Brand story ─────────────────────────────────────────── */}
      <div
        className="hidden lg:flex"
        style={{
          width: "460px",
          flexShrink: 0,
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "3rem",
          background: "linear-gradient(160deg, hsl(196 88% 36%), hsl(196 95% 26%))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle diagonal lines */}
        <div style={{
          position: "absolute", inset: 0, opacity: 0.08,
          backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.4) 40px, rgba(255,255,255,0.4) 41px)",
          pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", position: "relative", zIndex: 10, textDecoration: "none" }}>
          <span style={{
            display: "flex", height: "2rem", width: "2rem",
            alignItems: "center", justifyContent: "center",
            borderRadius: "0.5rem",
            background: "rgba(255,255,255,0.2)",
          }}>
            <Activity size={16} color="white" strokeWidth={2.5} />
          </span>
          <span style={{ fontWeight: 700, fontSize: "1rem", color: "white", letterSpacing: "-0.02em" }}>
            MediVerse AI
          </span>
        </Link>

        {/* Middle copy */}
        <div style={{ position: "relative", zIndex: 10 }}>
          <h2 style={{
            fontWeight: 700, color: "white",
            fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
            lineHeight: 1.1, letterSpacing: "-0.025em",
            marginBottom: "1rem",
          }}>
            Clinical AI,<br />
            <span style={{ fontWeight: 400, fontStyle: "italic", opacity: 0.85 }}>
              at your fingertips.
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.70)", fontSize: "0.9rem", lineHeight: 1.7, maxWidth: "300px", marginBottom: "2rem" }}>
            Six diagnostic modules, research-grade models, and structured reports — ready the moment you sign in.
          </p>

          {/* Module pills */}
          {[
            { icon: Radiation, label: "X-Ray Analysis",  sub: "17 conditions" },
            { icon: Heart,     label: "ECG Screening",   sub: "Rhythm patterns" },
            { icon: Scan,      label: "Skin Lesion AI",  sub: "Grad-CAM views" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.15)",
              marginBottom: "0.625rem",
            }}>
              <span style={{
                display: "flex", height: "2rem", width: "2rem",
                alignItems: "center", justifyContent: "center",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.15)",
                flexShrink: 0,
              }}>
                <Icon size={15} color="white" strokeWidth={1.8} />
              </span>
              <div>
                <div style={{ color: "white", fontWeight: 600, fontSize: "0.82rem", lineHeight: 1 }}>{label}</div>
                <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", marginTop: "0.2rem" }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative", zIndex: 10 }}>
          <ShieldCheck size={14} color="rgba(255,255,255,0.5)" />
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem" }}>
            HIPAA-aligned · End-to-end HTTPS · Zero data sharing
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Auth form ──────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
        overflowY: "auto",
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: "100%", maxWidth: "380px" }}
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" style={{
            display: "inline-flex", alignItems: "center", gap: "0.625rem",
            marginBottom: "2rem", textDecoration: "none",
          }}>
            <span style={{
              display: "flex", height: "1.75rem", width: "1.75rem",
              alignItems: "center", justifyContent: "center",
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))",
            }}>
              <Activity size={14} color="white" strokeWidth={2.5} />
            </span>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "hsl(var(--foreground))", letterSpacing: "-0.02em" }}>
              Medi<span style={{ color: "hsl(var(--primary))" }}>Verse</span>
            </span>
          </Link>

          {/* Heading */}
          <div style={{ marginBottom: "2rem" }}>
            <h1 style={{
              fontWeight: 700, fontSize: "1.75rem",
              letterSpacing: "-0.025em",
              color: "hsl(var(--foreground))",
              marginBottom: "0.375rem",
            }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted-foreground))" }}>
              Sign in to your MediVerse account
            </p>
          </div>

          {/* Reset success banner */}
          {resetSuccess && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: "0.75rem", padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "hsl(158 64% 40%)", fontSize: "0.82rem",
            }}>
              <CheckCircle size={15} />
              Password reset successful. Please sign in.
            </div>
          )}

          {serverError && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "0.75rem", padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "hsl(var(--destructive))", fontSize: "0.82rem",
            }}>
              <AlertCircle size={15} />
              {serverError}
            </div>
          )}

          {isSlowLoad && !serverError && (
            <div className="animate-pulse" style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              borderRadius: "0.75rem", padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              color: "hsl(var(--amber-600))", fontSize: "0.82rem",
            }}>
              <Loader2 size={15} className="animate-spin" />
              Waking up secure backend... this may take up to 50 seconds.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Email field */}
            <div>
              <label htmlFor="login-email" style={{
                display: "block", fontSize: "0.8rem", fontWeight: 500,
                color: "hsl(var(--foreground))", marginBottom: "0.375rem",
              }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                {...register("email")}
                style={{
                  width: "100%",
                  padding: "0.625rem 1rem",
                  borderRadius: "0.75rem",
                  border: `1px solid ${errors.email ? "hsl(var(--destructive))" : "hsl(var(--border))"}`,
                  background: "hsl(var(--background))",
                  color: "hsl(var(--foreground))",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "hsl(var(--primary))";
                  e.currentTarget.style.boxShadow   = "0 0 0 3px hsl(196 88% 42% / 0.15)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = errors.email ? "hsl(var(--destructive))" : "hsl(var(--border))";
                  e.currentTarget.style.boxShadow   = "0 1px 2px rgba(0,0,0,0.04)";
                }}
              />
              {errors.email && (
                <p style={{ color: "hsl(var(--destructive))", fontSize: "0.75rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <AlertCircle size={12} />{errors.email.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                <label htmlFor="login-password" style={{ fontSize: "0.8rem", fontWeight: 500, color: "hsl(var(--foreground))" }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: "0.78rem", color: "hsl(var(--primary))", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register("password")}
                  style={{
                    width: "100%",
                    padding: "0.625rem 2.75rem 0.625rem 1rem",
                    borderRadius: "0.75rem",
                    border: `1px solid ${errors.password ? "hsl(var(--destructive))" : "hsl(var(--border))"}`,
                    background: "hsl(var(--background))",
                    color: "hsl(var(--foreground))",
                    fontSize: "0.875rem",
                    outline: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "hsl(var(--primary))";
                    e.currentTarget.style.boxShadow   = "0 0 0 3px hsl(196 88% 42% / 0.15)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = errors.password ? "hsl(var(--destructive))" : "hsl(var(--border))";
                    e.currentTarget.style.boxShadow   = "0 1px 2px rgba(0,0,0,0.04)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: "absolute", right: "0.75rem", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "hsl(var(--muted-foreground))", padding: 0,
                    display: "flex", alignItems: "center",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p style={{ color: "hsl(var(--destructive))", fontSize: "0.75rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <AlertCircle size={12} />{errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "0.75rem",
                marginTop: "0.5rem",
                borderRadius: "0.75rem",
                border: "none",
                background: isLoading ? "hsl(196 88% 42% / 0.6)" : "linear-gradient(135deg, hsl(196 88% 44%), hsl(196 92% 34%))",
                color: "white",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: isLoading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 4px 20px rgba(8,159,189,0.25)",
                transition: "opacity 0.15s, box-shadow 0.15s",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "hsl(var(--border))" }} />
            <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "hsl(var(--border))" }} />
          </div>

          {/* Register link */}
          <p style={{ textAlign: "center", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "hsl(var(--primary))", fontWeight: 500, textDecoration: "none" }}>
              Create account
            </Link>
          </p>

          {/* Security note */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "0.375rem", marginTop: "2rem",
            color: "hsl(var(--muted-foreground))", fontSize: "0.7rem", opacity: 0.6,
          }}>
            <ShieldCheck size={12} />
            Secured with HTTPS · No data shared with third parties
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Page — wraps in Suspense ────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}