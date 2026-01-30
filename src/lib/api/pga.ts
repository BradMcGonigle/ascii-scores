import type {
  GolfLeaderboard,
  GolfPlayer,
  GolfTournament,
  GolfTournamentStatus,
} from "@/lib/types";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports";

/**
 * ESPN Golf API response types
 */
interface ESPNGolfAthlete {
  id: string;
  displayName: string;
  flag?: {
    alt: string;
  };
}

interface ESPNGolfLinescoreValue {
  value: number;
}

interface ESPNGolfStatistic {
  name: string;
  displayValue: string;
}

interface ESPNGolfCompetitor {
  id: string;
  athlete: ESPNGolfAthlete;
  status: {
    position?: {
      displayName: string;
      id?: string;
    };
    thru?: number;
    displayValue?: string;
  };
  score?: {
    displayValue: string;
    value: number;
  };
  linescores?: ESPNGolfLinescoreValue[];
  statistics?: ESPNGolfStatistic[];
  sortOrder?: number;
}

interface ESPNGolfCompetition {
  id: string;
  competitors: ESPNGolfCompetitor[];
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
    };
    period?: number;
  };
}

interface ESPNGolfEvent {
  id: string;
  name: string;
  shortName?: string;
  date: string;
  endDate?: string;
  competitions: ESPNGolfCompetition[];
  status: {
    type: {
      name: string;
      state: string;
      completed: boolean;
      description: string;
    };
  };
  venue?: {
    fullName: string;
    address?: {
      city: string;
      state?: string;
      country?: string;
    };
  };
}

interface ESPNGolfScoreboardResponse {
  events: ESPNGolfEvent[];
}

/**
 * Map ESPN tournament status to our status type
 */
function mapTournamentStatus(event: ESPNGolfEvent): GolfTournamentStatus {
  const state = event.status.type.state.toLowerCase();
  const name = event.status.type.name.toLowerCase();

  if (state === "in" || name === "in progress") return "in_progress";
  if (state === "post" || event.status.type.completed) return "completed";
  if (name === "canceled" || name === "postponed") return "canceled";
  return "scheduled";
}

/**
 * Parse score to par string and return numeric value
 */
function parseScoreToPar(displayValue: string | undefined): { display: string; num: number } {
  if (!displayValue || displayValue === "-" || displayValue === "") {
    return { display: "E", num: 0 };
  }

  // Handle "E" for even
  if (displayValue === "E") {
    return { display: "E", num: 0 };
  }

  // Parse numeric value
  const num = parseInt(displayValue, 10);
  if (isNaN(num)) {
    return { display: displayValue, num: 0 };
  }

  // Format with + for positive
  const display = num > 0 ? `+${num}` : num === 0 ? "E" : num.toString();
  return { display, num };
}

/**
 * Determine player status based on ESPN data
 */
function getPlayerStatus(competitor: ESPNGolfCompetitor): GolfPlayer["status"] {
  const statusDisplay = competitor.status.displayValue?.toLowerCase() || "";
  const position = competitor.status.position?.displayName?.toLowerCase() || "";

  if (statusDisplay.includes("wd") || position.includes("wd")) return "wd";
  if (statusDisplay.includes("dq") || position.includes("dq")) return "dq";
  if (statusDisplay.includes("cut") || position.includes("cut")) return "cut";
  return "active";
}

/**
 * Map ESPN competitor to GolfPlayer
 */
function mapCompetitor(competitor: ESPNGolfCompetitor): GolfPlayer {
  // Get score to par from statistics
  const scoreToParStat = competitor.statistics?.find(
    (s) => s.name === "scoreToPar" || s.name === "score"
  );
  const todayStat = competitor.statistics?.find((s) => s.name === "today");

  const { display: scoreToPar, num: scoreToParNum } = parseScoreToPar(
    scoreToParStat?.displayValue || competitor.score?.displayValue
  );

  // Get individual round scores from linescores
  const rounds = competitor.linescores?.map((ls) => ls.value) ?? [];

  // Get thru value
  let thru: string | undefined;
  if (competitor.status.thru !== undefined) {
    thru = competitor.status.thru === 18 ? "F" : competitor.status.thru.toString();
  }

  // Calculate total strokes from rounds
  const totalStrokes = rounds.length > 0 ? rounds.reduce((sum, r) => sum + r, 0) : undefined;

  return {
    id: competitor.id,
    name: competitor.athlete.displayName,
    country: competitor.athlete.flag?.alt,
    position: competitor.status.position?.displayName ?? "-",
    scoreToPar,
    scoreToParNum,
    today: todayStat?.displayValue,
    thru,
    rounds,
    totalStrokes,
    status: getPlayerStatus(competitor),
  };
}

/**
 * Map ESPN event to GolfTournament
 */
function mapTournament(event: ESPNGolfEvent): GolfTournament {
  const competition = event.competitions[0];

  // Map competitors and sort by position
  const players = competition.competitors
    .map(mapCompetitor)
    .sort((a, b) => {
      // Sort by score to par (lower is better)
      if (a.scoreToParNum !== b.scoreToParNum) {
        return a.scoreToParNum - b.scoreToParNum;
      }
      // Then by position string for ties
      return a.position.localeCompare(b.position);
    });

  // Determine current round from status
  const currentRound = competition.status.period;

  // Build location string
  let location: string | undefined;
  if (event.venue?.address) {
    const { city, state, country } = event.venue.address;
    location = [city, state || country].filter(Boolean).join(", ");
  }

  return {
    id: event.id,
    name: event.name,
    status: mapTournamentStatus(event),
    startDate: new Date(event.date),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    venue: event.venue?.fullName ?? "TBD",
    location,
    currentRound,
    totalRounds: 4, // Standard PGA Tour events are 4 rounds
    players,
  };
}

/**
 * Fetch current PGA Tour leaderboard from ESPN
 * Tries the leaderboard endpoint first, then falls back to scoreboard
 */
export async function getPGALeaderboard(): Promise<GolfLeaderboard> {
  // Try leaderboard endpoint first (more specific for golf)
  const endpoints = [
    `${ESPN_BASE_URL}/golf/pga/leaderboard`,
    `${ESPN_BASE_URL}/golf/leaderboard`,
    `${ESPN_BASE_URL}/golf/pga/scoreboard`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; AsciiScores/1.0)",
        },
        next: {
          revalidate: 60, // Cache for 60 seconds (golf moves slower than other sports)
        },
      });

      if (!response.ok) {
        console.warn(`ESPN Golf API returned ${response.status} for ${url}`);
        continue;
      }

      const data: ESPNGolfScoreboardResponse = await response.json();

      // Find the current/most relevant tournament
      // Prefer in-progress tournaments, then scheduled, then most recent completed
      const events = data.events;

      if (!events || events.length === 0) {
        console.warn(`No events found at ${url}`);
        continue;
      }

      // Sort events by relevance: in_progress first, then by date
      const sortedEvents = [...events].sort((a, b) => {
        const aStatus = mapTournamentStatus(a);
        const bStatus = mapTournamentStatus(b);

        // In-progress tournaments first
        if (aStatus === "in_progress" && bStatus !== "in_progress") return -1;
        if (bStatus === "in_progress" && aStatus !== "in_progress") return 1;

        // Then scheduled
        if (aStatus === "scheduled" && bStatus === "completed") return -1;
        if (bStatus === "scheduled" && aStatus === "completed") return 1;

        // Then by date (most recent first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const tournament = mapTournament(sortedEvents[0]);

      return {
        tournament,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.warn(`Failed to fetch from ${url}:`, error);
      continue;
    }
  }

  // All endpoints failed
  console.error("All ESPN Golf API endpoints failed");
  return {
    tournament: null,
    lastUpdated: new Date(),
  };
}
