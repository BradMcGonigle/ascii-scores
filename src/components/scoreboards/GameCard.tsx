import type { Game, GameStatus } from "@/lib/types";
import { getStatusClass, getStatusText } from "@/lib/utils/format";
import { LocalTime } from "@/components/LocalTime";
import { GameStats } from "./GameStats";
import { PeriodScores } from "./PeriodScores";

interface GameCardProps {
  game: Game;
}

/**
 * Get the appropriate border style based on game status
 */
function getBorderStyle(status: Game["status"]) {
  switch (status) {
    case "live":
      return {
        corners: { tl: "╔", tr: "╗", bl: "╚", br: "╝", ml: "╠", mr: "╣" },
        horizontal: "═",
        side: "║",
        borderClass: "border-terminal-green/70",
        textClass: "text-terminal-green",
      };
    case "final":
      return {
        corners: { tl: "┌", tr: "┐", bl: "└", br: "┘", ml: "├", mr: "┤" },
        horizontal: "─",
        side: "│",
        borderClass: "border-terminal-border",
        textClass: "text-terminal-border",
      };
    case "scheduled":
    default:
      return {
        corners: { tl: "┏", tr: "┓", bl: "┗", br: "┛", ml: "┣", mr: "┫" },
        horizontal: "━",
        side: "┃",
        borderClass: "border-terminal-yellow/50",
        textClass: "text-terminal-yellow",
      };
  }
}

/**
 * Flexible border line component that fills available width
 */
function BorderLine({
  left,
  right,
  fill,
  className,
}: {
  left: string;
  right: string;
  fill: string;
  className: string;
}) {
  return (
    <div className={`flex ${className}`} aria-hidden="true">
      <span>{left}</span>
      <span className="flex-1 overflow-hidden">{fill.repeat(50)}</span>
      <span>{right}</span>
    </div>
  );
}

/**
 * Team row component with flexible alignment
 */
function TeamRow({
  team,
  teamFullName,
  score,
  isWinning,
  side,
  sideClass,
  gameStatus,
}: {
  team: string;
  teamFullName: string;
  score: number;
  isWinning: boolean;
  side: string;
  sideClass: string;
  gameStatus: GameStatus;
}) {
  const textClass = isWinning ? "text-terminal-green font-bold" : "text-terminal-fg";
  const scoreClass = isWinning ? "text-terminal-green font-bold text-glow" : "text-terminal-fg";
  const showWinIndicator = isWinning && (gameStatus === "live" || gameStatus === "final");

  return (
    <div className="flex items-center">
      <span className={sideClass} aria-hidden="true">{side}</span>
      <div className="flex-1 flex items-center justify-between px-2 py-0.5">
        <span className={textClass}>
          <span className="sr-only">{teamFullName}</span>
          <span aria-hidden="true">{team}</span>
        </span>
        <div className="flex items-center gap-1">
          <span className={scoreClass}>{score}</span>
          {showWinIndicator && (
            <>
              <span className="text-terminal-green text-xs" aria-hidden="true">◄</span>
              <span className="sr-only">(leading)</span>
            </>
          )}
        </div>
      </div>
      <span className={sideClass} aria-hidden="true">{side}</span>
    </div>
  );
}

/**
 * ASCII game card component for displaying a single game
 */
export function GameCard({ game }: GameCardProps) {
  const statusClass = getStatusClass(game.status);
  const statusText = getStatusText(game.status, game.detail);
  const border = getBorderStyle(game.status);

  const isLive = game.status === "live";
  const cardClass = isLive ? "retro-card border-terminal-green/70" : "retro-card";

  return (
    <div
      className={`font-mono text-sm ${cardClass} p-1 transition-all hover:border-terminal-fg/50`}
      role="article"
      aria-label={`${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`}
    >
      {/* Top border */}
      <BorderLine
        left={border.corners.tl}
        right={border.corners.tr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Status line */}
      <div className="flex items-center">
        <span className={border.textClass} aria-hidden="true">{border.side}</span>
        <div className={`flex-1 px-2 py-0.5 ${statusClass}`}>
          {isLive && (
            <>
              <span className="inline-block mr-1 text-terminal-green" aria-hidden="true">●</span>
              <span className="sr-only">Live game: </span>
            </>
          )}
          {statusText}
        </div>
        <span className={border.textClass} aria-hidden="true">{border.side}</span>
      </div>

      {/* Separator */}
      <BorderLine
        left={border.corners.ml}
        right={border.corners.mr}
        fill={border.horizontal}
        className={border.textClass}
      />

      {/* Away team */}
      <TeamRow
        team={game.awayTeam.abbreviation}
        teamFullName={game.awayTeam.displayName}
        score={game.awayScore}
        isWinning={game.awayScore > game.homeScore}
        side={border.side}
        sideClass={border.textClass}
        gameStatus={game.status}
      />

      {/* Home team */}
      <TeamRow
        team={game.homeTeam.abbreviation}
        teamFullName={game.homeTeam.displayName}
        score={game.homeScore}
        isWinning={game.homeScore > game.awayScore}
        side={border.side}
        sideClass={border.textClass}
        gameStatus={game.status}
      />

      {/* Period scores for live/final games */}
      {(game.status === "live" || game.status === "final") && game.periodScores && (
        <>
          <BorderLine
            left={border.corners.ml}
            right={border.corners.mr}
            fill={border.horizontal}
            className={border.textClass}
          />
          <div className="flex items-center">
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
            <div className="flex-1 px-2 py-1">
              <PeriodScores game={game} borderClass={border.textClass} />
            </div>
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
          </div>
        </>
      )}

      {/* Game stats for live/final games */}
      {(game.status === "live" || game.status === "final") && game.stats && (
        <>
          <BorderLine
            left={border.corners.ml}
            right={border.corners.mr}
            fill={border.horizontal}
            className={border.textClass}
          />
          <div className="flex items-center">
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
            <div className="flex-1 px-2 py-0.5">
              <GameStats game={game} />
            </div>
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
          </div>
        </>
      )}

      {/* Time/Venue line for scheduled games */}
      {game.status === "scheduled" && (
        <>
          <BorderLine
            left={border.corners.ml}
            right={border.corners.mr}
            fill={border.horizontal}
            className={border.textClass}
          />
          <div className="flex items-center">
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
            <div className="flex-1 px-2 py-0.5 text-terminal-muted">
              <span className="text-terminal-yellow mr-1" aria-hidden="true">◈</span>
              <span className="sr-only">Scheduled start time: </span>
              <LocalTime date={game.startTime} />
            </div>
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
          </div>
        </>
      )}

      {/* Bottom border */}
      <BorderLine
        left={border.corners.bl}
        right={border.corners.br}
        fill={border.horizontal}
        className={border.textClass}
      />
    </div>
  );
}
