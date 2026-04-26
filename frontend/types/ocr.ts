/**
 * OCR TypeScript types — mirrors backend OcrPrescriptionResponse schema
 */

export interface OcrMedicine {
  name: string;
  raw_name: string;
  category: string | null;
  brand_names: string[];
  dosage: string | null;
  frequency: string | null;
  timing: string | null;
  duration: string | null;
  instructions: string | null;
  confidence: number;    // 0.0–1.0
  source_line?: string;
}

export interface OcrPrescriptionResponse {
  medicines: OcrMedicine[];
  doctor_name: string | null;
  date: string | null;
  patient_name: string | null;
  notes: string[];
  warnings: string[];
  raw_text: string;
  overall_confidence: number;   // 0–100
  low_confidence: boolean;
  ocr_engine: string;
  medicine_count: number;
}
