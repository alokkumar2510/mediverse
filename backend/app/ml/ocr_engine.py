"""
MediVerse AI — Prescription OCR Engine
========================================
Production-grade OCR pipeline for handwritten and printed prescriptions.

Architecture Decision:
  PRIMARY  → EasyOCR (GPU/CPU, deep-learning, best for handwriting)
  FALLBACK → Tesseract 5 (LSTM, fast, reliable for printed text)

Why EasyOCR over Tesseract alone:
  • Pre-trained on IAM handwriting, SROIE, academic corpora
  • Handles medical handwriting far better than Tesseract
  • Supports angle correction internally
  • Returns per-word confidence scores

Why NOT TrOCR for this build:
  • Requires 350 MB+ download at runtime (not ideal for cloud cold starts)
  • EasyOCR already uses transformer backbones (CRAFT + CRNN)
  • TrOCR best added in Wave 3 as optional premium path

Why NOT PaddleOCR as primary:
  • Excellent but harder to install on Windows without paddle GPU
  • EasyOCR has simpler dependency tree for cross-platform

Medicine Database Sources:
  • WHO Essential Medicines List 2023 (WHO EML)
  • OpenFDA drug names (FDA NDC database, public domain)
  • RxNorm concept names (NLM, public API)
  • Curated common prescription abbreviations

Preprocessing pipeline follows document restoration best practices from:
  • SROIE receipt OCR (ICDAR 2019 challenge)
  • Document dewarping literature (Ma et al., 2018)
  • Medical OCR pre-processing survey (Giotis et al., 2017)
"""
from __future__ import annotations

import io
import logging
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
_HERE = Path(__file__).parent
_DICT_PATH = _HERE / "medicine_db.py"   # loaded via import below

# ── Lazy engine holder ─────────────────────────────────────────────────────────
_easyocr_reader: Any = None
_easyocr_available: bool | None = None

_tesseract_available: bool | None = None


# ══════════════════════════════════════════════════════════════════════════════
# 1. Image Preprocessing Pipeline
# ══════════════════════════════════════════════════════════════════════════════

def preprocess_image(img: Image.Image) -> Image.Image:
    """
    Full preprocessing stack for prescription images.

    Steps (in order, matching SROIE/DocVQA best practices):
    1. Convert to RGB (handle RGBA/palette)
    2. Resize to OCR-optimal DPI equivalent (≥300 DPI)
    3. Deskew (rotate to horizontal)
    4. Denoise (median filter)
    5. Contrast enhancement (CLAHE-like via PIL)
    6. Sharpening
    7. Binarisation (Otsu-style via numpy)
    """
    # 1. Normalise colour mode
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    # 2. Upscale if too small (target ~2400px wide for 300 DPI A5)
    w, h = img.size
    if w < 1200:
        scale = 1200 / w
        img = img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)

    # 3. Deskew
    img = _deskew(img)

    # 4. Convert to grayscale for processing
    gray = img.convert("L")

    # 5. Denoise — median filter removes salt-and-pepper noise from scans
    gray = gray.filter(ImageFilter.MedianFilter(size=3))

    # 6. Contrast enhancement
    enhancer = ImageEnhance.Contrast(gray)
    gray = enhancer.enhance(1.8)

    # 7. Sharpen for thin ink strokes
    sharpener = ImageEnhance.Sharpness(gray)
    gray = sharpener.enhance(2.0)

    # 8. Adaptive binarisation (Sauvola-like via numpy threshold)
    gray = _adaptive_binarise(gray)

    return gray


def _deskew(img: Image.Image) -> Image.Image:
    """
    Deskew image using Hough-line-based angle detection.
    Falls back gracefully if scipy not available.
    """
    try:
        import scipy.ndimage as ndi

        gray = np.array(img.convert("L"))
        # Edge detection (simple gradient)
        from PIL import ImageFilter as IFilt
        pil_gray = Image.fromarray(gray)
        edges = np.array(pil_gray.filter(IFilt.FIND_EDGES))

        # Find dominant angle via projection profile
        # Project at angles -15..15° and pick max variance angle
        best_angle = 0.0
        best_var = -1.0
        for angle in np.linspace(-15, 15, 31):
            rotated = ndi.rotate(edges, angle, reshape=False)
            col_sums = rotated.sum(axis=1)
            var = float(np.var(col_sums))
            if var > best_var:
                best_var = var
                best_angle = angle

        if abs(best_angle) > 0.5:
            img = img.rotate(-best_angle, expand=True, fillcolor=255)

    except ImportError:
        pass  # scipy not installed — skip deskew
    except Exception as e:
        logger.debug("Deskew failed (non-fatal): %s", e)

    return img


def _adaptive_binarise(gray: Image.Image) -> Image.Image:
    """
    Adaptive binarisation using local mean threshold.
    Handles uneven illumination common in prescription photos.
    """
    try:
        arr = np.array(gray, dtype=np.float32)
        # Local mean via uniform filter
        from scipy.ndimage import uniform_filter
        local_mean = uniform_filter(arr, size=25)
        binary = (arr > (local_mean * 0.85)).astype(np.uint8) * 255
        return Image.fromarray(binary, mode="L")
    except ImportError:
        # Fallback: global Otsu-style threshold
        arr = np.array(gray)
        threshold = int(np.percentile(arr, 60))
        binary = ((arr > threshold).astype(np.uint8)) * 255
        return Image.fromarray(binary.astype(np.uint8), mode="L")


def preprocess_pdf_page(pdf_bytes: bytes, page_num: int = 0) -> Image.Image:
    """Convert PDF page to preprocessed PIL image for OCR."""
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        page = doc[page_num]
        mat = fitz.Matrix(3.0, 3.0)  # 3x zoom → ~216 DPI equivalent
        pix = page.get_pixmap(matrix=mat)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        doc.close()
        return preprocess_image(img)
    except ImportError:
        raise RuntimeError(
            "PyMuPDF (fitz) is required for PDF processing. "
            "Install with: pip install pymupdf"
        )


# ══════════════════════════════════════════════════════════════════════════════
# 2. OCR Engine Wrappers
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class OcrWord:
    text: str
    confidence: float       # 0.0–1.0
    bbox: tuple[int, int, int, int] | None = None   # x,y,w,h

@dataclass
class OcrResult:
    words: list[OcrWord] = field(default_factory=list)
    raw_text: str = ""
    engine_used: str = ""
    avg_confidence: float = 0.0


def _load_easyocr() -> Any:
    """Lazy-load EasyOCR reader (singleton)."""
    global _easyocr_reader, _easyocr_available

    if _easyocr_available is False:
        return None
    if _easyocr_reader is not None:
        return _easyocr_reader

    try:
        import easyocr  # type: ignore
        # gpu=False ensures it works on CPU-only cloud deployments
        _easyocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
        _easyocr_available = True
        logger.info("✅ EasyOCR reader loaded")
        return _easyocr_reader
    except ImportError:
        logger.warning("EasyOCR not installed. Falling back to Tesseract.")
        _easyocr_available = False
        return None
    except Exception as e:
        logger.error("EasyOCR load failed: %s", e)
        _easyocr_available = False
        return None


def _ocr_easyocr(img: Image.Image) -> OcrResult:
    """Run EasyOCR on a preprocessed PIL image."""
    reader = _load_easyocr()
    if reader is None:
        raise RuntimeError("EasyOCR not available")

    img_arr = np.array(img.convert("RGB"))
    results = reader.readtext(img_arr, detail=1, paragraph=False)

    words: list[OcrWord] = []
    for (bbox_coords, text, conf) in results:
        text = text.strip()
        if not text:
            continue
        # bbox_coords = [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
        xs = [p[0] for p in bbox_coords]
        ys = [p[1] for p in bbox_coords]
        bbox = (int(min(xs)), int(min(ys)), int(max(xs) - min(xs)), int(max(ys) - min(ys)))
        words.append(OcrWord(text=text, confidence=float(conf), bbox=bbox))

    raw_text = " ".join(w.text for w in words)
    avg_conf = float(np.mean([w.confidence for w in words])) if words else 0.0

    return OcrResult(
        words=words,
        raw_text=raw_text,
        engine_used="EasyOCR",
        avg_confidence=avg_conf,
    )


def _ocr_tesseract(img: Image.Image) -> OcrResult:
    """Run Tesseract 5 LSTM on a preprocessed PIL image."""
    global _tesseract_available

    try:
        import pytesseract  # type: ignore

        # TSV output gives per-word confidence
        tsv = pytesseract.image_to_data(
            img,
            lang="eng",
            config="--oem 1 --psm 6",   # LSTM engine, assume uniform block
            output_type=pytesseract.Output.DICT,
        )

        words: list[OcrWord] = []
        for i, text in enumerate(tsv["text"]):
            text = str(text).strip()
            if not text or tsv["conf"][i] == -1:
                continue
            conf = float(tsv["conf"][i]) / 100.0
            bbox = (
                int(tsv["left"][i]),
                int(tsv["top"][i]),
                int(tsv["width"][i]),
                int(tsv["height"][i]),
            )
            words.append(OcrWord(text=text, confidence=conf, bbox=bbox))

        raw_text = pytesseract.image_to_string(img, lang="eng", config="--oem 1 --psm 6")
        avg_conf = float(np.mean([w.confidence for w in words])) if words else 0.0
        _tesseract_available = True

        return OcrResult(
            words=words,
            raw_text=raw_text.strip(),
            engine_used="Tesseract-LSTM",
            avg_confidence=avg_conf,
        )

    except ImportError:
        _tesseract_available = False
        raise RuntimeError("Tesseract not installed")
    except Exception as e:
        _tesseract_available = False
        raise RuntimeError(f"Tesseract error: {e}")


def run_ocr_on_image(img: Image.Image) -> OcrResult:
    """
    Run OCR with EasyOCR primary, Tesseract fallback.
    Returns best available result.
    """
    errors: list[str] = []

    # Primary: EasyOCR
    try:
        result = _ocr_easyocr(img)
        if result.avg_confidence > 0.1 or result.raw_text.strip():
            return result
        errors.append(f"EasyOCR low confidence: {result.avg_confidence:.2f}")
    except Exception as e:
        errors.append(f"EasyOCR: {e}")

    # Fallback: Tesseract
    try:
        result = _ocr_tesseract(img)
        return result
    except Exception as e:
        errors.append(f"Tesseract: {e}")

    # Both failed — return empty with engine info
    logger.error("All OCR engines failed: %s", " | ".join(errors))
    return OcrResult(
        raw_text="",
        engine_used="none",
        avg_confidence=0.0,
        words=[],
    )


# ══════════════════════════════════════════════════════════════════════════════
# 3. Text Post-Processing
# ══════════════════════════════════════════════════════════════════════════════

# Common OCR confusion pairs for medical text
_OCR_CORRECTIONS = {
    # digit/letter confusions
    "0mg": "Omg",
    "l00": "100",
    "l0mg": "10mg",
    "0mg": "0mg",
    # Common misspellings from OCR
    "amoxicillin": "Amoxicillin",
    "metfomin": "Metformin",
    "metformin": "Metformin",
    "atorvastatin": "Atorvastatin",
    "lisinopril": "Lisinopril",
    "amlodipine": "Amlodipine",
    "omeprazol": "Omeprazole",
    "paracetamol": "Paracetamol",
    "acetaminophen": "Acetaminophen",
    "ibuprofen": "Ibuprofen",
    "aspirin": "Aspirin",
    "ciprofloxacin": "Ciprofloxacin",
    "azithromycin": "Azithromycin",
    "doxycycline": "Doxycycline",
    "prednisone": "Prednisone",
    "prednisolone": "Prednisolone",
    "clopidogrel": "Clopidogrel",
    "losartan": "Losartan",
    "furosemide": "Furosemide",
    "metoprolol": "Metoprolol",
    "simvastatin": "Simvastatin",
    "rosuvastatin": "Rosuvastatin",
    "pantoprazole": "Pantoprazole",
    "esomeprazole": "Esomeprazole",
    "sertraline": "Sertraline",
    "fluoxetine": "Fluoxetine",
    "alprazolam": "Alprazolam",
    "clonazepam": "Clonazepam",
    "levothyroxine": "Levothyroxine",
    "gabapentin": "Gabapentin",
    "tramadol": "Tramadol",
    "diclofenac": "Diclofenac",
    "cetirizine": "Cetirizine",
    "loratadine": "Loratadine",
    "montelukast": "Montelukast",
    "salbutamol": "Salbutamol",
    "albuterol": "Albuterol",
    "insulin": "Insulin",
    "glipizide": "Glipizide",
    "glyburide": "Glyburide",
    "glimepiride": "Glimepiride",
    "sitagliptin": "Sitagliptin",
    "empagliflozin": "Empagliflozin",
}


def normalize_text(text: str) -> str:
    """Unicode normalization and basic OCR correction."""
    # Normalize unicode (handle accented chars)
    text = unicodedata.normalize("NFKC", text)
    # Fix common OCR character confusions
    text = text.replace("|", "I").replace("°", "0")
    # Apply dictionary corrections (case-insensitive)
    for wrong, correct in _OCR_CORRECTIONS.items():
        text = re.sub(re.escape(wrong), correct, text, flags=re.IGNORECASE)
    return text


def clean_raw_lines(raw_text: str) -> list[str]:
    """Split OCR text into cleaned, non-empty lines."""
    lines = []
    for line in raw_text.splitlines():
        line = line.strip()
        line = re.sub(r"\s{2,}", " ", line)  # collapse whitespace
        if len(line) >= 2:
            lines.append(line)
    return lines
