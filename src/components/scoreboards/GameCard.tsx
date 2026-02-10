import Link from "next/link";
import type { Game, GameStatus, GameType } from "@/lib/types";
import { getStatusClass, getStatusText } from "@/lib/utils/format";
import { supportsNotifications } from "@/lib/notifications/types";
import { GameStats } from "./GameStats";
import { PeriodScores } from "./PeriodScores";
import { GameCardNotificationButton } from "./GameCardNotificationButton";

/**
 * Get badge display for game type (preseason, playoff, etc.)
 */
function getGameTypeBadge(gameType?: GameType): { label: string; className: string } | null {
  switch (gameType) {
    case "preseason":
      return { label: "PRE", className: "text-terminal-cyan" };
    case "postseason":
      return { label: "PLAYOFF", className: "text-terminal-yellow text-glow" };
    case "allstar":
      return { label: "ALL-STAR", className: "text-terminal-magenta" };
    case "regular":
    default:
      return null; // No badge for regular season
  }
}

interface GameCardProps {
  game: Game;
}

// Leagues that support game detail pages
const DETAIL_SUPPORTED_LEAGUES = ["nhl", "nfl", "nba", "mlb", "mls", "epl", "fa-cup", "ncaam", "ncaaw"];

/**
 * Get the appropriate border style based on game status
 * All statuses use double-line borders with color differentiation
 */
function getBorderStyle(status: Game["status"]) {
  const doubleBorder = {
    corners: { tl: "╔", tr: "╗", bl: "╚", br: "╝", ml: "╠", mr: "╣" },
    horizontal: "═",
    side: "║",
  };

  switch (status) {
    case "live":
      return {
        ...doubleBorder,
        borderClass: "border-terminal-green/70",
        textClass: "text-terminal-green",
      };
    case "final":
      return {
        ...doubleBorder,
        borderClass: "border-terminal-border",
        textClass: "text-terminal-border",
      };
    case "scheduled":
    default:
      return {
        ...doubleBorder,
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
      <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">{fill.repeat(100)}</span>
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
  record,
  rank,
  score,
  isWinning,
  side,
  sideClass,
  gameStatus,
}: {
  team: string;
  teamFullName: string;
  record?: string;
  rank?: number;
  score: number;
  isWinning: boolean;
  side: string;
  sideClass: string;
  gameStatus: GameStatus;
}) {
  // Only highlight winning team and show indicator for final games
  const showWinning = isWinning && gameStatus === "final";
  const textClass = showWinning ? "text-terminal-green font-bold" : "text-terminal-fg";
  const scoreClass = showWinning ? "text-terminal-green font-bold text-glow" : "text-terminal-fg";
  const showWinIndicator = showWinning;

  return (
    <div className="flex items-center">
      <span className={sideClass} aria-hidden="true">{side}</span>
      <div className="flex-1 flex items-center justify-between px-2 py-0.5">
        <span className={textClass}>
          <span className="sr-only">{rank ? `#${rank} ` : ""}{teamFullName}</span>
          <span aria-hidden="true">
            {rank && <span className="text-terminal-yellow text-xs">{rank} </span>}
            {team}
          </span>
          {record && (
            <span className="text-terminal-muted text-xs ml-2" aria-label={`Record: ${record}`}>
              ({record})
            </span>
          )}
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

  // Check if this league supports game detail pages
  const supportsDetail = DETAIL_SUPPORTED_LEAGUES.includes(game.league);
  const gameUrl = supportsDetail ? `/${game.league}/game/${game.id}` : undefined;

  const wrapperClassName = `font-mono text-sm ${cardClass} p-1 transition-all hover:border-terminal-fg/50 ${supportsDetail ? "cursor-pointer" : ""} block`;

  const cardContent = (
    <>
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
        <div className={`flex-1 px-2 py-0.5 ${statusClass} flex items-center justify-between`}>
          <div>
            {isLive && (
              <>
                <span className="inline-block mr-1 text-terminal-green" aria-hidden="true">●</span>
                <span className="sr-only">Live game: </span>
              </>
            )}
            {statusText}
          </div>
          <div className="flex items-center gap-2">
            {/* Notification button for supported leagues */}
            {supportsNotifications(game.league) && (
              <GameCardNotificationButton
                gameId={game.id}
                league={game.league}
                homeTeam={game.homeTeam.abbreviation}
                awayTeam={game.awayTeam.abbreviation}
                gameStatus={game.status}
                gameStartTime={game.startTime.toISOString()}
              />
            )}
            {/* TV broadcast for live and scheduled games */}
            {(isLive || game.status === "scheduled") && game.broadcasts && game.broadcasts.length > 0 && (
              <span className="text-xs text-terminal-muted">
                <span className="sr-only">Broadcast on {game.broadcasts.join(", ")}</span>
                <span aria-hidden="true">
                  <span className="text-terminal-cyan">TV:</span> {game.broadcasts[0]}
                  {game.broadcasts.length > 1 && (
                    <span className="ml-1">[+{game.broadcasts.length - 1}]</span>
                  )}
                </span>
              </span>
            )}
            {/* Game type badge (preseason, playoff, etc.) */}
            {game.gameType && getGameTypeBadge(game.gameType) && (
              <span className={`text-xs ${getGameTypeBadge(game.gameType)!.className}`}>
                <span className="sr-only">{game.gameType} game</span>
                <span aria-hidden="true">[{getGameTypeBadge(game.gameType)!.label}]</span>
              </span>
            )}
          </div>
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
        record={game.awayTeam.record}
        rank={game.awayTeam.rank}
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
        record={game.homeTeam.record}
        rank={game.homeTeam.rank}
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
          <PeriodScores game={game} borderClass={border.textClass} sideChar={border.side} />
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

      {/* Venue info for scheduled games */}
      {game.status === "scheduled" && game.venue && (
        <>
          <BorderLine
            left={border.corners.ml}
            right={border.corners.mr}
            fill={border.horizontal}
            className={border.textClass}
          />
          <div className="flex items-center">
            <span className={border.textClass} aria-hidden="true">{border.side}</span>
            <div className="flex-1 px-2 py-0.5 text-terminal-muted text-xs flex justify-between">
              <span className="truncate">
                <span className="sr-only">Venue: </span>
                {game.venue}
              </span>
              {game.venueLocation && (
                <span className="ml-2 shrink-0">
                  <span className="sr-only">Location: </span>
                  {game.venueLocation}
                </span>
              )}
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
    </>
  );

  // Wrap in Link if game details are supported
  if (gameUrl) {
    return (
      <Link
        href={gameUrl}
        className={wrapperClassName}
        role="article"
        aria-label={`${game.awayTeam.displayName} vs ${game.homeTeam.displayName} - Click for details`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div
      className={wrapperClassName}
      role="article"
      aria-label={`${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`}
    >
      {cardContent}
    </div>
  );
}
