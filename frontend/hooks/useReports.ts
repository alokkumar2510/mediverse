"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, getApiErrorMessage } from "@/lib/api";
import { useReportStore } from "@/stores/reportStore";
import type { ReportListResponse } from "@/types/reports";

export function useReports(perPage = 10) {
  const { reports, total, page, isLoading, setReports, setLoading, setPage, reset } =
    useReportStore();
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<ReportListResponse>("/api/reports", {
          page: pageNum,
          per_page: perPage,
        });
        setReports(data.items, data.total);
        setPage(pageNum);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [perPage, setLoading, setReports, setPage]
  );

  useEffect(() => {
    fetchReports(1);
    return () => reset();
  }, [fetchReports, reset]);

  return {
    reports,
    total,
    page,
    isLoading,
    error,
    hasMore: reports.length < total,
    refetch: fetchReports,
    nextPage: () => fetchReports(page + 1),
  };
}