#!/usr/bin/env python3
"""
ECG Dataset Download Helper for MediVerse AI
============================================
Downloads and validates PTB-XL from PhysioNet.

Usage:
    python scripts/download_ecg_data.py --dataset ptbxl --dest ./data
    python scripts/download_ecg_data.py --dataset ecg5000 --dest ./data
    python scripts/download_ecg_data.py --generate-sample --dest ./data/sample_ecg.csv
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


DATASETS = {
    "ptbxl": {
        "name": "PTB-XL",
        "url": "https://physionet.org/files/ptb-xl/1.0.3/",
        "size_gb": 2.6,
        "records": 21837,
        "description": "21,837 12-lead clinical ECG records, 10 sec at 500Hz, 5 superclasses",
        "citation": "Wagner et al. (2020) Nature Scientific Data",
        "command": "wget -r -N -c -np {url} -P {dest}/ptb-xl/",
    },
    "mitbih": {
        "name": "MIT-BIH Arrhythmia",
        "url": "https://physionet.org/files/mitdb/1.0.0/",
        "size_gb": 0.1,
        "records": 48,
        "description": "48 half-hour 2-lead ECG recordings, 360Hz, beat annotations",
        "citation": "Moody & Mark (2001) CinC",
        "command": "wget -r -N -c -np {url} -P {dest}/mitbih/",
    },
    "ecg5000": {
        "name": "ECG5000",
        "url": "http://www.timeseriesclassification.com/Downloads/ECG5000.zip",
        "size_gb": 0.05,
        "records": 5000,
        "description": "5,000 preprocessed single-lead ECG time series (140 samples each)",
        "citation": "UCR Time Series Archive",
        "command": "wget {url} -O {dest}/ECG5000.zip && unzip {dest}/ECG5000.zip -d {dest}/ecg5000/",
    },
}


def print_comparison():
    print("\n" + "="*72)
    print(" ECG DATASET COMPARISON FOR MEDIVERSE AI MVP")
    print("="*72)
    print(f"{'Dataset':<15} {'Records':>10} {'Size':>8} {'Classes':>10}  Notes")
    print("-"*72)
    rows = [
        ("PTB-XL ✅",    "21,837",  "2.6 GB", "5 super",   "CHOSEN — largest validated 12-lead"),
        ("MIT-BIH",      "48 long", "0.1 GB", "beat-lvl",  "Good for beat annotation (R-peaks)"),
        ("Chapman ECG",  "10,646",  "2.0 GB", "4 rhythm",  "Good secondary for AF detection"),
        ("ECG5000",      "5,000",   "50 MB",  "5 classes", "Quick demo dataset (preprocessed)"),
    ]
    for name, rec, sz, cls, note in rows:
        print(f"  {name:<13} {rec:>10} {sz:>8} {cls:>10}  {note}")
    print("="*72)
    print("\n✅ CHOSEN: PTB-XL v1.0.3")
    print("   Reasons:")
    print("   - Largest physician-validated 12-lead ECG dataset (open access)")
    print("   - Official train/val/test splits (stratified 10-fold)")
    print("   - 5 clinically meaningful superclasses matching MVP targets")
    print("   - Standard benchmark: enables reproducible comparison")
    print("   - Supports single-lead (Lead I) for MVP, expandable to 12-lead")
    print()


def generate_sample_ecg(dest: str, n_samples: int = 5000, fs: int = 500):
    """Generate a realistic-looking synthetic ECG CSV for testing the API."""
    import numpy as np

    t = np.linspace(0, n_samples / fs, n_samples)

    # PQRST template
    def pqrst(t_rel):
        """Single beat template."""
        p  =  0.15 * np.exp(-50 * (t_rel - 0.20)**2)
        q  = -0.10 * np.exp(-200 * (t_rel - 0.34)**2)
        r  =  1.00 * np.exp(-400 * (t_rel - 0.37)**2)
        s  = -0.25 * np.exp(-300 * (t_rel - 0.40)**2)
        t_ =  0.30 * np.exp(-50 * (t_rel - 0.55)**2)
        return p + q + r + s + t_

    hr_bpm = 72  # normal sinus rhythm
    rr_sec = 60.0 / hr_bpm
    signal = np.zeros(n_samples)

    beat_t = np.linspace(0, 1, int(rr_sec * fs))
    for i, beat_start in enumerate(np.arange(0, n_samples / fs, rr_sec)):
        start_idx = int(beat_start * fs)
        end_idx   = start_idx + len(beat_t)
        if end_idx > n_samples:
            break
        signal[start_idx:end_idx] += pqrst(beat_t)

    # Add baseline wander and noise
    signal += 0.05 * np.sin(2 * np.pi * 0.1 * t)
    signal += np.random.normal(0, 0.03, n_samples)

    out_path = Path(dest)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    np.savetxt(str(out_path), signal, fmt="%.6f")
    print(f"✅ Sample ECG saved → {out_path}")
    print(f"   Samples: {n_samples} | Sample Rate: {fs} Hz | Duration: {n_samples/fs:.1f}s")
    print(f"   Rhythm: Normal Sinus Rhythm at {hr_bpm} bpm")


def main():
    parser = argparse.ArgumentParser(description="ECG Dataset Manager for MediVerse AI")
    parser.add_argument("--list",            action="store_true", help="Compare available datasets")
    parser.add_argument("--dataset",         choices=list(DATASETS.keys()), help="Dataset to download")
    parser.add_argument("--dest",            default="./data", help="Download destination")
    parser.add_argument("--generate-sample", action="store_true", help="Generate a sample ECG CSV")
    parser.add_argument("--sample-dest",     default="./data/sample_ecg.csv")
    args = parser.parse_args()

    if args.list or (not args.dataset and not args.generate_sample):
        print_comparison()
        return

    if args.generate_sample:
        generate_sample_ecg(args.sample_dest)
        return

    ds = DATASETS[args.dataset]
    print(f"\nDataset: {ds['name']}")
    print(f"Records: {ds['records']:,}")
    print(f"Size:    ~{ds['size_gb']} GB")
    print(f"Description: {ds['description']}")
    print(f"Citation: {ds['citation']}\n")

    cmd = ds["command"].format(url=ds["url"], dest=args.dest)
    print(f"Running:\n  {cmd}\n")
    os.makedirs(args.dest, exist_ok=True)
    subprocess.run(cmd, shell=True, check=True)
    print(f"\n✅ {ds['name']} downloaded to {args.dest}")


if __name__ == "__main__":
    main()
