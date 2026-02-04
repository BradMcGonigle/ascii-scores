import type { Game, GameStats, GameStatus, GameType, League, LeagueStandings, NCAAPolls, PeriodScore, PeriodScores, RankedTeam, Scoreboard, StandingsEntry, StandingsGroup, Team } from "@/lib/types";
import { addDays, formatDateForAPI, getTodayInEastern, getTodayInUK, isDateInPast } from "@/lib/utils/format";

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
 * Get the timezone used for a league's schedule.
 * US sports use Eastern time, EPL uses UK time.
 */
export function getTimezoneForLeague(league: Exclude<League, "f1" | "pga">): string {
  if (league === "epl") {
    return "Europe/London";
  }
  // US sports (NHL, NFL, NBA, MLB, MLS, NCAAM, NCAAW) use Eastern time
  return "America/New_York";
}

/**
 * Get "today" in the appropriate timezone for a league's schedule.
 * US sports use Eastern time, EPL uses UK time.
 * This determines which day's games to show, not how times are displayed
 * (game times are always shown in the user's local timezone).
 */
export function getTodayForLeague(league: Exclude<League, "f1" | "pga">): Date {
  if (league === "epl") {
    return getTodayInUK();
  }
  // US sports (NHL, NFL, NBA, MLB, MLS, NCAAM, NCAAW) use Eastern time
  return getTodayInEastern();
}

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

interface ESPNSeason {
  type: number; // 1=preseason, 2=regular, 3=postseason, 4=off-season
  year: number;
}

interface ESPNCompetitionType {
  id: string;
  abbreviation?: string; // "REG", "EXH" (exhibition/spring training), "POST", etc.
}

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  season?: ESPNSeason;
  competitions: Array<{
    id: string;
    venue?: ESPNVenue;
    broadcasts?: Array<{ names: string[] }>;
    competitors: ESPNCompetitor[];
    status: ESPNStatus;
    type?: ESPNCompetitionType;
  }>;
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
  season?: ESPNSeason;
}

/**
 * Map ESPN status to our GameStatus type
 */
function mapStatus(status: ESPNStatus): GameStatus {
  const state = status.type.state.toLowerCase();
  const name = status.type.name.toLowerCase();

  if (state === "in") return "live";
  if (state === "post" || status.type.completed || name.includes("final")) return "final";
  if (name === "postponed") return "postponed";
  if (name === "delayed") return "delayed";
  return "scheduled";
}

/**
 * Map ESPN season type to our GameType
 * ESPN season.type: 1=preseason, 2=regular, 3=postseason, 4=off-season
 * ESPN competition.type.abbreviation: "EXH"=exhibition, "REG"=regular, "POST"=postseason
 */
function mapGameType(
  seasonType?: number,
  competitionTypeAbbr?: string
): GameType | undefined {
  // Competition type abbreviation takes precedence (more specific)
  if (competitionTypeAbbr) {
    const abbr = competitionTypeAbbr.toUpperCase();
    if (abbr === "EXH" || abbr === "PRE") return "preseason";
    if (abbr === "POST" || abbr === "PST") return "postseason";
    if (abbr === "ASG" || abbr === "ALL") return "allstar";
    if (abbr === "REG") return "regular";
  }

  // Fall back to season type
  if (seasonType === 1) return "preseason";
  if (seasonType === 2) return "regular";
  if (seasonType === 3) return "postseason";
  // seasonType === 4 is off-season, no games expected

  return undefined;
}

/**
 * Map ESPN competitor to our Team type
 */
function mapTeam(competitor: ESPNCompetitor): Team {
  // Get overall record (type: "total" or first record)
  const record = competitor.records?.find(r => r.type === "total")?.summary
    ?? competitor.records?.[0]?.summary;

  // Get team ranking for college sports
  const rawRank = competitor.curatedRank?.current;
  const rank = rawRank && rawRank > 0 ? rawRank : undefined;

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

  // Determine game status with fallback for ESPN data quality issues
  let gameStatus = mapStatus(status);

  // Fallback: if game shows as "scheduled" but has scores defined and start time
  // is in the past, it's almost certainly final (ESPN doesn't always set status correctly)
  if (gameStatus === "scheduled") {
    const hasScores = homeCompetitor.score !== undefined && awayCompetitor.score !== undefined;
    const startTime = new Date(event.date);
    const isInPast = startTime < new Date();

    if (hasScores && isInPast) {
      gameStatus = "final";
    }
  }

  return {
    id: event.id,
    league,
    status: gameStatus,
    startTime: new Date(event.date),
    venue: competition.venue?.fullName,
    venueLocation: formatVenueLocation(competition.venue),
    broadcasts: competition.broadcasts?.flatMap((b) => b.names).filter(Boolean),
    homeTeam: mapTeam(homeCompetitor),
    awayTeam: mapTeam(awayCompetitor),
    homeScore: parseInt(homeCompetitor.score ?? "0", 10),
    awayScore: parseInt(awayCompetitor.score ?? "0", 10),
    period: status.period?.toString(),
    clock: status.displayClock,
    detail: status.type.shortDetail,
    periodScores: mapPeriodScores(homeCompetitor, awayCompetitor, league),
    stats: mapGameStats(homeCompetitor, awayCompetitor, league),
    gameType: mapGameType(event.season?.type, competition.type?.abbreviation),
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

  // Always use explicit date to ensure proper cache invalidation at midnight
  // Without explicit date, the cache key stays the same and stale data persists
  // Use league-appropriate timezone for "today" (Eastern for US sports, UK for EPL)
  const effectiveDate = date ?? getTodayForLeague(league);
  const dateStr = formatDateForAPI(effectiveDate);
  const url = `${baseUrl}?dates=${dateStr}`;

  // Determine caching strategy:
  // - Past dates: cache for 5 minutes (allows updates if games weren't marked final)
  // - Today/future: revalidate every 30s for live updates
  // Note: revalidateTag cannot be called during Server Component render,
  // so we use time-based revalidation instead of manual tag invalidation
  const isPastDate = isDateInPast(effectiveDate, getTimezoneForLeague(league));

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: isPastDate
      ? { revalidate: 300 }  // Past: 5 minute refresh (in case games weren't final)
      : { revalidate: 30 },  // Today/future: 30s refresh for live updates
  });

  if (!response.ok) {
    throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
  }

  const data: ESPNScoreboardResponse = await response.json();

  // Map events to games, passing top-level season data if not present per-event
  const games = data.events.map((event) => {
    const eventWithSeason: ESPNEvent = {
      ...event,
      season: event.season ?? data.season,
    };
    return mapEvent(eventWithSeason, league);
  });

  return {
    league,
    games,
    lastUpdated: new Date(),
    date: effectiveDate,
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
  daysForward: number = 5,
  centerDate?: Date
): Promise<string[]> {
  // Use provided center date, or fall back to league-appropriate "today"
  const center = centerDate ?? getTodayForLeague(league);
  const dates: Date[] = [];

  // Build array of dates to check around the center date
  for (let i = -daysBack; i <= daysForward; i++) {
    dates.push(addDays(center, i));
  }

  const sportPath = LEAGUE_SPORT_MAP[league];

  // Fetch all dates in parallel
  const results = await Promise.all(
    dates.map(async (date) => {
      const dateStr = formatDateForAPI(date);
      const url = `${ESPN_BASE_URL}/${sportPath}/scoreboard?dates=${dateStr}`;

      // Past dates: cache forever (game count won't change)
      // Today/future: revalidate every 5 min
      // Use league-appropriate timezone for the comparison
      const isPast = isDateInPast(date, getTimezoneForLeague(league));

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
  nhl: [
    "points", "gamesPlayed", "wins", "losses", "otLosses",
    "goalsFor", "goalsAgainst", "goalDifferential",
    "streak", "homeRecord", "roadRecord", "regOTWins",
  ],
  nfl: [
    "wins", "losses", "ties", "winPercent",
    "pointsFor", "pointsAgainst", "pointDifferential",
    "streak", "homeRecord", "roadRecord", "divisionRecord",
  ],
  nba: [
    "wins", "losses", "winPercent", "gamesBehind", "streak",
    "homeRecord", "roadRecord", "divisionRecord", "last10Record",
    "pointsFor", "pointsAgainst",
  ],
  mlb: [
    "wins", "losses", "winPercent", "gamesBehind",
    "runsFor", "runsAgainst", "runDifferential",
    "streak", "homeRecord", "roadRecord", "last10Record",
  ],
  mls: [
    "points", "gamesPlayed", "wins", "losses", "ties",
    "goalsFor", "goalsAgainst", "goalDifferential",
  ],
  epl: [
    "points", "gamesPlayed", "wins", "losses", "ties",
    "goalsFor", "goalsAgainst", "goalDifferential",
  ],
  ncaam: ["wins", "losses", "winPercent", "conferenceWins", "conferenceLosses", "streak"],
  ncaaw: ["wins", "losses", "winPercent", "conferenceWins", "conferenceLosses", "streak"],
};

/**
 * Map ESPN stat names to our display names
 * ESPN may use different names for the same stat
 */
const STAT_NAME_ALIASES: Record<string, string> = {
  // ESPN uses "road" not "away"
  roadRecord: "awayRecord",
  // ESPN uses regOTWins for regulation + OT wins
  regOTWins: "regulationWins",
};

/**
 * Primary sort stat for each league (descending order)
 */
const PRIMARY_SORT_STAT: Record<Exclude<League, "f1" | "pga">, string> = {
  nhl: "points",
  nfl: "wins",
  nba: "wins",
  mlb: "wins",
  mls: "points",
  epl: "points",
  ncaam: "wins",
  ncaaw: "wins",
};

/**
 * Map ESPN standings entry to our StandingsEntry type
 */
function mapStandingsEntry(
  entry: ESPNStandingsEntry,
  league: Exclude<League, "f1" | "pga">,
  logStats = false
): StandingsEntry & { _sortValue: number } {
  const keyStats = STANDINGS_STATS[league];
  const primaryStat = PRIMARY_SORT_STAT[league];
  const stats: Record<string, string | number> = {};
  let sortValue = 0;

  // Debug: log all available stat names (only once per league in dev)
  if (logStats && process.env.NODE_ENV === "development") {
    console.log(`[${league.toUpperCase()}] Available stats:`, entry.stats.map(s => s.name).join(", "));
  }

  for (const stat of entry.stats) {
    if (keyStats.includes(stat.name)) {
      // Use alias name if defined, otherwise use original name
      const displayName = STAT_NAME_ALIASES[stat.name] ?? stat.name;
      // Use displayValue for formatted output
      stats[displayName] = stat.displayValue;
      // Store numeric value for primary sort stat
      if (stat.name === primaryStat && stat.value !== undefined) {
        sortValue = stat.value;
      }
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
    _sortValue: sortValue,
  };
}

/**
 * Sort standings entries by primary stat (descending)
 */
function sortStandingsEntries(
  entries: (StandingsEntry & { _sortValue: number })[]
): StandingsEntry[] {
  return entries
    .sort((a, b) => b._sortValue - a._sortValue)
    .map(({ _sortValue, ...entry }) => entry);
}

/**
 * Leagues that have divisions within conferences
 * These leagues should show the division/conference toggle
 */
const LEAGUES_WITH_DIVISIONS: Exclude<League, "f1" | "pga">[] = ["nhl", "nfl", "nba", "mlb"];

/**
 * Result of extracting standings groups including both levels
 */
interface ExtractedStandings {
  groups: StandingsGroup[];
  hasDivisions: boolean;
}

/**
 * Recursively extract standings groups from ESPN response
 * Returns both conference and division level groups
 */
function extractStandingsGroups(
  children: ESPNStandingsChild[],
  league: Exclude<League, "f1" | "pga">
): ExtractedStandings {
  const groups: StandingsGroup[] = [];
  // Check if this league is known to have divisions
  const leagueHasDivisions = LEAGUES_WITH_DIVISIONS.includes(league);
  let foundDivisions = false;

  for (const child of children) {
    // If this child has nested children (conferences with divisions)
    if (child.children && child.children.length > 0) {
      foundDivisions = true;
      const conferenceName = child.name;

      // Collect all entries from divisions for conference-level view
      const allConferenceEntries: (StandingsEntry & { _sortValue: number })[] = [];

      let hasLoggedStats = false;
      for (const subChild of child.children) {
        if (subChild.standings?.entries) {
          const mappedEntries = subChild.standings.entries.map((e, idx) => {
            const shouldLog = !hasLoggedStats && idx === 0;
            if (shouldLog) hasLoggedStats = true;
            return mapStandingsEntry(e, league, shouldLog);
          });

          // Add division-level group
          groups.push({
            name: subChild.name,
            level: "division",
            parentConference: conferenceName,
            entries: sortStandingsEntries(mappedEntries),
          });

          // Collect for conference-level aggregation
          allConferenceEntries.push(...mappedEntries);
        }
      }

      // Add conference-level group with all teams from all divisions
      if (allConferenceEntries.length > 0) {
        groups.push({
          name: conferenceName,
          level: "conference",
          entries: sortStandingsEntries(allConferenceEntries),
        });
      }
    }
    // If this child has direct standings (e.g., soccer tables, MLS conferences)
    else if (child.standings?.entries) {
      const mappedEntries = child.standings.entries.map((e) => mapStandingsEntry(e, league));
      groups.push({
        name: child.name,
        level: "conference",
        entries: sortStandingsEntries(mappedEntries),
      });
    }
  }

  // Use the league's known division status, but only if we actually found division data
  return { groups, hasDivisions: leagueHasDivisions && foundDivisions };
}

/**
 * Fetch standings data for a league from ESPN
 * @param league - The league to fetch standings for
 */
export async function getESPNStandings(
  league: Exclude<League, "f1" | "pga">
): Promise<LeagueStandings> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const baseUrl = `${ESPN_STANDINGS_URL}/${sportPath}/standings`;
  const isDivisionLeague = LEAGUES_WITH_DIVISIONS.includes(league);

  const fetchOptions = {
    headers: { Accept: "application/json" },
    next: { revalidate: 300 }, // Cache for 5 minutes
  };

  let groups: StandingsGroup[] = [];
  let hasDivisions = false;

  // For division leagues, try to fetch division-level data
  if (isDivisionLeague) {
    try {
      // Fetch division-level standings (level=3)
      const divisionRes = await fetch(`${baseUrl}?level=3`, fetchOptions);

      if (divisionRes.ok) {
        const divisionData = await divisionRes.json();

        // Parse division-level data
        // Structure: divisionData.children = conferences, each with nested children = divisions
        if (divisionData.children && Array.isArray(divisionData.children)) {
          const divisionGroups: StandingsGroup[] = [];
          const conferenceMap = new Map<string, (StandingsEntry & { _sortValue: number })[]>();

          for (const conference of divisionData.children) {
            const conferenceName = conference.name;

            // Each conference has nested children which are the divisions
            if (conference.children && Array.isArray(conference.children)) {
              for (const division of conference.children) {
                if (division.standings?.entries) {
                  const mappedEntries = division.standings.entries.map((e: ESPNStandingsEntry) =>
                    mapStandingsEntry(e, league)
                  );

                  // Add division-level group
                  divisionGroups.push({
                    name: division.name,
                    level: "division",
                    parentConference: conferenceName,
                    entries: sortStandingsEntries(mappedEntries),
                  });

                  // Aggregate for conference-level view
                  if (!conferenceMap.has(conferenceName)) {
                    conferenceMap.set(conferenceName, []);
                  }
                  conferenceMap.get(conferenceName)!.push(...mappedEntries);
                }
              }
            }
          }

          // Add all division groups
          groups.push(...divisionGroups);

          // Add conference-level aggregated groups
          for (const [conferenceName, entries] of conferenceMap) {
            groups.push({
              name: conferenceName,
              level: "conference",
              entries: sortStandingsEntries(entries),
            });
          }

          hasDivisions = divisionGroups.length > 0 && conferenceMap.size > 0;
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch division-level standings for ${league}:`, error);
    }
  }

  // Fallback to default endpoint if we don't have groups yet
  if (groups.length === 0) {
    const response = await fetch(baseUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Process nested children structure (conferences with divisions)
    if (data.children && Array.isArray(data.children) && data.children.length > 0) {
      const extracted = extractStandingsGroups(data.children as ESPNStandingsChild[], league);
      groups = extracted.groups;
      hasDivisions = extracted.hasDivisions;
    }
    // Fallback for flat standings structure
    else if (data.standings?.entries && Array.isArray(data.standings.entries)) {
      const mappedEntries = data.standings.entries.map((e: ESPNStandingsEntry) => mapStandingsEntry(e, league));
      groups = [{
        name: "Standings",
        level: "conference",
        entries: sortStandingsEntries(mappedEntries),
      }];
    } else {
      console.warn(`Unexpected ESPN standings response structure for ${league}:`, Object.keys(data));
    }
  }

  return {
    league,
    groups,
    hasDivisions,
    lastUpdated: new Date(),
  };
}

/**
 * ESPN Rankings API response types
 */
interface ESPNRankingsTeam {
  id: string;
  uid: string;
  location: string;
  name: string;
  nickname?: string;
  abbreviation: string;
  logos?: Array<{ href: string }>;
}

interface ESPNRankedTeam {
  current: number;
  previous: number;
  points?: number;
  recordSummary?: string;
  team: ESPNRankingsTeam;
}

interface ESPNRankingsRank {
  name: string;
  shortName?: string;
  headline?: string;
  ranks: ESPNRankedTeam[];
}

interface ESPNRankingsResponse {
  rankings: ESPNRankingsRank[];
}

/**
 * Fetch NCAA rankings (Top 25 polls)
 * @param league - ncaam or ncaaw
 */
export async function getNCAAPolls(
  league: "ncaam" | "ncaaw"
): Promise<NCAAPolls> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const url = `${ESPN_BASE_URL}/${sportPath}/rankings`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 3600, // Rankings update weekly, cache for 1 hour
    },
  });

  if (!response.ok) {
    throw new Error(`ESPN Rankings API error: ${response.status} ${response.statusText}`);
  }

  const data: ESPNRankingsResponse = await response.json();

  const polls = data.rankings.map((ranking) => ({
    name: ranking.shortName || ranking.name,
    teams: ranking.ranks.slice(0, 25).map((rankedTeam): RankedTeam => {
      const trend: "up" | "down" | "same" =
        rankedTeam.previous === 0 ? "same" : // New to rankings
        rankedTeam.current < rankedTeam.previous ? "up" :
        rankedTeam.current > rankedTeam.previous ? "down" : "same";

      return {
        rank: rankedTeam.current,
        team: {
          id: rankedTeam.team.id,
          name: rankedTeam.team.name,
          abbreviation: rankedTeam.team.abbreviation,
          logo: rankedTeam.team.logos?.[0]?.href,
        },
        record: rankedTeam.recordSummary || "",
        points: rankedTeam.points,
        trend,
        previousRank: rankedTeam.previous || undefined,
      };
    }),
  }));

  return {
    polls,
    lastUpdated: new Date(),
  };
}
