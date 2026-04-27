"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Activity, Loader2, ArrowRight, Github } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/lib/validators";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";

export function SignupForm() {
  const { register: registerUser, getApiErrorMessage } = useAuth();
  const { success, error: toastError } = useToast();
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    setIsSubmitting(true);
    try {
      await registerUser({ name: data.name, email: data.email, password: data.password });
      success("Account created!", "Welcome to MediVerse AI.");
    } catch (err) {
      toastError("Registration failed", getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      toastError("Signup failed", error.message);
    }
  };

  const fields: { id: string; name: keyof RegisterInput; label: string; type: string; placeholder: string; autoComplete: string }[] = [
    { id: "signup-name",  name: "name",  label: "Full Name", type: "text",     placeholder: "Jane Doe",          autoComplete: "name"  },
    { id: "signup-email", name: "email", label: "Email",     type: "email",    placeholder: "you@example.com",   autoComplete: "email" },
  ];

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand shadow-lg shadow-primary/30">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold">Medi<span className="gradient-text">Verse</span></span>
        </Link>

        <div className="glass-card rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-1">Create your account</h1>
            <p className="text-sm text-muted-foreground">Free to start — no credit card required</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/></svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              GitHub
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} id="signup-form" className="space-y-4" noValidate>
            {fields.map(({ id, name, label, type, placeholder, autoComplete }) => (
              <div key={id} className="space-y-1.5">
                <label htmlFor={id} className="text-sm font-medium">{label}</label>
                <input
                  id={id}
                  type={type}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  {...register(name)}
                  className={cn(
                    "w-full rounded-xl border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    errors[name] ? "border-destructive" : "border-border"
                  )}
                />
                {errors[name] && <p className="text-xs text-destructive">{errors[name]?.message}</p>}
              </div>
            ))}

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="signup-password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  {...register("password")}
                  className={cn(
                    "w-full rounded-xl border bg-background/50 px-4 py-3 pr-11 text-sm placeholder:text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                    errors.password ? "border-destructive" : "border-border"
                  )}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirm */}
            <div className="space-y-1.5">
              <label htmlFor="signup-confirm" className="text-sm font-medium">Confirm Password</label>
              <input
                id="signup-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                {...register("confirmPassword")}
                className={cn(
                  "w-full rounded-xl border bg-background/50 px-4 py-3 text-sm placeholder:text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-primary focus:border-primary",
                  errors.confirmPassword ? "border-destructive" : "border-border"
                )}
              />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <motion.button
              id="signup-submit-btn"
              type="submit"
              disabled={isSubmitting}
              whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold gradient-brand text-white shadow-md shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
              ) : (
                <>Create Account <ArrowRight className="h-4 w-4" /></>
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" id="signup-login-link" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
