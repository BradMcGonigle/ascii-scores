"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition, useRef } from "react";

interface RefreshButtonProps {
  /** Refresh interval in milliseconds */
  interval?: number;
  /** Whether auto-refresh is enabled */
  autoRefresh?: boolean;
}

/**
 * Client component for refreshing server component data
 */
export function RefreshButton({
  interval = 30000,
  autoRefresh = true,
}: RefreshButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAutoRefresh, setIsAutoRefresh] = useState(autoRefresh);
  const [statusMessage, setStatusMessage] = useState("");
  const checkboxId = useRef(`auto-refresh-${Math.random().toString(36).slice(2, 9)}`).current;

  const handleRefresh = useCallback(() => {
    setStatusMessage("Refreshing scores...");
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Update status message when refresh completes
  useEffect(() => {
    if (!isPending && statusMessage === "Refreshing scores...") {
      setStatusMessage("Scores updated");
      // Clear the message after announcement
      const timer = setTimeout(() => setStatusMessage(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [isPending, statusMessage]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!isAutoRefresh) return;

    const timer = setInterval(handleRefresh, interval);
    return () => clearInterval(timer);
  }, [isAutoRefresh, interval, handleRefresh]);

  const intervalSeconds = Math.round(interval / 1000);

  return (
    <div className="flex items-center gap-4 font-mono text-sm">
      {/* Live region for status announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      <button
        onClick={handleRefresh}
        disabled={isPending}
        aria-describedby={isAutoRefresh ? "auto-refresh-status" : undefined}
        className="px-3 py-1 border border-terminal-border hover:bg-terminal-border/20 transition-colors disabled:opacity-50"
      >
        {isPending ? "[REFRESHING...]" : "[REFRESH]"}
      </button>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          checked={isAutoRefresh}
          onChange={(e) => setIsAutoRefresh(e.target.checked)}
          className="accent-terminal-green"
          aria-describedby="auto-refresh-description"
        />
        <label htmlFor={checkboxId} className="text-terminal-muted cursor-pointer">
          Auto-refresh
        </label>
        <span id="auto-refresh-description" className="sr-only">
          Automatically refresh scores every {intervalSeconds} seconds
        </span>
        {isAutoRefresh && (
          <span id="auto-refresh-status" className="sr-only">
            Auto-refresh enabled, updating every {intervalSeconds} seconds
          </span>
        )}
      </div>
    </div>
  );
}
