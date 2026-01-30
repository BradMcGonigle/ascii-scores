import type { GameStatus } from "@/lib/types";

/**
 * Format a date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

/**
 * Format a time for display
 */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Format a date and time for display
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get status display text
 */
export function getStatusText(status: GameStatus, detail?: string): string {
  switch (status) {
    case "live":
      return detail ?? "LIVE";
    case "final":
      return detail ?? "FINAL";
    case "scheduled":
      return detail ?? "SCHEDULED";
    case "postponed":
      return "POSTPONED";
    case "delayed":
      return "DELAYED";
  }
}

/**
 * Get CSS class for status
 */
export function getStatusClass(status: GameStatus): string {
  switch (status) {
    case "live":
      return "text-live";
    case "final":
      return "text-final";
    case "scheduled":
      return "text-scheduled";
    default:
      return "text-terminal-muted";
  }
}

/**
 * Pad a string to a fixed width
 */
export function padString(str: string, width: number, align: "left" | "right" | "center" = "left"): string {
  const strLen = str.length;
  if (strLen >= width) return str.slice(0, width);

  const padding = width - strLen;

  switch (align) {
    case "right":
      return " ".repeat(padding) + str;
    case "center": {
      const leftPad = Math.floor(padding / 2);
      const rightPad = padding - leftPad;
      return " ".repeat(leftPad) + str + " ".repeat(rightPad);
    }
    default:
      return str + " ".repeat(padding);
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + "…";
}
