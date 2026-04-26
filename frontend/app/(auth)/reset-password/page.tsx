"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/\d/, "Must contain at least one number")
      .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character"),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

// ── Inner component that uses useSearchParams ──────────────────────────────────
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { doResetPassword, isLoading, getApiErrorMessage } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    if (!token) {
      setServerError("Invalid reset link. Please request a new one.");
      return;
    }
    try {
      await doResetPassword({ token, new_password: data.new_password });
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Invalid link</h2>
          <p className="text-white/50 text-sm mb-4">This reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl tracking-tight">MediVerse AI</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Set new password</h1>
          </div>
          <p className="text-white/50 text-sm mb-6">
            Choose a strong password. All your sessions will be signed out after reset.
          </p>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* New password */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="rp-password">
                New password
              </label>
              <div className="relative">
                <input
                  id="rp-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register("new_password")}
                  className={`
                    w-full bg-white/[0.06] border rounded-lg px-4 py-2.5 pr-10 text-white text-sm
                    placeholder:text-white/25 outline-none transition-all
                    focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                    ${errors.new_password ? "border-red-500/60" : "border-white/10"}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5" htmlFor="rp-confirm">
                Confirm new password
              </label>
              <input
                id="rp-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("confirm_password")}
                className={`
                  w-full bg-white/[0.06] border rounded-lg px-4 py-2.5 text-white text-sm
                  placeholder:text-white/25 outline-none transition-all
                  focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                  ${errors.confirm_password ? "border-red-500/60" : "border-white/10"}
                `}
              />
              {errors.confirm_password && (
                <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold
                py-2.5 rounded-lg text-sm transition-all
                hover:opacity-90 hover:shadow-lg hover:shadow-cyan-500/25
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ── Page — wraps inner component in Suspense ───────────────────────────────────
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
