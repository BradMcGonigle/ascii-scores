import type { GolfLeaderboard, GolfPlayer, GolfTournament, GolfTournamentStatus } from "@/lib/types";
import { truncate } from "@/lib/utils/format";

interface GolfLeaderboardProps {
  leaderboard: GolfLeaderboard;
}

interface GolfLeaderboardTableProps {
  tournament: GolfTournament;
  selectedRound: number;
  isLiveView: boolean;
  lastUpdated: Date;
}

/**
 * Check if all active players have completed their round
 */
function isRoundPlayComplete(players: GolfPlayer[]): boolean {
  const activePlayers = players.filter((p) => p.status === "active");
  if (activePlayers.length === 0) return false;

  // Round is complete if all active players have finished (thru === "F")
  return activePlayers.every((p) => p.thru === "F");
}

/**
 * Get status display text for golf tournament
 */
function getTournamentStatusText(
  status: GolfTournamentStatus,
  currentRound?: number,
  roundPlayComplete?: boolean
): string {
  switch (status) {
    case "in_progress":
      if (roundPlayComplete && currentRound) {
        return `ROUND ${currentRound} PLAY COMPLETE`;
      }
      return currentRound ? `ROUND ${currentRound} IN PROGRESS` : "IN PROGRESS";
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
 * Format round score with par comparison coloring class
 */
function getRoundScoreClass(score: number | undefined, par: number = 72): string {
  if (score === undefined) return "";
  if (score < par) return "text-terminal-green";
  if (score > par) return "text-terminal-red";
  return "";
}

/**
 * Displays PGA Tour leaderboard table (used by both server and client components)
 */
export function GolfLeaderboardTable({
  tournament,
  selectedRound,
  isLiveView,
  lastUpdated,
}: GolfLeaderboardTableProps) {
  const statusClass = getTournamentStatusClass(tournament.status);
  const roundPlayComplete = isRoundPlayComplete(tournament.players);
  const statusText = getTournamentStatusText(tournament.status, tournament.currentRound, roundPlayComplete);

  // Determine how many round columns to show based on selection
  const completedRounds = Math.max(...tournament.players.map((p) => p.rounds.length), 0);

  // Build venue string, hiding TBD
  const venueText =
    tournament.venue && tournament.venue !== "TBD"
      ? `${tournament.venue}${tournament.location ? ` · ${tournament.location}` : ""}`
      : tournament.location || null;

  return (
    <div className="overflow-x-auto">
      <div className="w-full">
        {/* Tournament header */}
        <div className="mb-6 border border-terminal-border p-3">
          <div className="text-terminal-fg font-bold text-center">
            {tournament.name}
          </div>
          {venueText && (
            <div className="text-terminal-muted text-center text-sm">
              {venueText}
            </div>
          )}
          <div className={`${statusClass} text-center text-sm`}>
            {statusText}
          </div>
        </div>

        {/* Leaderboard table */}
        <div role="table" aria-label="Golf tournament leaderboard" className="text-sm">
          {/* Header row */}
          <div className="text-terminal-cyan flex" role="row">
            <span className="w-12 text-center border-r border-terminal-border" role="columnheader">
              POS
            </span>
            <span className="w-48 px-2 border-r border-terminal-border" role="columnheader">
              PLAYER
            </span>
            <span className="w-16 text-center border-r border-terminal-border" role="columnheader">
              TOTAL
            </span>
            {isLiveView ? (
              <>
                <span className="w-14 text-center border-r border-terminal-border" role="columnheader">
                  TODAY
                </span>
                <span className="w-12 text-center border-r border-terminal-border" role="columnheader">
                  THRU
                </span>
                {Array.from({ length: Math.min(completedRounds + 1, 4) }, (_, i) => (
                  <span
                    key={`header-r${i + 1}`}
                    className={`w-12 text-center ${i < Math.min(completedRounds, 3) ? "border-r border-terminal-border" : ""}`}
                    role="columnheader"
                  >
                    R{i + 1}
                  </span>
                ))}
              </>
            ) : (
              <>
                <span className="w-16 text-center border-r border-terminal-border" role="columnheader">
                  R{selectedRound}
                </span>
                <span className="w-12 text-center" role="columnheader">
                  THRU
                </span>
              </>
            )}
          </div>

          {/* Header separator */}
          <div className="border-b border-terminal-border mb-1" aria-hidden="true" />

          {/* Player rows */}
          {tournament.players.length > 0 ? (
            tournament.players.slice(0, 40).map((player, index) => {
              const positionClass = getPositionClass(player.position);
              const scoreClass = getScoreClass(player.scoreToParNum);
              const statusIndicator = getPlayerStatusIndicator(player.status);
              const isInactive = player.status !== "active";
              const isEvenRow = index % 2 === 0;

              const positionLabel = player.position.startsWith("T")
                ? `Tied for position ${player.position.slice(1)}`
                : `Position ${player.position}`;

              // Get round score for selected round view
              const selectedRoundScore = player.rounds[selectedRound - 1];

              return (
                <div
                  key={player.id}
                  role="row"
                  className={`flex py-0.5 ${isInactive ? "text-terminal-muted" : ""} ${
                    isEvenRow ? "bg-terminal-bg" : "bg-terminal-border/10"
                  }`}
                >
                  {/* Position */}
                  <span
                    role="cell"
                    className={`w-12 text-center ${positionClass}`}
                  >
                    <span className="sr-only">{positionLabel}</span>
                    <span aria-hidden="true">
                      {statusIndicator || player.position}
                    </span>
                  </span>

                  {/* Player name */}
                  <span role="cell" className="w-48 px-2 truncate">
                    {truncate(player.name, 22)}
                  </span>

                  {/* Total score */}
                  <span role="cell" className={`w-16 text-center ${scoreClass}`}>
                    <span className="sr-only">
                      {player.scoreToParNum < 0
                        ? `${Math.abs(player.scoreToParNum)} under par`
                        : player.scoreToParNum > 0
                        ? `${player.scoreToParNum} over par`
                        : "Even par"}
                    </span>
                    <span aria-hidden="true">{player.scoreToPar}</span>
                  </span>

                  {isLiveView ? (
                    <>
                      {/* Today's score */}
                      <span role="cell" className="w-14 text-center">
                        {player.today ?? "-"}
                      </span>

                      {/* Thru */}
                      <span role="cell" className="w-12 text-center text-terminal-muted">
                        {player.thru ?? "-"}
                      </span>

                      {/* Round scores */}
                      {Array.from({ length: Math.min(completedRounds + 1, 4) }, (_, i) => {
                        const roundScore = player.rounds[i];
                        const roundClass = getRoundScoreClass(roundScore);
                        return (
                          <span
                            key={`r${i + 1}`}
                            role="cell"
                            className={`w-12 text-center ${roundClass}`}
                          >
                            {roundScore ?? "-"}
                          </span>
                        );
                      })}
                    </>
                  ) : (
                    <>
                      {/* Selected round score */}
                      <span
                        role="cell"
                        className={`w-16 text-center ${getRoundScoreClass(selectedRoundScore)}`}
                      >
                        {selectedRoundScore ?? "-"}
                      </span>

                      {/* Thru for that round */}
                      <span role="cell" className="w-12 text-center text-terminal-muted">
                        {selectedRound === tournament.currentRound
                          ? player.thru ?? "F"
                          : "F"}
                      </span>
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div role="row" className="text-terminal-muted text-center py-4">
              No players on leaderboard yet
            </div>
          )}

          {/* Footer separator */}
          <div className="border-t border-terminal-border mt-1" aria-hidden="true" />

          {/* Show count if truncated */}
          {tournament.players.length > 40 && (
            <div className="text-terminal-muted text-xs text-center pt-2">
              Showing top 40 of {tournament.players.length} players
            </div>
          )}
        </div>

        {/* Last updated */}
        <div className="text-terminal-muted text-xs text-center pt-4">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

/**
 * Server component wrapper - displays PGA Tour leaderboard
 * For client-side round tabs, use GolfLeaderboardClient instead
 */
export function GolfLeaderboardDisplay({ leaderboard }: GolfLeaderboardProps) {
  const { tournament } = leaderboard;

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
    <GolfLeaderboardTable
      tournament={tournament}
      selectedRound={tournament.currentRound ?? 1}
      isLiveView={true}
      lastUpdated={leaderboard.lastUpdated}
    />
  );
}
