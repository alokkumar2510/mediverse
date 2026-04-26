import type { Metadata } from "next";
import { PrescriptionOCR } from "@/components/modules/prescription/PrescriptionOCR";

export const metadata: Metadata = {
  title: "Prescription OCR — MediVerse AI",
  description:
    "Digitize and decode handwritten or printed prescriptions using AI-powered OCR. Extract medicine names, dosages, frequencies, and instructions instantly.",
};

export default function PrescriptionPage() {
  return <PrescriptionOCR />;
}