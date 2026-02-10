import Link from "next/link";
import type { PlayoffMatchup, BracketTeam } from "@/lib/types/playoffs";

interface BracketMatchupCardProps {
  matchup: PlayoffMatchup;
}

/**
 * Renders a single team row within a bracket matchup card
 */
function BracketTeamRow({
  team,
  isTop,
}: {
  team?: BracketTeam;
  isTop: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center justify-between px-2 py-0.5">
        <span className="text-terminal-muted">TBD</span>
        <span className="text-terminal-muted">—</span>
      </div>
    );
  }

  const isWinner = team.isWinner === true;
  const isLoser = team.isWinner === false;
  const nameClass = isWinner
    ? "text-terminal-green font-bold"
    : isLoser
      ? "text-terminal-muted"
      : "text-terminal-fg";
  const scoreClass = isWinner
    ? "text-terminal-green font-bold text-glow"
    : isLoser
      ? "text-terminal-muted"
      : "text-terminal-fg";

  return (
    <div className={`flex items-center justify-between px-2 py-0.5 ${isTop ? "" : ""}`}>
      <span className={nameClass}>
        <span className="sr-only">
          {team.seed ? `#${team.seed} ` : ""}{team.displayName}
          {isWinner ? " (winner)" : ""}
        </span>
        <span aria-hidden="true">
          {team.seed && (
            <span className="text-terminal-yellow text-xs mr-1">
              {team.seed}
            </span>
          )}
          {team.abbreviation}
        </span>
      </span>
      <div className="flex items-center gap-1">
        <span className={scoreClass}>
          {team.score !== undefined ? team.score : "—"}
        </span>
        {isWinner && (
          <span className="text-terminal-green text-xs" aria-hidden="true">
            ◄
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact matchup card for bracket display.
 * Shows two teams with seeds, scores, and winner indication.
 */
export function BracketMatchupCard({ matchup }: BracketMatchupCardProps) {
  // Bye matchup
  if (matchup.isBye && matchup.topTeam) {
    return (
      <div
        className="font-mono text-xs retro-card p-0.5"
        role="article"
        aria-label={`${matchup.topTeam.displayName} - Bye`}
      >
        <div className="flex text-terminal-border" aria-hidden="true">
          <span>┌</span>
          <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
            {"─".repeat(50)}
          </span>
          <span>┐</span>
        </div>
        <div className="flex items-center justify-between px-2 py-0.5">
          <span className="text-terminal-fg">
            <span className="sr-only">#{matchup.topTeam.seed} {matchup.topTeam.displayName} - Bye</span>
            <span aria-hidden="true">
              {matchup.topTeam.seed && (
                <span className="text-terminal-yellow text-xs mr-1">
                  {matchup.topTeam.seed}
                </span>
              )}
              {matchup.topTeam.abbreviation}
            </span>
          </span>
          <span className="text-terminal-muted text-xs">BYE</span>
        </div>
        <div className="flex text-terminal-border" aria-hidden="true">
          <span>└</span>
          <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
            {"─".repeat(50)}
          </span>
          <span>┘</span>
        </div>
      </div>
    );
  }

  // Determine border color based on game status
  const status = matchup.game?.status;
  const isLive = status === "live";
  const borderClass = isLive
    ? "text-terminal-green"
    : status === "final"
      ? "text-terminal-border"
      : "text-terminal-yellow";

  const cardClass = isLive ? "retro-card border-terminal-green/70" : "retro-card";
  const gameUrl = matchup.game
    ? `/nfl/game/${matchup.game.id}`
    : undefined;

  const content = (
    <div className={`font-mono text-xs ${cardClass} p-0.5`}>
      {/* Top border */}
      <div className={`flex ${borderClass}`} aria-hidden="true">
        <span>┌</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
          {"─".repeat(50)}
        </span>
        <span>┐</span>
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="flex items-center px-2 py-0.5">
          <span className={borderClass} aria-hidden="true">│</span>
          <div className="flex-1 flex items-center gap-1 px-1">
            <span className="text-terminal-green" aria-hidden="true">●</span>
            <span className="text-terminal-green text-xs">
              {matchup.game?.detail ?? "LIVE"}
            </span>
          </div>
          <span className={borderClass} aria-hidden="true">│</span>
        </div>
      )}

      {/* Top team (home / higher seed) */}
      <BracketTeamRow team={matchup.topTeam} isTop />

      {/* Divider */}
      <div className={`flex ${borderClass}`} aria-hidden="true">
        <span>├</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
          {"─".repeat(50)}
        </span>
        <span>┤</span>
      </div>

      {/* Bottom team (away / lower seed) */}
      <BracketTeamRow team={matchup.bottomTeam} isTop={false} />

      {/* Bottom border */}
      <div className={`flex ${borderClass}`} aria-hidden="true">
        <span>└</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">
          {"─".repeat(50)}
        </span>
        <span>┘</span>
      </div>
    </div>
  );

  if (gameUrl && matchup.game) {
    return (
      <Link
        href={gameUrl}
        className="block transition-all hover:brightness-125"
        role="article"
        aria-label={`${matchup.topTeam?.displayName ?? "TBD"} vs ${matchup.bottomTeam?.displayName ?? "TBD"} - Click for details`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      role="article"
      aria-label={`${matchup.topTeam?.displayName ?? "TBD"} vs ${matchup.bottomTeam?.displayName ?? "TBD"}`}
    >
      {content}
    </div>
  );
}
