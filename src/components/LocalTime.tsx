"use client";

import { useEffect, useState } from "react";

interface LocalTimeProps {
  date: Date | string;
  className?: string;
}

/**
 * Client component that displays a time in the user's local timezone.
 *
 * On the server, it renders a placeholder to avoid hydration mismatch.
 * Once mounted on the client, it formats the time using the browser's timezone.
 */
export function LocalTime({ date, className }: LocalTimeProps) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
    setFormattedTime(formatted);
  }, [date]);

  // Show a placeholder during SSR/hydration to avoid mismatch
  if (formattedTime === null) {
    return <span className={className}>--:-- --</span>;
  }

  return <span className={className}>{formattedTime}</span>;
}
