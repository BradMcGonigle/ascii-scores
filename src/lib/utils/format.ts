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

/**
 * Format a date as YYYYMMDD for ESPN API
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

/**
 * Parse a YYYYMMDD string back to a Date
 */
export function parseDateFromAPI(dateStr: string): Date | null {
  if (!/^\d{8}$/.test(dateStr)) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  const month = parseInt(dateStr.slice(4, 6), 10) - 1;
  const day = parseInt(dateStr.slice(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Get a date offset by a number of days
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are the same calendar day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if a date is in the past (before today)
 * Used to determine caching strategy - past dates can be cached indefinitely
 */
export function isDateInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

/**
 * Get a relative date label (Today, Yesterday, Tomorrow, or formatted date)
 */
export function getRelativeDateLabel(date: Date): string {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";
  if (isSameDay(date, tomorrow)) return "Tomorrow";

  return formatDate(date);
}
