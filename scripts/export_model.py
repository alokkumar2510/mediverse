"""Export PyTorch checkpoint to ONNX format."""
import argparse, pathlib

parser = argparse.ArgumentParser()
parser.add_argument("--module",     required=True, choices=["xray","ecg","skin","diabetes","symptom"])
parser.add_argument("--checkpoint", required=True)
parser.add_argument("--output",     required=True)
args = parser.parse_args()

out = pathlib.Path(args.output)
out.parent.mkdir(parents=True, exist_ok=True)
print(f"[TODO] Export {args.module}: {args.checkpoint} -> {args.output}")