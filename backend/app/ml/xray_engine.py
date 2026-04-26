"""
MediVerse AI — Chest X-Ray Inference Engine
============================================
Production ONNX Runtime inference with:
  - Multi-model support (EfficientNet-B4, DenseNet121, ResNet50)
  - Test-Time Augmentation (TTA) for uncertainty
  - Grad-CAM heatmap generation
  - Image quality validation
  - Demo mode fallback (never crashes)
"""
from __future__ import annotations

import base64
import hashlib
import io
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger("mediverse.xray")

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parents[3]
META_PATH = ROOT / "ml" / "exports" / "xray_meta.json"
ONNX_PATH = ROOT / "ml" / "exports" / "xray_best.onnx"
CKPT_DIR  = ROOT / "ml" / "checkpoints"

# ── Fallback class config ──────────────────────────────────────────────────────
FALLBACK_CLASSES = [
    "Atelectasis", "Cardiomegaly", "Consolidation", "Edema",
    "Effusion", "Emphysema", "Fibrosis", "Hernia",
    "Infiltration", "Mass", "No Finding", "Nodule",
    "Pleural_Thickening", "Pneumonia", "Pneumothorax",
    "Scoliosis", "Tuberculosis",
]

HIGH_RISK = {
    "Pneumonia", "Cardiomegaly", "Pneumothorax", "Tuberculosis",
    "Edema", "Effusion", "Mass", "ARDS",
}

# Clinical severity descriptions
SEVERITY_MAP: dict[str, str] = {
    "Pneumonia":         "High — Active infection. Prompt medical evaluation required.",
    "Tuberculosis":      "High — Infectious disease. Isolation + specialist referral needed.",
    "Cardiomegaly":      "High — Enlarged heart. Cardiac evaluation urgent.",
    "Pneumothorax":      "High — Collapsed lung. Emergency care may be required.",
    "Edema":             "High — Fluid accumulation. Cardiopulmonary evaluation needed.",
    "Effusion":          "Moderate-High — Pleural fluid. Clinical correlation needed.",
    "Mass":              "High — Potential malignancy. Biopsy/CT workup recommended.",
    "Atelectasis":       "Moderate — Partial lung collapse. Follow-up imaging advised.",
    "Consolidation":     "Moderate — Possible infection/inflammation. Clinical review needed.",
    "Emphysema":         "Moderate — Chronic airway disease. Pulmonologist referral advised.",
    "Fibrosis":          "Moderate — Chronic lung scarring. Pulmonology follow-up needed.",
    "Nodule":            "Moderate — Lung nodule. CT scan and follow-up recommended.",
    "Pleural_Thickening":"Moderate — Pleural changes. Respiratory review advised.",
    "Scoliosis":         "Low-Moderate — Spinal curvature. Orthopaedic assessment if severe.",
    "Infiltration":      "Moderate — Airspace changes. Clinical correlation needed.",
    "Hernia":            "Low-Moderate — Diaphragmatic hernia. Surgical evaluation if symptomatic.",
    "No Finding":        "Low — No significant radiological abnormality detected.",
}

CARE_SUGGESTIONS: dict[str, list[str]] = {
    "Pneumonia": [
        "Seek immediate medical care — antibiotic therapy is typically required.",
        "Stay hydrated and rest completely.",
        "Monitor oxygen saturation; seek emergency care if below 94%.",
        "Share this report with your physician immediately.",
    ],
    "Tuberculosis": [
        "Contact a physician immediately — TB requires confirmation and isolation protocols.",
        "Avoid close contact with others until evaluated.",
        "Do not self-medicate — TB treatment requires a specific multi-drug regimen.",
        "Notify public health authorities if diagnosis is confirmed.",
    ],
    "Cardiomegaly": [
        "Schedule an urgent cardiology appointment.",
        "Avoid strenuous physical activity until evaluated.",
        "Monitor for shortness of breath, leg swelling, or chest pain.",
        "Review any existing cardiac medications with your doctor.",
    ],
    "Pneumothorax": [
        "Seek emergency care immediately if experiencing severe chest pain or difficulty breathing.",
        "Do not engage in physical activity.",
        "This finding requires urgent radiological and clinical correlation.",
    ],
    "Edema": [
        "Reduce sodium intake and monitor fluid balance.",
        "Seek cardiology or pulmonology evaluation promptly.",
        "Monitor weight daily — rapid gain may indicate worsening fluid retention.",
    ],
    "Effusion": [
        "Clinical correlation required — causes range from infection to malignancy.",
        "Follow up with your physician for further imaging (CT/ultrasound).",
        "Report any fever, chest pain, or difficulty breathing immediately.",
    ],
    "Mass": [
        "Urgent follow-up required — CT scan or PET-CT recommended.",
        "Consult a pulmonologist or thoracic surgeon.",
        "Do not delay — early evaluation significantly improves outcomes.",
        "Biopsy may be needed to determine the nature of the mass.",
    ],
    "Atelectasis": [
        "Deep breathing exercises and incentive spirometry can help.",
        "Follow up with your physician for repeat imaging.",
        "Treat any underlying infection or obstruction as directed.",
    ],
    "Emphysema": [
        "If you smoke, cessation is the most important intervention.",
        "Consult a pulmonologist for lung function testing (spirometry).",
        "Pulmonary rehabilitation programs can significantly improve quality of life.",
        "Ask your doctor about bronchodilator therapy.",
    ],
    "No Finding": [
        "No significant radiological abnormality detected in this screening.",
        "Continue regular health check-ups as recommended by your doctor.",
        "Maintain healthy lifestyle habits (non-smoking, exercise, balanced diet).",
        "This result does not exclude all conditions — consult your doctor if symptoms persist.",
    ],
    "Fibrosis": [
        "Consult a pulmonologist for lung function testing.",
        "Avoid known lung irritants (smoking, dust, chemicals).",
        "Ask about antifibrotic therapy if ILD is confirmed.",
    ],
    "Nodule": [
        "CT scan of the chest recommended for nodule characterization.",
        "Follow Fleischner Society guidelines for nodule follow-up.",
        "Consult a pulmonologist — most nodules are benign but require monitoring.",
    ],
    "Consolidation": [
        "Clinical correlation with symptoms required.",
        "Antibiotic therapy may be warranted if infection is suspected.",
        "Follow-up chest X-ray in 4–6 weeks to confirm resolution.",
    ],
    "Scoliosis": [
        "Orthopaedic evaluation recommended, especially for curvature > 20 degrees.",
        "Physical therapy and posture correction exercises can help.",
        "Bracing or surgical intervention may be needed for severe cases.",
    ],
    "Pleural_Thickening": [
        "Occupational history review — asbestos exposure is a common cause.",
        "Follow-up with a pulmonologist for monitoring.",
        "CT scan may provide better characterization of pleural changes.",
    ],
    "Infiltration": [
        "Clinical correlation required — may represent infection, aspiration, or other causes.",
        "Monitor closely for fever, cough, or respiratory distress.",
        "Follow-up imaging as directed by your physician.",
    ],
    "Hernia": [
        "Surgical consultation recommended if symptomatic.",
        "Avoid heavy lifting until evaluated.",
        "Seek emergency care if sudden severe pain occurs.",
    ],
}


# ── Dataclass ──────────────────────────────────────────────────────────────────
@dataclass
class XrayAnalysisResult:
    top_condition:      str
    top_label:          str
    confidence:         float           # 0–100
    top3:               list[dict]      # [{code, label, confidence}]
    all_probabilities:  dict[str, float]
    severity:           str
    care_suggestions:   list[str]
    is_high_risk:       bool
    low_confidence:     bool
    image_quality:      str
    quality_warnings:   list[str]
    heatmap_b64:        Optional[str]
    image_hash:         str
    tta_std:            float
    model_name:         str
    model_version:      str
    n_classes:          int


# ── Image quality ──────────────────────────────────────────────────────────────
def check_image_quality(pil_img) -> tuple[str, list[str]]:
    try:
        from PIL import ImageFilter
        gray = pil_img.convert("L")
        arr  = np.array(gray, dtype=np.float32)

        blur_score       = float(np.array(gray.filter(ImageFilter.FIND_EDGES), dtype=np.float32).var())
        mean_brightness  = float(arr.mean())
        w, h             = pil_img.size

        warnings: list[str] = []
        quality  = "good"

        if w < 224 or h < 224:
            warnings.append(f"Low resolution ({w}×{h}px). Use at least 224×224 for reliable results.")
            quality = "small"
        if blur_score < 50:
            warnings.append("Image appears blurry or low contrast. Better image quality improves accuracy.")
            quality = "blurry"
        if mean_brightness < 30:
            warnings.append("Image is very dark. Ensure X-ray is properly exposed.")
            quality = "dark"
        elif mean_brightness > 230:
            warnings.append("Image appears overexposed. This may reduce accuracy.")

        return quality, warnings
    except Exception:
        return "unknown", []


# ── Preprocessing ──────────────────────────────────────────────────────────────
_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def preprocess(pil_img, size: int = 224) -> np.ndarray:
    from PIL import Image
    img = pil_img.convert("RGB").resize((size, size), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0
    arr = (arr - _MEAN) / _STD
    arr = arr.transpose(2, 0, 1)          # HWC → CHW
    return arr[np.newaxis, ...]            # NCHW


def preprocess_tta(pil_img, size: int = 224, n: int = 5) -> list[np.ndarray]:
    from PIL import Image, ImageOps, ImageEnhance
    import random

    results = [preprocess(pil_img, size)]
    for _ in range(n - 1):
        img = pil_img.convert("RGB")
        if random.random() > 0.5:
            img = ImageOps.mirror(img)
        angle = random.uniform(-8, 8)
        img = img.rotate(angle, fillcolor=(128, 128, 128))
        factor = random.uniform(0.9, 1.1)
        img = ImageEnhance.Contrast(img).enhance(factor)
        results.append(preprocess(img, size))
    return results


# ── ONNX Engine ────────────────────────────────────────────────────────────────
class XrayEngine:
    _instance: Optional["XrayEngine"] = None

    def __init__(self):
        self._session    = None
        self._meta: dict = {}
        self._class_names: list[str] = FALLBACK_CLASSES
        self._image_size = 224
        self._is_demo    = False
        self._model_name = "demo"
        self._load()

    @classmethod
    def get(cls) -> "XrayEngine":
        if cls._instance is None:
            cls._instance = XrayEngine()
        return cls._instance

    @classmethod
    def reset(cls):
        """Force reload (call after new model export)."""
        cls._instance = None

    def _load(self):
        if META_PATH.exists():
            with open(META_PATH) as f:
                self._meta = json.load(f)
            self._class_names = self._meta.get("class_names", FALLBACK_CLASSES)
            self._image_size  = self._meta.get("image_size", 224)
            self._model_name  = self._meta.get("model_name", "unknown")
            logger.info("X-ray meta loaded: %s (%d classes)", META_PATH, len(self._class_names))

        if ONNX_PATH.exists():
            try:
                import onnxruntime as ort
                opts = ort.SessionOptions()
                opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                opts.intra_op_num_threads = 4
                self._session = ort.InferenceSession(
                    str(ONNX_PATH),
                    sess_options=opts,
                    providers=["CUDAExecutionProvider", "CPUExecutionProvider"],
                )
                logger.info("X-ray ONNX model loaded: %s", ONNX_PATH)
            except Exception as e:
                logger.warning("Failed to load X-ray ONNX: %s — demo mode", e)
                self._is_demo = True
        else:
            logger.warning(
                "X-ray ONNX not found at %s — demo mode. "
                "Train with: python ml/training/train_xray.py",
                ONNX_PATH,
            )
            self._is_demo = True

    def _run_session(self, tensor: np.ndarray) -> np.ndarray:
        name = self._session.get_inputs()[0].name
        out  = self._session.run(None, {name: tensor})[0]
        e    = np.exp(out - out.max(axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)

    def _demo_predict(self, pil_img) -> np.ndarray:
        """
        Frequency-based demo — reflects approximate chest X-ray prevalence.
        Only used when model is not yet trained.
        """
        n = len(self._class_names)
        # Uniform prior slightly tilted toward "No Finding"
        probs = np.ones(n, dtype=np.float32) / n
        no_finding_idx = next(
            (i for i, c in enumerate(self._class_names) if "no finding" in c.lower()),
            None,
        )
        if no_finding_idx is not None:
            probs[no_finding_idx] += 0.3
            probs /= probs.sum()

        arr  = np.array(pil_img.convert("L"), dtype=np.float32)
        dark = arr.mean() < 100
        if dark:
            for i, c in enumerate(self._class_names):
                if "effusion" in c.lower() or "edema" in c.lower():
                    probs[i] += 0.08
        probs /= probs.sum()
        return probs[np.newaxis, :]

    def predict(self, pil_img) -> tuple[np.ndarray, float]:
        if self._is_demo:
            return self._demo_predict(pil_img)[0], 0.0

        tensors   = preprocess_tta(pil_img, self._image_size, n=5)
        all_probs = np.vstack([self._run_session(t) for t in tensors])
        mean      = all_probs.mean(axis=0)
        top_idx   = mean.argmax()
        std       = float(all_probs[:, top_idx].std())
        return mean, std

    @property
    def class_names(self) -> list[str]:
        return self._class_names

    @property
    def version(self) -> str:
        v = self._meta.get("version", "1.0.0-demo")
        return v + ("-demo" if self._is_demo else "")


# ── Grad-CAM ───────────────────────────────────────────────────────────────────
def generate_gradcam_b64(pil_img, target_class_idx: int,
                         model_name: str, n_classes: int) -> Optional[str]:
    try:
        import torch
        import timm

        name_map = {
            "EFFICIENTNET_B4": "efficientnet_b4",
            "DENSENET121":     "densenet121",
            "RESNET50":        "resnet50",
        }
        timm_name = name_map.get(model_name, "efficientnet_b4")
        ckpt_path = CKPT_DIR / f"xray_{model_name.lower()}_best.pt"
        if not ckpt_path.exists():
            return None

        model = timm.create_model(timm_name, pretrained=False, num_classes=n_classes)
        model.load_state_dict(torch.load(ckpt_path, map_location="cpu"), strict=False)
        model.eval()

        # Find target layer
        if hasattr(model, "conv_head"):           target_layer = model.conv_head
        elif hasattr(model, "features"):          target_layer = model.features[-1]
        elif hasattr(model, "layer4"):            target_layer = model.layer4[-1]
        else:                                     return None

        gradients, activations = [], []
        fwd_h = target_layer.register_forward_hook(lambda m, i, o: activations.append(o.detach()))
        bwd_h = target_layer.register_backward_hook(lambda m, gi, go: gradients.append(go[0].detach()))

        tensor = torch.tensor(preprocess(pil_img, 224))
        output = model(tensor)
        model.zero_grad()
        output[0, target_class_idx].backward()
        fwd_h.remove(); bwd_h.remove()

        alpha = gradients[0].mean(dim=(2, 3), keepdim=True)
        cam   = torch.relu((alpha * activations[0]).sum(dim=1)).squeeze().numpy()
        cam   = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        from PIL import Image
        cam_resized = np.array(
            Image.fromarray((cam * 255).astype(np.uint8)).resize(
                pil_img.size, Image.BILINEAR
            )
        )

        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

        fig, ax = plt.subplots(figsize=(5, 5), dpi=100)
        ax.imshow(pil_img.convert("RGB"), cmap="gray")
        ax.imshow(cam_resized, alpha=0.40, cmap="jet")
        ax.axis("off")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()
    except Exception as e:
        logger.debug("Grad-CAM failed: %s", e)
        return None


# ── Main analysis function ─────────────────────────────────────────────────────
def analyze_xray_image(
    image_bytes: bytes,
    generate_heatmap: bool = True,
) -> XrayAnalysisResult:
    from PIL import Image

    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    quality, quality_warnings = check_image_quality(pil_img)
    img_hash = hashlib.sha256(image_bytes).hexdigest()

    engine = XrayEngine.get()
    probs, tta_std = engine.predict(pil_img)

    class_names = engine.class_names
    top_idx     = int(probs.argmax())
    top_code    = class_names[top_idx]
    top_conf    = float(probs[top_idx]) * 100.0

    low_confidence = top_conf < 50.0 or tta_std > 0.12

    # Top-3
    top3_idx = probs.argsort()[::-1][:3]
    top3 = [
        {
            "code":       class_names[i],
            "label":      class_names[i].replace("_", " "),
            "confidence": round(float(probs[i]) * 100, 1),
        }
        for i in top3_idx
    ]

    all_probs_dict = {
        class_names[i]: round(float(p) * 100, 2)
        for i, p in enumerate(probs)
    }

    heatmap = None
    if generate_heatmap and not engine._is_demo:
        heatmap = generate_gradcam_b64(
            pil_img, top_idx, engine._model_name, len(class_names)
        )

    return XrayAnalysisResult(
        top_condition     = top_code,
        top_label         = top_code.replace("_", " "),
        confidence        = round(top_conf, 1),
        top3              = top3,
        all_probabilities = all_probs_dict,
        severity          = SEVERITY_MAP.get(top_code, "Clinical correlation required."),
        care_suggestions  = CARE_SUGGESTIONS.get(top_code, [
            "Consult a radiologist or your physician for interpretation.",
        ]),
        is_high_risk      = top_code in HIGH_RISK,
        low_confidence    = low_confidence,
        image_quality     = quality,
        quality_warnings  = quality_warnings,
        heatmap_b64       = heatmap,
        image_hash        = img_hash,
        tta_std           = round(tta_std, 4),
        model_name        = engine._model_name,
        model_version     = engine.version,
        n_classes         = len(class_names),
    )
