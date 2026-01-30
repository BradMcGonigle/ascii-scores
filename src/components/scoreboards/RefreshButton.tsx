"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

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

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Auto-refresh on interval
  useEffect(() => {
    if (!isAutoRefresh) return;

    const timer = setInterval(handleRefresh, interval);
    return () => clearInterval(timer);
  }, [isAutoRefresh, interval, handleRefresh]);

  return (
    <div className="flex items-center gap-4 font-mono text-sm">
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="px-3 py-1 border border-terminal-border hover:bg-terminal-border/20 transition-colors disabled:opacity-50"
      >
        {isPending ? "[REFRESHING...]" : "[REFRESH]"}
      </button>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isAutoRefresh}
          onChange={(e) => setIsAutoRefresh(e.target.checked)}
          className="accent-terminal-green"
        />
        <span className="text-terminal-muted">Auto-refresh</span>
      </label>
    </div>
  );
}
