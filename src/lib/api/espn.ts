import type { Game, GameStatus, League, Scoreboard, Team } from "@/lib/types";
import { addDays, formatDateForAPI } from "@/lib/utils/format";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * ESPN sport paths for each league
 */
const LEAGUE_SPORT_MAP: Record<Exclude<League, "f1">, string> = {
  nhl: "hockey/nhl",
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  mls: "soccer/usa.1",
};

/**
 * ESPN API response types (simplified)
 */
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

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    id: string;
    venue?: { fullName: string };
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
  return {
    id: competitor.team.id,
    name: competitor.team.name,
    abbreviation: competitor.team.abbreviation,
    displayName: competitor.team.displayName,
    logo: competitor.team.logo,
    color: competitor.team.color,
  };
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
    broadcast: competition.broadcasts?.[0]?.names?.[0],
    homeTeam: mapTeam(homeCompetitor),
    awayTeam: mapTeam(awayCompetitor),
    homeScore: parseInt(homeCompetitor.score ?? "0", 10),
    awayScore: parseInt(awayCompetitor.score ?? "0", 10),
    period: status.period?.toString(),
    clock: status.displayClock,
    detail: status.type.shortDetail,
  };
}

/**
 * Fetch scoreboard data for a league from ESPN
 * @param league - The league to fetch scores for
 * @param date - Optional date to fetch scores for (defaults to today)
 */
export async function getESPNScoreboard(
  league: Exclude<League, "f1">,
  date?: Date
): Promise<Scoreboard> {
  const sportPath = LEAGUE_SPORT_MAP[league];
  const baseUrl = `${ESPN_BASE_URL}/${sportPath}/scoreboard`;

  // Add date parameter if provided
  const url = date
    ? `${baseUrl}?dates=${formatDateForAPI(date)}`
    : baseUrl;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    next: {
      revalidate: 30, // Cache for 30 seconds
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
  league: Exclude<League, "f1">,
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

      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 300 }, // Cache for 5 minutes (schedule doesn't change often)
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
