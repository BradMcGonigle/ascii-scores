"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import type { F1RaceWeekend } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

interface F1RaceWeekendNavProps {
  weekends: F1RaceWeekend[];
}

/**
 * Format a date range for display (e.g., "Mar 14-16")
 */
function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * Check if a race weekend is currently active (happening now)
 */
function isWeekendActive(weekend: F1RaceWeekend): boolean {
  const now = new Date();
  return now >= weekend.startDate && now <= weekend.endDate;
}

/**
 * Check if a race weekend is in the past
 */
function isWeekendPast(weekend: F1RaceWeekend): boolean {
  return new Date() > weekend.endDate;
}

/**
 * F1 Race Weekend Navigation
 * Allows navigation between race weekends rather than individual dates
 */
export function F1RaceWeekendNav({ weekends }: F1RaceWeekendNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current weekend from search params
  const weekendParam = searchParams.get("weekend");

  // Find current, previous, and next weekends
  const { currentWeekend, currentIndex, prevWeekend, nextWeekend } = useMemo(() => {
    if (weekends.length === 0) {
      return { currentWeekend: null, currentIndex: -1, prevWeekend: null, nextWeekend: null };
    }

    let index: number;
    if (weekendParam) {
      // Find the weekend matching the param
      index = weekends.findIndex((w) => w.id === weekendParam);
      if (index === -1) {
        // Param not found, default to most recent/current
        index = findCurrentOrMostRecentIndex(weekends);
      }
    } else {
      // No param, find the current or most recent weekend
      index = findCurrentOrMostRecentIndex(weekends);
    }

    return {
      currentWeekend: weekends[index] ?? null,
      currentIndex: index,
      prevWeekend: index > 0 ? weekends[index - 1] : null,
      nextWeekend: index < weekends.length - 1 ? weekends[index + 1] : null,
    };
  }, [weekends, weekendParam]);

  const navigateToWeekend = useCallback(
    (weekendId: string | null) => {
      startTransition(() => {
        if (!weekendId) {
          router.push("/f1");
        } else {
          router.push(`/f1?weekend=${weekendId}`);
        }
      });
    },
    [router]
  );

  const handlePrevious = useCallback(() => {
    if (prevWeekend) {
      navigateToWeekend(prevWeekend.id);
    }
  }, [prevWeekend, navigateToWeekend]);

  const handleNext = useCallback(() => {
    if (nextWeekend) {
      navigateToWeekend(nextWeekend.id);
    }
  }, [nextWeekend, navigateToWeekend]);

  const handleCurrent = useCallback(() => {
    navigateToWeekend(null);
  }, [navigateToWeekend]);

  // Find the "live" or current weekend
  const liveWeekendIndex = useMemo(
    () => weekends.findIndex((w) => isWeekendActive(w)),
    [weekends]
  );
  const hasLiveWeekend = liveWeekendIndex !== -1;
  const isViewingLive = hasLiveWeekend && currentIndex === liveWeekendIndex;

  if (!currentWeekend) {
    return (
      <div className="font-mono text-sm text-center text-terminal-muted">
        No race weekends available
      </div>
    );
  }

  const isCurrentPast = isWeekendPast(currentWeekend);
  const isCurrentLive = isWeekendActive(currentWeekend);

  return (
    <div className="font-mono text-sm">
      {/* Race weekend navigation controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={!prevWeekend || isPending}
          className={`px-3 py-1 border transition-colors ${
            prevWeekend && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label={prevWeekend ? `Go to ${prevWeekend.name}` : "No previous race"}
          title={prevWeekend?.name ?? "No previous race"}
        >
          <span aria-hidden="true">◄</span> PREV
        </button>

        {/* Current race weekend display */}
        <div className="px-4 py-1 min-w-[280px] text-center">
          <span className="text-terminal-border">[</span>
          {isPending ? (
            <span className="mx-2 text-terminal-muted">Loading...</span>
          ) : (
            <>
              <span
                className={`mx-2 ${
                  isCurrentLive
                    ? "text-terminal-green"
                    : isCurrentPast
                    ? "text-terminal-muted"
                    : "text-terminal-cyan"
                }`}
              >
                {currentWeekend.name}
              </span>
            </>
          )}
          <span className="text-terminal-border">]</span>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!nextWeekend || isPending}
          className={`px-3 py-1 border transition-colors ${
            nextWeekend && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label={nextWeekend ? `Go to ${nextWeekend.name}` : "No upcoming race"}
          title={nextWeekend?.name ?? "No upcoming race"}
        >
          NEXT <span aria-hidden="true">►</span>
        </button>
      </div>

      {/* Date range and status */}
      <div className="flex justify-center mt-2 gap-4 text-xs">
        <span className="text-terminal-muted">
          {formatDateRange(currentWeekend.startDate, currentWeekend.endDate)}
        </span>
        {isCurrentLive && (
          <span className="text-terminal-green">
            <span aria-hidden="true">●</span> LIVE
          </span>
        )}
        {isCurrentPast && (
          <span className="text-terminal-muted">COMPLETED</span>
        )}
      </div>

      {/* Jump to current/live weekend */}
      {hasLiveWeekend && !isViewingLive && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleCurrent}
            disabled={isPending}
            className={`px-3 py-1 text-xs border transition-colors ${
              isPending
                ? "border-terminal-muted text-terminal-muted cursor-not-allowed"
                : "border-terminal-green text-terminal-green hover:bg-terminal-green/10"
            }`}
          >
            <span aria-hidden="true">●</span> JUMP TO LIVE RACE
          </button>
        </div>
      )}

      {/* Prev/Next weekend hints */}
      <div className="flex justify-center mt-2 gap-6 text-xs text-terminal-muted">
        {prevWeekend && (
          <span>
            ◄ {prevWeekend.circuitName} ({formatDate(prevWeekend.startDate)})
          </span>
        )}
        {nextWeekend && (
          <span>
            {nextWeekend.circuitName} ({formatDate(nextWeekend.startDate)}) ►
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Find the index of the current (live) or most recent weekend
 */
function findCurrentOrMostRecentIndex(weekends: F1RaceWeekend[]): number {
  const now = new Date();

  // First, check for an active weekend
  const activeIndex = weekends.findIndex((w) => isWeekendActive(w));
  if (activeIndex !== -1) return activeIndex;

  // Find the most recent past weekend or next upcoming
  for (let i = weekends.length - 1; i >= 0; i--) {
    if (weekends[i].endDate <= now) {
      return i;
    }
  }

  // If all weekends are in the future, return the first one
  return 0;
}
