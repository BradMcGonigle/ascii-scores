import type {
  Game,
  GameLeaders,
  GameStatus,
  GameSummary,
  GoalieStats,
  League,
  PeriodScore,
  PeriodScores,
  PlayerStats,
  ScoringPlay,
  ScoringStrength,
  Team,
  TeamBoxscore,
} from "@/lib/types";

// ESPN uses different subdomains for different endpoints
// The summary endpoint works with site.api.espn.com
const ESPN_SUMMARY_URL = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * ESPN sport paths for each league
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

// ============================================================================
// ESPN Summary API Response Types
// ============================================================================

interface ESPNAthlete {
  id: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  position?: {
    abbreviation: string;
  };
}

interface ESPNPlayerStatLine {
  athlete: ESPNAthlete;
  starter: boolean;
  stats: string[];
}

interface ESPNStatCategory {
  name: string;
  keys: string[];
  athletes: ESPNPlayerStatLine[];
}

interface ESPNBoxscoreTeam {
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
    color?: string;
  };
  statistics: Array<{
    name: string;
    displayValue: string;
  }>;
}

interface ESPNBoxscore {
  teams: ESPNBoxscoreTeam[];
  players: Array<{
    team: { id: string };
    statistics: ESPNStatCategory[];
  }>;
}

interface ESPNScoringPlay {
  id: string;
  type: {
    id: string;
    text: string;
  };
  text: string;
  awayScore: number;
  homeScore: number;
  period: {
    number: number;
  };
  clock: {
    displayValue: string;
  };
  team: {
    id: string;
    abbreviation?: string;
  };
  scoringPlay: boolean;
  scoreValue?: number;
  athletesInvolved?: Array<{
    id: string;
    displayName: string;
    shortName: string;
  }>;
}

interface ESPNLeader {
  name: string;
  displayName: string;
  leaders: Array<{
    displayValue: string;
    value: number;
    athlete: {
      id: string;
      displayName: string;
      shortName: string;
    };
    team: {
      id: string;
      abbreviation: string;
    };
  }>;
}

interface ESPNGameInfo {
  venue?: {
    fullName: string;
    address?: {
      city?: string;
      state?: string;
    };
  };
  attendance?: number;
  officials?: Array<{
    displayName: string;
  }>;
}

interface ESPNHeader {
  id: string;
  competitions: Array<{
    id: string;
    date: string;
    competitors: Array<{
      id: string;
      homeAway: "home" | "away";
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo?: string;
        color?: string;
      };
      score?: string;
      linescores?: Array<{ value: number }>;
      record?: Array<{ summary: string; type: string }>;
    }>;
    status: {
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
    };
  }>;
}

interface ESPNSummaryResponse {
  header: ESPNHeader;
  boxscore?: ESPNBoxscore;
  scoringPlays?: ESPNScoringPlay[];
  leaders?: ESPNLeader[];
  gameInfo?: ESPNGameInfo;
}

// ============================================================================
// Mapping Functions
// ============================================================================

function mapStatus(status: ESPNHeader["competitions"][0]["status"]): GameStatus {
  const state = status.type.state.toLowerCase();
  const name = status.type.name.toLowerCase();

  if (state === "in") return "live";
  if (state === "post" || status.type.completed) return "final";
  if (name === "postponed") return "postponed";
  if (name === "delayed") return "delayed";
  return "scheduled";
}

function mapTeam(competitor: ESPNHeader["competitions"][0]["competitors"][0]): Team {
  const record = competitor.record?.find((r) => r.type === "total")?.summary
    ?? competitor.record?.[0]?.summary;

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

function mapLinescores(linescores?: Array<{ value: number }>): PeriodScore[] {
  if (!linescores) return [];
  return linescores.map((ls, index) => ({
    period: index + 1,
    score: ls.value,
  }));
}

function mapPeriodScores(
  homeCompetitor: ESPNHeader["competitions"][0]["competitors"][0],
  awayCompetitor: ESPNHeader["competitions"][0]["competitors"][0]
): PeriodScores | undefined {
  const homeLinescores = mapLinescores(homeCompetitor.linescores);
  const awayLinescores = mapLinescores(awayCompetitor.linescores);

  if (homeLinescores.length === 0 && awayLinescores.length === 0) {
    return undefined;
  }

  return {
    home: homeLinescores,
    away: awayLinescores,
  };
}

function mapGame(header: ESPNHeader, league: League): Game {
  const competition = header.competitions[0];
  const homeCompetitor = competition.competitors.find((c) => c.homeAway === "home")!;
  const awayCompetitor = competition.competitors.find((c) => c.homeAway === "away")!;
  const status = competition.status;

  return {
    id: header.id,
    league,
    status: mapStatus(status),
    startTime: new Date(competition.date),
    homeTeam: mapTeam(homeCompetitor),
    awayTeam: mapTeam(awayCompetitor),
    homeScore: parseInt(homeCompetitor.score ?? "0", 10),
    awayScore: parseInt(awayCompetitor.score ?? "0", 10),
    period: status.period?.toString(),
    clock: status.displayClock,
    detail: status.type.shortDetail,
    periodScores: mapPeriodScores(homeCompetitor, awayCompetitor),
  };
}

/**
 * Parse scoring strength from play text for hockey
 */
function parseScoringStrength(text: string): ScoringStrength | undefined {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("power play") || lowerText.includes("power-play")) return "ppg";
  if (lowerText.includes("short handed") || lowerText.includes("shorthanded")) return "shg";
  if (lowerText.includes("empty net")) return "en";
  if (lowerText.includes("penalty shot")) return "ps";
  if (lowerText.includes("own goal")) return "og";
  return undefined;
}

/**
 * Parse goal number from play text (e.g., "(22)" for 22nd goal of season)
 */
function parseSeasonTotal(text: string): number | undefined {
  const match = text.match(/\((\d+)\)/);
  return match ? parseInt(match[1], 10) : undefined;
}

function mapScoringPlays(
  plays: ESPNScoringPlay[] | undefined,
  _homeTeamId: string
): ScoringPlay[] {
  if (!plays) return [];

  return plays
    .filter((play) => play.scoringPlay)
    .map((play) => {
      const athletes = play.athletesInvolved ?? [];
      const scorer = athletes[0];
      const assists = athletes.slice(1);

      return {
        period: play.period.number,
        time: play.clock.displayValue,
        team: {
          id: play.team.id,
          abbreviation: play.team.abbreviation ?? "",
        },
        scorer: scorer
          ? {
              id: scorer.id,
              name: scorer.shortName || scorer.displayName,
              seasonTotal: parseSeasonTotal(play.text),
            }
          : { id: "", name: "Unknown" },
        assists: assists.length > 0
          ? assists.map((a) => ({ id: a.id, name: a.shortName || a.displayName }))
          : undefined,
        strength: parseScoringStrength(play.text),
        homeScore: play.homeScore,
        awayScore: play.awayScore,
        description: play.text,
      };
    });
}

/**
 * NHL stat keys in order they appear from ESPN
 */
const NHL_SKATER_STAT_KEYS = [
  "goals",
  "assists",
  "points",
  "plusMinus",
  "penaltyMinutes",
  "shots",
  "hits",
  "blockedShots",
  "faceoffWins",
  "faceoffLosses",
  "timeOnIce",
];

const NHL_GOALIE_STAT_KEYS = [
  "saves",
  "shotsAgainst",
  "savePercentage",
  "goalsAgainst",
  "timeOnIce",
];

function mapPlayerStats(
  playersData: ESPNBoxscore["players"] | undefined,
  teamId: string,
  _league: League
): { players: PlayerStats[]; goalies: GoalieStats[] } {
  const players: PlayerStats[] = [];
  const goalies: GoalieStats[] = [];

  if (!playersData) return { players, goalies };

  const teamData = playersData.find((p) => p.team.id === teamId);
  if (!teamData) return { players, goalies };

  for (const category of teamData.statistics) {
    const isGoalieCategory = category.name.toLowerCase().includes("goalie") ||
      category.name.toLowerCase().includes("goalkeep");

    for (const athlete of category.athletes) {
      const statsObj: Record<string, string | number> = {};

      // Map stats based on category keys or use default keys
      const keys = category.keys.length > 0
        ? category.keys
        : (isGoalieCategory ? NHL_GOALIE_STAT_KEYS : NHL_SKATER_STAT_KEYS);

      athlete.stats.forEach((value, index) => {
        const key = keys[index];
        if (key) {
          statsObj[key] = value;
        }
      });

      if (isGoalieCategory) {
        // Determine decision based on stats or game result
        let decision: GoalieStats["decision"];
        // ESPN sometimes includes decision in the stats
        const decisionValue = statsObj["decision"] as string | undefined;
        if (decisionValue === "W") decision = "W";
        else if (decisionValue === "L") decision = "L";
        else if (decisionValue === "OTL") decision = "OTL";

        goalies.push({
          player: {
            id: athlete.athlete.id,
            name: athlete.athlete.displayName,
            displayName: athlete.athlete.displayName,
            shortName: athlete.athlete.shortName,
            jersey: athlete.athlete.jersey,
          },
          decision,
          stats: statsObj,
        });
      } else {
        players.push({
          player: {
            id: athlete.athlete.id,
            name: athlete.athlete.displayName,
            displayName: athlete.athlete.displayName,
            shortName: athlete.athlete.shortName,
            jersey: athlete.athlete.jersey,
            position: athlete.athlete.position?.abbreviation,
          },
          starter: athlete.starter,
          stats: statsObj,
        });
      }
    }
  }

  return { players, goalies };
}

function mapTeamBoxscore(
  boxscore: ESPNBoxscore | undefined,
  teamId: string,
  team: Team,
  league: League
): TeamBoxscore {
  const stats: Record<string, string | number> = {};

  if (boxscore) {
    const teamStats = boxscore.teams.find((t) => t.team.id === teamId);
    if (teamStats) {
      for (const stat of teamStats.statistics) {
        stats[stat.name] = stat.displayValue;
      }
    }
  }

  const { players, goalies } = mapPlayerStats(boxscore?.players, teamId, league);

  return {
    team,
    stats,
    players,
    goalies,
  };
}

function mapLeaders(leaders: ESPNLeader[] | undefined): GameLeaders[] {
  if (!leaders) return [];

  return leaders.map((leader) => ({
    category: leader.displayName,
    leaders: leader.leaders.map((l) => ({
      player: {
        id: l.athlete.id,
        name: l.athlete.displayName,
        shortName: l.athlete.shortName,
      },
      team: {
        id: l.team.id,
        abbreviation: l.team.abbreviation,
      },
      value: l.displayValue || l.value,
    })),
  }));
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch detailed game summary/boxscore from ESPN
 * @param league - The league
 * @param gameId - The ESPN game/event ID
 */
export async function getGameSummary(
  league: Exclude<League, "f1" | "pga">,
  gameId: string
): Promise<GameSummary | null> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const url = `${ESPN_SUMMARY_URL}/${sportPath}/summary?event=${gameId}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: {
        // Cache based on likely game state:
        // - We don't know status yet, so use moderate cache
        // - Will be revalidated on subsequent requests if game is live
        revalidate: 60,
      },
    });

    if (!response.ok) {
      console.error(`ESPN Summary API error for ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: ESPNSummaryResponse = await response.json();

    // The ESPN summary API has a different structure - check for header or boxscore
    if (!data.header && !data.boxscore) {
      console.error("ESPN Summary API: No header or boxscore in response", Object.keys(data));
      return null;
    }

    // If we have header, use that for game info
    if (data.header) {
      const game = mapGame(data.header, league);
      const homeTeamId = game.homeTeam.id;
      const awayTeamId = game.awayTeam.id;

      return {
        game,
        scoringPlays: mapScoringPlays(data.scoringPlays, homeTeamId),
        homeBoxscore: mapTeamBoxscore(data.boxscore, homeTeamId, game.homeTeam, league),
        awayBoxscore: mapTeamBoxscore(data.boxscore, awayTeamId, game.awayTeam, league),
        leaders: mapLeaders(data.leaders),
        attendance: data.gameInfo?.attendance,
        officials: data.gameInfo?.officials?.map((o) => o.displayName),
      };
    }

    // Fallback: try to construct basic game info from boxscore
    console.error("ESPN Summary API: Header not found, cannot construct game summary");
    return null;
  } catch (error) {
    console.error(`Failed to fetch game summary for ${league}/${gameId}:`, error);
    return null;
  }
}

/**
 * Get cache time based on game status
 * - Live games: 30 seconds
 * - Final games: cache indefinitely
 * - Scheduled games: 5 minutes
 */
export function getGameCacheTime(status: GameStatus): number | false {
  switch (status) {
    case "live":
      return 30;
    case "final":
      return false; // Cache forever
    default:
      return 300; // 5 minutes
  }
}
