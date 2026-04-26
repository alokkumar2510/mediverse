import { z } from "zod";

// ─── Auth validators ─────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

// ─── Profile validators ───────────────────────────────────────────────────────
export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().email("Enter a valid email address"),
});

// ─── Diabetes form ────────────────────────────────────────────────────────────
export const diabetesFormSchema = z.object({
  pregnancies: z.number().int().min(0).max(20),
  glucose: z.number().min(0).max(500),
  blood_pressure: z.number().min(0).max(300),
  skin_thickness: z.number().min(0).max(100),
  insulin: z.number().min(0).max(1000),
  bmi: z.number().min(0).max(100),
  diabetes_pedigree: z.number().min(0).max(5),
  age: z.number().int().min(1).max(120),
});

// ─── Symptom checker ─────────────────────────────────────────────────────────
export const symptomSchema = z.object({
  text: z
    .string()
    .min(10, "Please describe your symptoms in at least 10 characters")
    .max(1000, "Description must be at most 1000 characters"),
});

// ─── Type exports ─────────────────────────────────────────────────────────────
export type LoginInput              = z.infer<typeof loginSchema>;
export type RegisterInput           = z.infer<typeof registerSchema>;
export type ForgotPasswordInput     = z.infer<typeof forgotPasswordSchema>;
export type ProfileUpdateInput      = z.infer<typeof profileUpdateSchema>;
export type DiabetesFormInput       = z.infer<typeof diabetesFormSchema>;
export type SymptomInput            = z.infer<typeof symptomSchema>;