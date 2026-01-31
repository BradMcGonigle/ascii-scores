import type { Game, GameStats, GameStatus, League, PeriodScore, PeriodScores, Scoreboard, Team } from "@/lib/types";
import { addDays, formatDateForAPI, isDateInPast } from "@/lib/utils/format";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * ESPN sport paths for each league (excluding F1 and PGA which have their own API clients)
 */
const LEAGUE_SPORT_MAP: Record<Exclude<League, "f1" | "pga">, string> = {
  nhl: "hockey/nhl",
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  mls: "soccer/usa.1",
};

/**
 * ESPN API response types (simplified)
 */
interface ESPNLinescore {
  value: number;
}

interface ESPNStatistic {
  name: string;
  abbreviation: string;
  displayValue: string;
}

interface ESPNRecord {
  name: string;
  type: string;
  summary: string;
}

interface ESPNCompetitor {
  id: string;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
    color?: string;
  };
  score?: string;
  homeAway: "home" | "away";
  linescores?: ESPNLinescore[];
  statistics?: ESPNStatistic[];
  records?: ESPNRecord[];
  /** MLB-specific: hits */
  hits?: number;
  /** MLB-specific: errors */
  errors?: number;
}

interface ESPNStatus {
  type: {
    name: string;
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
  period?: number;
  displayClock?: string;
}

interface ESPNVenue {
  fullName: string;
  address?: {
    city?: string;
    state?: string;
  };
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    id: string;
    venue?: ESPNVenue;
    broadcasts?: Array<{ names: string[] }>;
    competitors: ESPNCompetitor[];
    status: ESPNStatus;
  }>;
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

/**
 * Map ESPN status to our GameStatus type
 */
function mapStatus(status: ESPNStatus): GameStatus {
  const state = status.type.state.toLowerCase();
  const name = status.type.name.toLowerCase();

  if (state === "in") return "live";
  if (state === "post" || status.type.completed) return "final";
  if (name === "postponed") return "postponed";
  if (name === "delayed") return "delayed";
  return "scheduled";
}

/**
 * Map ESPN competitor to our Team type
 */
function mapTeam(competitor: ESPNCompetitor): Team {
  // Get overall record (type: "total" or first record)
  const record = competitor.records?.find(r => r.type === "total")?.summary
    ?? competitor.records?.[0]?.summary;

  return {
    id: competitor.team.id,
    name: competitor.team.name,
    abbreviation: competitor.team.abbreviation,
    displayName: competitor.team.displayName,
    logo: competitor.team.logo,
    color: competitor.team.color,
    record,
  };
}

/**
 * Map ESPN linescores to our PeriodScore array
 */
function mapLinescores(linescores?: ESPNLinescore[]): PeriodScore[] {
  if (!linescores || linescores.length === 0) return [];
  return linescores.map((ls, index) => ({
    period: index + 1,
    score: ls.value,
  }));
}

/**
 * Map ESPN competitors to PeriodScores
 */
function mapPeriodScores(
  homeCompetitor: ESPNCompetitor,
  awayCompetitor: ESPNCompetitor,
  league: League
): PeriodScores | undefined {
  const homeLinescores = mapLinescores(homeCompetitor.linescores);
  const awayLinescores = mapLinescores(awayCompetitor.linescores);

  // Only return period scores if we have data
  if (homeLinescores.length === 0 && awayLinescores.length === 0) {
    return undefined;
  }

  const periodScores: PeriodScores = {
    home: homeLinescores,
    away: awayLinescores,
  };

  // Add MLB-specific stats
  if (league === "mlb") {
    if (homeCompetitor.hits !== undefined) {
      periodScores.homeHits = homeCompetitor.hits;
    }
    if (awayCompetitor.hits !== undefined) {
      periodScores.awayHits = awayCompetitor.hits;
    }
    if (homeCompetitor.errors !== undefined) {
      periodScores.homeErrors = homeCompetitor.errors;
    }
    if (awayCompetitor.errors !== undefined) {
      periodScores.awayErrors = awayCompetitor.errors;
    }
  }

  return periodScores;
}

/**
 * Key stats to extract for each league
 * Maps ESPN stat names to display labels
 */
const LEAGUE_KEY_STATS: Record<Exclude<League, "f1" | "pga">, string[]> = {
  nhl: ["shotsOnGoal", "powerPlayGoals", "powerPlayOpportunities", "goals", "assists", "savePct"],
  nfl: ["totalYards", "turnovers", "passingYards", "rushingYards", "possessionTime"],
  nba: ["rebounds", "assists", "fieldGoalPct", "freeThrowPct", "threePointFieldGoalPct", "turnovers", "fouls"],
  mlb: ["hits", "strikeouts", "homeRuns"],
  mls: ["possessionPct", "shotsOnTarget", "saves"],
};

/**
 * Extract key statistics from ESPN competitor
 * Uses stat name as key for consistent access regardless of ESPN's abbreviations
 */
function extractStats(
  statistics: ESPNStatistic[] | undefined,
  league: Exclude<League, "f1" | "pga">
): Record<string, string | number> {
  if (!statistics || statistics.length === 0) return {};

  const keyStats = LEAGUE_KEY_STATS[league];
  const result: Record<string, string | number> = {};

  for (const stat of statistics) {
    if (keyStats.includes(stat.name)) {
      result[stat.name] = stat.displayValue;
    }
  }

  return result;
}

/**
 * Map ESPN competitors to GameStats
 */
function mapGameStats(
  homeCompetitor: ESPNCompetitor,
  awayCompetitor: ESPNCompetitor,
  league: League
): GameStats | undefined {
  if (league === "f1" || league === "pga") return undefined;

  const homeStats = extractStats(homeCompetitor.statistics, league);
  const awayStats = extractStats(awayCompetitor.statistics, league);

  // Only return stats if we have data
  if (Object.keys(homeStats).length === 0 && Object.keys(awayStats).length === 0) {
    return undefined;
  }

  return { home: homeStats, away: awayStats };
}

/**
 * Format venue location from city and state
 */
function formatVenueLocation(venue?: ESPNVenue): string | undefined {
  const city = venue?.address?.city;
  const state = venue?.address?.state;
  if (city && state) {
    return `${city}, ${state}`;
  }
  if (city) {
    return city;
  }
  return undefined;
}

/**
 * Map ESPN event to our Game type
 */
function mapEvent(event: ESPNEvent, league: League): Game {
  const competition = event.competitions[0];
  const homeCompetitor = competition.competitors.find(
    (c) => c.homeAway === "home"
  )!;
  const awayCompetitor = competition.competitors.find(
    (c) => c.homeAway === "away"
  )!;
  const status = competition.status;

  return {
    id: event.id,
    league,
    status: mapStatus(status),
    startTime: new Date(event.date),
    venue: competition.venue?.fullName,
    venueLocation: formatVenueLocation(competition.venue),
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    homeTeam: mapTeam(homeCompetitor),
    awayTeam: mapTeam(awayCompetitor),
    homeScore: parseInt(homeCompetitor.score ?? "0", 10),
    awayScore: parseInt(awayCompetitor.score ?? "0", 10),
    period: status.period?.toString(),
    clock: status.displayClock,
    detail: status.type.shortDetail,
    periodScores: mapPeriodScores(homeCompetitor, awayCompetitor, league),
    stats: mapGameStats(homeCompetitor, awayCompetitor, league),
  };
}

/**
 * Fetch scoreboard data for a league from ESPN
 * @param league - The league to fetch scores for
 * @param date - Optional date to fetch scores for (defaults to today)
 */
export async function getESPNScoreboard(
  league: Exclude<League, "f1" | "pga">,
  date?: Date
): Promise<Scoreboard> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const baseUrl = `${ESPN_BASE_URL}/${sportPath}/scoreboard`;

  // Add date parameter if provided
  const url = date
    ? `${baseUrl}?dates=${formatDateForAPI(date)}`
    : baseUrl;

  // Determine caching strategy:
  // - Past dates: cache indefinitely (games are final, won't change)
  // - Today/future: revalidate every 30s for live updates
  const isPastDate = date && isDateInPast(date);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: isPastDate ? false : 30,
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  const data: ESPNScoreboardResponse = await response.json();

  const games = data.events.map((event) => mapEvent(event, league));

  return {
    league,
    games,
    lastUpdated: new Date(),
    date: date ?? new Date(),
  };
}

/**
 * Check if any games are currently live for a league
 */
export function hasLiveGames(scoreboard: Scoreboard): boolean {
  return scoreboard.games.some((game) => game.status === "live");
}

/**
 * Fetch game counts for a range of dates to enable smart navigation
 * Returns an array of date strings (YYYYMMDD) that have games
 * @param league - The league to check
 * @param daysBack - Number of days in the past to check
 * @param daysForward - Number of days in the future to check
 */
export async function getDatesWithGames(
  league: Exclude<League, "f1" | "pga">,
  daysBack: number = 5,
  daysForward: number = 5
): Promise<string[]> {
  const today = new Date();
  const dates: Date[] = [];

  // Build array of dates to check
  for (let i = -daysBack; i <= daysForward; i++) {
    dates.push(addDays(today, i));
  }

  const sportPath = LEAGUE_SPORT_MAP[league];

  // Fetch all dates in parallel
  const results = await Promise.all(
    dates.map(async (date) => {
      const dateStr = formatDateForAPI(date);
      const url = `${ESPN_BASE_URL}/${sportPath}/scoreboard?dates=${dateStr}`;

      // Past dates can be cached indefinitely, future/today revalidate every 5 min
      const isPast = isDateInPast(date);

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: isPast ? false : 300 },
        });

        if (!response.ok) return null;

        const data: ESPNScoreboardResponse = await response.json();
        return data.events.length > 0 ? dateStr : null;
      } catch {
        return null;
      }
    })
  );

  // Filter out nulls and return dates that have games
  return results.filter((date): date is string => date !== null);
}
