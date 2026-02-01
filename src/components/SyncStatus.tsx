"use client";

import { useEffect, useState, useRef } from "react";

interface SyncStatusProps {
  lastUpdated: Date | string;
  /** Refresh interval in seconds */
  refreshInterval?: number;
  className?: string;
}

/**
 * Client component that displays the last sync time and countdown to next refresh.
 *
 * Shows the time in the user's local timezone and a countdown that resets
 * when new data is detected (lastUpdated changes).
 */
export function SyncStatus({
  lastUpdated,
  refreshInterval = 30,
  className,
}: SyncStatusProps) {
  const [formattedTime, setFormattedTime] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(refreshInterval);
  const lastUpdatedRef = useRef<number>(0);

  // Format time in user's timezone and reset countdown when lastUpdated changes
  useEffect(() => {
    const dateObj = typeof lastUpdated === "string" ? new Date(lastUpdated) : lastUpdated;
    const timestamp = dateObj.getTime();

    // Format the time
    const formatted = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
    setFormattedTime(formatted);

    // Reset countdown if this is new data
    if (timestamp !== lastUpdatedRef.current) {
      lastUpdatedRef.current = timestamp;
      setCountdown(refreshInterval);
    }
  }, [lastUpdated, refreshInterval]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        // Don't go below 0, will reset when new data arrives
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Show placeholder during SSR/hydration
  if (formattedTime === null) {
    return (
      <span className={className}>
        Last synced: --:-- -- · Next in --s
      </span>
    );
  }

  return (
    <span className={className}>
      Last synced: {formattedTime}
      <span className="text-terminal-border mx-2" aria-hidden="true">·</span>
      <span className="text-terminal-cyan">
        {countdown > 0 ? `Next in ${countdown}s` : "Refreshing..."}
      </span>
    </span>
  );
}
