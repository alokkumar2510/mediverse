/**
 * Skin AI TypeScript types — mirrors SkinAnalysisResponse schema
 */

export interface SkinConditionProb {
  code: string;
  label: string;
  probability: number; // 0–100
}

export type ImageQuality = "good" | "blurry" | "dark" | "small" | "unknown";
export type RiskLevel = "high" | "moderate" | "low";

export interface SkinAnalysisResponse {
  condition_code: string;
  condition_label: string;
  confidence: number; // 0–100
  all_probabilities: SkinConditionProb[];
  severity: string;
  care_suggestions: string[];
  needs_dermatologist: boolean;
  low_confidence: boolean;
  tta_uncertainty: number;
  image_quality: ImageQuality;
  quality_warnings: string[];
  heatmap_b64: string | null;
  image_hash: string;
  model_version: string;
  report_id: number | null;
  disclaimer: string;
}

export const HIGH_RISK_CODES = new Set(["mel", "bcc", "akiec"]);

export const CONDITION_META: Record<
  string,
  { riskLevel: RiskLevel; icon: string }
> = {
  mel:   { riskLevel: "high",     icon: "🔴" },
  bcc:   { riskLevel: "high",     icon: "🔴" },
  akiec: { riskLevel: "moderate", icon: "🟠" },
  bkl:   { riskLevel: "low",      icon: "🟢" },
  df:    { riskLevel: "low",      icon: "🟢" },
  nv:    { riskLevel: "low",      icon: "🟢" },
  vasc:  { riskLevel: "low",      icon: "🟡" },
};
