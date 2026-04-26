"""
Dataset audit script — run before training to verify dataset structure.
Usage: python ml/scripts/audit_xray_dataset.py
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

DATASET_DIR = ROOT / "ml" / "datasets" / "xray"

def main():
    print("=" * 60)
    print("  MediVerse AI — Chest X-Ray Dataset Audit")
    print("=" * 60)
    print(f"\n  Looking for dataset in:\n  {DATASET_DIR}\n")

    if not DATASET_DIR.exists():
        print("  ❌ Dataset directory not found!")
        print("\n  Please create it and place your dataset:")
        print(f"    mkdir -p {DATASET_DIR}")
        print("\n  Then either:")
        print("    Option A — ImageFolder structure:")
        print("      chest_xray_17/")
        print("        Pneumonia/      (image files)")
        print("        No Finding/")
        print("        Cardiomegaly/")
        print("        ...etc")
        print("\n    Option B — CSV + images:")
        print("      chest_xray_17/")
        print("        labels.csv      (with image_path, label columns)")
        print("        images/         (image files referenced by CSV)")
        print("\n  Download from Kaggle:")
        print("    kaggle datasets download trainingdatapro/chest-xray-17-diseases")
        print("    Unzip into: ml/datasets/chest_xray_17/")
        sys.exit(1)

    # Check structure
    subdirs = [d for d in DATASET_DIR.iterdir() if d.is_dir()]
    csvs    = list(DATASET_DIR.glob("*.csv")) + list(DATASET_DIR.glob("**/*.csv"))
    imgs    = (
        list(DATASET_DIR.rglob("*.jpg"))  +
        list(DATASET_DIR.rglob("*.jpeg")) +
        list(DATASET_DIR.rglob("*.png"))
    )

    print(f"  Subdirectories : {len(subdirs)}")
    print(f"  CSV files      : {len(csvs)}")
    print(f"  Image files    : {len(imgs):,}")

    if subdirs:
        print("\n  Classes found (ImageFolder):")
        for d in sorted(subdirs):
            n = len(list(d.glob("*.[jJpP]*")))
            print(f"    {d.name:<30} {n:>6,} images")

    if csvs:
        import csv
        for csv_path in csvs[:2]:
            print(f"\n  CSV: {csv_path.name}")
            with open(csv_path, newline="", encoding="utf-8") as f:
                reader = csv.reader(f)
                headers = next(reader, [])
                print(f"    Headers: {headers}")
                rows = list(reader)
                print(f"    Rows   : {len(rows):,}")

    if not imgs:
        print("\n  ⚠️  No image files found! Please verify dataset extraction.")
        sys.exit(1)

    print("\n  ✅ Dataset looks ready for training!")
    print(f"\n  Run training with:")
    print(f"    python ml/training/train_xray.py")

if __name__ == "__main__":
    main()
