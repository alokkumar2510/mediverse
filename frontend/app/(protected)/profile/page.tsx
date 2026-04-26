"use client";

/**
 * Profile Page — view & edit user account details.
 */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Mail, Shield, Save, CheckCircle2, AlertCircle, Camera,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:  z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
});
type Fields = z.infer<typeof schema>;

// ── Avatar placeholder ────────────────────────────────────────────────────────

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="relative group w-fit">
      <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold shadow-lg">
        {initials}
      </div>
      <button
        id="change-avatar-btn"
        className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Change avatar — coming soon"
      >
        <Camera className="h-5 w-5 text-white" />
      </button>
    </div>
  );
}

// ── Info card wrapper ─────────────────────────────────────────────────────────

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────

function FieldRow({
  id, label, icon: Icon, placeholder, type = "text",
  error, ...rest
}: {
  id: string; label: string; icon: typeof User; placeholder?: string;
  type?: string; error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none transition-all",
          "placeholder:text-muted-foreground/60",
          "focus:ring-2 focus:ring-primary/20 focus:border-primary",
          error ? "border-destructive" : "border-border"
        )}
        {...rest}
      />
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, refresh } = useAuth() as { user: { name: string; email: string; role: string; is_verified?: boolean } | null; refresh?: () => void };
  const [saving, setSaving]    = useState(false);
  const [success, setSuccess]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm<Fields>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email });
  }, [user, reset]);

  const onSubmit = async (data: Fields) => {
    setSaving(true);
    setApiError(null);
    setSuccess(false);
    try {
      await api.patch("/auth/me", data);
      setSuccess(true);
      refresh?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setApiError(err?.response?.data?.detail ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account details and security settings.
        </p>
      </motion.div>

      {/* Avatar + role row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5"
      >
        <AvatarPlaceholder name={user.name} />
        <div>
          <p className="font-semibold text-lg">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold",
              user.role === "admin" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
            )}>
              {user.role === "admin" ? "Admin" : "User"}
            </span>
            {user.is_verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <InfoCard title="Account Information">
          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FieldRow
              id="profile-name"
              label="Full Name"
              icon={User}
              placeholder="Your full name"
              {...register("name")}
              error={errors.name?.message}
            />
            <FieldRow
              id="profile-email"
              label="Email Address"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              {...register("email")}
              error={errors.email?.message}
            />

            {/* API error */}
            {apiError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> {apiError}
              </p>
            )}

            {/* Success */}
            {success && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-emerald-500 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" /> Profile updated!
              </motion.p>
            )}

            <div className="flex justify-end pt-2">
              <button
                id="save-profile-btn"
                type="submit"
                disabled={saving || !isDirty}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-brand text-white text-sm font-medium shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </InfoCard>
      </motion.div>

      {/* Security */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <InfoCard title="Security">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed: unknown</p>
              </div>
            </div>
            <button
              id="change-password-btn"
              className="px-3.5 py-2 rounded-xl text-xs font-medium border border-border hover:bg-accent transition-colors"
            >
              Change Password
            </button>
          </div>
        </InfoCard>
      </motion.div>
    </div>
  );
}