import type { Game, GameStats, GameStatus, League, LeagueStandings, PeriodScore, PeriodScores, Scoreboard, StandingsEntry, StandingsGroup, Team } from "@/lib/types";
import { addDays, formatDateForAPI, isDateInPast } from "@/lib/utils/format";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_STANDINGS_URL = "https://site.web.api.espn.com/apis/v2/sports";

/**
 * ESPN sport paths for each league (excluding F1 and PGA which have their own API clients)
 */
const LEAGUE_SPORT_MAP: Record<Exclude<League, "f1" | "pga">, string> = {
  nhl: "hockey/nhl",
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  mls: "soccer/usa.1",
  epl: "soccer/eng.1",
  ncaam: "basketball/mens-college-basketball",
  ncaaw: "basketball/womens-college-basketball",
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
  /** College sports: team ranking (AP Top 25, etc.) */
  curatedRank?: {
    current: number;
  };
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

  // Get team ranking for college sports (only include if in top 25)
  const rawRank = competitor.curatedRank?.current;
  const rank = rawRank && rawRank > 0 && rawRank <= 25 ? rawRank : undefined;

  return {
    id: competitor.team.id,
    name: competitor.team.name,
    abbreviation: competitor.team.abbreviation,
    displayName: competitor.team.displayName,
    logo: competitor.team.logo,
    color: competitor.team.color,
    record,
    rank,
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
  epl: ["possessionPct", "shotsOnTarget", "saves"],
  ncaam: ["rebounds", "assists", "fieldGoalPct", "freeThrowPct", "threePointFieldGoalPct", "turnovers", "fouls"],
  ncaaw: ["rebounds", "assists", "fieldGoalPct", "freeThrowPct", "threePointFieldGoalPct", "turnovers", "fouls"],
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

/**
 * ESPN Standings API response types
 */
interface ESPNStandingsStat {
  name: string;
  displayName: string;
  shortDisplayName: string;
  description: string;
  abbreviation: string;
  type: string;
  value?: number;
  displayValue: string;
}

interface ESPNStandingsTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logos?: Array<{ href: string }>;
}

interface ESPNStandingsEntry {
  team: ESPNStandingsTeam;
  stats: ESPNStandingsStat[];
}

interface ESPNStandingsGroup {
  name: string;
  abbreviation?: string;
  standings: {
    entries: ESPNStandingsEntry[];
  };
}

interface ESPNStandingsChild {
  name: string;
  abbreviation?: string;
  children?: ESPNStandingsGroup[];
  standings?: {
    entries: ESPNStandingsEntry[];
  };
}

// Note: ESPN API response structure varies by league, so we parse flexibly
// rather than typing strictly. Expected structures:
// - { children: ESPNStandingsChild[] } for leagues with divisions/conferences
// - { standings: { entries: ESPNStandingsEntry[] } } for flat standings

/**
 * Key stats to extract for standings by league
 * Order matters - first stat is primary sort
 */
const STANDINGS_STATS: Record<Exclude<League, "f1" | "pga">, string[]> = {
  nhl: ["points", "gamesPlayed", "wins", "losses", "otLosses", "goalsFor", "goalsAgainst", "goalDifferential"],
  nfl: ["wins", "losses", "ties", "winPercent", "pointsFor", "pointsAgainst", "pointDifferential"],
  nba: ["wins", "losses", "winPercent", "gamesBehind", "streak"],
  mlb: ["wins", "losses", "winPercent", "gamesBehind", "runsFor", "runsAgainst", "runDifferential"],
  mls: ["points", "gamesPlayed", "wins", "losses", "ties", "goalDifferential"],
  epl: ["points", "gamesPlayed", "wins", "losses", "ties", "goalDifferential"],
  ncaam: ["wins", "losses", "winPercent", "conferenceWins", "conferenceLosses"],
  ncaaw: ["wins", "losses", "winPercent", "conferenceWins", "conferenceLosses"],
};

/**
 * Map ESPN standings entry to our StandingsEntry type
 */
function mapStandingsEntry(
  entry: ESPNStandingsEntry,
  league: Exclude<League, "f1" | "pga">
): StandingsEntry {
  const keyStats = STANDINGS_STATS[league];
  const stats: Record<string, string | number> = {};

  for (const stat of entry.stats) {
    if (keyStats.includes(stat.name)) {
      // Use displayValue for formatted output
      stats[stat.name] = stat.displayValue;
    }
  }

  return {
    team: {
      id: entry.team.id,
      name: entry.team.name,
      abbreviation: entry.team.abbreviation,
      displayName: entry.team.displayName,
      logo: entry.team.logos?.[0]?.href,
    },
    stats,
  };
}

/**
 * Recursively extract standings groups from ESPN response
 */
function extractStandingsGroups(
  children: ESPNStandingsChild[],
  league: Exclude<League, "f1" | "pga">
): StandingsGroup[] {
  const groups: StandingsGroup[] = [];

  for (const child of children) {
    // If this child has nested children (conferences with divisions)
    if (child.children && child.children.length > 0) {
      for (const subChild of child.children) {
        if (subChild.standings?.entries) {
          groups.push({
            name: subChild.name,
            entries: subChild.standings.entries.map((e) => mapStandingsEntry(e, league)),
          });
        }
      }
    }
    // If this child has direct standings (e.g., soccer tables)
    else if (child.standings?.entries) {
      groups.push({
        name: child.name,
        entries: child.standings.entries.map((e) => mapStandingsEntry(e, league)),
      });
    }
  }

  return groups;
}

/**
 * Fetch standings data for a league from ESPN
 * @param league - The league to fetch standings for
 */
export async function getESPNStandings(
  league: Exclude<League, "f1" | "pga">
): Promise<LeagueStandings> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const url = `${ESPN_STANDINGS_URL}/${sportPath}/standings`;

  // Standings update infrequently, cache for 5 minutes
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 300,
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  let groups: StandingsGroup[] = [];

  // Handle different response structures
  // ESPN API structure varies by league - some have children (divisions/conferences),
  // some have direct standings
  if (data.children && Array.isArray(data.children) && data.children.length > 0) {
    groups = extractStandingsGroups(data.children as ESPNStandingsChild[], league);
  } else if (data.standings?.entries && Array.isArray(data.standings.entries)) {
    // Direct standings (no divisions/conferences)
    groups = [{
      name: "Standings",
      entries: data.standings.entries.map((e: ESPNStandingsEntry) => mapStandingsEntry(e, league)),
    }];
  } else {
    // Log unexpected structure for debugging
    console.warn(`Unexpected ESPN standings response structure for ${league}:`, Object.keys(data));
  }

  return {
    league,
    groups,
    lastUpdated: new Date(),
  };
}
