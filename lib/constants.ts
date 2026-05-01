export const BOUNCE_THRESHOLDS = {
  healthy: 0.02,
  warning: 0.05,
} as const;

export function getBounceStatus(rate: number): "healthy" | "warning" | "critical" {
  if (rate < BOUNCE_THRESHOLDS.healthy) return "healthy";
  if (rate < BOUNCE_THRESHOLDS.warning) return "warning";
  return "critical";
}

export const BOUNCE_STATUS_COLORS = {
  healthy: "text-green-600 bg-green-50",
  warning: "text-yellow-600 bg-yellow-50",
  critical: "text-red-600 bg-red-50",
} as const;

export const BOUNCE_BADGE_COLORS = {
  healthy: "bg-green-100 text-green-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
} as const;

export const CHART_COLORS = {
  sent: "#6366f1",
  replies: "#3b82f6",
  positiveReplies: "#10b981",
  bounces: "#f59e0b",
} as const;

export const DEFAULT_DATE_RANGE_DAYS = 30;

export const EMAILBISON_BASE_URL =
  process.env.EMAILBISON_BASE_URL ?? "https://api.emailbison.com";
