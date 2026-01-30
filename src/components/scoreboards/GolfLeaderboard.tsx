import type { GolfLeaderboard, GolfTournamentStatus } from "@/lib/types";
import { padString, truncate } from "@/lib/utils/format";

interface GolfLeaderboardProps {
  leaderboard: GolfLeaderboard;
}

/**
 * Get status display text for golf tournament
 */
function getTournamentStatusText(status: GolfTournamentStatus, currentRound?: number): string {
  switch (status) {
    case "in_progress":
      return currentRound ? `ROUND ${currentRound} - IN PROGRESS` : "IN PROGRESS";
    case "completed":
      return "FINAL";
    case "scheduled":
      return "UPCOMING";
    case "canceled":
      return "CANCELED";
  }
}

/**
 * Get CSS class for tournament status
 */
function getTournamentStatusClass(status: GolfTournamentStatus): string {
  switch (status) {
    case "in_progress":
      return "text-live";
    case "completed":
      return "text-final";
    case "scheduled":
      return "text-scheduled";
    case "canceled":
      return "text-terminal-muted";
  }
}

/**
 * Get CSS class for player position (highlight top 3)
 */
function getPositionClass(position: string): string {
  const posNum = parseInt(position.replace("T", ""), 10);
  if (!isNaN(posNum) && posNum <= 3) {
    return "text-terminal-green";
  }
  return "";
}

/**
 * Get CSS class for score to par
 */
function getScoreClass(scoreToParNum: number): string {
  if (scoreToParNum < 0) return "text-terminal-green";
  if (scoreToParNum > 0) return "text-terminal-red";
  return "";
}

/**
 * Get status indicator for player
 */
function getPlayerStatusIndicator(status: string): string {
  switch (status) {
    case "cut":
      return "CUT";
    case "wd":
      return "WD";
    case "dq":
      return "DQ";
    default:
      return "";
  }
}

/**
 * Displays PGA Tour leaderboard in ASCII table format
 */
export function GolfLeaderboardDisplay({ leaderboard }: GolfLeaderboardProps) {
  const { tournament } = leaderboard;

  if (!tournament) {
    return (
      <div className="font-mono overflow-x-auto">
        <div className="inline-block min-w-fit">
          <div className="text-terminal-border" aria-hidden="true">
            +=================================================+
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span className="text-terminal-muted px-2">
              {padString("No tournament data available", 47, "center")}
            </span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            +=================================================+
          </div>
        </div>
      </div>
    );
  }

  const statusClass = getTournamentStatusClass(tournament.status);
  const statusText = getTournamentStatusText(tournament.status, tournament.currentRound);

  // Determine how many round columns to show
  const maxRounds = Math.max(...tournament.players.map((p) => p.rounds.length), tournament.totalRounds);
  const roundsToShow = Math.min(maxRounds, 4);

  // Calculate column widths
  const posWidth = 4;
  const nameWidth = 22;
  const scoreWidth = 6;
  const todayWidth = 5;
  const thruWidth = 4;
  const roundWidth = 4;

  // Build header line dynamically
  const roundHeaders = Array.from({ length: roundsToShow }, (_, i) => `R${i + 1}`);

  return (
    <div className="font-mono overflow-x-auto">
      <div className="inline-block min-w-fit">
        {/* Tournament header */}
        <div className="mb-4">
          <div className="text-terminal-border" aria-hidden="true">
            +======================================================================+
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span className="text-terminal-fg font-bold px-2">
              {padString(truncate(tournament.name, 68), 68, "center")}
            </span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span className="text-terminal-muted px-2">
              {padString(truncate(`${tournament.venue}${tournament.location ? ` - ${tournament.location}` : ""}`, 68), 68, "center")}
            </span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span className={`${statusClass} px-2`}>
              {padString(statusText, 68, "center")}
            </span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
          </div>
          <div className="text-terminal-border" aria-hidden="true">
            +======================================================================+
          </div>
        </div>

        {/* Leaderboard table */}
        <div role="table" aria-label="Golf tournament leaderboard">
          {/* Header row */}
          <div className="text-terminal-cyan" role="row">
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span role="columnheader">{padString("POS", posWidth)}</span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span role="columnheader">{padString("PLAYER", nameWidth)}</span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span role="columnheader">{padString("SCORE", scoreWidth)}</span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span role="columnheader">{padString("TODAY", todayWidth)}</span>
            <span className="text-terminal-border" aria-hidden="true">|</span>
            <span role="columnheader">{padString("THRU", thruWidth)}</span>
            {roundHeaders.map((header) => (
              <span key={header}>
                <span className="text-terminal-border" aria-hidden="true">|</span>
                <span role="columnheader">{padString(header, roundWidth)}</span>
              </span>
            ))}
            <span className="text-terminal-border" aria-hidden="true">|</span>
          </div>

          {/* Header separator */}
          <div className="text-terminal-border" aria-hidden="true">
            +{"-".repeat(posWidth)}+{"-".repeat(nameWidth)}+{"-".repeat(scoreWidth)}+{"-".repeat(todayWidth)}+{"-".repeat(thruWidth)}{roundHeaders.map(() => `+${"-".repeat(roundWidth)}`).join("")}+
          </div>

          {/* Player rows */}
          {tournament.players.length > 0 ? (
            tournament.players.slice(0, 30).map((player) => {
              const positionClass = getPositionClass(player.position);
              const scoreClass = getScoreClass(player.scoreToParNum);
              const statusIndicator = getPlayerStatusIndicator(player.status);
              const isInactive = player.status !== "active";

              const positionLabel = player.position.startsWith("T")
                ? `Tied for position ${player.position.slice(1)}`
                : `Position ${player.position}`;

              return (
                <div
                  key={player.id}
                  role="row"
                  className={isInactive ? "text-terminal-muted" : ""}
                >
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                  <span role="cell" className={positionClass}>
                    <span className="sr-only">{positionLabel}</span>
                    <span aria-hidden="true">
                      {padString(statusIndicator || player.position, posWidth)}
                    </span>
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                  <span role="cell">
                    {padString(truncate(player.name, nameWidth), nameWidth)}
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                  <span role="cell" className={scoreClass}>
                    <span className="sr-only">
                      {player.scoreToParNum < 0
                        ? `${Math.abs(player.scoreToParNum)} under par`
                        : player.scoreToParNum > 0
                        ? `${player.scoreToParNum} over par`
                        : "Even par"}
                    </span>
                    <span aria-hidden="true">
                      {padString(player.scoreToPar, scoreWidth, "right")}
                    </span>
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                  <span role="cell">
                    {padString(player.today ?? "-", todayWidth, "right")}
                  </span>
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                  <span role="cell">
                    {padString(player.thru ?? "-", thruWidth, "right")}
                  </span>
                  {Array.from({ length: roundsToShow }, (_, i) => (
                    <span key={`round-${i + 1}`}>
                      <span className="text-terminal-border" aria-hidden="true">|</span>
                      <span role="cell">
                        {padString(player.rounds[i]?.toString() ?? "-", roundWidth, "right")}
                      </span>
                    </span>
                  ))}
                  <span className="text-terminal-border" aria-hidden="true">|</span>
                </div>
              );
            })
          ) : (
            <div role="row" className="text-terminal-muted">
              <span className="text-terminal-border" aria-hidden="true">|</span>
              <span role="cell">
                {padString("No players on leaderboard yet", 50, "center")}
              </span>
              <span className="text-terminal-border" aria-hidden="true">|</span>
            </div>
          )}

          {/* Bottom border */}
          <div className="text-terminal-border" aria-hidden="true">
            +{"-".repeat(posWidth)}+{"-".repeat(nameWidth)}+{"-".repeat(scoreWidth)}+{"-".repeat(todayWidth)}+{"-".repeat(thruWidth)}{roundHeaders.map(() => `+${"-".repeat(roundWidth)}`).join("")}+
          </div>

          {/* Show count if truncated */}
          {tournament.players.length > 30 && (
            <div className="text-terminal-muted text-sm text-center pt-2">
              Showing top 30 of {tournament.players.length} players
            </div>
          )}
        </div>

        {/* Last updated */}
        <div className="text-terminal-muted text-sm text-center pt-4">
          Last updated: {leaderboard.lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
