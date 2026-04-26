"""
MediVerse AI — Skin Analysis Inference Engine
==============================================
Production ONNX Runtime inference with:
  - Image quality detection (blur, darkness, coverage)
  - Grad-CAM heatmap generation (via hooks on PyTorch fallback)
  - Test-Time Augmentation (TTA) for uncertainty estimation
  - Per-class confidence with high-risk flagging
  - Duplicate image hash detection
"""
from __future__ import annotations

import hashlib
import io
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import numpy as np

logger = logging.getLogger("mediverse.skin")

# ── Paths ─────────────────────────────────────────────────────────────────────
ROOT      = Path(__file__).resolve().parents[3]   # e:\Mediverse\
META_PATH = ROOT / "ml" / "exports" / "skin_meta.json"
ONNX_PATH = ROOT / "ml" / "exports" / "skin_efficientnet.onnx"

# ── Class config (fallback if meta not found) ─────────────────────────────────
CLASS_NAMES = ["akiec", "bcc", "bkl", "df", "mel", "nv", "vasc"]
CLASS_LABELS = {
    "akiec": "Actinic Keratoses",
    "bcc":   "Basal Cell Carcinoma",
    "bkl":   "Benign Keratosis",
    "df":    "Dermatofibroma",
    "mel":   "Melanoma",
    "nv":    "Melanocytic Nevi",
    "vasc":  "Vascular Lesion",
}
HIGH_RISK = {"mel", "bcc", "akiec"}

# Severity map: clinical urgency level per class
SEVERITY_MAP = {
    "mel":   "High — Potentially malignant. Dermatologist review urgent.",
    "bcc":   "High — Possible basal cell carcinoma. Seek evaluation.",
    "akiec": "Moderate-High — Precancerous lesion. Consult dermatologist.",
    "bkl":   "Low — Generally benign. Monitor for changes.",
    "df":    "Low — Typically benign dermatofibroma.",
    "nv":    "Low — Common mole. Monitor for ABCDE changes.",
    "vasc":  "Low-Moderate — Vascular lesion. Usually benign.",
}

# Care suggestions per class
CARE_SUGGESTIONS = {
    "mel": [
        "Schedule an urgent appointment with a board-certified dermatologist.",
        "Do not scratch, irritate, or attempt self-treatment of the lesion.",
        "Photograph the lesion now to track any changes.",
        "Avoid sun exposure and use SPF 50+ on the area.",
        "Share this screening result with your doctor.",
    ],
    "bcc": [
        "Consult a dermatologist — basal cell carcinoma is highly treatable when caught early.",
        "Avoid prolonged UV exposure; wear protective clothing.",
        "Do not delay evaluation — early treatment has excellent outcomes.",
        "Share this screening result with your doctor.",
    ],
    "akiec": [
        "Consult a dermatologist for assessment of this precancerous lesion.",
        "Use broad-spectrum SPF 50+ sunscreen daily.",
        "Avoid tanning beds and direct midday sun.",
        "This lesion may be treated preventively if confirmed.",
    ],
    "bkl": [
        "Monitor the lesion monthly for changes in size, color, or shape.",
        "If it grows, bleeds, or changes, see a dermatologist promptly.",
        "Generally benign — most seborrheic keratoses require no treatment.",
    ],
    "df": [
        "Dermatofibromas are typically harmless. No urgent action needed.",
        "If it becomes painful, grows rapidly, or bleeds, see a dermatologist.",
    ],
    "nv": [
        "Apply the ABCDE rule: Asymmetry, Border, Color, Diameter, Evolution.",
        "Photograph monthly and note any changes.",
        "Annual skin check by a dermatologist is recommended.",
        "Protect with SPF 50+ and avoid tanning.",
    ],
    "vasc": [
        "Most vascular lesions are benign (cherry angiomas, spider veins).",
        "If new, growing, or bleeding, consult a dermatologist.",
        "Cosmetic treatment options are available if desired.",
    ],
}

# ─────────────────────────────────────────────────────────────────────────────
# 1.  DATA CLASSES
# ─────────────────────────────────────────────────────────────────────────────
@dataclass
class SkinAnalysisResult:
    condition_code:     str
    condition_label:    str
    confidence:         float           # 0–100
    all_probabilities:  dict[str, float]
    severity:           str
    care_suggestions:   list[str]
    needs_dermatologist: bool
    low_confidence:     bool
    image_quality:      str             # good | blurry | dark | small
    quality_warnings:   list[str]
    heatmap_b64:        Optional[str]   # base64 PNG (Grad-CAM)
    image_hash:         str             # sha256 of raw bytes
    tta_std:            float           # uncertainty from TTA
    model_version:      str


# ─────────────────────────────────────────────────────────────────────────────
# 2.  IMAGE QUALITY CHECK
# ─────────────────────────────────────────────────────────────────────────────
def check_image_quality(pil_img) -> tuple[str, list[str]]:
    """
    Returns (quality_label, list_of_warnings).
    Uses Laplacian variance for blur and mean pixel brightness for darkness.
    """
    try:
        import numpy as np
        from PIL import ImageFilter
        gray = pil_img.convert("L")
        arr = np.array(gray, dtype=np.float32)

        # Blur check — Laplacian variance
        laplacian = np.array(gray.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
        blur_score = float(laplacian.var())

        # Brightness check
        mean_brightness = float(arr.mean())

        # Size check
        w, h = pil_img.size

        warnings = []
        quality = "good"

        if w < 224 or h < 224:
            warnings.append(f"Image resolution is low ({w}×{h}px). Use at least 224×224 for best results.")
            quality = "small"

        if blur_score < 80:
            warnings.append("Image appears blurry. Please retake with better focus.")
            quality = "blurry"

        if mean_brightness < 40:
            warnings.append("Image is too dark. Use better lighting.")
            quality = "dark"
        elif mean_brightness > 230:
            warnings.append("Image is overexposed. Avoid direct flash on the skin.")

        return quality, warnings
    except Exception:
        return "unknown", []


# ─────────────────────────────────────────────────────────────────────────────
# 3.  PREPROCESSING
# ─────────────────────────────────────────────────────────────────────────────
# HAM10000 normalization constants
_MEAN = np.array([0.7630392, 0.5456457, 0.5700467], dtype=np.float32)
_STD  = np.array([0.1409286, 0.1526128, 0.1693038], dtype=np.float32)

def preprocess(pil_img, size: int = 224) -> np.ndarray:
    """Convert PIL image → normalized NCHW float32 numpy array."""
    from PIL import Image
    img = pil_img.convert("RGB").resize((size, size), Image.LANCZOS)
    arr = np.array(img, dtype=np.float32) / 255.0  # HWC [0,1]
    arr = (arr - _MEAN) / _STD                      # normalize
    arr = arr.transpose(2, 0, 1)                     # HWC → CHW
    return arr[np.newaxis, ...]                      # add batch dim: NCHW


def preprocess_tta(pil_img, size: int = 224, n: int = 5) -> list[np.ndarray]:
    """
    Generate N augmented versions for Test-Time Augmentation.
    Reduces prediction variance and gives uncertainty estimate.
    """
    from PIL import Image, ImageOps, ImageEnhance
    import random

    results = [preprocess(pil_img, size)]  # original always first

    for _ in range(n - 1):
        img = pil_img.convert("RGB")
        # Random flip
        if random.random() > 0.5:
            img = ImageOps.mirror(img)
        if random.random() > 0.5:
            img = ImageOps.flip(img)
        # Random rotation ±20°
        angle = random.uniform(-20, 20)
        img = img.rotate(angle, fillcolor=(200, 200, 200))
        # Slight brightness jitter
        factor = random.uniform(0.85, 1.15)
        img = ImageEnhance.Brightness(img).enhance(factor)
        results.append(preprocess(img, size))

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 4.  ONNX INFERENCE ENGINE
# ─────────────────────────────────────────────────────────────────────────────
class SkinEngine:
    """
    Singleton ONNX Runtime engine.
    Falls back to a clinical probability distribution if model not found,
    ensuring the API never crashes in development/demo mode.
    """
    _instance: Optional["SkinEngine"] = None

    def __init__(self):
        self._session = None
        self._meta: dict = {}
        self._image_size = 224
        self._is_demo = False
        self._load()

    @classmethod
    def get(cls) -> "SkinEngine":
        if cls._instance is None:
            cls._instance = SkinEngine()
        return cls._instance

    def _load(self):
        # Load metadata
        if META_PATH.exists():
            with open(META_PATH) as f:
                self._meta = json.load(f)
            self._image_size = self._meta.get("image_size", 224)
            logger.info("Skin meta loaded: %s", META_PATH)

        # Load ONNX model
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
                logger.info("Skin ONNX model loaded: %s", ONNX_PATH)
            except Exception as e:
                logger.warning("Failed to load ONNX model: %s — using demo mode", e)
                self._is_demo = True
        else:
            logger.warning(
                "Skin ONNX model not found at %s — running in demo mode. "
                "Train the model with: python ml/training/train_skin.py",
                ONNX_PATH,
            )
            self._is_demo = True

    def _run_session(self, tensor: np.ndarray) -> np.ndarray:
        """Run ONNX inference and return probabilities."""
        input_name = self._session.get_inputs()[0].name
        outputs = self._session.run(None, {input_name: tensor})
        logits = outputs[0]  # (batch, n_classes)
        # Softmax
        e = np.exp(logits - logits.max(axis=1, keepdims=True))
        return e / e.sum(axis=1, keepdims=True)

    def _demo_predict(self, pil_img) -> np.ndarray:
        """
        Clinical frequency-based demo distribution.
        Reflects real-world ISIC prevalence (nv most common, vasc rarest).
        Used ONLY when model not trained yet.
        """
        # Simulate by image brightness/color variance
        import numpy as np
        arr = np.array(pil_img.convert("RGB"), dtype=np.float32)
        redness = arr[:, :, 0].mean() / 255.0
        darkness = 1.0 - arr.mean() / 255.0

        # Base priors from HAM10000 class distribution
        probs = np.array([0.033, 0.051, 0.110, 0.011, 0.112, 0.669, 0.014])

        # Slight tilt based on image features (not random — deterministic)
        if redness > 0.55:   probs[1] += 0.08   # bcc
        if redness > 0.65:   probs[4] += 0.10   # mel
        if darkness > 0.55:  probs[3] += 0.05   # df

        probs = np.abs(probs)
        probs /= probs.sum()
        return probs[np.newaxis, :]

    def predict(self, pil_img) -> tuple[np.ndarray, float]:
        """
        Run TTA inference. Returns (mean_probs, std_max).
        std_max is the std of the top-class probability across TTA rounds —
        used as uncertainty estimate.
        """
        if self._is_demo:
            probs = self._demo_predict(pil_img)
            return probs[0], 0.0

        tensors = preprocess_tta(pil_img, self._image_size, n=5)
        all_probs = np.vstack([self._run_session(t) for t in tensors])
        mean_probs = all_probs.mean(axis=0)
        std_max = float(all_probs[:, all_probs.mean(axis=0).argmax()].std())
        return mean_probs, std_max


# ─────────────────────────────────────────────────────────────────────────────
# 5.  GRAD-CAM (lightweight, hook-based)
# ─────────────────────────────────────────────────────────────────────────────
def generate_gradcam_b64(pil_img, target_class_idx: int) -> Optional[str]:
    """
    Generate Grad-CAM heatmap overlay.
    Only runs if torch + timm are installed (training environment).
    Returns base64-encoded PNG or None.
    """
    try:
        import torch
        import timm
        import base64
        from PIL import Image
        import numpy as np

        # Load model (CPU)
        model = timm.create_model("efficientnet_b3", pretrained=False, num_classes=7)
        ckpt = CKPT_DIR = ROOT / "ml" / "checkpoints" / "skin_efficientnet_b3_best.pt"
        if not ckpt.exists():
            return None
        model.load_state_dict(torch.load(ckpt, map_location="cpu"), strict=False)
        model.eval()

        # Hook on the last conv layer
        gradients, activations = [], []
        target_layer = model.conv_head

        def fwd_hook(m, inp, out):
            activations.append(out.detach())

        def bwd_hook(m, gin, gout):
            gradients.append(gout[0].detach())

        fwd_h = target_layer.register_forward_hook(fwd_hook)
        bwd_h = target_layer.register_backward_hook(bwd_hook)

        tensor = torch.tensor(preprocess(pil_img, 224))
        output = model(tensor)
        model.zero_grad()
        output[0, target_class_idx].backward()

        fwd_h.remove()
        bwd_h.remove()

        # Compute weighted activation map
        alpha = gradients[0].mean(dim=(2, 3), keepdim=True)
        cam = torch.relu((alpha * activations[0]).sum(dim=1)).squeeze()
        cam = cam.numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        # Overlay on original
        cam_resized = np.array(
            Image.fromarray((cam * 255).astype(np.uint8)).resize(
                pil_img.size, Image.BILINEAR
            )
        )
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import matplotlib.cm as cm

        fig, ax = plt.subplots(1, 1, figsize=(4, 4), dpi=100)
        ax.imshow(pil_img.convert("RGB"))
        ax.imshow(cam_resized, alpha=0.45, cmap="jet")
        ax.axis("off")
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.read()).decode()

    except Exception as e:
        logger.debug("Grad-CAM failed (non-critical): %s", e)
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 6.  MAIN ANALYSIS FUNCTION
# ─────────────────────────────────────────────────────────────────────────────
def analyze_skin_image(
    image_bytes: bytes,
    generate_heatmap: bool = True,
) -> SkinAnalysisResult:
    """
    Full pipeline:
      1. Decode image
      2. Quality check
      3. Hash (duplicate detection)
      4. TTA inference
      5. Grad-CAM (optional)
      6. Build rich result
    """
    from PIL import Image

    # Decode
    pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Quality check
    quality, quality_warnings = check_image_quality(pil_img)

    # Hash
    img_hash = hashlib.sha256(image_bytes).hexdigest()

    # Inference
    engine = SkinEngine.get()
    probs, tta_std = engine.predict(pil_img)

    # Results
    top_idx = int(probs.argmax())
    top_code = CLASS_NAMES[top_idx]
    top_conf = float(probs[top_idx]) * 100.0

    confidence_cfg = {
        "high": 80.0,
        "medium": 55.0,
    }
    low_confidence = (top_conf < confidence_cfg["medium"]) or (tta_std > 0.12)

    all_probs_dict = {
        CLASS_NAMES[i]: round(float(p) * 100, 2)
        for i, p in enumerate(probs)
    }

    # Grad-CAM
    heatmap = None
    if generate_heatmap:
        heatmap = generate_gradcam_b64(pil_img, top_idx)

    meta = engine._meta
    version = meta.get("version", "1.0.0-demo") + ("-demo" if engine._is_demo else "")

    return SkinAnalysisResult(
        condition_code     = top_code,
        condition_label    = CLASS_LABELS.get(top_code, top_code),
        confidence         = round(top_conf, 1),
        all_probabilities  = all_probs_dict,
        severity           = SEVERITY_MAP.get(top_code, "Unknown"),
        care_suggestions   = CARE_SUGGESTIONS.get(top_code, []),
        needs_dermatologist= (top_code in HIGH_RISK) or low_confidence,
        low_confidence     = low_confidence,
        image_quality      = quality,
        quality_warnings   = quality_warnings,
        heatmap_b64        = heatmap,
        image_hash         = img_hash,
        tta_std            = round(tta_std, 4),
        model_version      = version,
    )
