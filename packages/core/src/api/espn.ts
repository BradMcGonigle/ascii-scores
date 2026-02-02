import type {
  Game,
  GameStats,
  GameStatus,
  GameType,
  League,
  LeagueStandings,
  NCAAPolls,
  PeriodScore,
  PeriodScores,
  RankedTeam,
  Scoreboard,
  StandingsEntry,
  StandingsGroup,
  Team,
} from "../types/index.js";
import {
  addDays,
  formatDateForAPI,
  getTodayInEastern,
  getTodayInUK,
  isDateInPast,
} from "../utils/index.js";

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
 * Get "today" in the appropriate timezone for a league's schedule.
 */
function getTodayForLeague(league: Exclude<League, "f1" | "pga">): Date {
  if (league === "epl") {
    return getTodayInUK();
  }
  return getTodayInEastern();
}

// ESPN API response types
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
  curatedRank?: {
    current: number;
  };
  hits?: number;
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
  type?: number;
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
  }>;
}

interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

function mapStatus(status: ESPNStatus): GameStatus {
  const state = status.type.state.toLowerCase();
  const name = status.type.name.toLowerCase();

  if (state === "in") return "live";
  if (state === "post" || status.type.completed) return "final";
  if (name === "postponed") return "postponed";
  if (name === "delayed") return "delayed";
  return "scheduled";
}

function mapTeam(competitor: ESPNCompetitor): Team {
  const record =
    competitor.records?.find((r) => r.type === "total")?.summary ??
    competitor.records?.[0]?.summary;

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

function mapLinescores(linescores?: ESPNLinescore[]): PeriodScore[] {
  if (!linescores || linescores.length === 0) return [];
  return linescores.map((ls, index) => ({
    period: index + 1,
    score: ls.value,
  }));
}

function mapPeriodScores(
  homeCompetitor: ESPNCompetitor,
  awayCompetitor: ESPNCompetitor,
  league: League
): PeriodScores | undefined {
  const homeLinescores = mapLinescores(homeCompetitor.linescores);
  const awayLinescores = mapLinescores(awayCompetitor.linescores);

  if (homeLinescores.length === 0 && awayLinescores.length === 0) {
    return undefined;
  }

  const periodScores: PeriodScores = {
    home: homeLinescores,
    away: awayLinescores,
  };

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

const LEAGUE_KEY_STATS: Record<Exclude<League, "f1" | "pga">, string[]> = {
  nhl: [
    "shotsOnGoal",
    "powerPlayGoals",
    "powerPlayOpportunities",
    "goals",
    "assists",
    "savePct",
  ],
  nfl: [
    "totalYards",
    "turnovers",
    "passingYards",
    "rushingYards",
    "possessionTime",
  ],
  nba: [
    "rebounds",
    "assists",
    "fieldGoalPct",
    "freeThrowPct",
    "threePointFieldGoalPct",
    "turnovers",
    "fouls",
  ],
  mlb: ["hits", "strikeouts", "homeRuns"],
  mls: ["possessionPct", "shotsOnTarget", "saves"],
  epl: ["possessionPct", "shotsOnTarget", "saves"],
  ncaam: [
    "rebounds",
    "assists",
    "fieldGoalPct",
    "freeThrowPct",
    "threePointFieldGoalPct",
    "turnovers",
    "fouls",
  ],
  ncaaw: [
    "rebounds",
    "assists",
    "fieldGoalPct",
    "freeThrowPct",
    "threePointFieldGoalPct",
    "turnovers",
    "fouls",
  ],
};

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

function mapGameStats(
  homeCompetitor: ESPNCompetitor,
  awayCompetitor: ESPNCompetitor,
  league: League
): GameStats | undefined {
  if (league === "f1" || league === "pga") return undefined;

  const homeStats = extractStats(homeCompetitor.statistics, league);
  const awayStats = extractStats(awayCompetitor.statistics, league);

  if (
    Object.keys(homeStats).length === 0 &&
    Object.keys(awayStats).length === 0
  ) {
    return undefined;
  }

  return { home: homeStats, away: awayStats };
}

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
 * Map ESPN season type to our GameType
 * ESPN season types: 1=preseason, 2=regular, 3=postseason, 4=all-star
 */
function mapGameType(seasonType?: number): GameType | undefined {
  switch (seasonType) {
    case 1:
      return "preseason";
    case 2:
      return "regular";
    case 3:
      return "postseason";
    case 4:
      return "allstar";
    default:
      return undefined;
  }
}

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
    gameType: mapGameType(event.season?.type),
  };
}

/**
 * Fetch scoreboard data for a league from ESPN
 */
export async function getESPNScoreboard(
  league: Exclude<League, "f1" | "pga">,
  date?: Date
): Promise<Scoreboard> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const baseUrl = `${ESPN_BASE_URL}/${sportPath}/scoreboard`;

  const effectiveDate = date ?? getTodayForLeague(league);
  const url = `${baseUrl}?dates=${formatDateForAPI(effectiveDate)}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `ESPN API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as ESPNScoreboardResponse;

  const games = data.events.map((event) => mapEvent(event, league));

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
 * Fetch game counts for a range of dates
 */
export async function getDatesWithGames(
  league: Exclude<League, "f1" | "pga">,
  daysBack: number = 5,
  daysForward: number = 5
): Promise<string[]> {
  const today = getTodayForLeague(league);
  const dates: Date[] = [];

  for (let i = -daysBack; i <= daysForward; i++) {
    dates.push(addDays(today, i));
  }

  const sportPath = LEAGUE_SPORT_MAP[league];

  const results = await Promise.all(
    dates.map(async (date) => {
      const dateStr = formatDateForAPI(date);
      const url = `${ESPN_BASE_URL}/${sportPath}/scoreboard?dates=${dateStr}`;

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return null;

        const data = (await response.json()) as ESPNScoreboardResponse;
        return data.events.length > 0 ? dateStr : null;
      } catch {
        return null;
      }
    })
  );

  return results.filter((date): date is string => date !== null);
}

// Standings types
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

const STANDINGS_STATS: Record<Exclude<League, "f1" | "pga">, string[]> = {
  nhl: [
    "points",
    "gamesPlayed",
    "wins",
    "losses",
    "otLosses",
    "goalsFor",
    "goalsAgainst",
    "goalDifferential",
    "streak",
    "homeRecord",
    "roadRecord",
    "regOTWins",
  ],
  nfl: [
    "wins",
    "losses",
    "ties",
    "winPercent",
    "pointsFor",
    "pointsAgainst",
    "pointDifferential",
    "streak",
    "homeRecord",
    "roadRecord",
    "divisionRecord",
  ],
  nba: [
    "wins",
    "losses",
    "winPercent",
    "gamesBehind",
    "streak",
    "homeRecord",
    "roadRecord",
    "divisionRecord",
    "last10Record",
    "pointsFor",
    "pointsAgainst",
  ],
  mlb: [
    "wins",
    "losses",
    "winPercent",
    "gamesBehind",
    "runsFor",
    "runsAgainst",
    "runDifferential",
    "streak",
    "homeRecord",
    "roadRecord",
    "last10Record",
  ],
  mls: [
    "points",
    "gamesPlayed",
    "wins",
    "losses",
    "ties",
    "goalsFor",
    "goalsAgainst",
    "goalDifferential",
  ],
  epl: [
    "points",
    "gamesPlayed",
    "wins",
    "losses",
    "ties",
    "goalsFor",
    "goalsAgainst",
    "goalDifferential",
  ],
  ncaam: [
    "wins",
    "losses",
    "winPercent",
    "conferenceWins",
    "conferenceLosses",
    "streak",
  ],
  ncaaw: [
    "wins",
    "losses",
    "winPercent",
    "conferenceWins",
    "conferenceLosses",
    "streak",
  ],
};

const STAT_NAME_ALIASES: Record<string, string> = {
  roadRecord: "awayRecord",
  regOTWins: "regulationWins",
};

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

function mapStandingsEntry(
  entry: ESPNStandingsEntry,
  league: Exclude<League, "f1" | "pga">
): StandingsEntry & { _sortValue: number } {
  const keyStats = STANDINGS_STATS[league];
  const primaryStat = PRIMARY_SORT_STAT[league];
  const stats: Record<string, string | number> = {};
  let sortValue = 0;

  for (const stat of entry.stats) {
    if (keyStats.includes(stat.name)) {
      const displayName = STAT_NAME_ALIASES[stat.name] ?? stat.name;
      stats[displayName] = stat.displayValue;
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

function sortStandingsEntries(
  entries: (StandingsEntry & { _sortValue: number })[]
): StandingsEntry[] {
  return entries
    .sort((a, b) => b._sortValue - a._sortValue)
    .map(({ _sortValue, ...entry }) => entry);
}

const LEAGUES_WITH_DIVISIONS: Exclude<League, "f1" | "pga">[] = [
  "nhl",
  "nfl",
  "nba",
  "mlb",
];

interface ExtractedStandings {
  groups: StandingsGroup[];
  hasDivisions: boolean;
}

function extractStandingsGroups(
  children: ESPNStandingsChild[],
  league: Exclude<League, "f1" | "pga">
): ExtractedStandings {
  const groups: StandingsGroup[] = [];
  const leagueHasDivisions = LEAGUES_WITH_DIVISIONS.includes(league);
  let foundDivisions = false;

  for (const child of children) {
    if (child.children && child.children.length > 0) {
      foundDivisions = true;
      const conferenceName = child.name;

      const allConferenceEntries: (StandingsEntry & { _sortValue: number })[] =
        [];

      for (const subChild of child.children) {
        if (subChild.standings?.entries) {
          const mappedEntries = subChild.standings.entries.map((e) =>
            mapStandingsEntry(e, league)
          );

          groups.push({
            name: subChild.name,
            level: "division",
            parentConference: conferenceName,
            entries: sortStandingsEntries(mappedEntries),
          });

          allConferenceEntries.push(...mappedEntries);
        }
      }

      if (allConferenceEntries.length > 0) {
        groups.push({
          name: conferenceName,
          level: "conference",
          entries: sortStandingsEntries(allConferenceEntries),
        });
      }
    } else if (child.standings?.entries) {
      const mappedEntries = child.standings.entries.map((e) =>
        mapStandingsEntry(e, league)
      );
      groups.push({
        name: child.name,
        level: "conference",
        entries: sortStandingsEntries(mappedEntries),
      });
    }
  }

  return { groups, hasDivisions: leagueHasDivisions && foundDivisions };
}

/**
 * Fetch standings data for a league from ESPN
 */
export async function getESPNStandings(
  league: Exclude<League, "f1" | "pga">
): Promise<LeagueStandings> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const baseUrl = `${ESPN_STANDINGS_URL}/${sportPath}/standings`;
  const isDivisionLeague = LEAGUES_WITH_DIVISIONS.includes(league);

  const fetchOptions = {
    headers: { Accept: "application/json" },
  };

  let groups: StandingsGroup[] = [];
  let hasDivisions = false;

  if (isDivisionLeague) {
    try {
      const divisionRes = await fetch(`${baseUrl}?level=3`, fetchOptions);

      if (divisionRes.ok) {
        const divisionData = (await divisionRes.json()) as { children?: ESPNStandingsChild[] };

        if (divisionData.children && Array.isArray(divisionData.children)) {
          const divisionGroups: StandingsGroup[] = [];
          const conferenceMap = new Map<
            string,
            (StandingsEntry & { _sortValue: number })[]
          >();

          for (const conference of divisionData.children) {
            const conferenceName = conference.name;

            if (conference.children && Array.isArray(conference.children)) {
              for (const division of conference.children) {
                if (division.standings?.entries) {
                  const mappedEntries = division.standings.entries.map(
                    (e: ESPNStandingsEntry) => mapStandingsEntry(e, league)
                  );

                  divisionGroups.push({
                    name: division.name,
                    level: "division",
                    parentConference: conferenceName,
                    entries: sortStandingsEntries(mappedEntries),
                  });

                  if (!conferenceMap.has(conferenceName)) {
                    conferenceMap.set(conferenceName, []);
                  }
                  conferenceMap.get(conferenceName)!.push(...mappedEntries);
                }
              }
            }
          }

          groups.push(...divisionGroups);

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
      console.warn(
        `Failed to fetch division-level standings for ${league}:`,
        error
      );
    }
  }

  if (groups.length === 0) {
    const response = await fetch(baseUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(
        `ESPN API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as {
      children?: ESPNStandingsChild[];
      standings?: { entries: ESPNStandingsEntry[] };
    };

    if (data.children && Array.isArray(data.children) && data.children.length > 0) {
      const extracted = extractStandingsGroups(
        data.children,
        league
      );
      groups = extracted.groups;
      hasDivisions = extracted.hasDivisions;
    } else if (
      data.standings?.entries &&
      Array.isArray(data.standings.entries)
    ) {
      const mappedEntries = data.standings.entries.map(
        (e) => mapStandingsEntry(e, league)
      );
      groups = [
        {
          name: "Standings",
          level: "conference",
          entries: sortStandingsEntries(mappedEntries),
        },
      ];
    }
  }

  return {
    league,
    groups,
    hasDivisions,
    lastUpdated: new Date(),
  };
}

// Rankings types
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
  });

  if (!response.ok) {
    throw new Error(
      `ESPN Rankings API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as ESPNRankingsResponse;

  const polls = data.rankings.map((ranking) => ({
    name: ranking.shortName || ranking.name,
    teams: ranking.ranks.slice(0, 25).map((rankedTeam): RankedTeam => {
      const trend: "up" | "down" | "same" =
        rankedTeam.previous === 0
          ? "same"
          : rankedTeam.current < rankedTeam.previous
            ? "up"
            : rankedTeam.current > rankedTeam.previous
              ? "down"
              : "same";

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
