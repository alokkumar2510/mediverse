/**
 * Dashboard store — Zustand slice for dashboard data.
 * Keeps summary, activity, metrics and notifications in one place.
 * Components subscribe only to what they need.
 */
import { create } from "zustand";
import {
  fetchDashboardSummary,
  fetchRecentActivity,
  fetchDashboardMetrics,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type DashboardSummary,
  type ActivityItem,
  type DashboardMetrics,
  type Notification,
} from "@/lib/dashboard";

interface DashboardState {
  // Data
  summary: DashboardSummary | null;
  activity: ActivityItem[];
  metrics: DashboardMetrics | null;
  notifications: Notification[];

  // Loading flags
  loadingSummary: boolean;
  loadingActivity: boolean;
  loadingMetrics: boolean;
  loadingNotifications: boolean;

  // Derived
  unreadCount: number;

  // Actions
  loadSummary: () => Promise<void>;
  loadActivity: () => Promise<void>;
  loadMetrics: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadAll: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  summary: null,
  activity: [],
  metrics: null,
  notifications: [],

  loadingSummary: false,
  loadingActivity: false,
  loadingMetrics: false,
  loadingNotifications: false,

  get unreadCount() {
    return get().notifications.filter((n) => !n.is_read).length;
  },

  loadSummary: async () => {
    set({ loadingSummary: true });
    try {
      const data = await fetchDashboardSummary();
      set({ summary: data });
    } finally {
      set({ loadingSummary: false });
    }
  },

  loadActivity: async () => {
    set({ loadingActivity: true });
    try {
      const data = await fetchRecentActivity();
      set({ activity: data });
    } finally {
      set({ loadingActivity: false });
    }
  },

  loadMetrics: async () => {
    set({ loadingMetrics: true });
    try {
      const data = await fetchDashboardMetrics();
      set({ metrics: data });
    } finally {
      set({ loadingMetrics: false });
    }
  },

  loadNotifications: async () => {
    set({ loadingNotifications: true });
    try {
      const data = await fetchNotifications();
      set({ notifications: data });
    } finally {
      set({ loadingNotifications: false });
    }
  },

  loadAll: async () => {
    await Promise.all([
      get().loadSummary(),
      get().loadActivity(),
      get().loadMetrics(),
      get().loadNotifications(),
    ]);
  },

  markRead: async (id: string) => {
    await markNotificationRead(id);
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
  },

  markAllRead: async () => {
    await markAllNotificationsRead();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
    }));
  },
}));
