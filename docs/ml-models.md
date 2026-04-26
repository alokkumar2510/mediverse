# ML Model Cards

| Module   | Model              | Runtime      | Input       | Latency   | Dataset         |
|----------|--------------------|--------------|-------------|-----------|-----------------|
| X-ray    | ResNet/EfficientNet| ONNX Runtime | 224x224 JPG | <5s       | NIH ChestX-14   |
| ECG      | 1D-Conv            | ONNX Runtime | Image/signal| <3s       | PhysioNet MIT-BIH|
| Skin     | MobileNetV3        | ONNX Runtime | 224x224 JPG | <3s       | HAM10000        |
| Diabetes | XGBoost            | XGBoost      | 6 features  | <100ms    | PIMA            |
| OCR      | Tesseract          | pytesseract  | Image/PDF   | <2s       | N/A             |
| Symptom  | TF-IDF + Logistic  | scikit-learn | Text        | <500ms    | Custom NLP      |

All models follow: load() -> preprocess() -> infer() -> postprocess()