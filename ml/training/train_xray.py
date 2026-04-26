"""
MediVerse AI — Chest X-Ray Classification Pipeline
====================================================
Dataset  : Kaggle trainingdatapro/chest-xray-17-diseases
Models   : EfficientNet-B4, DenseNet121, ResNet50
Hardware : RTX 4050 6GB (AMP + gradient checkpointing)
Output   : ml/exports/xray_best.onnx + xray_meta.json
"""
from __future__ import annotations

import json
import os
import sys
import time
import warnings
from pathlib import Path

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

try:
    import torch
except ImportError:
    torch = None

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT        = Path(__file__).resolve().parents[2]
DATASET_DIR = ROOT / "ml" / "datasets" / "xray"
EXPORT_DIR  = ROOT / "ml" / "exports"
CKPT_DIR    = ROOT / "ml" / "checkpoints"

EXPORT_DIR.mkdir(parents=True, exist_ok=True)
CKPT_DIR.mkdir(parents=True, exist_ok=True)

# ── Config ─────────────────────────────────────────────────────────────────────
CONFIG = {
    "image_size":    224,
    "batch_size":    16,        # reduced to avoid OOM on 6GB VRAM
    "epochs":        30,
    "lr":            3e-4,
    "weight_decay":  1e-4,
    "warmup_epochs": 3,
    "label_smoothing": 0.1,
    "dropout":       0.35,
    "tta_rounds":    5,
    "val_split":     0.15,
    "test_split":    0.10,
    "num_workers":   4,
    "seed":          42,
    "patience":      8,         # early stopping
    "min_delta":     1e-4,
    "grad_accum":    4,         # effective batch = 64
    "use_amp":       True,
}

# ── Disease classes (auto-detected, these are fallback) ───────────────────────
FALLBACK_CLASSES = [
    "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
    "Mass", "Nodule", "Pneumonia", "Pneumothorax",
    "Consolidation", "Edema", "Emphysema", "Fibrosis",
    "Pleural_Thickening", "Hernia", "No Finding",
    "Tuberculosis", "Scoliosis",
]

HIGH_RISK_CLASSES = {
    "Pneumonia", "Cardiomegaly", "Pneumothorax", "Tuberculosis",
    "Edema", "Effusion", "ARDS", "Mass",
}

# ── Reproducibility ────────────────────────────────────────────────────────────
def set_seed(seed: int):
    import random
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

# ── Dataset audit ──────────────────────────────────────────────────────────────
def audit_dataset(dataset_dir: Path) -> tuple[pd.DataFrame, list[str], dict]:
    """
    Auto-detect dataset structure. Supports:
      1) CSV with image_path + label columns
      2) ImageFolder structure (class subdirs)
    Returns (df, class_names, stats)
    """
    print("\n" + "=" * 65)
    print("  DATASET AUDIT — Chest X-Ray 17 Diseases")
    print("=" * 65)

    # Try CSV-based dataset first
    csv_candidates = list(dataset_dir.glob("*.csv")) + list(dataset_dir.glob("**/*.csv"))
    df = None
    class_names = None

    for csv_path in csv_candidates:
        try:
            tmp = pd.read_csv(csv_path)
            # Look for label column
            label_col = next(
                (c for c in tmp.columns if c.lower() in
                 {"label", "class", "finding", "disease", "dx", "finding labels", "type"}),
                None
            )
            img_col = next(
                (c for c in tmp.columns if c.lower() in
                 {"image", "image_path", "filename", "path", "file", "image index", "jpg"}),
                None
            )
            if label_col and img_col:
                df = tmp.rename(columns={label_col: "label", img_col: "image_path"})
                print(f"  CSV found   : {csv_path.name}")
                print(f"  Label col   : {label_col}")
                print(f"  Image col   : {img_col}")
                break
        except Exception:
            continue

    # ImageFolder fallback
    if df is None:
        subdirs = [d for d in dataset_dir.iterdir() if d.is_dir()]
        if subdirs:
            records = []
            for cls_dir in subdirs:
                for img in cls_dir.glob("*.[jJpP][pPnN][gG]*"):
                    records.append({"image_path": str(img), "label": cls_dir.name})
            if records:
                df = pd.DataFrame(records)
                print(f"  ImageFolder : {len(subdirs)} classes detected")

    if df is None or len(df) == 0:
        raise FileNotFoundError(
            f"No valid dataset found in {dataset_dir}.\n"
            "Expected either:\n"
            "  - A CSV file with image path + label columns, OR\n"
            "  - Subdirectories named after each class (ImageFolder format).\n"
            f"Please place the Kaggle dataset in: {dataset_dir}"
        )

    # Handle multi-label (pipe-separated like NIH ChestX-ray14)
    if df["label"].str.contains("|", na=False).any():
        print("  Multi-label : pipe-separated labels detected — using primary label")
        df["label"] = df["label"].str.split("|").str[0].str.strip()

    df["label"] = df["label"].str.strip()
    class_names = sorted(df["label"].unique().tolist())

    # Stats
    counts = df["label"].value_counts()
    total  = len(df)
    print(f"\n  Total samples : {total:,}")
    print(f"  Num classes   : {len(class_names)}")
    print(f"\n  Class distribution:")
    for cls, cnt in counts.items():
        bar = "#" * int(cnt / total * 40)
        print(f"    {cls:<30} {cnt:>6,}  {cnt/total*100:5.1f}%  {bar}")

    imbalance_ratio = counts.max() / counts.min()
    print(f"\n  Imbalance ratio (max/min): {imbalance_ratio:.1f}x")

    stats = {
        "total": total,
        "n_classes": len(class_names),
        "class_counts": counts.to_dict(),
        "imbalance_ratio": round(float(imbalance_ratio), 2),
    }
    return df, class_names, stats


# ── Image path resolution ──────────────────────────────────────────────────────
def resolve_image_path(raw_path: str, dataset_dir: Path) -> Path | None:
    p = Path(str(raw_path).lstrip('/\\'))
    if p.exists():
        return p
    candidate = dataset_dir / p
    if candidate.exists():
        return candidate
    candidate_files = dataset_dir / "files" / p
    if candidate_files.exists():
        return candidate_files
    # Search recursively
    name = p.name
    found = list(dataset_dir.rglob(name))
    return found[0] if found else None


# ── Augmentation ───────────────────────────────────────────────────────────────
def get_transforms(image_size: int, train: bool):
    import torchvision.transforms as T

    # X-ray specific normalization (ImageNet works well for transfer)
    normalize = T.Normalize(mean=[0.485, 0.456, 0.406],
                            std=[0.229, 0.224, 0.225])
    if train:
        return T.Compose([
            T.Grayscale(num_output_channels=3),   # X-rays are grayscale
            T.Resize((image_size + 32, image_size + 32)),
            T.RandomCrop(image_size),
            T.RandomHorizontalFlip(p=0.4),
            T.RandomRotation(degrees=10),
            T.ColorJitter(brightness=0.15, contrast=0.2),
            T.ToTensor(),
            normalize,
            T.RandomErasing(p=0.1, scale=(0.01, 0.05)),
        ])
    else:
        return T.Compose([
            T.Grayscale(num_output_channels=3),
            T.Resize((image_size, image_size)),
            T.ToTensor(),
            normalize,
        ])


# ── Dataset class ──────────────────────────────────────────────────────────────
class ChestXrayDataset(torch.utils.data.Dataset):
    def __init__(self, df: pd.DataFrame, class_names: list[str],
                 dataset_dir: Path, transform=None):
        self.df          = df.reset_index(drop=True)
        self.class_names = class_names
        self.dataset_dir = dataset_dir
        self.transform   = transform
        self.label2idx   = {c: i for i, c in enumerate(class_names)}

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        from PIL import Image
        row = self.df.iloc[idx]
        img_path = resolve_image_path(str(row["image_path"]), self.dataset_dir)

        if img_path is None or not img_path.exists():
            # Return black image on missing file
            img = Image.new("RGB", (224, 224), (0, 0, 0))
        else:
            img = Image.open(img_path).convert("RGB")

        if self.transform:
            img = self.transform(img)

        label = self.label2idx.get(str(row["label"]), 0)
        return img, label


# ── Weighted sampler for class imbalance ───────────────────────────────────────
def make_weighted_sampler(df: pd.DataFrame, class_names: list[str]):
    label2idx = {c: i for i, c in enumerate(class_names)}
    labels    = df["label"].map(label2idx).values
    counts    = np.bincount(labels, minlength=len(class_names))
    weights_per_class = 1.0 / (counts + 1e-8)
    sample_weights = weights_per_class[labels]
    return torch.utils.data.WeightedRandomSampler(
        weights=torch.FloatTensor(sample_weights),
        num_samples=len(sample_weights),
        replacement=True,
    )


# ── Model factory ──────────────────────────────────────────────────────────────
def build_model(name: str, n_classes: int, dropout: float):
    import torch.nn as nn
    import timm

    model_map = {
        "EFFICIENTNET_B4": "efficientnet_b4",
        "DENSENET121":     "densenet121",
        "RESNET50":        "resnet50",
    }
    timm_name = model_map[name]
    model = timm.create_model(
        timm_name,
        pretrained=True,
        num_classes=n_classes,
        drop_rate=dropout,
    )

    # Gradient checkpointing for memory efficiency
    if hasattr(model, "set_grad_checkpointing"):
        model.set_grad_checkpointing(True)

    return model


# ── Training utilities ─────────────────────────────────────────────────────────
def train_one_epoch(model, loader, optimizer, criterion, scaler, device, grad_accum=2):
    import torch
    import torch.nn as nn
    model.train()
    total_loss, correct, total = 0.0, 0, 0
    optimizer.zero_grad()

    for step, (imgs, labels) in enumerate(loader):
        imgs, labels = imgs.to(device), labels.to(device)

        with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
            out  = model(imgs)
            loss = criterion(out, labels) / grad_accum

        scaler.scale(loss).backward()

        if (step + 1) % grad_accum == 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()
            optimizer.zero_grad()

        total_loss += loss.item() * grad_accum
        correct    += (out.argmax(1) == labels).sum().item()
        total      += labels.size(0)

    return total_loss / max(total, 1), correct / max(total, 1)


@torch.no_grad()
def evaluate(model, loader, criterion, device):
    import torch
    model.eval()
    total_loss, correct, total = 0.0, 0, 0
    all_probs, all_labels = [], []

    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        with torch.amp.autocast("cuda", enabled=(device.type == "cuda")):
            out  = model(imgs)
            loss = criterion(out, labels)

        probs = torch.softmax(out, dim=1).cpu().numpy()
        all_probs.append(probs)
        all_labels.append(labels.cpu().numpy())

        total_loss += loss.item()
        correct    += (out.argmax(1) == labels).sum().item()
        total      += labels.size(0)

    all_probs  = np.concatenate(all_probs)
    all_labels = np.concatenate(all_labels)
    return total_loss / len(loader), correct / max(total, 1), all_probs, all_labels


def compute_metrics(probs, labels, class_names):
    from sklearn.metrics import (
        accuracy_score, precision_score, recall_score,
        f1_score, roc_auc_score, classification_report,
    )
    preds = probs.argmax(axis=1)
    n     = len(class_names)

    acc  = accuracy_score(labels, preds)
    prec = precision_score(labels, preds, average="macro", zero_division=0)
    rec  = recall_score(labels, preds, average="macro", zero_division=0)
    f1   = f1_score(labels, preds, average="macro", zero_division=0)

    # AUROC (one-vs-rest, macro)
    try:
        from sklearn.preprocessing import label_binarize
        lb = label_binarize(labels, classes=list(range(n)))
        auroc = float(roc_auc_score(lb, probs, average="macro", multi_class="ovr"))
    except Exception:
        auroc = 0.0

    return {"accuracy": acc, "precision": prec, "recall": rec, "f1": f1, "auroc": auroc}


def train_model(model, name, train_loader, val_loader, device, cfg):
    import torch
    import torch.nn as nn

    criterion = nn.CrossEntropyLoss(label_smoothing=cfg["label_smoothing"])
    optimizer = torch.optim.AdamW(
        model.parameters(), lr=cfg["lr"], weight_decay=cfg["weight_decay"]
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=cfg["epochs"], eta_min=1e-6
    )
    scaler = torch.amp.GradScaler("cuda", enabled=(device.type == "cuda"))

    best_val_f1  = 0.0
    best_ckpt    = CKPT_DIR / f"xray_{name.lower()}_best.pt"
    patience_cnt = 0

    for epoch in range(1, cfg["epochs"] + 1):
        t0 = time.time()
        tr_loss, tr_acc = train_one_epoch(
            model, train_loader, optimizer, criterion, scaler, device, cfg["grad_accum"]
        )
        val_loss, val_acc, val_probs, val_labels = evaluate(
            model, val_loader, criterion, device
        )
        metrics = compute_metrics(val_probs, val_labels, [])
        scheduler.step()

        elapsed = time.time() - t0
        print(
            f"  Ep {epoch:03d}/{cfg['epochs']} | "
            f"loss {tr_loss:.4f}/{val_loss:.4f} | "
            f"acc {tr_acc:.3f}/{val_acc:.3f} | "
            f"F1 {metrics['f1']:.3f} | "
            f"AUROC {metrics['auroc']:.3f} | "
            f"{elapsed:.0f}s"
        )

        if metrics["f1"] > best_val_f1 + cfg["min_delta"]:
            best_val_f1 = metrics["f1"]
            patience_cnt = 0
            torch.save(model.state_dict(), best_ckpt)
            print(f"    ✔ Saved checkpoint (F1={best_val_f1:.4f})")
        else:
            patience_cnt += 1
            if patience_cnt >= cfg["patience"]:
                print(f"  Early stopping at epoch {epoch}")
                break

    # Restore best
    model.load_state_dict(torch.load(best_ckpt, map_location=device))
    return model, best_val_f1


# ── ONNX Export ────────────────────────────────────────────────────────────────
def export_onnx(model, image_size: int, export_path: Path, model_name: str):
    import torch
    model.eval()
    dummy = torch.randn(1, 3, image_size, image_size).to(next(model.parameters()).device)
    torch.onnx.export(
        model, dummy, str(export_path),
        input_names=["image"], output_names=["logits"],
        dynamic_axes={"image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
        do_constant_folding=True,
    )
    import onnx
    onnx.checker.check_model(str(export_path))
    size_mb = export_path.stat().st_size / 1e6
    print(f"  ONNX exported: {export_path.name}  ({size_mb:.1f} MB)")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print("=" * 65)
    print("  MediVerse AI — Chest X-Ray Classification Pipeline")
    print("  Dataset: Chest X-Ray 17 Diseases (Kaggle)")
    print("=" * 65)

    set_seed(CONFIG["seed"])

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n  Device: {device}")
    if device.type == "cuda":
        print(f"  GPU   : {torch.cuda.get_device_name(0)}")
        print(f"  VRAM  : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")

    # ── Dataset ──
    df, class_names, stats = audit_dataset(DATASET_DIR)

    from sklearn.model_selection import train_test_split

    # Stratified splits with leakage prevention (fallback to unstratified for tiny datasets)
    try:
        df_train, df_test = train_test_split(
            df, test_size=CONFIG["test_split"], stratify=df["label"], random_state=CONFIG["seed"]
        )
        df_train, df_val = train_test_split(
            df_train, test_size=CONFIG["val_split"] / (1 - CONFIG["test_split"]),
            stratify=df_train["label"], random_state=CONFIG["seed"]
        )
    except ValueError:
        print("  Warning: Dataset too small for stratified splitting. Using unstratified splits.")
        df_train, df_test = train_test_split(
            df, test_size=CONFIG["test_split"], random_state=CONFIG["seed"]
        )
        df_train, df_val = train_test_split(
            df_train, test_size=CONFIG["val_split"] / (1 - CONFIG["test_split"]),
            random_state=CONFIG["seed"]
        )
    print(f"\n  Split — train: {len(df_train):,} | val: {len(df_val):,} | test: {len(df_test):,}")

    # ── DataLoaders ──
    train_ds = ChestXrayDataset(df_train, class_names, DATASET_DIR,
                                get_transforms(CONFIG["image_size"], train=True))
    val_ds   = ChestXrayDataset(df_val,   class_names, DATASET_DIR,
                                get_transforms(CONFIG["image_size"], train=False))
    test_ds  = ChestXrayDataset(df_test,  class_names, DATASET_DIR,
                                get_transforms(CONFIG["image_size"], train=False))

    sampler = make_weighted_sampler(df_train, class_names)

    nw = CONFIG["num_workers"] if device.type == "cuda" else 0
    train_loader = torch.utils.data.DataLoader(
        train_ds, batch_size=CONFIG["batch_size"], sampler=sampler,
        num_workers=nw, pin_memory=(device.type == "cuda"),
        persistent_workers=(device.type == "cuda" and nw > 0),
    )
    val_loader = torch.utils.data.DataLoader(
        val_ds, batch_size=CONFIG["batch_size"] * 2,
        num_workers=nw, pin_memory=(device.type == "cuda"),
    )
    test_loader = torch.utils.data.DataLoader(
        test_ds, batch_size=CONFIG["batch_size"] * 2,
        num_workers=nw, pin_memory=(device.type == "cuda"),
    )

    # ── Train all models ──
    model_names   = ["EFFICIENTNET_B4", "DENSENET121", "RESNET50"]
    best_model    = None
    best_f1       = 0.0
    best_name     = ""
    all_metrics   = {}

    for name in model_names:
        print(f"\n{'=' * 65}")
        print(f"  Training {name}")
        print("=" * 65)

        import torch.nn as nn
        model = build_model(name, len(class_names), CONFIG["dropout"]).to(device)
        params = sum(p.numel() for p in model.parameters()) / 1e6
        print(f"  Parameters: {params:.1f}M")

        model, val_f1 = train_model(
            model, name, train_loader, val_loader, device, CONFIG
        )

        # Test set evaluation
        import torch.nn as nn
        criterion = nn.CrossEntropyLoss()
        _, _, test_probs, test_labels = evaluate(model, test_loader, criterion, device)
        m = compute_metrics(test_probs, test_labels, class_names)
        all_metrics[name] = m

        print(f"\n  Test Metrics — {name}")
        for k, v in m.items():
            print(f"    {k:<12}: {v:.4f}")

        if val_f1 > best_f1:
            best_f1    = val_f1
            best_model = model
            best_name  = name
            best_probs = test_probs
            best_labels = test_labels

        del model
        if device.type == "cuda":
            torch.cuda.empty_cache()

    # ── Model comparison ──
    print(f"\n{'=' * 65}")
    print("  MODEL COMPARISON")
    print("=" * 65)
    print(f"  {'Model':<20} {'Acc':>7} {'Prec':>7} {'Rec':>7} {'F1':>7} {'AUROC':>7}")
    print("  " + "-" * 55)
    for name, m in all_metrics.items():
        mark = " ★" if name == best_name else ""
        print(
            f"  {name:<20} "
            f"{m['accuracy']:>7.4f} {m['precision']:>7.4f} "
            f"{m['recall']:>7.4f} {m['f1']:>7.4f} {m['auroc']:>7.4f}{mark}"
        )
    print(f"\n  Winner: {best_name} (Val F1={best_f1:.4f})")

    # ── Export best model ──
    print(f"\n  Exporting {best_name} to ONNX...")
    onnx_path = EXPORT_DIR / "xray_best.onnx"
    export_onnx(best_model, CONFIG["image_size"], onnx_path, best_name)

    # ── Save metadata ──
    meta = {
        "version":       "1.0.0",
        "model_name":    best_name,
        "dataset":       "Chest X-Ray 17 Diseases (trainingdatapro/chest-xray-17-diseases)",
        "class_names":   class_names,
        "n_classes":     len(class_names),
        "image_size":    CONFIG["image_size"],
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "high_risk":     list(HIGH_RISK_CLASSES & set(class_names)),
        "metrics":       {best_name: all_metrics[best_name]},
        "all_metrics":   all_metrics,
        "dataset_stats": stats,
        "trained_at":    time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    meta_path = EXPORT_DIR / "xray_meta.json"
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"  Metadata saved: {meta_path.name}")

    print(f"\n{'=' * 65}")
    print("  TRAINING COMPLETE")
    print(f"  Model  : {best_name}")
    print(f"  ONNX   : {onnx_path}")
    print(f"  Classes: {len(class_names)}")
    print(f"  Best F1: {best_f1:.4f}")
    print("=" * 65)


if __name__ == "__main__":
    if torch is None:
        sys.exit("PyTorch not installed. Run: pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124")
    main()
