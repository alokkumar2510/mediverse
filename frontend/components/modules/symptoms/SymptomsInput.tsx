"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Brain,
  Loader2,
  Mic,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const SYMPTOM_CHIPS = [
  "Chest pain", "Shortness of breath", "Fever", "Headache",
  "Fatigue", "Nausea", "Dizziness", "Cough", "Back pain",
  "Joint pain", "Sore throat", "Abdominal pain",
];

interface SymptomsInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function SymptomsInput({ onSubmit, isLoading }: SymptomsInputProps) {
  const [text, setText] = useState("");
  const [chips, setChips] = useState<string[]>([]);

  const fullText = [text, ...chips].filter(Boolean).join(", ");

  function addChip(chip: string) {
    if (!chips.includes(chip)) setChips((c) => [...c, chip]);
  }

  function removeChip(chip: string) {
    setChips((c) => c.filter((s) => s !== chip));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fullText.trim().length < 5) return;
    onSubmit(fullText.trim());
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
      id="symptom-input-section"
    >
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-violet-400" />
          <h2 className="text-base font-semibold">Describe Your Symptoms</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe how you're feeling in your own words. Our AI will triage
          your symptoms and recommend next steps.
        </p>
      </div>

      {/* Quick chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick add:</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              id={`symptom-chip-${chip.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={() => addChip(chip)}
              disabled={chips.includes(chip)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-all",
                chips.includes(chip)
                  ? "border-violet-500/60 bg-violet-500/15 text-violet-300 cursor-default"
                  : "border-border/50 bg-card/30 text-muted-foreground hover:border-violet-500/40 hover:text-foreground"
              )}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Selected chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-violet-500/15 border border-violet-500/40 text-violet-300"
            >
              {chip}
              <button
                type="button"
                onClick={() => removeChip(chip)}
                className="hover:text-white transition-colors"
                aria-label={`Remove ${chip}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Text area */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <textarea
            id="symptom-text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. I have had a persistent headache for 3 days, mild fever around 38°C, and feel very tired…"
            rows={4}
            className={cn(
              "w-full rounded-xl border bg-card/40 px-4 py-3 text-sm",
              "placeholder:text-muted-foreground/50 resize-none",
              "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/40",
              "border-border/50 transition-all"
            )}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span
              className={cn(
                "text-xs",
                fullText.length > 1800 ? "text-red-400" : "text-muted-foreground"
              )}
            >
              {fullText.length}/2000
            </span>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Preview */}
        {fullText.length > 5 && (
          <div className="rounded-lg bg-card/30 border border-border/40 px-3 py-2.5">
            <p className="text-xs text-muted-foreground">
              <span className="text-violet-400 font-medium">Will analyse:</span>{" "}
              {fullText}
            </p>
          </div>
        )}

        <motion.button
          type="submit"
          id="symptom-check-btn"
          disabled={isLoading || fullText.trim().length < 5}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full flex items-center justify-center gap-2.5 rounded-xl px-6 py-3.5",
            "font-semibold text-sm transition-all duration-200",
            "bg-gradient-to-r from-violet-600 to-purple-600 text-white",
            "hover:from-violet-500 hover:to-purple-500",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            "shadow-lg shadow-violet-500/20"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analysing symptoms…</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Check My Symptoms</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </motion.button>

        {/* Gemini badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-violet-400" />
          <span>Powered by Gemini AI · Not a medical diagnosis</span>
        </div>
      </form>
    </motion.div>
  );
}
