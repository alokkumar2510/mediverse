"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Brain, Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { sendForgotPassword, isLoading, getApiErrorMessage } = useAuth();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await sendForgotPassword({ email: data.email });
      setSent(true);
    } catch (err) {
      setServerError(getApiErrorMessage(err));
    }
  };

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

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
              <p className="text-white/50 text-sm mb-6">
                If an account exists for that email, a reset link has been sent.
                Check your spam folder too.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white mb-1.5">Forgot password?</h1>
              <p className="text-white/50 text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {serverError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5" htmlFor="fp-email">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@clinic.com"
                      {...register("email")}
                      className={`
                        w-full bg-white/[0.06] border rounded-lg pl-9 pr-4 py-2.5 text-white text-sm
                        placeholder:text-white/25 outline-none transition-all
                        focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20
                        ${errors.email ? "border-red-500/60" : "border-white/10"}
                      `}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
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
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}