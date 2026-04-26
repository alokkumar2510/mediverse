/**
 * Dashboard API — data-fetching functions for all dashboard endpoints.
 * Uses the shared Axios instance (with auto-refresh interceptor).
 */
import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_reports: number;
  reports_this_month: number;
  last_module_type: string | null;
  last_confidence: number | null;
  last_scan_at: string | null;
  avg_confidence: number | null;
  health_score: number | null;
  plan: string;
}

export interface ActivityItem {
  id: string;
  module_type: string;
  title: string;
  confidence: number | null;
  status: string;
  created_at: string;
}

export interface DashboardMetrics {
  daily_reports: { date: string; count: number }[];
  by_module: Record<string, number>;
}

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: "info" | "success" | "warning" | "error" | "report";
  is_read: boolean;
  created_at: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get<DashboardSummary>("/dashboard/summary");
  return res.data;
}

export async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const res = await api.get<ActivityItem[]>("/dashboard/activity");
  return res.data;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get<DashboardMetrics>("/dashboard/metrics");
  return res.data;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await api.get<Notification[]>("/notifications");
  return res.data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
