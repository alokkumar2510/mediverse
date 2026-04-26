// X-Ray module type definitions
export interface XrayTop3Item {
  code: string;
  label: string;
  confidence: number;
}

export interface XrayConditionProb {
  code: string;
  label: string;
  probability: number;
}

export interface XrayAnalysisResponse {
  top_condition: string;
  top_label: string;
  confidence: number;
  top3: XrayTop3Item[];
  all_probabilities: XrayConditionProb[];
  severity: string;
  care_suggestions: string[];
  is_high_risk: boolean;
  low_confidence: boolean;
  image_quality: string;
  quality_warnings: string[];
  heatmap_b64: string | null;
  image_hash: string;
  tta_uncertainty: number;
  model_name: string;
  model_version: string;
  n_classes: number;
  report_id: string | null;
  disclaimer: string;
}

export const HIGH_RISK_XRAY = new Set([
  "Pneumonia", "Cardiomegaly", "Pneumothorax", "Tuberculosis",
  "Edema", "Effusion", "Mass", "ARDS",
]);

export const CONDITION_META_XRAY: Record<string, {
  riskLevel: "high" | "moderate" | "low";
  icon: string;
  organ: string;
}> = {
  "Pneumonia":          { riskLevel: "high",     icon: "🫁", organ: "Lung" },
  "Tuberculosis":       { riskLevel: "high",     icon: "⚠️", organ: "Lung" },
  "Cardiomegaly":       { riskLevel: "high",     icon: "❤️", organ: "Heart" },
  "Pneumothorax":       { riskLevel: "high",     icon: "🚨", organ: "Lung" },
  "Edema":              { riskLevel: "high",     icon: "💧", organ: "Lung" },
  "Effusion":           { riskLevel: "moderate", icon: "🫧", organ: "Pleura" },
  "Mass":               { riskLevel: "high",     icon: "🔴", organ: "Lung" },
  "Atelectasis":        { riskLevel: "moderate", icon: "🫁", organ: "Lung" },
  "Consolidation":      { riskLevel: "moderate", icon: "🫁", organ: "Lung" },
  "Emphysema":          { riskLevel: "moderate", icon: "💨", organ: "Lung" },
  "Fibrosis":           { riskLevel: "moderate", icon: "🧬", organ: "Lung" },
  "Nodule":             { riskLevel: "moderate", icon: "🔵", organ: "Lung" },
  "Pleural_Thickening": { riskLevel: "moderate", icon: "🩻", organ: "Pleura" },
  "Infiltration":       { riskLevel: "moderate", icon: "🫁", organ: "Lung" },
  "Hernia":             { riskLevel: "low",      icon: "🩺", organ: "Diaphragm" },
  "Scoliosis":          { riskLevel: "low",      icon: "🦴", organ: "Spine" },
  "No Finding":         { riskLevel: "low",      icon: "✅", organ: "All" },
};
