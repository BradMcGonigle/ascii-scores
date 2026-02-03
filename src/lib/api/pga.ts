import type {
  GolfCourse,
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
  /** Player earnings for this tournament */
  earnings?: number;
}

interface ESPNGolfBroadcast {
  media: {
    shortName: string;
  };
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
  /** Broadcast networks */
  broadcasts?: ESPNGolfBroadcast[];
}

interface ESPNGolfCourse {
  id: string;
  name: string;
  totalYards?: number;
  /** Par for the course (called shotsToPar in ESPN) */
  shotsToPar?: number;
  /** Whether this is the host/main course */
  host?: boolean;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

interface ESPNGolfDefTitle {
  athlete?: {
    displayName: string;
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
  /** Course information (available in leaderboard endpoint) */
  courses?: ESPNGolfCourse[];
  /** Prize purse in dollars */
  purse?: number;
  /** Defending champion */
  defTitle?: ESPNGolfDefTitle;
}

interface ESPNGolfScoreboardResponse {
  events: ESPNGolfEvent[];
  leagues?: Array<{
    calendar?: Array<{
      id: string;
      label: string;
      startDate: string;
      endDate: string;
    }>;
  }>;
}

/**
 * Tournament info for navigation (lightweight, no player data)
 */
export interface PGATournamentInfo {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "scheduled" | "in_progress" | "completed" | "canceled";
}

/**
 * Tournament calendar response
 */
export interface PGATournamentCalendar {
  tournaments: PGATournamentInfo[];
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

  // Get earnings (directly from competitor or from statistics)
  const earnings = competitor.earnings;

  // Get FedEx Cup points from statistics
  const fedexPointsStat = competitor.statistics?.find((s) => s.name === "cupPoints");
  const fedexPoints = fedexPointsStat
    ? parseFloat(fedexPointsStat.displayValue)
    : undefined;

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
    earnings,
    fedexPoints,
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

  // Build location string (fallback if no courses)
  let location: string | undefined;
  if (event.venue?.address) {
    const { city, state, country } = event.venue.address;
    location = [city, state || country].filter(Boolean).join(", ");
  }

  // Map courses (available in leaderboard endpoint)
  const courses: GolfCourse[] | undefined = event.courses?.map((course) => ({
    name: course.name,
    totalYards: course.totalYards,
    par: course.shotsToPar ?? 72,
    isHost: course.host ?? false,
    location: course.address
      ? {
          city: course.address.city,
          state: course.address.state,
          country: course.address.country,
        }
      : undefined,
  }));

  // Use course location if available and no venue location
  if (!location && courses?.[0]?.location) {
    const { city, state, country } = courses[0].location;
    location = [city, state || country].filter(Boolean).join(", ");
  }

  // Extract broadcasts
  const broadcasts = competition.broadcasts
    ?.map((b) => b.media?.shortName)
    .filter((name): name is string => !!name);

  // Extract defending champion
  const defendingChampion = event.defTitle?.athlete?.displayName;

  return {
    id: event.id,
    name: event.name,
    status: mapTournamentStatus(event),
    startDate: new Date(event.date),
    endDate: event.endDate ? new Date(event.endDate) : undefined,
    venue: event.venue?.fullName ?? courses?.[0]?.name ?? "TBD",
    location,
    currentRound,
    totalRounds: 4, // Standard PGA Tour events are 4 rounds
    purseAmount: event.purse,
    courses,
    defendingChampion,
    broadcasts,
    players,
  };
}

/**
 * Determine tournament status from dates
 */
function getTournamentStatusFromDates(
  startDate: Date,
  endDate: Date
): PGATournamentInfo["status"] {
  const now = new Date();
  if (now < startDate) return "scheduled";
  if (now > endDate) return "completed";
  return "in_progress";
}

/**
 * Fetch PGA Tour tournament calendar
 * Returns list of all tournaments in the current season for navigation
 */
export async function getPGATournamentCalendar(): Promise<PGATournamentCalendar> {
  try {
    const response = await fetch(`${ESPN_BASE_URL}/golf/pga/scoreboard`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; AsciiScores/1.0)",
      },
      next: {
        revalidate: 3600, // Cache for 1 hour (calendar doesn't change often)
      },
    });

    if (!response.ok) {
      console.warn(`ESPN Golf API returned ${response.status} for calendar`);
      return { tournaments: [] };
    }

    const data: ESPNGolfScoreboardResponse = await response.json();
    const calendar = data.leagues?.[0]?.calendar ?? [];

    const tournaments: PGATournamentInfo[] = calendar.map((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      return {
        id: event.id,
        name: event.label,
        startDate,
        endDate,
        status: getTournamentStatusFromDates(startDate, endDate),
      };
    });

    return { tournaments };
  } catch (error) {
    console.error("Failed to fetch PGA tournament calendar:", error);
    return { tournaments: [] };
  }
}

/**
 * Fetch PGA Tour leaderboard from ESPN
 * @param eventId - Optional event ID to fetch a specific tournament
 */
export async function getPGALeaderboard(eventId?: string): Promise<GolfLeaderboard> {
  // Build endpoints - if eventId provided, use query param
  const eventParam = eventId ? `?event=${eventId}` : "";
  const endpoints = [
    `${ESPN_BASE_URL}/golf/leaderboard${eventParam}`,
    `${ESPN_BASE_URL}/golf/pga/leaderboard${eventParam}`,
    `${ESPN_BASE_URL}/golf/pga/scoreboard${eventParam}`,
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
