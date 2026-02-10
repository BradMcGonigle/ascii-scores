import type { Game, GameStats as GameStatsType, GameStatus, League } from "@/lib/types";
import { getStatFullName } from "@/lib/stats/definitions";

interface GameStatsProps {
  game: Game;
}

/**
 * Structured stat data for rendering
 */
interface StatData {
  key: string;
  label: string;
  awayValue: string;
  homeValue: string;
}

/**
 * Helper to create stat data object
 */
function createStatData(
  stats: GameStatsType,
  key: string,
  label: string,
  defaultValue: string = "-"
): StatData | null {
  const awayVal = stats.away[key];
  const homeVal = stats.home[key];
  if (awayVal !== undefined || homeVal !== undefined) {
    return {
      key,
      label,
      awayValue: String(awayVal ?? defaultValue),
      homeValue: String(homeVal ?? defaultValue),
    };
  }
  return null;
}

/**
 * Format stats for live NHL games
 */
function getNHLLiveStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const goals = createStatData(stats, "goals", "G");
  if (goals) result.push(goals);

  const assists = createStatData(stats, "assists", "A");
  if (assists) result.push(assists);

  const savePct = createStatData(stats, "savePct", "SV%");
  if (savePct) result.push(savePct);

  return result;
}

/**
 * Format stats for final NHL games
 */
function getNHLFinalStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const goals = createStatData(stats, "goals", "G");
  if (goals) result.push(goals);

  const assists = createStatData(stats, "assists", "A");
  if (assists) result.push(assists);

  const savePct = createStatData(stats, "savePct", "SV%");
  if (savePct) result.push(savePct);

  return result;
}

/**
 * Format stats for live NBA games
 */
function getNBALiveStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const fgPct = createStatData(stats, "fieldGoalPct", "FG%");
  if (fgPct) result.push(fgPct);

  const ftPct = createStatData(stats, "freeThrowPct", "FT%");
  if (ftPct) result.push(ftPct);

  const threePct = createStatData(stats, "threePointFieldGoalPct", "3P%");
  if (threePct) result.push(threePct);

  return result;
}

/**
 * Format stats for final NBA games
 */
function getNBAFinalStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const fgPct = createStatData(stats, "fieldGoalPct", "FG%");
  if (fgPct) result.push(fgPct);

  const ftPct = createStatData(stats, "freeThrowPct", "FT%");
  if (ftPct) result.push(ftPct);

  const threePct = createStatData(stats, "threePointFieldGoalPct", "3P%");
  if (threePct) result.push(threePct);

  return result;
}

/**
 * Format stats for live NFL games
 */
function getNFLLiveStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const yds = createStatData(stats, "totalYards", "YDS");
  if (yds) result.push(yds);

  const to = createStatData(stats, "turnovers", "TO");
  if (to) result.push(to);

  return result;
}

/**
 * Format stats for final NFL games
 */
function getNFLFinalStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const yds = createStatData(stats, "totalYards", "YDS");
  if (yds) result.push(yds);

  const to = createStatData(stats, "turnovers", "TO");
  if (to) result.push(to);

  const poss = createStatData(stats, "possessionTime", "TOP");
  if (poss) result.push(poss);

  return result;
}

/**
 * Format stats for MLB games
 */
function getMLBStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const hits = createStatData(stats, "hits", "H");
  if (hits) result.push(hits);

  return result;
}

/**
 * Format stats for MLS games
 */
function getMLSStats(stats: GameStatsType): StatData[] {
  const result: StatData[] = [];

  const poss = createStatData(stats, "possessionPct", "POSS");
  if (poss) result.push(poss);

  return result;
}

/**
 * Get stats data based on league and game status
 */
function getStatsData(
  stats: GameStatsType,
  league: League,
  status: GameStatus
): StatData[] {
  const isFinal = status === "final";

  switch (league) {
    case "nhl":
      return isFinal ? getNHLFinalStats(stats) : getNHLLiveStats(stats);
    case "nba":
    case "ncaam":
    case "ncaaw":
      return isFinal ? getNBAFinalStats(stats) : getNBALiveStats(stats);
    case "nfl":
      return isFinal ? getNFLFinalStats(stats) : getNFLLiveStats(stats);
    case "mlb":
      return getMLBStats(stats);
    case "mls":
    case "fa-cup":
      return getMLSStats(stats);
    default:
      return [];
  }
}

/**
 * Check if stats should use full-width layout
 */
function shouldUseFullWidthLayout(league: League, status: GameStatus): boolean {
  if (status !== "live" && status !== "final") return false;
  return league === "nba" || league === "nhl" || league === "ncaam" || league === "ncaaw";
}

/**
 * Render a single stat with accessible abbreviation
 */
function StatItem({ stat }: { stat: StatData }) {
  const fullName = getStatFullName(stat.label);

  return (
    <span>
      <abbr title={fullName} className="no-underline">
        <span className="sr-only">{fullName}</span>
        {stat.label}
      </abbr>
      : {stat.awayValue}-{stat.homeValue}
    </span>
  );
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

  const statsData = getStatsData(stats, league, status);

  if (statsData.length === 0) {
    return null;
  }

  // Use full-width evenly spaced layout for certain combinations
  if (shouldUseFullWidthLayout(league, status)) {
    return (
      <div className="font-mono text-xs text-terminal-muted flex justify-between">
        {statsData.map((stat) => (
          <StatItem key={stat.key} stat={stat} />
        ))}
      </div>
    );
  }

  return (
    <div className="font-mono text-xs text-terminal-muted">
      <span className="text-terminal-cyan">◆</span>{" "}
      {statsData.map((stat, index) => (
        <span key={stat.key}>
          {index > 0 && "  "}
          <StatItem stat={stat} />
        </span>
      ))}
    </div>
  );
}
