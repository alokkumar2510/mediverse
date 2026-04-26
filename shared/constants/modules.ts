export const MODULE_SLUGS = ['xray', 'ecg', 'skin', 'diabetes', 'prescription', 'symptoms'] as const;
export type ModuleSlug = typeof MODULE_SLUGS[number];
