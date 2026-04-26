export type ModuleType =
  | "xray"
  | "ecg"
  | "skin"
  | "diabetes"
  | "ocr"
  | "symptom";

export interface Report {
  id: string;
  user_id: string;
  module_type: ModuleType;
  title: string;
  result_json: Record<string, unknown>;
  confidence: number | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface ReportListResponse {
  items: Report[];
  total: number;
  page: number;
  per_page: number;
}

export interface XrayResult {
  type: string;
  condition: string;
  confidence: number;
  heatmap_url: string | null;
  recommendation: string;
}

export interface EcgResult {
  rhythm: string;
  risk_flags: string[];
  confidence: number;
}

export interface SkinResult {
  condition: string;
  confidence: number;
  severity: "mild" | "moderate" | "severe";
  care_tips: string[];
}

export interface DiabetesResult {
  risk_pct: number;
  risk_tier: "low" | "moderate" | "high";
  suggestions: string[];
}

export interface OcrResult {
  medicines: string[];
  dosages: string[];
  warnings: string[];
}

export interface SymptomResult {
  conditions: Array<{ name: string; probability: number }>;
  urgency_score: number;
  specialist: string;
}