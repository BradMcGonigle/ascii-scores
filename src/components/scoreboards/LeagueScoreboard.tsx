import type { Scoreboard } from "@/lib/types";
import { LEAGUES } from "@/lib/types";
import { getRelativeDateLabel, isToday } from "@/lib/utils/format";
import { SyncStatus } from "@/components/SyncStatus";
import { GameCard } from "./GameCard";

interface LeagueScoreboardProps {
  scoreboard: Scoreboard;
}

/**
 * Section header component with decorative ASCII styling
 */
function SectionHeader({
  title,
  count,
  variant,
}: {
  title: string;
  count: number;
  variant: "live" | "scheduled" | "final";
}) {
  const styles = {
    live: {
      color: "text-terminal-green",
      glow: "glow-green",
      icon: "●",
      border: "═",
      corners: { left: "╔", right: "╗" },
      srLabel: "Live games in progress",
    },
    scheduled: {
      color: "text-terminal-yellow",
      glow: "glow-amber",
      icon: "◈",
      border: "━",
      corners: { left: "┏", right: "┓" },
      srLabel: "Upcoming scheduled games",
    },
    final: {
      color: "text-terminal-muted",
      glow: "",
      icon: "◇",
      border: "─",
      corners: { left: "┌", right: "┐" },
      srLabel: "Completed games",
    },
  };

  const style = styles[variant];

  return (
    <h2 className={`font-mono ${style.color} mb-4`}>
      <span className="sr-only">{style.srLabel}: {count} {count === 1 ? 'game' : 'games'}</span>
      <span aria-hidden="true">
        <span className="text-terminal-border">{style.corners.left}</span>
        <span className={style.color}>{style.border.repeat(3)}</span>
        <span className={`${style.glow} mx-2`}>
          {variant === "live" && <span className="glow-pulse mr-1">{style.icon}</span>}
          {variant !== "live" && <span className="mr-1">{style.icon}</span>}
          {title.toUpperCase()} ({count})
        </span>
        <span className={style.color}>{style.border.repeat(3)}</span>
        <span className="text-terminal-border">{style.corners.right}</span>
      </span>
    </h2>
  );
}

/**
 * Displays a scoreboard for a league with all games
 */
export function LeagueScoreboard({ scoreboard }: LeagueScoreboardProps) {
  const league = LEAGUES[scoreboard.league];
  const dateLabel = getRelativeDateLabel(scoreboard.date);
  const isTodayDate = isToday(scoreboard.date);

  if (scoreboard.games.length === 0) {
    const noGamesMessage = isTodayDate
      ? `No ${league.name} games scheduled today`
      : `No ${league.name} games on ${dateLabel}`;

    return (
      <div className="font-mono text-center py-12 px-4">
        <div className="inline-block max-w-full">
          {/* Top border */}
          <div className="text-terminal-border hidden sm:block" aria-hidden="true">
            ╔══════════════════════════════════════════════╗
          </div>
          <div className="text-terminal-border sm:hidden" aria-hidden="true">
            ╔════════════════════════════╗
          </div>

          {/* Decorative padding row */}
          <div className="text-terminal-border hidden sm:block" aria-hidden="true">
            ║{"░".repeat(46)}║
          </div>
          <div className="text-terminal-border sm:hidden" aria-hidden="true">
            ║{"░".repeat(28)}║
          </div>

          {/* Message row */}
          <div className="flex items-center">
            <span className="text-terminal-border" aria-hidden="true">║</span>
            <span className="text-terminal-muted px-2 flex-1 text-center whitespace-nowrap overflow-hidden text-ellipsis">
              {noGamesMessage}
            </span>
            <span className="text-terminal-border" aria-hidden="true">║</span>
          </div>

          {/* Decorative padding row */}
          <div className="text-terminal-border hidden sm:block" aria-hidden="true">
            ║{"░".repeat(46)}║
          </div>
          <div className="text-terminal-border sm:hidden" aria-hidden="true">
            ║{"░".repeat(28)}║
          </div>

          {/* Bottom border */}
          <div className="text-terminal-border hidden sm:block" aria-hidden="true">
            ╚══════════════════════════════════════════════╝
          </div>
          <div className="text-terminal-border sm:hidden" aria-hidden="true">
            ╚════════════════════════════╝
          </div>
        </div>
        <div className="mt-4 text-terminal-muted text-xs">
          <span className="text-terminal-cyan">{">"}</span>{" "}
          {isTodayDate
            ? "Check back later for game updates"
            : "Use navigation to browse other dates"}
        </div>
      </div>
    );
  }

  // Group games by status
  const liveGames = scoreboard.games.filter((g) => g.status === "live");
  const scheduledGames = scoreboard.games.filter((g) => g.status === "scheduled");
  const finalGames = scoreboard.games.filter((g) => g.status === "final");

  return (
    <div className="space-y-8">
      {/* Live games section */}
      {liveGames.length > 0 && (
        <section aria-label="Live games" className="relative">
          <SectionHeader title="LIVE" count={liveGames.length} variant="live" />
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
          <SectionHeader title="SCHEDULED" count={scheduledGames.length} variant="scheduled" />
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
          <SectionHeader title="FINAL" count={finalGames.length} variant="final" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {finalGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Last updated with enhanced styling */}
      <div className="font-mono text-center pt-6" role="status" aria-live="polite">
        <div className="inline-block">
          <div className="text-terminal-border text-xs" aria-hidden="true">
            ├────────────────────────────────────────────┤
          </div>
          <div className="text-terminal-muted text-sm py-2">
            <span className="text-terminal-cyan mr-2" aria-hidden="true">◆</span>
            <span className="sr-only">Data sync status: </span>
            <SyncStatus lastUpdated={scoreboard.lastUpdated} />
            <span className="text-terminal-green ml-2" aria-hidden="true">●</span>
          </div>
          <div className="text-terminal-border text-xs" aria-hidden="true">
            └────────────────────────────────────────────┘
          </div>
        </div>
      </div>
    </div>
  );
}
