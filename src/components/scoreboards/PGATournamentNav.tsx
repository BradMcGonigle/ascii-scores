"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import type { PGATournamentInfo } from "@/lib/api/pga";

interface PGATournamentNavProps {
  tournaments: PGATournamentInfo[];
}

/**
 * Format a date range for display (e.g., "Jan 29 - Feb 1")
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
 * Check if a tournament is currently active (happening now)
 */
function isTournamentActive(tournament: PGATournamentInfo): boolean {
  const now = new Date();
  return now >= tournament.startDate && now <= tournament.endDate;
}

/**
 * Check if a tournament is in the past
 */
function isTournamentPast(tournament: PGATournamentInfo): boolean {
  return new Date() > tournament.endDate;
}

/**
 * Find the index of the current (live) or most recent tournament
 */
function findCurrentOrMostRecentIndex(tournaments: PGATournamentInfo[]): number {
  const now = new Date();

  // First, check for an active tournament
  const activeIndex = tournaments.findIndex((t) => isTournamentActive(t));
  if (activeIndex !== -1) return activeIndex;

  // Find the most recent past tournament or next upcoming
  for (let i = tournaments.length - 1; i >= 0; i--) {
    if (tournaments[i].endDate <= now) {
      return i;
    }
  }

  // If all tournaments are in the future, return the first one
  return 0;
}

/**
 * PGA Tournament Navigation
 * Allows navigation between tournaments
 */
export function PGATournamentNav({ tournaments }: PGATournamentNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Get current tournament from search params
  const eventParam = searchParams.get("event");

  // Find current, previous, and next tournaments
  const { currentTournament, currentIndex, prevTournament, nextTournament } = useMemo(() => {
    if (tournaments.length === 0) {
      return { currentTournament: null, currentIndex: -1, prevTournament: null, nextTournament: null };
    }

    let index: number;
    if (eventParam) {
      // Find the tournament matching the param
      index = tournaments.findIndex((t) => t.id === eventParam);
      if (index === -1) {
        // Param not found, default to most recent/current
        index = findCurrentOrMostRecentIndex(tournaments);
      }
    } else {
      // No param, find the current or most recent tournament
      index = findCurrentOrMostRecentIndex(tournaments);
    }

    return {
      currentTournament: tournaments[index] ?? null,
      currentIndex: index,
      prevTournament: index > 0 ? tournaments[index - 1] : null,
      nextTournament: index < tournaments.length - 1 ? tournaments[index + 1] : null,
    };
  }, [tournaments, eventParam]);

  const navigateToTournament = useCallback(
    (eventId: string | null) => {
      startTransition(() => {
        if (!eventId) {
          router.push("/pga");
        } else {
          router.push(`/pga?event=${eventId}`);
        }
      });
    },
    [router]
  );

  const handlePrevious = useCallback(() => {
    if (prevTournament) {
      navigateToTournament(prevTournament.id);
    }
  }, [prevTournament, navigateToTournament]);

  const handleNext = useCallback(() => {
    if (nextTournament) {
      navigateToTournament(nextTournament.id);
    }
  }, [nextTournament, navigateToTournament]);

  const handleCurrent = useCallback(() => {
    navigateToTournament(null);
  }, [navigateToTournament]);

  // Find the "live" or current tournament
  const liveTournamentIndex = useMemo(
    () => tournaments.findIndex((t) => isTournamentActive(t)),
    [tournaments]
  );
  const hasLiveTournament = liveTournamentIndex !== -1;

  // Check if viewing past tournament (show "jump to current" even when no live)
  const defaultIndex = useMemo(
    () => findCurrentOrMostRecentIndex(tournaments),
    [tournaments]
  );
  const isViewingDefault = currentIndex === defaultIndex;

  if (!currentTournament) {
    return (
      <div className="font-mono text-sm text-center text-terminal-muted">
        No tournaments available
      </div>
    );
  }

  const isCurrentPast = isTournamentPast(currentTournament);
  const isCurrentLive = isTournamentActive(currentTournament);

  return (
    <div className="font-mono text-sm">
      {/* Tournament navigation controls */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={!prevTournament || isPending}
          className={`px-2 sm:px-3 py-1 border transition-colors ${
            prevTournament && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label={prevTournament ? `Go to ${prevTournament.name}` : "No previous tournament"}
          title={prevTournament?.name ?? "No previous tournament"}
        >
          <span aria-hidden="true">◄</span><span className="hidden sm:inline"> PREV</span>
        </button>

        {/* Current tournament display */}
        <div className="px-2 sm:px-4 py-1 min-w-0 sm:min-w-[280px] text-center flex-1 sm:flex-none">
          <span className="text-terminal-border">[</span>
          {isPending ? (
            <span className="mx-1 sm:mx-2 text-terminal-muted">Loading...</span>
          ) : (
            <span
              className={`mx-1 sm:mx-2 ${
                isCurrentLive
                  ? "text-terminal-green"
                  : isCurrentPast
                    ? "text-terminal-muted"
                    : "text-terminal-cyan"
              }`}
            >
              {currentTournament.name}
            </span>
          )}
          <span className="text-terminal-border">]</span>
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!nextTournament || isPending}
          className={`px-2 sm:px-3 py-1 border transition-colors ${
            nextTournament && !isPending
              ? "border-terminal-border text-terminal-fg hover:border-terminal-cyan hover:text-terminal-cyan"
              : "border-terminal-muted text-terminal-muted cursor-not-allowed"
          }`}
          aria-label={nextTournament ? `Go to ${nextTournament.name}` : "No upcoming tournament"}
          title={nextTournament?.name ?? "No upcoming tournament"}
        >
          <span className="hidden sm:inline">NEXT </span><span aria-hidden="true">►</span>
        </button>
      </div>

      {/* Date range and status */}
      <div className="flex justify-center mt-2 gap-3 sm:gap-4 text-xs">
        <span className="text-terminal-muted">
          {formatDateRange(currentTournament.startDate, currentTournament.endDate)}
        </span>
        {isCurrentLive && (
          <span className="text-terminal-green">
            <span aria-hidden="true">●</span> LIVE
          </span>
        )}
        {isCurrentPast && !isCurrentLive && (
          <span className="text-terminal-muted">FINAL</span>
        )}
        {!isCurrentPast && !isCurrentLive && (
          <span className="text-terminal-cyan">UPCOMING</span>
        )}
      </div>

      {/* Jump to current tournament */}
      {!isViewingDefault && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleCurrent}
            disabled={isPending}
            className={`px-3 py-1 text-xs border transition-colors ${
              isPending
                ? "border-terminal-muted text-terminal-muted cursor-not-allowed"
                : hasLiveTournament
                  ? "border-terminal-green text-terminal-green hover:bg-terminal-green/10"
                  : "border-terminal-cyan text-terminal-cyan hover:bg-terminal-cyan/10"
            }`}
          >
            {hasLiveTournament ? (
              <>
                <span aria-hidden="true">●</span> JUMP TO LIVE
              </>
            ) : (
              "JUMP TO CURRENT"
            )}
          </button>
        </div>
      )}

      {/* Prev/Next tournament hints - hide on mobile */}
      <div className="hidden sm:flex justify-center mt-2 gap-6 text-xs text-terminal-muted">
        {prevTournament && (
          <span>
            ◄ {prevTournament.name.length > 20 ? prevTournament.name.slice(0, 20) + "…" : prevTournament.name}
          </span>
        )}
        {nextTournament && (
          <span>
            {nextTournament.name.length > 20 ? nextTournament.name.slice(0, 20) + "…" : nextTournament.name} ►
          </span>
        )}
      </div>
    </div>
  );
}
