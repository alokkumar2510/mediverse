"""
MediVerse AI — Medicine Reference Database
===========================================
Compiled from publicly available sources:
  • WHO Essential Medicines List (EML) 2023 — https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02
  • OpenFDA Drug NDC Database — https://open.fda.gov/drug/ndc/
  • RxNorm (NLM) — https://www.nlm.nih.gov/research/umls/rxnorm/
  • British National Formulary (BNF) drug list — public reference
  • Common prescription drug name aliases and abbreviations

Usage:
  from app.ml.medicine_db import MEDICINE_DB, fuzzy_match_medicine

This module is intentionally dependency-free for fast startup.
Fuzzy matching uses a custom edit-distance implementation (no thefuzz).
If thefuzz is available it is used as a faster fallback.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Sequence


# ══════════════════════════════════════════════════════════════════════════════
# Medicine Registry
# Each entry: (canonical_name, category, common_aliases)
# ══════════════════════════════════════════════════════════════════════════════

@dataclass(frozen=True)
class Medicine:
    name: str               # Canonical INN / generic name
    category: str           # pharmacological category
    aliases: tuple[str, ...] = field(default_factory=tuple)
    brand_names: tuple[str, ...] = field(default_factory=tuple)


# Primary medicine list — WHO EML + common prescriptions
# Organized by pharmacological class
MEDICINE_LIST: list[Medicine] = [
    # ── Analgesics & Antipyretics ─────────────────────────────────────────────
    Medicine("Paracetamol", "Analgesic/Antipyretic",
             aliases=("acetaminophen", "tylenol", "crocin", "panadol"),
             brand_names=("Tylenol", "Panadol", "Crocin", "Dolo")),
    Medicine("Ibuprofen", "NSAID",
             aliases=("advil", "brufen", "nurofen"),
             brand_names=("Advil", "Brufen", "Nurofen")),
    Medicine("Aspirin", "NSAID/Antiplatelet",
             aliases=("acetylsalicylic acid", "asa", "ecosprin"),
             brand_names=("Ecosprin", "Disprin")),
    Medicine("Diclofenac", "NSAID",
             aliases=("voltaren", "voveran"),
             brand_names=("Voltaren", "Voveran")),
    Medicine("Naproxen", "NSAID",
             aliases=("aleve", "naprosyn"),
             brand_names=("Aleve", "Naprosyn")),
    Medicine("Tramadol", "Opioid Analgesic",
             aliases=("ultram", "tramal"),
             brand_names=("Ultram", "Tramal")),
    Medicine("Codeine", "Opioid Analgesic",
             aliases=("codeine phosphate",),
             brand_names=()),
    Medicine("Morphine", "Opioid Analgesic",
             aliases=("morphine sulfate", "ms contin"),
             brand_names=("MS Contin",)),

    # ── Antibiotics ───────────────────────────────────────────────────────────
    Medicine("Amoxicillin", "Antibiotic - Penicillin",
             aliases=("amoxil", "trimox"),
             brand_names=("Amoxil", "Trimox")),
    Medicine("Amoxicillin-Clavulanate", "Antibiotic - Penicillin+β-lactamase inhibitor",
             aliases=("augmentin", "co-amoxiclav"),
             brand_names=("Augmentin",)),
    Medicine("Azithromycin", "Antibiotic - Macrolide",
             aliases=("zithromax", "azee", "z-pak"),
             brand_names=("Zithromax", "Azee")),
    Medicine("Ciprofloxacin", "Antibiotic - Fluoroquinolone",
             aliases=("cipro", "ciplox"),
             brand_names=("Cipro", "Ciplox")),
    Medicine("Doxycycline", "Antibiotic - Tetracycline",
             aliases=("vibramycin", "doxt"),
             brand_names=("Vibramycin",)),
    Medicine("Metronidazole", "Antibiotic - Nitroimidazole",
             aliases=("flagyl", "metrogyl"),
             brand_names=("Flagyl", "Metrogyl")),
    Medicine("Cephalexin", "Antibiotic - Cephalosporin",
             aliases=("keflex",),
             brand_names=("Keflex",)),
    Medicine("Ceftriaxone", "Antibiotic - Cephalosporin 3rd gen",
             aliases=("rocephin",),
             brand_names=("Rocephin",)),
    Medicine("Clarithromycin", "Antibiotic - Macrolide",
             aliases=("biaxin", "klaricid"),
             brand_names=("Biaxin",)),
    Medicine("Levofloxacin", "Antibiotic - Fluoroquinolone",
             aliases=("levaquin", "tavanic"),
             brand_names=("Levaquin",)),
    Medicine("Trimethoprim-Sulfamethoxazole", "Antibiotic - Sulfonamide",
             aliases=("cotrimoxazole", "bactrim", "septran"),
             brand_names=("Bactrim", "Septran")),
    Medicine("Nitrofurantoin", "Antibiotic - Urinary",
             aliases=("macrobid", "macrodantin"),
             brand_names=("Macrobid",)),

    # ── Antihypertensives ─────────────────────────────────────────────────────
    Medicine("Amlodipine", "Calcium Channel Blocker",
             aliases=("norvasc", "amlogard"),
             brand_names=("Norvasc", "Amlogard")),
    Medicine("Lisinopril", "ACE Inhibitor",
             aliases=("zestril", "prinivil"),
             brand_names=("Zestril", "Prinivil")),
    Medicine("Enalapril", "ACE Inhibitor",
             aliases=("vasotec",),
             brand_names=("Vasotec",)),
    Medicine("Losartan", "ARB",
             aliases=("cozaar",),
             brand_names=("Cozaar",)),
    Medicine("Telmisartan", "ARB",
             aliases=("micardis",),
             brand_names=("Micardis",)),
    Medicine("Valsartan", "ARB",
             aliases=("diovan",),
             brand_names=("Diovan",)),
    Medicine("Metoprolol", "Beta Blocker",
             aliases=("lopressor", "toprol"),
             brand_names=("Lopressor", "Toprol")),
    Medicine("Atenolol", "Beta Blocker",
             aliases=("tenormin",),
             brand_names=("Tenormin",)),
    Medicine("Carvedilol", "Beta Blocker",
             aliases=("coreg",),
             brand_names=("Coreg",)),
    Medicine("Bisoprolol", "Beta Blocker",
             aliases=("zebeta",),
             brand_names=("Zebeta",)),
    Medicine("Hydrochlorothiazide", "Diuretic",
             aliases=("hctz", "hydrodiuril"),
             brand_names=("Hydrodiuril",)),
    Medicine("Furosemide", "Loop Diuretic",
             aliases=("lasix",),
             brand_names=("Lasix",)),
    Medicine("Spironolactone", "Potassium-sparing Diuretic",
             aliases=("aldactone",),
             brand_names=("Aldactone",)),

    # ── Statins & Lipid-lowering ──────────────────────────────────────────────
    Medicine("Atorvastatin", "Statin",
             aliases=("lipitor",),
             brand_names=("Lipitor",)),
    Medicine("Rosuvastatin", "Statin",
             aliases=("crestor",),
             brand_names=("Crestor",)),
    Medicine("Simvastatin", "Statin",
             aliases=("zocor",),
             brand_names=("Zocor",)),
    Medicine("Pravastatin", "Statin",
             aliases=("pravachol",),
             brand_names=("Pravachol",)),

    # ── Diabetes medications ──────────────────────────────────────────────────
    Medicine("Metformin", "Biguanide / Antidiabetic",
             aliases=("glucophage", "obimet", "glycomet"),
             brand_names=("Glucophage", "Glycomet")),
    Medicine("Glipizide", "Sulfonylurea",
             aliases=("glucotrol",),
             brand_names=("Glucotrol",)),
    Medicine("Glyburide", "Sulfonylurea",
             aliases=("micronase", "glibenclamide"),
             brand_names=("Micronase",)),
    Medicine("Glimepiride", "Sulfonylurea",
             aliases=("amaryl",),
             brand_names=("Amaryl",)),
    Medicine("Sitagliptin", "DPP-4 Inhibitor",
             aliases=("januvia",),
             brand_names=("Januvia",)),
    Medicine("Empagliflozin", "SGLT-2 Inhibitor",
             aliases=("jardiance",),
             brand_names=("Jardiance",)),
    Medicine("Dapagliflozin", "SGLT-2 Inhibitor",
             aliases=("farxiga", "forxiga"),
             brand_names=("Farxiga", "Forxiga")),
    Medicine("Insulin", "Insulin",
             aliases=("insulin glargine", "insulin aspart", "insulin lispro",
                      "novolog", "humalog", "lantus", "basaglar"),
             brand_names=("Lantus", "Novolog", "Humalog")),
    Medicine("Pioglitazone", "Thiazolidinedione",
             aliases=("actos",),
             brand_names=("Actos",)),

    # ── GI medications ────────────────────────────────────────────────────────
    Medicine("Omeprazole", "PPI",
             aliases=("prilosec", "omez"),
             brand_names=("Prilosec", "Omez")),
    Medicine("Pantoprazole", "PPI",
             aliases=("protonix", "pan"),
             brand_names=("Protonix",)),
    Medicine("Esomeprazole", "PPI",
             aliases=("nexium",),
             brand_names=("Nexium",)),
    Medicine("Ranitidine", "H2 Blocker",
             aliases=("zantac",),
             brand_names=("Zantac",)),
    Medicine("Domperidone", "Antiemetic/Prokinetic",
             aliases=("motilium",),
             brand_names=("Motilium",)),
    Medicine("Ondansetron", "Antiemetic",
             aliases=("zofran",),
             brand_names=("Zofran",)),
    Medicine("Metoclopramide", "Antiemetic/Prokinetic",
             aliases=("reglan",),
             brand_names=("Reglan",)),

    # ── Respiratory ───────────────────────────────────────────────────────────
    Medicine("Salbutamol", "Bronchodilator / SABA",
             aliases=("albuterol", "ventolin", "proventil"),
             brand_names=("Ventolin",)),
    Medicine("Montelukast", "Leukotriene Antagonist",
             aliases=("singulair",),
             brand_names=("Singulair",)),
    Medicine("Budesonide", "Inhaled Corticosteroid",
             aliases=("pulmicort",),
             brand_names=("Pulmicort",)),
    Medicine("Salmeterol", "LABA",
             aliases=("serevent",),
             brand_names=("Serevent",)),
    Medicine("Tiotropium", "LAMA",
             aliases=("spiriva",),
             brand_names=("Spiriva",)),
    Medicine("Fluticasone", "Inhaled Corticosteroid",
             aliases=("flonase", "flovent"),
             brand_names=("Flonase", "Flovent")),

    # ── Antihistamines ────────────────────────────────────────────────────────
    Medicine("Cetirizine", "Antihistamine",
             aliases=("zyrtec", "cetzine"),
             brand_names=("Zyrtec",)),
    Medicine("Loratadine", "Antihistamine",
             aliases=("claritin",),
             brand_names=("Claritin",)),
    Medicine("Fexofenadine", "Antihistamine",
             aliases=("allegra",),
             brand_names=("Allegra",)),
    Medicine("Diphenhydramine", "Antihistamine",
             aliases=("benadryl",),
             brand_names=("Benadryl",)),
    Medicine("Chlorphenamine", "Antihistamine",
             aliases=("chlorpheniramine", "piriton"),
             brand_names=("Piriton",)),

    # ── Psychiatric / Neurological ────────────────────────────────────────────
    Medicine("Sertraline", "SSRI",
             aliases=("zoloft",),
             brand_names=("Zoloft",)),
    Medicine("Fluoxetine", "SSRI",
             aliases=("prozac",),
             brand_names=("Prozac",)),
    Medicine("Escitalopram", "SSRI",
             aliases=("lexapro",),
             brand_names=("Lexapro",)),
    Medicine("Duloxetine", "SNRI",
             aliases=("cymbalta",),
             brand_names=("Cymbalta",)),
    Medicine("Venlafaxine", "SNRI",
             aliases=("effexor",),
             brand_names=("Effexor",)),
    Medicine("Alprazolam", "Benzodiazepine",
             aliases=("xanax",),
             brand_names=("Xanax",)),
    Medicine("Clonazepam", "Benzodiazepine",
             aliases=("klonopin", "rivotril"),
             brand_names=("Klonopin",)),
    Medicine("Diazepam", "Benzodiazepine",
             aliases=("valium",),
             brand_names=("Valium",)),
    Medicine("Zolpidem", "Sleep Aid",
             aliases=("ambien",),
             brand_names=("Ambien",)),
    Medicine("Quetiapine", "Antipsychotic",
             aliases=("seroquel",),
             brand_names=("Seroquel",)),
    Medicine("Risperidone", "Antipsychotic",
             aliases=("risperdal",),
             brand_names=("Risperdal",)),
    Medicine("Gabapentin", "Anticonvulsant/Neuropathic pain",
             aliases=("neurontin",),
             brand_names=("Neurontin",)),
    Medicine("Pregabalin", "Anticonvulsant/Neuropathic pain",
             aliases=("lyrica",),
             brand_names=("Lyrica",)),
    Medicine("Carbamazepine", "Anticonvulsant",
             aliases=("tegretol",),
             brand_names=("Tegretol",)),
    Medicine("Valproate", "Anticonvulsant/Mood stabiliser",
             aliases=("depakote", "valproic acid", "sodium valproate"),
             brand_names=("Depakote",)),
    Medicine("Levodopa", "Antiparkinsonian",
             aliases=("l-dopa",),
             brand_names=()),

    # ── Thyroid ───────────────────────────────────────────────────────────────
    Medicine("Levothyroxine", "Thyroid Hormone",
             aliases=("synthroid", "eltroxin"),
             brand_names=("Synthroid", "Eltroxin")),
    Medicine("Carbimazole", "Antithyroid",
             aliases=(),
             brand_names=()),

    # ── Anticoagulants ────────────────────────────────────────────────────────
    Medicine("Warfarin", "Anticoagulant",
             aliases=("coumadin",),
             brand_names=("Coumadin",)),
    Medicine("Clopidogrel", "Antiplatelet",
             aliases=("plavix",),
             brand_names=("Plavix",)),
    Medicine("Rivaroxaban", "NOAC",
             aliases=("xarelto",),
             brand_names=("Xarelto",)),
    Medicine("Apixaban", "NOAC",
             aliases=("eliquis",),
             brand_names=("Eliquis",)),

    # ── Vitamins & Supplements ────────────────────────────────────────────────
    Medicine("Vitamin D", "Supplement",
             aliases=("cholecalciferol", "calciferol", "vitamin d3", "vit d"),
             brand_names=()),
    Medicine("Vitamin B12", "Supplement",
             aliases=("cyanocobalamin", "methylcobalamin", "vit b12"),
             brand_names=()),
    Medicine("Folic Acid", "Vitamin",
             aliases=("folate", "vitamin b9"),
             brand_names=()),
    Medicine("Calcium Carbonate", "Supplement",
             aliases=("caltrate", "tums"),
             brand_names=("Caltrate", "Tums")),
    Medicine("Iron Supplements", "Supplement",
             aliases=("ferrous sulfate", "ferrous fumarate", "feso4"),
             brand_names=()),
    Medicine("Zinc Sulfate", "Supplement",
             aliases=("zinc",),
             brand_names=()),

    # ── Antivirals ────────────────────────────────────────────────────────────
    Medicine("Acyclovir", "Antiviral",
             aliases=("zovirax",),
             brand_names=("Zovirax",)),
    Medicine("Oseltamivir", "Antiviral",
             aliases=("tamiflu",),
             brand_names=("Tamiflu",)),

    # ── Antimalarials ─────────────────────────────────────────────────────────
    Medicine("Chloroquine", "Antimalarial",
             aliases=(),
             brand_names=()),
    Medicine("Hydroxychloroquine", "Antimalarial/DMARD",
             aliases=("plaquenil",),
             brand_names=("Plaquenil",)),
    Medicine("Artemether-Lumefantrine", "Antimalarial",
             aliases=("coartem",),
             brand_names=("Coartem",)),

    # ── Steroids ──────────────────────────────────────────────────────────────
    Medicine("Prednisolone", "Corticosteroid",
             aliases=("pred forte",),
             brand_names=()),
    Medicine("Prednisone", "Corticosteroid",
             aliases=("deltasone",),
             brand_names=("Deltasone",)),
    Medicine("Dexamethasone", "Corticosteroid",
             aliases=("decadron",),
             brand_names=("Decadron",)),
    Medicine("Hydrocortisone", "Corticosteroid",
             aliases=("cortisol",),
             brand_names=()),
    Medicine("Methylprednisolone", "Corticosteroid",
             aliases=("medrol",),
             brand_names=("Medrol",)),
]


# ── Build lookup indices ───────────────────────────────────────────────────────

# Normalise a string for matching
def _norm(s: str) -> str:
    return s.lower().strip().replace("-", " ").replace("_", " ")


# name → Medicine (case-insensitive)
MEDICINE_DB: dict[str, Medicine] = {}

for _m in MEDICINE_LIST:
    MEDICINE_DB[_norm(_m.name)] = _m
    for _alias in _m.aliases:
        MEDICINE_DB[_norm(_alias)] = _m
    for _brand in _m.brand_names:
        MEDICINE_DB[_norm(_brand)] = _m

ALL_MEDICINE_NAMES: list[str] = list(MEDICINE_DB.keys())


# ══════════════════════════════════════════════════════════════════════════════
# Fuzzy Matching
# ══════════════════════════════════════════════════════════════════════════════

def _edit_distance(a: str, b: str) -> int:
    """Standard Levenshtein edit distance (pure Python)."""
    if len(a) < len(b):
        return _edit_distance(b, a)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (ca != cb)))
        prev = curr
    return prev[-1]


def fuzzy_match_medicine(
    query: str,
    threshold: float = 0.72,
    max_results: int = 1,
) -> list[tuple[str, Medicine, float]]:
    """
    Fuzzy match `query` against the medicine database.

    Returns list of (matched_key, Medicine, score) sorted by score desc.
    Score: 1.0 = exact match, 0.0 = no match.
    Threshold: 0.72 recommended for medical names (OCR has ~5–15% char error rate).

    Uses thefuzz (Levenshtein) if available, else our own implementation.
    """
    q = _norm(query)
    if not q:
        return []

    # Exact match fast-path
    if q in MEDICINE_DB:
        return [(q, MEDICINE_DB[q], 1.0)]

    # Try thefuzz for speed
    try:
        from thefuzz import process  # type: ignore
        matches = process.extractBests(q, ALL_MEDICINE_NAMES, limit=max_results, score_cutoff=int(threshold * 100))
        results = []
        for matched_key, score in matches:
            results.append((matched_key, MEDICINE_DB[matched_key], score / 100))
        return results
    except ImportError:
        pass

    # Fallback: edit distance
    results: list[tuple[str, Medicine, float]] = []
    for key in ALL_MEDICINE_NAMES:
        # Skip if length difference is too large
        if abs(len(q) - len(key)) > max(len(q), len(key)) * 0.5:
            continue
        dist = _edit_distance(q, key)
        max_len = max(len(q), len(key), 1)
        score = 1.0 - (dist / max_len)
        if score >= threshold:
            results.append((key, MEDICINE_DB[key], score))

    results.sort(key=lambda x: x[2], reverse=True)
    return results[:max_results]


def lookup_medicine(name: str) -> Medicine | None:
    """Exact + fuzzy lookup. Returns Medicine or None."""
    q = _norm(name)
    if q in MEDICINE_DB:
        return MEDICINE_DB[q]
    matches = fuzzy_match_medicine(name, threshold=0.75, max_results=1)
    if matches:
        return matches[0][1]
    return None
