import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn/ui style cn() helper */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format ISO date string to human-readable */
export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(new Date(iso));
}

/** Format ISO date to relative time ("3 min ago", "2 days ago") */
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "year"],
    [2592000, "month"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
  ];
  for (const [secs, label] of intervals) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${label}${n > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

/** Truncate long strings */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "…";
}

/** Format confidence percentage */
export function formatConfidence(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/** Capitalize first letter */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Format file size bytes to human readable */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/** Sleep helper for async flows */
export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Module color mapping */
export const MODULE_COLORS: Record<string, string> = {
  xray:         "text-blue-500",
  ecg:          "text-red-500",
  skin:         "text-orange-500",
  diabetes:     "text-purple-500",
  prescription: "text-green-500",
  symptoms:     "text-yellow-500",
};

export const MODULE_BG_COLORS: Record<string, string> = {
  xray:         "bg-blue-500/10",
  ecg:          "bg-red-500/10",
  skin:         "bg-orange-500/10",
  diabetes:     "bg-purple-500/10",
  prescription: "bg-green-500/10",
  symptoms:     "bg-yellow-500/10",
};