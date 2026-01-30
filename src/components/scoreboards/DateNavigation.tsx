"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import {
  formatDateForAPI,
  getRelativeDateLabel,
  isToday,
  parseDateFromAPI,
} from "@/lib/utils/format";

interface DateNavigationProps {
  league: string;
  datesWithGames: string[]; // Array of YYYYMMDD strings
}

/**
 * Find the previous date with games from the current date
 */
function findPrevDateWithGames(
  currentDateStr: string,
  datesWithGames: string[]
): string | null {
  // Sort dates in descending order and find the first one before current
  const sortedDates = [...datesWithGames].sort((a, b) => b.localeCompare(a));
  return sortedDates.find((d) => d < currentDateStr) ?? null;
}

/**
 * Find the next date with games from the current date
 */
function findNextDateWithGames(
  currentDateStr: string,
  datesWithGames: string[]
): string | null {
  // Sort dates in ascending order and find the first one after current
  const sortedDates = [...datesWithGames].sort((a, b) => a.localeCompare(b));
  return sortedDates.find((d) => d > currentDateStr) ?? null;
}

/**
 * Client component for navigating between dates on the scoreboard
 * Uses smart navigation to skip to dates that have games
 */
export function DateNavigation({ league, datesWithGames }: DateNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current date from search params or default to today
  const dateParam = searchParams.get("date");
  const currentDate = useMemo(() => {
    return dateParam ? parseDateFromAPI(dateParam) ?? new Date() : new Date();
  }, [dateParam]);

  const currentDateStr = formatDateForAPI(currentDate);
  const todayStr = formatDateForAPI(new Date());

  // Find prev/next dates with games
  const prevDateWithGames = useMemo(
    () => findPrevDateWithGames(currentDateStr, datesWithGames),
    [currentDateStr, datesWithGames]
  );
  const nextDateWithGames = useMemo(
    () => findNextDateWithGames(currentDateStr, datesWithGames),
    [currentDateStr, datesWithGames]
  );

  // Check if we can navigate in each direction
  const canGoPrev = prevDateWithGames !== null;
  const canGoNext = nextDateWithGames !== null;
  const isCurrentlyToday = isToday(currentDate);
  const hasGamesToday = datesWithGames.includes(todayStr);

  const navigateToDate = useCallback(
    (dateStr: string) => {
      startTransition(() => {
        if (dateStr === todayStr) {
          // Remove date param for today
          router.push(`/${league}`);
        } else {
          router.push(`/${league}?date=${dateStr}`);
        }
      });
    },
    [league, router, todayStr]
  );

  const handlePrevious = useCallback(() => {
    if (prevDateWithGames) {
      navigateToDate(prevDateWithGames);
    }
  }, [prevDateWithGames, navigateToDate]);

  const handleNext = useCallback(() => {
    if (nextDateWithGames) {
      navigateToDate(nextDateWithGames);
    }
  }, [nextDateWithGames, navigateToDate]);

  const handleToday = useCallback(() => {
    if (!isCurrentlyToday) {
      navigateToDate(todayStr);
    }
  }, [isCurrentlyToday, navigateToDate, todayStr]);

  // Get label for prev/next buttons showing the target date
  const prevLabel = prevDateWithGames
    ? getRelativeDateLabel(parseDateFromAPI(prevDateWithGames)!)
    : null;
  const nextLabel = nextDateWithGames
    ? getRelativeDateLabel(parseDateFromAPI(nextDateWithGames)!)
    : null;

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
          aria-label={prevLabel ? `Go to ${prevLabel}` : "No previous games"}
          title={prevLabel ?? "No previous games"}
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
          aria-label={nextLabel ? `Go to ${nextLabel}` : "No upcoming games"}
          title={nextLabel ?? "No upcoming games"}
        >
          NEXT <span aria-hidden="true">►</span>
        </button>
      </div>

      {/* Today button (only show if not on today and there are games today) */}
      {!isCurrentlyToday && hasGamesToday && (
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

      {/* Show hint about next game when no games today */}
      {isCurrentlyToday && !datesWithGames.includes(currentDateStr) && nextDateWithGames && (
        <div className="flex justify-center mt-2">
          <span className="text-terminal-muted text-xs">
            No games today. Next games:{" "}
            <button
              onClick={() => navigateToDate(nextDateWithGames)}
              disabled={isPending}
              className="text-terminal-cyan hover:underline"
            >
              {getRelativeDateLabel(parseDateFromAPI(nextDateWithGames)!)}
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
