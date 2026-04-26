import { create } from "zustand";
import type { Report } from "@/types/reports";

interface ReportState {
  reports: Report[];
  activeReport: Report | null;
  isLoading: boolean;
  total: number;
  page: number;

  setReports: (reports: Report[], total: number) => void;
  appendReports: (reports: Report[]) => void;
  setActiveReport: (report: Report | null) => void;
  removeReport: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setPage: (page: number) => void;
  reset: () => void;
}

export const useReportStore = create<ReportState>()((set) => ({
  reports: [],
  activeReport: null,
  isLoading: false,
  total: 0,
  page: 1,

  setReports: (reports, total) => set({ reports, total }),
  appendReports: (reports) =>
    set((s) => ({ reports: [...s.reports, ...reports] })),
  setActiveReport: (report) => set({ activeReport: report }),
  removeReport: (id) =>
    set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
  setPage: (page) => set({ page }),
  reset: () => set({ reports: [], activeReport: null, isLoading: false, total: 0, page: 1 }),
}));