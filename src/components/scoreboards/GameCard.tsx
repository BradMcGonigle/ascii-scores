import type { Game } from "@/lib/types";
import { formatTime, getStatusClass, getStatusText, padString } from "@/lib/utils/format";

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
        top: "╔══════════════════════╗",
        mid: "╠══════════════════════╣",
        bot: "╚══════════════════════╝",
        side: "║",
        className: "text-terminal-green",
      };
    case "final":
      return {
        top: "┌──────────────────────┐",
        mid: "├──────────────────────┤",
        bot: "└──────────────────────┘",
        side: "│",
        className: "text-terminal-border",
      };
    case "scheduled":
    default:
      return {
        top: "┏━━━━━━━━━━━━━━━━━━━━━━┓",
        mid: "┣━━━━━━━━━━━━━━━━━━━━━━┫",
        bot: "┗━━━━━━━━━━━━━━━━━━━━━━┛",
        side: "┃",
        className: "text-terminal-yellow",
      };
  }
}

/**
 * ASCII game card component for displaying a single game
 */
export function GameCard({ game }: GameCardProps) {
  const statusClass = getStatusClass(game.status);
  const statusText = getStatusText(game.status, game.detail);
  const border = getBorderStyle(game.status);

  const awayName = padString(game.awayTeam.abbreviation, 4);
  const homeName = padString(game.homeTeam.abbreviation, 4);
  const awayScore = padString(game.awayScore.toString(), 3, "right");
  const homeScore = padString(game.homeScore.toString(), 3, "right");

  const isLive = game.status === "live";
  const cardClass = isLive ? "retro-card border-terminal-green/50" : "retro-card";

  return (
    <div
      className={`font-mono text-sm ${cardClass} p-1 transition-all hover:border-terminal-fg/50`}
      role="article"
      aria-label={`${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`}
    >
      {/* Top border */}
      <div className={border.className} aria-hidden="true">
        {border.top}
      </div>

      {/* Status line */}
      <div>
        <span className={border.className} aria-hidden="true">{border.side}</span>
        <span className={`${statusClass} px-1 ${isLive ? "glow-pulse" : ""}`}>
          {isLive && <span className="inline-block mr-1">●</span>}
          {padString(statusText, isLive ? 18 : 20)}
        </span>
        <span className={border.className} aria-hidden="true">{border.side}</span>
      </div>

      {/* Separator */}
      <div className={border.className} aria-hidden="true">
        {border.mid}
      </div>

      {/* Away team */}
      <div>
        <span className={border.className} aria-hidden="true">{border.side}</span>
        <span className="px-1">
          <span className={game.awayScore > game.homeScore ? "text-terminal-green font-bold" : "text-terminal-fg"}>
            {awayName}
          </span>
          <span className="text-terminal-border mx-1">{"·".repeat(10)}</span>
          <span className={game.awayScore > game.homeScore ? "text-terminal-green font-bold text-glow" : "text-terminal-fg"}>
            {awayScore}
          </span>
          {game.awayScore > game.homeScore && <span className="text-terminal-green text-xs ml-1">◄</span>}
        </span>
        <span className={border.className} aria-hidden="true">{border.side}</span>
      </div>

      {/* Home team */}
      <div>
        <span className={border.className} aria-hidden="true">{border.side}</span>
        <span className="px-1">
          <span className={game.homeScore > game.awayScore ? "text-terminal-green font-bold" : "text-terminal-fg"}>
            {homeName}
          </span>
          <span className="text-terminal-border mx-1">{"·".repeat(10)}</span>
          <span className={game.homeScore > game.awayScore ? "text-terminal-green font-bold text-glow" : "text-terminal-fg"}>
            {homeScore}
          </span>
          {game.homeScore > game.awayScore && <span className="text-terminal-green text-xs ml-1">◄</span>}
        </span>
        <span className={border.className} aria-hidden="true">{border.side}</span>
      </div>

      {/* Time/Venue line for scheduled games */}
      {game.status === "scheduled" && (
        <>
          <div className={border.className} aria-hidden="true">
            {border.mid}
          </div>
          <div>
            <span className={border.className} aria-hidden="true">{border.side}</span>
            <span className="px-1 text-terminal-muted">
              <span className="text-terminal-yellow mr-1">◈</span>
              {padString(formatTime(game.startTime), 18)}
            </span>
            <span className={border.className} aria-hidden="true">{border.side}</span>
          </div>
        </>
      )}

      {/* Bottom border */}
      <div className={border.className} aria-hidden="true">
        {border.bot}
      </div>
    </div>
  );
}
