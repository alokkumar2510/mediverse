export interface XrayResult { type: string; condition: string; confidence: number; heatmap_url?: string; recommendation: string }
export interface EcgResult { rhythm: string; risk_flags: string[]; confidence: number }
export interface SkinResult { condition: string; confidence: number; severity: string; care_tips: string[] }
export interface DiabetesResult { risk_pct: number; risk_tier: "low" | "moderate" | "high"; suggestions: string[] }
export interface OcrResult { medicines: string[]; dosages: string[]; warnings: string[] }
export interface SymptomResult { conditions: string[]; urgency_score: number; specialist: string }