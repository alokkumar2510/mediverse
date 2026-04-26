"""
MediVerse AI — Prescription Parser
====================================
Parses OCR raw text into structured prescription entities:
  • Medicine names (with fuzzy matching against WHO/FDA database)
  • Dosage strength (e.g. 500mg, 10mcg, 1g)
  • Frequency (e.g. BD, TDS, QID, OD, twice daily)
  • Timing (e.g. after meals, before bed, morning)
  • Duration (e.g. 5 days, 2 weeks)
  • Doctor name (regex heuristics)
  • Date extraction (ISO + common formats)
  • Warnings (duplicates, low confidence, special drug flags)

Parsing approach:
  1. Line-by-line scan (most prescriptions are line-structured)
  2. Per-line, try to identify the "anchor" (medicine name via DB match)
  3. Extract modifiers (dosage, freq, timing, duration) from surrounding tokens
  4. Fuzzy-match unresolved tokens against medicine names
  5. Validate and flag duplicates
  6. Collect doctor metadata from header lines
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from app.ml.medicine_db import lookup_medicine, fuzzy_match_medicine, Medicine


# ══════════════════════════════════════════════════════════════════════════════
# Output Data Structures
# ══════════════════════════════════════════════════════════════════════════════

@dataclass
class ParsedMedicine:
    name: str                          # canonical name from DB or raw
    raw_name: str                      # as OCR'd
    canonical: Medicine | None         # DB entry if found
    dosage: str | None                 # "500 mg", "10 mcg", etc.
    frequency: str | None              # "Twice daily", "TDS", etc.
    timing: str | None                 # "After meals", "Bedtime", etc.
    duration: str | None               # "5 days", "1 week", etc.
    instructions: str | None           # other instructions on the line
    confidence: float                  # match confidence 0-1
    source_line: str                   # original OCR line


@dataclass
class ParsedPrescription:
    medicines: list[ParsedMedicine] = field(default_factory=list)
    doctor_name: str | None = None
    date: str | None = None
    patient_name: str | None = None
    notes: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    raw_lines: list[str] = field(default_factory=list)
    overall_confidence: float = 0.0
    low_confidence: bool = False


# ══════════════════════════════════════════════════════════════════════════════
# Regex Patterns (compiled once)
# ══════════════════════════════════════════════════════════════════════════════

# Dosage: 500mg, 10 mcg, 1.5g, 50IU, 250ml
_RE_DOSAGE = re.compile(
    r"""
    \b
    (\d+(?:\.\d+)?)           # number (int or float)
    \s*
    (mg|mcg|µg|g|ml|l|iu|mEq|mmol|units?)   # unit
    \b
    """,
    re.IGNORECASE | re.VERBOSE,
)

# Frequency codes (common Rx abbreviations from Latin and English)
_FREQ_MAP = {
    r"\bod\b":              "Once daily",
    r"\bqd\b":              "Once daily",
    r"\bonce\s*daily\b":    "Once daily",
    r"\bonce\s*a\s*day\b":  "Once daily",
    r"\bbd\b":              "Twice daily",
    r"\bbid\b":             "Twice daily",
    r"\btwice\s*daily\b":   "Twice daily",
    r"\btwice\s*a\s*day\b": "Twice daily",
    r"\b2\s*times?\s*(?:a\s*)?day\b":  "Twice daily",
    r"\btds\b":             "Three times daily",
    r"\btid\b":             "Three times daily",
    r"\bthree\s*times?\s*(?:a\s*)?day\b": "Three times daily",
    r"\b3\s*times?\s*(?:a\s*)?day\b":     "Three times daily",
    r"\bqid\b":             "Four times daily",
    r"\bfour\s*times?\s*(?:a\s*)?day\b":  "Four times daily",
    r"\bq4h\b":             "Every 4 hours",
    r"\bq6h\b":             "Every 6 hours",
    r"\bq8h\b":             "Every 8 hours",
    r"\bq12h\b":            "Every 12 hours",
    r"\bqhs\b":             "At bedtime",
    r"\bhs\b":              "At bedtime",
    r"\bprn\b":             "As needed",
    r"\bas\s*needed\b":     "As needed",
    r"\bsos\b":             "If needed",
    r"\bstat\b":            "Immediately",
    r"\bonce\s*weekly\b":   "Once weekly",
    r"\bweekly\b":          "Once weekly",
    r"\bmonthly\b":         "Once monthly",
    r"\balterate\s*day\b":  "Alternate days",
    r"\balt\s*day\b":       "Alternate days",
    r"\bevery\s*other\s*day\b": "Alternate days",
}

_FREQ_PATTERNS = [(re.compile(pat, re.IGNORECASE), label) for pat, label in _FREQ_MAP.items()]

# Timing
_TIMING_MAP = {
    r"\bafter\s*(?:food|meal|meals|eating|lunch|dinner|breakfast)\b": "After meals",
    r"\bwith\s*(?:food|meal|meals)\b":                                "With meals",
    r"\bbefore\s*(?:food|meal|meals|eating|breakfast|lunch|dinner)\b": "Before meals",
    r"\bon\s*(?:empty|an\s*empty)\s*stomach\b":                       "Empty stomach",
    r"\bat\s*bedtime\b":                                              "At bedtime",
    r"\bat\s*night\b":                                                "At bedtime",
    r"\bnight\b":                                                     "At night",
    r"\bin\s*the\s*morning\b":                                        "In the morning",
    r"\bmorning\b":                                                   "Morning",
    r"\bevening\b":                                                   "Evening",
    r"\bwith\s*water\b":                                              "With water",
    r"\bsublingually\b":                                              "Sublingual",
    r"\binternally\b":                                                "Oral",
    r"\btopically\b":                                                 "Topical use",
}

_TIMING_PATTERNS = [(re.compile(pat, re.IGNORECASE), label) for pat, label in _TIMING_MAP.items()]

# Duration
_RE_DURATION = re.compile(
    r"""
    \b
    (?:for\s+)?
    (\d+)
    \s*
    (day|days|week|weeks|month|months|year|years)
    \b
    """,
    re.IGNORECASE | re.VERBOSE,
)

# Date
_RE_DATE = re.compile(
    r"""
    \b
    (?:
        (\d{1,2})[/-](\d{1,2})[/-](\d{2,4})     # DD/MM/YYYY or MM/DD/YYYY
        |
        (\d{4})[/-](\d{1,2})[/-](\d{1,2})        # YYYY-MM-DD
        |
        (\d{1,2})\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})  # 12 Jan 2024
    )
    \b
    """,
    re.IGNORECASE | re.VERBOSE,
)

# Doctor name heuristics
_RE_DOCTOR = re.compile(
    r"""
    \b
    (?:Dr\.?|Doctor|Prof\.?|MD|MBBS|M\.B\.B\.S)
    \s+
    ([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})
    """,
    re.VERBOSE,
)

# Patient name heuristics
_RE_PATIENT = re.compile(
    r"""
    (?:Patient|Name|Pt\.?)
    \s*[:.]?\s*
    ([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})
    """,
    re.VERBOSE,
)

# Rx number prefix on lines (common prescription line starters)
_RE_RX_LINE = re.compile(
    r"^[\d]+[.)]\s*|^Rx\.?\s*|^◆\s*|^•\s*|^-\s*|\[R\]\s*",
    re.IGNORECASE,
)

# Words that are NOT medicines (filter noise)
_NOISE_TOKENS = {
    "the", "and", "or", "for", "with", "from", "take", "tablet", "tablets",
    "capsule", "capsules", "cap", "tab", "tabs", "caps", "syrup", "liquid",
    "injection", "cream", "ointment", "drops", "solution", "suspension",
    "dose", "doses", "daily", "times", "day", "days", "weeks", "months",
    "apply", "use", "please", "signature", "sig", "date", "patient",
    "name", "address", "hospital", "clinic", "doctor", "dr", "mr", "mrs",
    "ms", "rx", "prescription", "reg", "registration",
}


# ══════════════════════════════════════════════════════════════════════════════
# Extraction Helpers
# ══════════════════════════════════════════════════════════════════════════════

def _extract_dosage(text: str) -> str | None:
    """Extract first dosage from text. Returns 'NNNunit' formatted string."""
    m = _RE_DOSAGE.search(text)
    if m:
        return f"{m.group(1)} {m.group(2).lower()}"
    return None


def _extract_frequency(text: str) -> str | None:
    """Match frequency patterns in text."""
    for pattern, label in _FREQ_PATTERNS:
        if pattern.search(text):
            return label
    return None


def _extract_timing(text: str) -> str | None:
    """Match timing patterns in text."""
    for pattern, label in _TIMING_PATTERNS:
        if pattern.search(text):
            return label
    return None


def _extract_duration(text: str) -> str | None:
    """Extract duration from text."""
    m = _RE_DURATION.search(text)
    if m:
        return f"{m.group(1)} {m.group(2)}"
    return None


def _extract_date(text: str) -> str | None:
    """Extract date from text."""
    m = _RE_DATE.search(text)
    if m:
        return m.group(0).strip()
    return None


def _extract_doctor(text: str) -> str | None:
    """Extract doctor name from text."""
    m = _RE_DOCTOR.search(text)
    if m:
        return m.group(1).strip()
    return None


def _extract_patient(text: str) -> str | None:
    """Extract patient name from text."""
    m = _RE_PATIENT.search(text)
    if m:
        return m.group(1).strip()
    return None


def _candidate_medicine_tokens(line: str) -> list[str]:
    """
    Extract potential medicine name tokens from a line.
    Strategy: remove known non-medicine tokens and dosage/freq patterns,
    then try remaining multi-word and single-word phrases.
    """
    # Remove dosage numbers
    clean = _RE_DOSAGE.sub("", line)
    # Remove Rx prefixes
    clean = _RE_RX_LINE.sub("", clean)
    # Remove duration patterns
    clean = _RE_DURATION.sub("", clean)
    # Remove parenthetical content
    clean = re.sub(r"\([^)]*\)", "", clean)
    # Tokenize
    tokens = re.findall(r"[A-Za-z][A-Za-z'-]*", clean)
    # Filter noise
    tokens = [t for t in tokens if t.lower() not in _NOISE_TOKENS and len(t) >= 4]
    return tokens


# ══════════════════════════════════════════════════════════════════════════════
# Main Parser
# ══════════════════════════════════════════════════════════════════════════════

def parse_prescription(raw_text: str, ocr_words: list[Any] | None = None) -> ParsedPrescription:
    """
    Full prescription parser.

    Args:
        raw_text: OCR raw text output (may be multi-line)
        ocr_words: optional list of OcrWord objects for confidence data

    Returns:
        ParsedPrescription with all extracted fields.
    """
    result = ParsedPrescription()
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    result.raw_lines = lines

    medicines_seen: dict[str, int] = {}   # canonical_name → count (for dup detection)

    for line in lines:
        normalized = line.strip()
        if len(normalized) < 3:
            continue

        # ── Metadata extraction ───────────────────────────────────────────────
        if result.doctor_name is None:
            doc = _extract_doctor(normalized)
            if doc:
                result.doctor_name = doc
                continue

        if result.date is None:
            d = _extract_date(normalized)
            if d:
                result.date = d

        if result.patient_name is None:
            pt = _extract_patient(normalized)
            if pt:
                result.patient_name = pt

        # ── Medicine line detection ───────────────────────────────────────────
        tokens = _candidate_medicine_tokens(normalized)
        if not tokens:
            # Could be a notes/instruction line
            if len(normalized) > 20 and any(c.isalpha() for c in normalized):
                result.notes.append(normalized)
            continue

        # Try to find medicine: sliding window of 1-3 tokens
        found_medicine: ParsedMedicine | None = None

        for window in range(3, 0, -1):
            for start in range(len(tokens) - window + 1):
                phrase = " ".join(tokens[start:start + window])
                med = lookup_medicine(phrase)
                if med:
                    # Good match
                    found_medicine = ParsedMedicine(
                        name=med.name,
                        raw_name=phrase,
                        canonical=med,
                        dosage=_extract_dosage(normalized),
                        frequency=_extract_frequency(normalized),
                        timing=_extract_timing(normalized),
                        duration=_extract_duration(normalized),
                        instructions=None,
                        confidence=1.0,
                        source_line=normalized,
                    )
                    break
            if found_medicine:
                break

        # Fuzzy fallback for unresolved single tokens
        if found_medicine is None and tokens:
            best_score = 0.0
            best_med = None
            best_raw = ""
            for token in tokens:
                matches = fuzzy_match_medicine(token, threshold=0.72, max_results=1)
                if matches and matches[0][2] > best_score:
                    best_score = matches[0][2]
                    best_med = matches[0][1]
                    best_raw = token

            if best_med and best_score >= 0.72:
                found_medicine = ParsedMedicine(
                    name=best_med.name,
                    raw_name=best_raw,
                    canonical=best_med,
                    dosage=_extract_dosage(normalized),
                    frequency=_extract_frequency(normalized),
                    timing=_extract_timing(normalized),
                    duration=_extract_duration(normalized),
                    instructions=None,
                    confidence=best_score,
                    source_line=normalized,
                )

        if found_medicine:
            # Duplicate detection
            canon_lower = found_medicine.name.lower()
            medicines_seen[canon_lower] = medicines_seen.get(canon_lower, 0) + 1
            result.medicines.append(found_medicine)

    # ── Post-processing ───────────────────────────────────────────────────────

    # Duplicate warnings
    for name, count in medicines_seen.items():
        if count > 1:
            result.warnings.append(
                f"⚠️ Duplicate medicine detected: '{name.title()}' appears {count} times."
            )

    # Low confidence warnings
    low_conf_meds = [m for m in result.medicines if m.confidence < 0.80]
    if low_conf_meds:
        result.warnings.append(
            f"⚠️ Low confidence on {len(low_conf_meds)} medicine(s): "
            + ", ".join(f"'{m.raw_name}' ({m.confidence:.0%})" for m in low_conf_meds)
            + ". Please verify manually."
        )

    # Controlled substance flags
    _CONTROLLED = {"tramadol", "codeine", "morphine", "alprazolam", "clonazepam",
                   "diazepam", "zolpidem", "warfarin"}
    for m in result.medicines:
        if m.name.lower() in _CONTROLLED:
            result.warnings.append(
                f"⚠️ Controlled/High-alert medicine: {m.name}. "
                "Verify dosage carefully and confirm with prescribing physician."
            )

    # Overall confidence
    if result.medicines:
        result.overall_confidence = sum(m.confidence for m in result.medicines) / len(result.medicines)
    result.low_confidence = result.overall_confidence < 0.70

    return result


def prescription_to_dict(parsed: ParsedPrescription) -> dict:
    """Convert ParsedPrescription to JSON-serialisable dict."""
    return {
        "medicines": [
            {
                "name": m.name,
                "raw_name": m.raw_name,
                "category": m.canonical.category if m.canonical else None,
                "brand_names": list(m.canonical.brand_names) if m.canonical else [],
                "dosage": m.dosage,
                "frequency": m.frequency,
                "timing": m.timing,
                "duration": m.duration,
                "instructions": m.instructions,
                "confidence": round(m.confidence, 3),
                "source_line": m.source_line,
            }
            for m in parsed.medicines
        ],
        "doctor_name": parsed.doctor_name,
        "date": parsed.date,
        "patient_name": parsed.patient_name,
        "notes": parsed.notes,
        "warnings": parsed.warnings,
        "overall_confidence": round(parsed.overall_confidence, 3),
        "low_confidence": parsed.low_confidence,
        "medicine_count": len(parsed.medicines),
    }
