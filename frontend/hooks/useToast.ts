"use client";

import { create } from "zustand";

type ToastVariant = "default" | "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open?: boolean;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { ...toast, id, open: true }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, toast.duration ?? 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

function useToast() {
  const { add } = useToastStore();

  return {
    toast: (opts: Omit<ToastItem, "id">) => add(opts),
    success: (title: string, description?: string) =>
      add({ title, description, variant: "success" }),
    error: (title: string, description?: string) =>
      add({ title, description, variant: "error" }),
    warning: (title: string, description?: string) =>
      add({ title, description, variant: "warning" }),
    info: (title: string, description?: string) =>
      add({ title, description, variant: "info" }),
  };
}

export { useToast, useToastStore };