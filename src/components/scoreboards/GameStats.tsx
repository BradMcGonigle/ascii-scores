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

  const goals = formatStat(stats, "goals", "G");
  if (goals) lines.push(goals);

  const assists = formatStat(stats, "assists", "A");
  if (assists) lines.push(assists);

  const savePct = formatStat(stats, "savePct", "SV%");
  if (savePct) lines.push(savePct);

  return lines;
}

/**
 * Format stats for final NHL games
 */
function formatNHLFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const goals = formatStat(stats, "goals", "G");
  if (goals) lines.push(goals);

  const assists = formatStat(stats, "assists", "A");
  if (assists) lines.push(assists);

  const savePct = formatStat(stats, "savePct", "SV%");
  if (savePct) lines.push(savePct);

  return lines;
}

/**
 * Format stats for live NBA games
 */
function formatNBALiveStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const fgPct = formatStat(stats, "fieldGoalPct", "FG%");
  if (fgPct) lines.push(fgPct);

  const ftPct = formatStat(stats, "freeThrowPct", "FT%");
  if (ftPct) lines.push(ftPct);

  const threePct = formatStat(stats, "threePointFieldGoalPct", "3P%");
  if (threePct) lines.push(threePct);

  return lines;
}

/**
 * Format stats for final NBA games
 */
function formatNBAFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const fgPct = formatStat(stats, "fieldGoalPct", "FG%");
  if (fgPct) lines.push(fgPct);

  const ftPct = formatStat(stats, "freeThrowPct", "FT%");
  if (ftPct) lines.push(ftPct);

  const threePct = formatStat(stats, "threePointFieldGoalPct", "3P%");
  if (threePct) lines.push(threePct);

  return lines;
}

/**
 * Format stats for live NFL games
 */
function formatNFLLiveStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const yds = formatStat(stats, "totalYards", "YDS");
  if (yds) lines.push(yds);

  const to = formatStat(stats, "turnovers", "TO");
  if (to) lines.push(to);

  return lines;
}

/**
 * Format stats for final NFL games
 */
function formatNFLFinalStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const yds = formatStat(stats, "totalYards", "YDS");
  if (yds) lines.push(yds);

  const to = formatStat(stats, "turnovers", "TO");
  if (to) lines.push(to);

  const poss = formatStat(stats, "possessionTime", "TOP");
  if (poss) lines.push(poss);

  return lines;
}

/**
 * Format stats for MLB games
 */
function formatMLBStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const hits = formatStat(stats, "hits", "H");
  if (hits) lines.push(hits);

  return lines;
}

/**
 * Format stats for MLS games
 */
function formatMLSStats(stats: GameStatsType): string[] {
  const lines: string[] = [];

  const poss = formatStat(stats, "possessionPct", "POSS");
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
 * Check if stats should use full-width layout
 */
function shouldUseFullWidthLayout(league: League, status: GameStatus): boolean {
  if (status !== "live" && status !== "final") return false;
  return league === "nba" || league === "nhl";
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

  // Use full-width evenly spaced layout for certain combinations
  if (shouldUseFullWidthLayout(league, status)) {
    return (
      <div className="font-mono text-xs text-terminal-muted flex justify-between">
        {statLines.map((stat) => (
          <span key={stat}>{stat}</span>
        ))}
      </div>
    );
  }

  return (
    <div className="font-mono text-xs text-terminal-muted">
      <span className="text-terminal-cyan">◆</span>{" "}
      {statLines.join("  ")}
    </div>
  );
}
