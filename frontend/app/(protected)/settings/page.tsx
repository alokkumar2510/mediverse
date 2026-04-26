"use client";

/**
 * Settings Page — account preferences, notification settings, danger zone.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell, Moon, Globe, Shield, Trash2, AlertTriangle,
  ChevronRight, Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  id, label, description, checked, onToggle,
}: {
  id: string; label: string; description?: string;
  checked: boolean; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-border/50 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────────────────────

function SettingsCard({ icon: Icon, title, children }: {
  icon: typeof Bell; title: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border/60">
        <div className="p-2 rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="px-6 py-1">{children}</div>
    </motion.div>
  );
}

// ── Theme selector ─────────────────────────────────────────────────────────────

const THEMES = [
  { id: "settings-theme-light", value: "light", label: "Light" },
  { id: "settings-theme-dark",  value: "dark",  label: "Dark"  },
  { id: "settings-theme-sys",   value: "system",label: "System"},
];

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex gap-2 py-3.5">
      {THEMES.map((t) => (
        <button
          key={t.value}
          id={t.id}
          onClick={() => setTheme(t.value)}
          className={cn(
            "flex-1 py-2 rounded-xl text-xs font-medium border transition-all",
            theme === t.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/30 text-muted-foreground"
          )}
        >
          {theme === t.value && <Check className="inline-block mr-1 h-3 w-3" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [notifs, setNotifs] = useState({
    reportReady:   true,
    weeklyDigest:  false,
    securityAlerts:true,
    marketingEmails:false,
  });
  const [showDangerConfirm, setDangerConfirm] = useState(false);

  const toggle = (key: keyof typeof notifs) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account preferences and data.
        </p>
      </motion.div>

      {/* Appearance */}
      <SettingsCard icon={Moon} title="Appearance">
        <ThemeSelector />
      </SettingsCard>

      {/* Notifications */}
      <SettingsCard icon={Bell} title="Notifications">
        <Toggle
          id="notif-report-ready"
          label="Report Ready"
          description="Get notified when an AI analysis completes."
          checked={notifs.reportReady}
          onToggle={() => toggle("reportReady")}
        />
        <Toggle
          id="notif-weekly-digest"
          label="Weekly Digest"
          description="Summary of your activity sent every Monday."
          checked={notifs.weeklyDigest}
          onToggle={() => toggle("weeklyDigest")}
        />
        <Toggle
          id="notif-security"
          label="Security Alerts"
          description="Alerts for new logins and password changes."
          checked={notifs.securityAlerts}
          onToggle={() => toggle("securityAlerts")}
        />
        <Toggle
          id="notif-marketing"
          label="Product Updates & Offers"
          description="News about new modules and promotions."
          checked={notifs.marketingEmails}
          onToggle={() => toggle("marketingEmails")}
        />
      </SettingsCard>

      {/* Privacy */}
      <SettingsCard icon={Globe} title="Privacy & Data">
        <div className="py-3.5 space-y-3">
          {[
            { id: "settings-export-data", label: "Export My Data", sub: "Download all your reports and profile data as JSON." },
            { id: "settings-privacy-policy", label: "Privacy Policy", sub: "How we handle and protect your health data." },
          ].map(({ id, label, sub }) => (
            <button
              key={id}
              id={id}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-accent hover:border-primary/20 transition-all group"
            >
              <div className="text-left">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </button>
          ))}
        </div>
      </SettingsCard>

      {/* Security */}
      <SettingsCard icon={Shield} title="Security">
        <div className="py-3.5">
          <button
            id="settings-change-password"
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border hover:bg-accent hover:border-primary/20 transition-all group"
          >
            <div className="text-left">
              <p className="text-sm font-medium">Change Password</p>
              <p className="text-xs text-muted-foreground">Update your account password.</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </SettingsCard>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-4 border-b border-destructive/20">
          <div className="p-2 rounded-xl bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <h2 className="font-semibold text-sm text-destructive">Danger Zone</h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          {!showDangerConfirm ? (
            <button
              id="settings-delete-account-btn"
              onClick={() => setDangerConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive hover:text-white transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Are you absolutely sure? This cannot be undone.
              </div>
              <div className="flex gap-2">
                <button
                  id="settings-confirm-delete-btn"
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors"
                >
                  Yes, delete my account
                </button>
                <button
                  id="settings-cancel-delete-btn"
                  onClick={() => setDangerConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}