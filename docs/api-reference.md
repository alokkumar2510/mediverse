# MediVerse API Reference

Auto-generated from FastAPI. Start server then visit:
http://localhost:8000/api/docs

## Key Endpoints
| Method | Path                   | Auth | Description        |
|--------|------------------------|------|--------------------|
| POST   | /api/auth/register     | No   | Register user      |
| POST   | /api/auth/login        | No   | Login (JWT pair)   |
| GET    | /api/auth/me           | Yes  | Current user       |
| POST   | /api/xray/analyze      | Yes  | X-ray analysis     |
| POST   | /api/ecg/analyze       | Yes  | ECG analysis       |
| POST   | /api/skin/analyze      | Yes  | Skin analysis      |
| POST   | /api/diabetes/predict  | Yes  | Diabetes risk      |
| POST   | /api/ocr/prescription  | Yes  | OCR extraction     |
| POST   | /api/symptom/check     | Yes  | Symptom checker    |
| GET    | /api/reports           | Yes  | List reports       |