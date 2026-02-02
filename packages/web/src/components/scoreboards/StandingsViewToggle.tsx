"use client";

import { useState, useCallback, useTransition } from "react";
import type { LeagueStandings, StandingsGroupLevel, League } from "@/lib/types";
import { LeagueStandingsDisplay } from "./LeagueStandings";

/**
 * Leagues known to have divisions within conferences
 */
const DIVISION_LEAGUES: string[] = ["nhl", "nfl", "nba", "mlb"];

interface StandingsViewToggleProps {
  standings: LeagueStandings;
}

/**
 * Client wrapper for standings with division/conference toggle
 */
export function StandingsViewToggle({ standings }: StandingsViewToggleProps) {
  const league = standings.league as Exclude<League, "f1" | "pga">;

  // Check if we have both division and conference level data
  const divisionGroups = standings.groups.filter((g) => g.level === "division");
  const conferenceGroups = standings.groups.filter((g) => g.level === "conference");

  // Show toggle if this is a known division league and we have both types of data
  const showToggle = DIVISION_LEAGUES.includes(league) && divisionGroups.length > 0 && conferenceGroups.length > 0;

  // Default to division view for leagues with divisions, conference for others
  const [viewMode, setViewMode] = useState<StandingsGroupLevel>(
    showToggle ? "division" : "conference"
  );
  const [isPending, startTransition] = useTransition();

  const handleViewModeChange = useCallback((mode: StandingsGroupLevel) => {
    startTransition(() => {
      setViewMode(mode);
    });
  }, []);

  // Filter groups based on view mode
  const filteredGroups = viewMode === "division" ? divisionGroups : conferenceGroups;

  // Create filtered standings object - fall back to all groups if filtering returns empty
  // This handles backwards compatibility with cached data that doesn't have level property
  const filteredStandings: LeagueStandings = {
    ...standings,
    groups: filteredGroups.length > 0 ? filteredGroups : standings.groups,
  };

  return (
    <div className="font-mono">
      {/* View toggle - only show for leagues with divisions */}
      {showToggle && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="text-terminal-muted text-sm">Group by:</span>

          <div className="flex gap-1">
            <button
              onClick={() => handleViewModeChange("division")}
              className={`px-4 py-1.5 text-sm font-medium border transition-colors ${
                viewMode === "division"
                  ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                  : "border-terminal-border text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
              }`}
              aria-pressed={viewMode === "division"}
            >
              Division
            </button>

            <button
              onClick={() => handleViewModeChange("conference")}
              className={`px-4 py-1.5 text-sm font-medium border transition-colors ${
                viewMode === "conference"
                  ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                  : "border-terminal-border text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
              }`}
              aria-pressed={viewMode === "conference"}
            >
              Conference
            </button>
          </div>
        </div>
      )}

      {/* Standings display */}
      <div className={isPending ? "opacity-70 transition-opacity" : ""}>
        <LeagueStandingsDisplay standings={filteredStandings} />
      </div>
    </div>
  );
}
