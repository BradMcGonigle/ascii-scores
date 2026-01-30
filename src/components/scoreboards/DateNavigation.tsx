"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import {
  addDays,
  formatDateForAPI,
  getRelativeDateLabel,
  isToday,
  parseDateFromAPI,
} from "@/lib/utils/format";

const MAX_DAYS_PAST = 5;
const MAX_DAYS_FUTURE = 5;

interface DateNavigationProps {
  league: string;
}

/**
 * Client component for navigating between dates on the scoreboard
 */
export function DateNavigation({ league }: DateNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current date from search params or default to today
  const dateParam = searchParams.get("date");
  const currentDate = useMemo(() => {
    return dateParam ? parseDateFromAPI(dateParam) ?? new Date() : new Date();
  }, [dateParam]);
  const today = new Date();

  // Calculate date boundaries
  const minDate = addDays(today, -MAX_DAYS_PAST);
  const maxDate = addDays(today, MAX_DAYS_FUTURE);

  // Check if we can navigate in each direction
  const canGoPrev = currentDate > minDate;
  const canGoNext = currentDate < maxDate;
  const isCurrentlyToday = isToday(currentDate);

  const navigateToDate = useCallback(
    (date: Date) => {
      startTransition(() => {
        if (isToday(date)) {
          // Remove date param for today
          router.push(`/${league}`);
        } else {
          router.push(`/${league}?date=${formatDateForAPI(date)}`);
        }
      });
    },
    [league, router]
  );

  const handlePrevious = useCallback(() => {
    if (canGoPrev) {
      navigateToDate(addDays(currentDate, -1));
    }
  }, [canGoPrev, currentDate, navigateToDate]);

  const handleNext = useCallback(() => {
    if (canGoNext) {
      navigateToDate(addDays(currentDate, 1));
    }
  }, [canGoNext, currentDate, navigateToDate]);

  const handleToday = useCallback(() => {
    if (!isCurrentlyToday) {
      navigateToDate(new Date());
    }
  }, [isCurrentlyToday, navigateToDate]);

  return (
    <div className="font-mono text-sm">
      {/* Date navigation controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrev || isPending}
          className={`px-3 py-1 border transition-colors ${
            canGoPrev && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label="Previous day"
        >
          <span aria-hidden="true">◄</span> PREV
        </button>

        {/* Current date display */}
        <div className="px-4 py-1 min-w-[160px] text-center">
          <span className="text-terminal-border">[</span>
          <span className={`mx-2 ${isPending ? "text-terminal-muted" : "text-terminal-cyan"}`}>
            {isPending ? "Loading..." : getRelativeDateLabel(currentDate)}
          </span>
          <span className="text-terminal-border">]</span>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext || isPending}
          className={`px-3 py-1 border transition-colors ${
            canGoNext && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label="Next day"
        >
          NEXT <span aria-hidden="true">►</span>
        </button>
      </div>

      {/* Today button (only show if not on today) */}
      {!isCurrentlyToday && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleToday}
            disabled={isPending}
            className={`px-3 py-1 text-xs border transition-colors ${
              isPending
                ? "border-terminal-muted text-terminal-muted cursor-not-allowed"
                : "border-terminal-green text-terminal-green hover:bg-terminal-green/10"
            }`}
          >
            <span aria-hidden="true">●</span> JUMP TO TODAY
          </button>
        </div>
      )}
    </div>
  );
}
