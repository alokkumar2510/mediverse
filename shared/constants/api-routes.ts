export const API = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  XRAY:     { ANALYZE: '/api/xray/analyze' },
  ECG:      { ANALYZE: '/api/ecg/analyze' },
  SKIN:     { ANALYZE: '/api/skin/analyze' },
  DIABETES: { PREDICT: '/api/diabetes/predict' },
  OCR:      { PRESCRIPTION: '/api/ocr/prescription' },
  SYMPTOM:  { CHECK: '/api/symptom/check' },
  REPORTS:  { LIST: '/api/reports', DETAIL: (id: string) => `/api/reports/${id}` },
  USER:     { PROFILE: '/api/user/profile' },
  ADMIN:    { STATS: '/api/admin/stats', USERS: '/api/admin/users', LOGS: '/api/admin/logs' },
};