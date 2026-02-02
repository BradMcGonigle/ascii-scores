"use client";

import { useState, useCallback, useTransition } from "react";
import type { GolfLeaderboard } from "@/lib/types";
import { GolfLeaderboardTable } from "./GolfLeaderboard";

interface GolfLeaderboardClientProps {
  leaderboard: GolfLeaderboard;
}

/**
 * Client wrapper for golf leaderboard with round tabs
 */
export function GolfLeaderboardClient({ leaderboard }: GolfLeaderboardClientProps) {
  const { tournament } = leaderboard;
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  // Determine available rounds and current round
  const currentRound = tournament?.currentRound ?? 1;
  const totalRounds = tournament?.totalRounds ?? 4;
  const completedRounds = tournament?.players?.[0]?.rounds?.length ?? 0;

  // When no round is selected, show the current/latest round
  const displayRound = selectedRound ?? currentRound;

  const handleRoundSelect = useCallback((round: number | null) => {
    startTransition(() => {
      setSelectedRound(round);
    });
  }, []);

  if (!tournament) {
    return (
      <div className="font-mono overflow-x-auto">
        <div className="inline-block min-w-fit text-center py-8">
          <div className="text-terminal-border" aria-hidden="true">
            ╔═══════════════════════════════════════════════╗
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-muted px-4">
              {"  "}No tournament data available{"  "}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            ╚═══════════════════════════════════════════════╝
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono">
      {/* Round tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-terminal-muted text-sm mr-2">View Round:</span>

        {/* All rounds button (shows current) */}
        <button
          onClick={() => handleRoundSelect(null)}
          className={`px-3 py-1 text-sm border transition-colors ${
            selectedRound === null
              ? "border-terminal-green text-terminal-green bg-terminal-green/10"
              : "border-terminal-border text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
          }`}
          aria-pressed={selectedRound === null}
        >
          LIVE
        </button>

        {/* Individual round buttons */}
        {Array.from({ length: totalRounds }, (_, i) => i + 1).map((round) => {
          const isCompleted = round <= completedRounds;
          const isCurrent = round === currentRound;
          const isSelected = selectedRound === round;
          const isAvailable = round <= completedRounds || isCurrent;

          return (
            <button
              key={round}
              onClick={() => handleRoundSelect(round)}
              disabled={!isAvailable}
              className={`px-3 py-1 text-sm border transition-colors ${
                isSelected
                  ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                  : isAvailable
                  ? "border-terminal-border text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
                  : "border-terminal-border/50 text-terminal-muted/50 cursor-not-allowed"
              }`}
              aria-pressed={isSelected}
              aria-label={`Round ${round}${isCurrent ? " (current)" : ""}${isCompleted ? " (completed)" : ""}`}
            >
              R{round}
              {isCurrent && !isCompleted && (
                <span className="ml-1 text-terminal-green text-xs">●</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Leaderboard table */}
      <div className={isPending ? "opacity-70 transition-opacity" : ""}>
        <GolfLeaderboardTable
          tournament={tournament}
          selectedRound={displayRound}
          isLiveView={selectedRound === null}
          lastUpdated={leaderboard.lastUpdated}
        />
      </div>
    </div>
  );
}
