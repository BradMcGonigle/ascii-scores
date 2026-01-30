import type { Game } from "@/lib/types";
import { formatTime, getStatusClass, getStatusText, padString } from "@/lib/utils/format";

interface GameCardProps {
  game: Game;
}

/**
 * ASCII game card component for displaying a single game
 */
export function GameCard({ game }: GameCardProps) {
  const statusClass = getStatusClass(game.status);
  const statusText = getStatusText(game.status, game.detail);

  const awayName = padString(game.awayTeam.abbreviation, 4);
  const homeName = padString(game.homeTeam.abbreviation, 4);
  const awayScore = padString(game.awayScore.toString(), 3, "right");
  const homeScore = padString(game.homeScore.toString(), 3, "right");

  return (
    <div className="font-mono text-sm" role="article" aria-label={`${game.awayTeam.displayName} vs ${game.homeTeam.displayName}`}>
      {/* Top border */}
      <div className="text-terminal-border" aria-hidden="true">
        ┌──────────────────────┐
      </div>

      {/* Status line */}
      <div>
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className={`${statusClass} px-1`}>
          {padString(statusText, 20)}
        </span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      {/* Separator */}
      <div className="text-terminal-border" aria-hidden="true">
        ├──────────────────────┤
      </div>

      {/* Away team */}
      <div>
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className="px-1">
          {awayName}
          <span className="text-terminal-muted mx-2">............</span>
          <span className={game.awayScore > game.homeScore ? "text-terminal-green" : ""}>
            {awayScore}
          </span>
        </span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      {/* Home team */}
      <div>
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className="px-1">
          {homeName}
          <span className="text-terminal-muted mx-2">............</span>
          <span className={game.homeScore > game.awayScore ? "text-terminal-green" : ""}>
            {homeScore}
          </span>
        </span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      {/* Time/Venue line for scheduled games */}
      {game.status === "scheduled" && (
        <>
          <div className="text-terminal-border" aria-hidden="true">
            ├──────────────────────┤
          </div>
          <div>
            <span className="text-terminal-border" aria-hidden="true">│</span>
            <span className="px-1 text-terminal-muted">
              {padString(formatTime(game.startTime), 20)}
            </span>
            <span className="text-terminal-border" aria-hidden="true">│</span>
          </div>
        </>
      )}

      {/* Bottom border */}
      <div className="text-terminal-border" aria-hidden="true">
        └──────────────────────┘
      </div>
    </div>
  );
}
