"use client";

import { useState, useCallback } from "react";
import { apiPostForm, getApiErrorMessage } from "@/lib/api";

interface UploadState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

export function useUpload<T = unknown>(endpoint: string) {
  const [state, setState] = useState<UploadState<T>>({
    data: null,
    isLoading: false,
    error: null,
    progress: 0,
  });

  const upload = useCallback(
    async (file: File, extraFields?: Record<string, string>) => {
      setState({ data: null, isLoading: true, error: null, progress: 0 });
      try {
        const formData = new FormData();
        formData.append("file", file);
        if (extraFields) {
          Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
        }
        const result = await apiPostForm<T>(endpoint, formData);
        setState({ data: result, isLoading: false, error: null, progress: 100 });
        return result;
      } catch (err) {
        const message = getApiErrorMessage(err);
        setState({ data: null, isLoading: false, error: message, progress: 0 });
        throw err;
      }
    },
    [endpoint]
  );

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, progress: 0 });
  }, []);

  return { ...state, upload, reset };
}