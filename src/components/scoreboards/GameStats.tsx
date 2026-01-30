import type { Game, GameStats as GameStatsType, League } from "@/lib/types";

interface GameStatsProps {
  game: Game;
}

/**
 * Get stat display labels for each league
 */
function getStatLabels(league: League): Record<string, string> {
  switch (league) {
    case "nhl":
      return {
        SOG: "SOG",
        PPG: "PP",
        PPO: "PP",
      };
    case "nfl":
      return {
        TYDS: "YDS",
        TO: "TO",
        PYDS: "PASS",
        RYDS: "RUSH",
      };
    case "nba":
      return {
        REB: "REB",
        AST: "AST",
        "FG%": "FG%",
      };
    case "mlb":
      return {
        H: "H",
        K: "K",
        HR: "HR",
      };
    case "mls":
      return {
        POSS: "POSS",
        SOT: "SOT",
        SV: "SV",
      };
    default:
      return {};
  }
}

/**
 * Format stats for display - shows most meaningful 1-2 stats
 */
function formatStatsDisplay(
  stats: GameStatsType,
  league: League
): string[] {
  const labels = getStatLabels(league);
  const statKeys = Object.keys(labels);
  const lines: string[] = [];

  // For NHL, show shots and power play in a nice format
  if (league === "nhl") {
    const awaySog = stats.away["SOG"] ?? "-";
    const homeSog = stats.home["SOG"] ?? "-";
    if (awaySog !== "-" || homeSog !== "-") {
      lines.push(`SOG: ${awaySog}-${homeSog}`);
    }
  }
  // For NFL, show total yards
  else if (league === "nfl") {
    const awayYds = stats.away["TYDS"] ?? stats.away["YDS"];
    const homeYds = stats.home["TYDS"] ?? stats.home["YDS"];
    if (awayYds || homeYds) {
      lines.push(`YDS: ${awayYds ?? "-"}-${homeYds ?? "-"}`);
    }
    const awayTo = stats.away["TO"];
    const homeTo = stats.home["TO"];
    if (awayTo || homeTo) {
      lines.push(`TO: ${awayTo ?? "0"}-${homeTo ?? "0"}`);
    }
  }
  // For NBA, show rebounds and assists
  else if (league === "nba") {
    const awayReb = stats.away["REB"];
    const homeReb = stats.home["REB"];
    if (awayReb || homeReb) {
      lines.push(`REB: ${awayReb ?? "-"}-${homeReb ?? "-"}`);
    }
  }
  // For MLS, show possession
  else if (league === "mls") {
    const awayPoss = stats.away["POSS"];
    const homePoss = stats.home["POSS"];
    if (awayPoss || homePoss) {
      lines.push(`POSS: ${awayPoss ?? "-"}-${homePoss ?? "-"}`);
    }
  }
  // Generic format for other stats
  else {
    for (const key of statKeys.slice(0, 2)) {
      const awayVal = stats.away[key];
      const homeVal = stats.home[key];
      if (awayVal !== undefined || homeVal !== undefined) {
        lines.push(`${labels[key]}: ${awayVal ?? "-"}-${homeVal ?? "-"}`);
      }
    }
  }

  return lines;
}

/**
 * Game statistics component for displaying key stats
 */
export function GameStats({ game }: GameStatsProps) {
  const { stats, league } = game;

  // Don't render if no stats available
  if (!stats || (Object.keys(stats.home).length === 0 && Object.keys(stats.away).length === 0)) {
    return null;
  }

  const statLines = formatStatsDisplay(stats, league);

  if (statLines.length === 0) {
    return null;
  }

  return (
    <div className="font-mono text-xs text-terminal-muted">
      <span className="text-terminal-cyan">◆</span>{" "}
      {statLines.join("  ")}
    </div>
  );
}
