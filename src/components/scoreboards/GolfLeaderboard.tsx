import type { GolfLeaderboard, GolfPlayer, GolfTournament, GolfTournamentStatus } from "@/lib/types";
import { formatCurrency, formatNumber, truncate } from "@/lib/utils/format";

interface GolfLeaderboardProps {
  leaderboard: GolfLeaderboard;
}

interface GolfLeaderboardTableProps {
  tournament: GolfTournament;
  lastUpdated: Date;
}

/**
 * Check if all active players have completed their round
 */
function isRoundPlayComplete(players: GolfPlayer[], currentRound?: number): boolean {
  if (!currentRound) return false;
  const activePlayers = players.filter((p) => p.status === "active");
  if (activePlayers.length === 0) return false;

  // Round is complete if all active players have:
  // 1. thru === "F" (finished today), OR
  // 2. completed this round (have score in rounds array for current round)
  return activePlayers.every(
    (p) => p.thru === "F" || p.rounds.length >= currentRound
  );
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

interface TournamentHeaderProps {
  tournament: GolfTournament;
}

/**
 * Enhanced tournament header with course info, purse, defending champion, and broadcasts
 * Uses ASCII border styling consistent with other sports scoreboards
 */
function TournamentHeader({ tournament }: TournamentHeaderProps) {
  const statusClass = getTournamentStatusClass(tournament.status);
  const roundPlayComplete = isRoundPlayComplete(tournament.players, tournament.currentRound);
  const statusText = getTournamentStatusText(tournament.status, tournament.currentRound, roundPlayComplete);
  const isLive = tournament.status === "in_progress";

  // Get primary course (host course or first course)
  const primaryCourse = tournament.courses?.find((c) => c.isHost) ?? tournament.courses?.[0];
  const additionalCourseCount = (tournament.courses?.length ?? 0) - 1;

  // Format purse
  const formattedPurse = tournament.purseAmount
    ? formatCurrency(tournament.purseAmount)
    : null;

  // Build broadcast string
  const broadcastText = tournament.broadcasts?.slice(0, 4).join(", ");

  // Determine border style based on status
  const borderChars = isLive
    ? { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║", ml: "╠", mr: "╣" }
    : { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│", ml: "├", mr: "┤" };

  const borderClass = isLive ? "text-terminal-green" : "text-terminal-border";

  // Build venue/location fallback for header subtitle
  const venueText =
    tournament.venue && tournament.venue !== "TBD"
      ? `${tournament.venue}${tournament.location ? ` · ${tournament.location}` : ""}`
      : tournament.location || null;

  return (
    <div className="mb-6 font-mono text-sm">
      {/* Top border */}
      <div className={borderClass} aria-hidden="true">
        {borderChars.tl}{borderChars.h.repeat(58)}{borderChars.tr}
      </div>

      {/* Tournament name */}
      <div className="flex">
        <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        <span className="flex-1 text-terminal-fg font-bold px-2 py-0.5 truncate">
          {tournament.name}
        </span>
        <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
      </div>

      {/* Status line */}
      <div className="flex">
        <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        <span className={`flex-1 ${statusClass} px-2`}>
          {isLive && <span className="glow-pulse mr-1">●</span>}
          {statusText}
        </span>
        <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
      </div>

      {/* Separator - only if we have additional info to show */}
      {(primaryCourse || formattedPurse || tournament.defendingChampion || broadcastText) && (
        <div className={borderClass} aria-hidden="true">
          {borderChars.ml}{borderChars.h.repeat(58)}{borderChars.mr}
        </div>
      )}

      {/* Course info */}
      {primaryCourse && (
        <div className="flex">
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
          <span className="flex-1 px-2 py-0.5 text-terminal-muted truncate">
            <span className="text-terminal-cyan">Course:</span>{" "}
            {primaryCourse.name}
            {primaryCourse.par && ` · Par ${primaryCourse.par}`}
            {primaryCourse.totalYards && ` · ${formatNumber(primaryCourse.totalYards)} yds`}
          </span>
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        </div>
      )}

      {/* Additional courses indicator */}
      {additionalCourseCount > 0 && (
        <div className="flex">
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
          <span className="flex-1 px-2 py-0.5 text-xs text-terminal-muted">
            +{additionalCourseCount} additional course{additionalCourseCount > 1 ? "s" : ""}
          </span>
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        </div>
      )}

      {/* Fallback venue info if no course data */}
      {!primaryCourse && venueText && (
        <div className="flex">
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
          <span className="flex-1 px-2 py-0.5 text-terminal-muted truncate">
            {venueText}
          </span>
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        </div>
      )}

      {/* Purse and defending champion row */}
      {(formattedPurse || tournament.defendingChampion) && (
        <div className="flex">
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
          <span className="flex-1 px-2 py-0.5 text-terminal-muted flex flex-wrap gap-x-4">
            {formattedPurse && (
              <span>
                <span className="text-terminal-cyan">Purse:</span>{" "}
                <span className="text-terminal-green">{formattedPurse}</span>
              </span>
            )}
            {tournament.defendingChampion && (
              <span>
                <span className="text-terminal-cyan">Defending:</span>{" "}
                {truncate(tournament.defendingChampion, 20)}
              </span>
            )}
          </span>
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        </div>
      )}

      {/* Broadcast info */}
      {broadcastText && (
        <div className="flex">
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
          <span className="flex-1 px-2 py-0.5 text-xs text-terminal-muted truncate">
            <span className="text-terminal-cyan">TV:</span> {broadcastText}
          </span>
          <span className={borderClass} aria-hidden="true">{borderChars.v}</span>
        </div>
      )}

      {/* Bottom border */}
      <div className={borderClass} aria-hidden="true">
        {borderChars.bl}{borderChars.h.repeat(58)}{borderChars.br}
      </div>
    </div>
  );
}

/**
 * Displays PGA Tour leaderboard table
 */
function GolfLeaderboardTable({
  tournament,
  lastUpdated,
}: GolfLeaderboardTableProps) {
  // Determine how many round columns to show
  const completedRounds = Math.max(...tournament.players.map((p) => p.rounds.length), 0);

  // Check if earnings/FedEx data is available
  const hasEarningsData = tournament.players.some((p) => p.earnings !== undefined && p.earnings > 0);
  const hasFedexData = tournament.players.some((p) => p.fedexPoints !== undefined && p.fedexPoints > 0);

  return (
    <div className="overflow-x-auto">
      <div className="w-full">
        {/* Enhanced tournament header */}
        <TournamentHeader tournament={tournament} />

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
            <span className="w-14 text-center border-r border-terminal-border" role="columnheader">
              TODAY
            </span>
            <span className="w-12 text-center border-r border-terminal-border" role="columnheader">
              THRU
            </span>
            {/* Earnings column - hidden on mobile */}
            {hasEarningsData && (
              <span className="w-20 text-center border-r border-terminal-border hidden md:inline-block" role="columnheader">
                EARN
              </span>
            )}
            {/* FedEx points column - hidden on mobile/tablet */}
            {hasFedexData && (
              <span className="w-14 text-center border-r border-terminal-border hidden lg:inline-block" role="columnheader">
                FEDEX
              </span>
            )}
            {Array.from({ length: Math.min(completedRounds + 1, 4) }, (_, i) => (
              <span
                key={`header-r${i + 1}`}
                className={`w-12 text-center ${i < Math.min(completedRounds, 3) ? "border-r border-terminal-border" : ""}`}
                role="columnheader"
              >
                R{i + 1}
              </span>
            ))}
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

                  {/* Today's score */}
                  <span role="cell" className="w-14 text-center">
                    {player.today ?? "-"}
                  </span>

                  {/* Thru */}
                  <span role="cell" className="w-12 text-center text-terminal-muted">
                    {player.thru ?? "-"}
                  </span>

                  {/* Earnings - hidden on mobile */}
                  {hasEarningsData && (
                    <span role="cell" className="w-20 text-center text-terminal-green hidden md:inline-block">
                      {player.earnings ? formatCurrency(player.earnings, true) : "-"}
                    </span>
                  )}

                  {/* FedEx points - hidden on mobile/tablet */}
                  {hasFedexData && (
                    <span role="cell" className="w-14 text-center hidden lg:inline-block">
                      {player.fedexPoints ? Math.round(player.fedexPoints) : "-"}
                    </span>
                  )}

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
 * Server component - displays PGA Tour leaderboard
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
      lastUpdated={leaderboard.lastUpdated}
    />
  );
}
