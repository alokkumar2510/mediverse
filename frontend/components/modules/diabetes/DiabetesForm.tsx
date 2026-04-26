"use client";

import { useState } from "react";
import { useForm, type UseFormRegister } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Schema ─────────────────────────────────────────────────────────────────────
const schema = z.object({
  glucose: z.coerce
    .number({ invalid_type_error: "Required" })
    .min(44, "Min 44 mg/dL")
    .max(300, "Max 300 mg/dL"),
  bmi: z.coerce
    .number({ invalid_type_error: "Required" })
    .min(10, "Min 10 kg/m²")
    .max(80, "Max 80 kg/m²"),
  age: z.coerce
    .number({ invalid_type_error: "Required" })
    .int("Must be a whole number")
    .min(1, "Min 1")
    .max(120, "Max 120"),
  blood_pressure: z.coerce.number().min(0).max(200).default(72),
  skin_thickness: z.coerce.number().min(0).max(100).default(29),
  insulin: z.coerce.number().min(0).max(1000).default(80),
  diabetes_pedigree: z.coerce.number().min(0).max(3).default(0.37),
  pregnancies: z.coerce.number().min(0).max(20).default(0),
});

export type DiabetesFormValues = z.infer<typeof schema>;

// ── Field config ──────────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  {
    id: "glucose",
    label: "Blood Glucose",
    unit: "mg/dL",
    placeholder: "e.g. 120",
    min: 44,
    max: 300,
    step: 1,
    tooltip: "Plasma glucose from a 2-hour OGTT. Normal fasting: 70–99 mg/dL. Prediabetes: 100–125. Diabetes: ≥126.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
  {
    id: "bmi",
    label: "BMI",
    unit: "kg/m²",
    placeholder: "e.g. 28.5",
    min: 10,
    max: 80,
    step: 0.1,
    tooltip: "Body Mass Index. Normal: 18.5–24.9. Overweight: 25–29.9. Obese: ≥30.",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
  },
  {
    id: "age",
    label: "Age",
    unit: "years",
    placeholder: "e.g. 35",
    min: 1,
    max: 120,
    step: 1,
    tooltip: "Age in years. Risk of Type 2 diabetes increases significantly after 45.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
] as const;

const OPTIONAL_FIELDS = [
  {
    id: "blood_pressure",
    label: "Diastolic Blood Pressure",
    unit: "mmHg",
    placeholder: "72",
    min: 0,
    max: 200,
    step: 1,
    tooltip: "Diastolic BP (the lower number). Normal: 60–80 mmHg.",
    defaultVal: 72,
  },
  {
    id: "insulin",
    label: "Serum Insulin",
    unit: "µU/mL",
    placeholder: "80",
    min: 0,
    max: 1000,
    step: 1,
    tooltip: "2-hour serum insulin. Normal fasting: 2.6–24.9 µU/mL. High values may indicate insulin resistance.",
    defaultVal: 80,
  },
  {
    id: "skin_thickness",
    label: "Skin Fold Thickness",
    unit: "mm",
    placeholder: "29",
    min: 0,
    max: 100,
    step: 1,
    tooltip: "Triceps skin fold thickness, used as a proxy for body fat. Optional.",
    defaultVal: 29,
  },
  {
    id: "diabetes_pedigree",
    label: "Family History Score",
    unit: "score",
    placeholder: "0.37",
    min: 0,
    max: 3,
    step: 0.01,
    tooltip: "Diabetes Pedigree Function — encodes genetic risk from family history. Range: 0.08–2.42. Use 0.37 if unknown.",
    defaultVal: 0.37,
  },
  {
    id: "pregnancies",
    label: "Number of Pregnancies",
    unit: "times",
    placeholder: "0",
    min: 0,
    max: 20,
    step: 1,
    tooltip: "Total number of pregnancies. Use 0 if male or not applicable.",
    defaultVal: 0,
  },
] as const;

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Field info"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-xl border border-border bg-popover/95 backdrop-blur-sm p-3 text-xs text-muted-foreground shadow-xl"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

// ── Field component ───────────────────────────────────────────────────────────
function FormField({
  id,
  label,
  unit,
  placeholder,
  tooltip,
  min,
  max,
  step,
  register,
  error,
  accent = "violet",
}: {
  id: string;
  label: string;
  unit: string;
  placeholder: string;
  tooltip: string;
  min: number;
  max: number;
  step: number;
  register: UseFormRegister<DiabetesFormValues>;
  error?: string;
  accent?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-sm font-medium text-foreground/80"
      >
        {label}
        <Tooltip text={tooltip} />
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          {...register(id as never)}
          className={cn(
            "w-full rounded-xl border bg-card/60 px-4 py-3 pr-20 text-sm",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50",
            "transition-all duration-200",
            error
              ? "border-destructive/60 ring-1 ring-destructive/30"
              : "border-border hover:border-border/80"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/70 select-none">
          {unit}
        </span>
      </div>
      {error && (
        <motion.p
          id={`${id}-error`}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface DiabetesFormProps {
  onSubmit: (values: DiabetesFormValues) => Promise<void>;
  isLoading: boolean;
}

export function DiabetesForm({ onSubmit, isLoading }: DiabetesFormProps) {
  const [showOptional, setShowOptional] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DiabetesFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      blood_pressure: 72,
      skin_thickness: 29,
      insulin: 80,
      diabetes_pedigree: 0.37,
      pregnancies: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" id="diabetes-form" noValidate>
      {/* Required fields */}
      <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-violet-500/10">
            <Activity className="h-4 w-4 text-violet-400" />
          </div>
          <h2 className="text-sm font-semibold">Core Biomarkers</h2>
          <span className="ml-auto text-xs text-muted-foreground">Required</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REQUIRED_FIELDS.map((f) => (
            <FormField
              key={f.id}
              id={f.id}
              label={f.label}
              unit={f.unit}
              placeholder={f.placeholder}
              tooltip={f.tooltip}
              min={f.min}
              max={f.max}
              step={f.step}
              register={register}
              error={errors[f.id as keyof DiabetesFormValues]?.message as string | undefined}
            />
          ))}
        </div>
      </div>

      {/* Optional fields */}
      <div className="rounded-2xl border border-border/40 bg-card/20 overflow-hidden">
        <button
          type="button"
          id="diabetes-optional-toggle"
          onClick={() => setShowOptional((v) => !v)}
          className="w-full flex items-center gap-2 px-6 py-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all"
        >
          <HelpCircle className="h-4 w-4 shrink-0" />
          <span>Optional — More clinical detail improves accuracy</span>
          <span className="ml-auto">
            {showOptional ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>

        <AnimatePresence>
          {showOptional && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border/30 pt-5">
                {OPTIONAL_FIELDS.map((f) => (
                  <FormField
                    key={f.id}
                    id={f.id}
                    label={f.label}
                    unit={f.unit}
                    placeholder={String(f.defaultVal)}
                    tooltip={f.tooltip}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    register={register}
                    error={errors[f.id as keyof DiabetesFormValues]?.message as string | undefined}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        id="diabetes-submit-btn"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.01 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className={cn(
          "w-full flex items-center justify-center gap-2.5 rounded-2xl px-6 py-4",
          "text-sm font-semibold text-white shadow-lg transition-all duration-200",
          "bg-gradient-to-r from-violet-600 to-fuchsia-600",
          "hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/25 hover:shadow-xl",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing biomarkers…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Assess My Diabetes Risk
          </>
        )}
      </motion.button>
    </form>
  );
}
