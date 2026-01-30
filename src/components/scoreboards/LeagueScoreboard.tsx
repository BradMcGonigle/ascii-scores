import type { Scoreboard } from "@/lib/types";
import { LEAGUES } from "@/lib/types";
import { GameCard } from "./GameCard";

interface LeagueScoreboardProps {
  scoreboard: Scoreboard;
}

/**
 * Displays a scoreboard for a league with all games
 */
export function LeagueScoreboard({ scoreboard }: LeagueScoreboardProps) {
  const league = LEAGUES[scoreboard.league];

  if (scoreboard.games.length === 0) {
    return (
      <div className="font-mono text-center py-8">
        <div className="text-terminal-border" aria-hidden="true">
          ╔════════════════════════════════════════╗
        </div>
        <div>
          <span className="text-terminal-border" aria-hidden="true">║</span>
          <span className="text-terminal-muted px-4">
            {"    "}No {league.name} games scheduled today{"    "}
          </span>
          <span className="text-terminal-border" aria-hidden="true">║</span>
        </div>
        <div className="text-terminal-border" aria-hidden="true">
          ╚════════════════════════════════════════╝
        </div>
      </div>
    );
  }

  // Group games by status
  const liveGames = scoreboard.games.filter((g) => g.status === "live");
  const scheduledGames = scoreboard.games.filter((g) => g.status === "scheduled");
  const finalGames = scoreboard.games.filter((g) => g.status === "final");

  return (
    <div className="space-y-6">
      {/* Live games section */}
      {liveGames.length > 0 && (
        <section aria-label="Live games">
          <h2 className="font-mono text-terminal-green mb-4">
            ═══ LIVE ({liveGames.length}) ═══
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Scheduled games section */}
      {scheduledGames.length > 0 && (
        <section aria-label="Scheduled games">
          <h2 className="font-mono text-terminal-yellow mb-4">
            ═══ SCHEDULED ({scheduledGames.length}) ═══
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scheduledGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Final games section */}
      {finalGames.length > 0 && (
        <section aria-label="Final games">
          <h2 className="font-mono text-terminal-muted mb-4">
            ═══ FINAL ({finalGames.length}) ═══
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {finalGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Last updated */}
      <div className="text-terminal-muted text-sm font-mono text-center pt-4 border-t border-terminal-border">
        Last updated: {scoreboard.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
}
