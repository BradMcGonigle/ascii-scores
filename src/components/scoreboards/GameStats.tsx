import type { Game, GameStats as GameStatsType, GameStatus, League } from "@/lib/types";

interface GameStatsProps {
  game: Game;
}

/**
 * Helper to format a stat line
 */
function formatStat(
  stats: GameStatsType,
  key: string,
  label: string,
  defaultValue: string = "-"
): string | null {
  const awayVal = stats.away[key];
  const homeVal = stats.home[key];
  if (awayVal !== undefined || homeVal !== undefined) {
    return `${label}: ${awayVal ?? defaultValue}-${homeVal ?? defaultValue}`;
  }
  return null;
}

/**
 * Format stats for live NHL games
 */
function formatNHLLiveStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show shots on goal
  const sog = formatStat(stats, "SOG", "SOG");
  if (sog) lines.push(sog);

  return lines;
}

/**
 * Format stats for final NHL games
 */
function formatNHLFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show shots on goal
  const sog = formatStat(stats, "SOG", "SOG");
  if (sog) lines.push(sog);

  return lines;
}

/**
 * Format stats for live NBA games
 */
function formatNBALiveStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show rebounds
  const reb = formatStat(stats, "REB", "REB");
  if (reb) lines.push(reb);

  // Show fouls if available
  const fouls = formatStat(stats, "FLS", "FLS") ?? formatStat(stats, "FOULS", "FLS");
  if (fouls) lines.push(fouls);

  return lines;
}

/**
 * Format stats for final NBA games
 */
function formatNBAFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show FG%
  const fgPct = formatStat(stats, "FG%", "FG%");
  if (fgPct) lines.push(fgPct);

  // Show turnovers (ESPN uses TOV for NBA turnovers)
  const to = formatStat(stats, "TOV", "TO") ?? formatStat(stats, "TO", "TO", "0");
  if (to) lines.push(to);

  // Show rebounds
  const reb = formatStat(stats, "REB", "REB");
  if (reb) lines.push(reb);

  return lines;
}

/**
 * Format stats for live NFL games
 */
function formatNFLLiveStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show total yards
  const yds = formatStat(stats, "TYDS", "YDS") ?? formatStat(stats, "YDS", "YDS");
  if (yds) lines.push(yds);

  // Show turnovers
  const to = formatStat(stats, "TO", "TO", "0");
  if (to) lines.push(to);

  return lines;
}

/**
 * Format stats for final NFL games
 */
function formatNFLFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  // Show total yards
  const yds = formatStat(stats, "TYDS", "YDS") ?? formatStat(stats, "YDS", "YDS");
  if (yds) lines.push(yds);

  // Show turnovers
  const to = formatStat(stats, "TO", "TO", "0");
  if (to) lines.push(to);

  // Show possession time if available
  const poss = formatStat(stats, "TOP", "TOP") ?? formatStat(stats, "POSS", "TOP");
  if (poss) lines.push(poss);

  return lines;
}

/**
 * Format stats for MLB games
 */
function formatMLBStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const hits = formatStat(stats, "H", "H");
  if (hits) lines.push(hits);

  return lines;
}

/**
 * Format stats for MLS games
 */
function formatMLSStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const poss = formatStat(stats, "POSS", "POSS");
  if (poss) lines.push(poss);

  return lines;
}

/**
 * Format stats for display based on league and game status
 */
function formatStatsDisplay(
  stats: GameStatsType,
  league: League,
  status: GameStatus
): string[] {
  const isFinal = status === "final";

  switch (league) {
    case "nhl":
      return isFinal ? formatNHLFinalStats(stats) : formatNHLLiveStats(stats);
    case "nba":
      return isFinal ? formatNBAFinalStats(stats) : formatNBALiveStats(stats);
    case "nfl":
      return isFinal ? formatNFLFinalStats(stats) : formatNFLLiveStats(stats);
    case "mlb":
      return formatMLBStats(stats);
    case "mls":
      return formatMLSStats(stats);
    default:
      return [];
  }
}

/**
 * Game statistics component for displaying key stats
 */
export function GameStats({ game }: GameStatsProps) {
  const { stats, league, status } = game;

  // Don't render if no stats available
  if (!stats || (Object.keys(stats.home).length === 0 && Object.keys(stats.away).length === 0)) {
    return null;
  }

  const statLines = formatStatsDisplay(stats, league, status);

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
