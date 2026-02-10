/**
 * Supported leagues
 */
export type League = "nhl" | "nfl" | "nba" | "mlb" | "mls" | "epl" | "fa-cup" | "ncaam" | "ncaaw" | "f1" | "pga";

/**
 * Game status types
 */
export type GameStatus = "scheduled" | "live" | "final" | "postponed" | "delayed";

/**
 * Game type classification (season phase)
 * - preseason: Exhibition/preseason games (NFL preseason, MLB spring training)
 * - regular: Regular season games
 * - postseason: Playoff/championship games
 * - allstar: All-Star games and related events
 */
export type GameType = "preseason" | "regular" | "postseason" | "allstar";

/**
 * Period/quarter/inning score data
 */
export interface PeriodScore {
  /** Period number (1-indexed) */
  period: number;
  /** Score for this period */
  score: number;
}

/**
 * Period scores for both teams
 */
export interface PeriodScores {
  /** Home team period scores */
  home: PeriodScore[];
  /** Away team period scores */
  away: PeriodScore[];
  /** MLB-specific: hits */
  homeHits?: number;
  awayHits?: number;
  /** MLB-specific: errors */
  homeErrors?: number;
  awayErrors?: number;
}

/**
 * Game statistics for display (sport-specific key stats)
 */
export interface GameStats {
  /** Home team stats */
  home: Record<string, string | number>;
  /** Away team stats */
  away: Record<string, string | number>;
}

/**
 * Normalized team data across all sports
 */
export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
  color?: string;
  /** Team record (e.g., "25-15") */
  record?: string;
  /** Team ranking for college sports (e.g., 1-25 for top 25) */
  rank?: number;
}

/**
 * Normalized game/event data across all sports
 */
export interface Game {
  id: string;
  league: League;
  status: GameStatus;
  startTime: Date;
  venue?: string;
  /** Venue location (city, state) */
  venueLocation?: string;
  /** Broadcast networks */
  broadcasts?: string[];
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  period?: string;
  clock?: string;
  detail?: string;
  /** Period/quarter/inning scores */
  periodScores?: PeriodScores;
  /** Game statistics (sport-specific) */
  stats?: GameStats;
  /** Game type (preseason, regular, postseason, allstar) */
  gameType?: GameType;
}

/**
 * F1-specific session types
 */
export type F1SessionType =
  | "practice_1"
  | "practice_2"
  | "practice_3"
  | "qualifying"
  | "sprint"
  | "race";

/**
 * F1 driver position data
 */
export interface F1Driver {
  position: number;
  driverNumber: number;
  driverCode: string;
  driverName?: string;
  teamName: string;
  gap?: string;
  interval?: string;
  lastLapTime?: string;
  fastestLap?: string;
  lapsCompleted?: number;
  pitStops?: number;
  currentTyre?: string;
  status: "running" | "pit" | "out" | "finished";
}

/**
 * F1 session data
 */
export interface F1Session {
  id: string;
  name: string;
  type: F1SessionType;
  status: GameStatus;
  startTime: Date;
  circuitName: string;
  country: string;
  drivers: F1Driver[];
  currentLap?: number;
  totalLaps?: number;
}

/**
 * Scoreboard data for a league
 */
export interface Scoreboard {
  league: League;
  games: Game[];
  lastUpdated: Date;
  date: Date;
}

// ============================================================================
// Game Summary / Boxscore Types
// ============================================================================

/**
 * Scoring play strength indicator
 */
export type ScoringStrength = "even" | "ppg" | "shg" | "en" | "ps" | "og";

/**
 * Individual scoring play in a game
 */
export interface ScoringPlay {
  /** Period/quarter/inning when score occurred */
  period: number;
  /** Time of the score (e.g., "12:34") */
  time: string;
  /** Team that scored */
  team: {
    id: string;
    abbreviation: string;
  };
  /** Player who scored */
  scorer: {
    id: string;
    name: string;
    seasonTotal?: number;
  };
  /** Assists (hockey/soccer) or other contributors */
  assists?: Array<{
    id: string;
    name: string;
  }>;
  /** Scoring strength (PP, SH, EN, etc.) */
  strength?: ScoringStrength;
  /** Score after this play (home-away) */
  homeScore: number;
  awayScore: number;
  /** Description of the play */
  description?: string;
}

/**
 * Player statistics for boxscore
 */
export interface PlayerStats {
  /** Player info */
  player: {
    id: string;
    name: string;
    displayName: string;
    shortName: string;
    jersey?: string;
    position?: string;
  };
  /** Whether player is a starter */
  starter: boolean;
  /** Sport-specific stats as key-value pairs */
  stats: Record<string, string | number>;
  /** Category name (e.g., "passing", "rushing", "batting") - used for sports with position-specific stats */
  category?: string;
  /** Stat keys/columns for this category - preserves ESPN's column order */
  statKeys?: string[];
}

/**
 * Goalie/pitcher/keeper specific stats
 */
export interface GoalieStats {
  /** Player info */
  player: {
    id: string;
    name: string;
    displayName: string;
    shortName: string;
    jersey?: string;
  };
  /** Win/Loss/OTL decision */
  decision?: "W" | "L" | "OTL" | "SO" | "ND";
  /** Sport-specific stats */
  stats: Record<string, string | number>;
}

/**
 * Team boxscore data
 */
export interface TeamBoxscore {
  /** Team info */
  team: Team;
  /** All team statistics */
  stats: Record<string, string | number>;
  /** Player statistics (skaters in hockey, position players in other sports) */
  players: PlayerStats[];
  /** Goalies/pitchers/keepers */
  goalies?: GoalieStats[];
}

/**
 * Game leaders (top performers)
 */
export interface GameLeaders {
  /** Category name (e.g., "Goals", "Assists", "Points") */
  category: string;
  /** Leaders in this category */
  leaders: Array<{
    player: {
      id: string;
      name: string;
      shortName: string;
    };
    team: {
      id: string;
      abbreviation: string;
    };
    value: string | number;
  }>;
}

/**
 * Full game summary with boxscore data
 */
export interface GameSummary {
  /** Basic game info (from scoreboard) */
  game: Game;
  /** Scoring plays timeline */
  scoringPlays: ScoringPlay[];
  /** Home team boxscore */
  homeBoxscore: TeamBoxscore;
  /** Away team boxscore */
  awayBoxscore: TeamBoxscore;
  /** Game leaders by category */
  leaders: GameLeaders[];
  /** Attendance */
  attendance?: number;
  /** Game duration */
  duration?: string;
  /** Officials/referees */
  officials?: string[];
}

/**
 * F1 standings data
 */
export interface F1Standings {
  session: F1Session;
  lastUpdated: Date;
}

/**
 * League standings entry (team in standings)
 */
export interface StandingsEntry {
  /** Team info */
  team: {
    id: string;
    name: string;
    abbreviation: string;
    displayName: string;
    logo?: string;
  };
  /** Stats as key-value pairs (varies by league) */
  stats: Record<string, string | number>;
}

/**
 * Standings group level type
 */
export type StandingsGroupLevel = "conference" | "division";

/**
 * Standings group (division/conference)
 */
export interface StandingsGroup {
  /** Group name (e.g., "AFC East", "Eastern Conference") */
  name: string;
  /** Level of this group (conference or division) */
  level: StandingsGroupLevel;
  /** Parent conference name (for division-level groups) */
  parentConference?: string;
  /** Teams in this group */
  entries: StandingsEntry[];
}

/**
 * League standings data
 */
export interface LeagueStandings {
  league: League;
  /** Standings groups (divisions/conferences) */
  groups: StandingsGroup[];
  /** Whether this league has divisions (separate from conferences) */
  hasDivisions: boolean;
  lastUpdated: Date;
}

/**
 * Ranked team entry (for Top 25 polls)
 */
export interface RankedTeam {
  rank: number;
  team: {
    id: string;
    name: string;
    abbreviation: string;
    logo?: string;
  };
  record: string;
  points?: number;
  trend?: "up" | "down" | "same";
  previousRank?: number;
}

/**
 * NCAA Rankings data
 */
export interface NCAAPolls {
  polls: {
    name: string;
    teams: RankedTeam[];
  }[];
  lastUpdated: Date;
}

/**
 * F1 race weekend data (groups multiple sessions)
 */
export interface F1RaceWeekend {
  /** Unique identifier (circuit + year) */
  id: string;
  /** Race weekend name (e.g., "Monaco Grand Prix") */
  name: string;
  /** Circuit short name */
  circuitName: string;
  /** Country */
  country: string;
  /** Start date of the weekend (first session) */
  startDate: Date;
  /** End date of the weekend (last session) */
  endDate: Date;
  /** Sessions in this weekend */
  sessions: F1Session[];
}

/**
 * Golf tournament status
 */
export type GolfTournamentStatus = "scheduled" | "in_progress" | "completed" | "canceled";

/**
 * Golf course information
 */
export interface GolfCourse {
  /** Course name */
  name: string;
  /** Total yards */
  totalYards?: number;
  /** Par for the course */
  par: number;
  /** Whether this is the host/main course for the tournament */
  isHost: boolean;
  /** Course location */
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Golf player/competitor data
 */
export interface GolfPlayer {
  /** Player's unique identifier */
  id: string;
  /** Player's display name */
  name: string;
  /** Player's country flag/code */
  country?: string;
  /** Current position (1, 2, T3, etc.) */
  position: string;
  /** Score to par (e.g., -5, E, +2) */
  scoreToPar: string;
  /** Score to par as number for sorting */
  scoreToParNum: number;
  /** Today's round score to par */
  today?: string;
  /** Thru holes for current round (e.g., "F", "12", "B9") */
  thru?: string;
  /** Individual round scores */
  rounds: number[];
  /** Total strokes */
  totalStrokes?: number;
  /** Player status (active, cut, withdrawn, disqualified) */
  status: "active" | "cut" | "wd" | "dq";
  /** Prize money winnings (formatted, e.g., "$1,500,000") */
  prizeMoney?: string;
  /** Tournament earnings in dollars */
  earnings?: number;
  /** FedEx Cup points earned */
  fedexPoints?: number;
}

/**
 * Golf tournament data
 */
export interface GolfTournament {
  /** Tournament ID */
  id: string;
  /** Tournament name */
  name: string;
  /** Tournament status */
  status: GolfTournamentStatus;
  /** Start date */
  startDate: Date;
  /** End date */
  endDate?: Date;
  /** Course/venue name */
  venue: string;
  /** Location (city, state/country) */
  location?: string;
  /** Current round (1-4) */
  currentRound?: number;
  /** Total rounds */
  totalRounds: number;
  /** Prize purse (formatted string - deprecated, use purseAmount) */
  purse?: string;
  /** Prize purse amount in dollars */
  purseAmount?: number;
  /** Course information (can be multiple for multi-course events) */
  courses?: GolfCourse[];
  /** Defending champion name */
  defendingChampion?: string;
  /** Broadcast networks */
  broadcasts?: string[];
  /** Leaderboard of players */
  players: GolfPlayer[];
}

/**
 * Golf leaderboard standings
 */
export interface GolfLeaderboard {
  tournament: GolfTournament | null;
  lastUpdated: Date;
}

/**
 * Season date range with day-level precision
 * For leagues that span calendar years (e.g., NHL Oct-Jun),
 * seasonStart > seasonEnd indicates a wrap-around
 */
export interface SeasonDates {
  /** Month the season starts (1-12) */
  seasonStart: number;
  /** Day the season starts (1-31) */
  seasonStartDay: number;
  /** Month the season ends (1-12) */
  seasonEnd: number;
  /** Day the season ends (1-31) */
  seasonEndDay: number;
}

/**
 * League display configuration
 */
export interface LeagueConfig {
  id: League;
  name: string;
  fullName: string;
  color: string;
  sport: "hockey" | "football" | "basketball" | "baseball" | "soccer" | "racing" | "golf";
  /** Season dates for determining active status */
  season: SeasonDates;
  /** Popularity ranking (lower = more popular, used for sorting) */
  popularity: number;
}

/**
 * League configurations
 */
export const LEAGUES: Record<League, LeagueConfig> = {
  nhl: {
    id: "nhl",
    name: "NHL",
    fullName: "National Hockey League",
    color: "nhl",
    sport: "hockey",
    season: { seasonStart: 10, seasonStartDay: 7, seasonEnd: 6, seasonEndDay: 30 }, // Oct 7 - Jun 30 (2025-26)
    popularity: 4,
  },
  nfl: {
    id: "nfl",
    name: "NFL",
    fullName: "National Football League",
    color: "nfl",
    sport: "football",
    season: { seasonStart: 9, seasonStartDay: 10, seasonEnd: 2, seasonEndDay: 14 }, // Sep 10 - Feb 14 (2026)
    popularity: 1,
  },
  nba: {
    id: "nba",
    name: "NBA",
    fullName: "National Basketball Association",
    color: "nba",
    sport: "basketball",
    season: { seasonStart: 10, seasonStartDay: 21, seasonEnd: 6, seasonEndDay: 19 }, // Oct 21 - Jun 19 (2025-26)
    popularity: 2,
  },
  mlb: {
    id: "mlb",
    name: "MLB",
    fullName: "Major League Baseball",
    color: "mlb",
    sport: "baseball",
    season: { seasonStart: 3, seasonStartDay: 26, seasonEnd: 11, seasonEndDay: 5 }, // Mar 26 - Nov 5 (2026)
    popularity: 3,
  },
  mls: {
    id: "mls",
    name: "MLS",
    fullName: "Major League Soccer",
    color: "mls",
    sport: "soccer",
    season: { seasonStart: 2, seasonStartDay: 21, seasonEnd: 11, seasonEndDay: 30 }, // Feb 21 - Nov 30
    popularity: 9,
  },
  epl: {
    id: "epl",
    name: "EPL",
    fullName: "English Premier League",
    color: "epl",
    sport: "soccer",
    season: { seasonStart: 8, seasonStartDay: 15, seasonEnd: 5, seasonEndDay: 24 }, // Aug 15 - May 24 (2025-26)
    popularity: 7,
  },
  "fa-cup": {
    id: "fa-cup",
    name: "FA Cup",
    fullName: "English FA Cup",
    color: "fa-cup",
    sport: "soccer",
    season: { seasonStart: 8, seasonStartDay: 15, seasonEnd: 5, seasonEndDay: 17 }, // Aug 15 - May 17 (early rounds through final)
    popularity: 8,
  },
  ncaam: {
    id: "ncaam",
    name: "NCAAM",
    fullName: "NCAA Men's Basketball Top 25",
    color: "ncaam",
    sport: "basketball",
    season: { seasonStart: 11, seasonStartDay: 3, seasonEnd: 4, seasonEndDay: 6 }, // Nov 3 - Apr 6 (2025-26)
    popularity: 5,
  },
  ncaaw: {
    id: "ncaaw",
    name: "NCAAW",
    fullName: "NCAA Women's Basketball Top 25",
    color: "ncaaw",
    sport: "basketball",
    season: { seasonStart: 11, seasonStartDay: 3, seasonEnd: 4, seasonEndDay: 5 }, // Nov 3 - Apr 5 (2025-26)
    popularity: 6,
  },
  f1: {
    id: "f1",
    name: "F1",
    fullName: "Formula 1",
    color: "f1",
    sport: "racing",
    season: { seasonStart: 3, seasonStartDay: 6, seasonEnd: 12, seasonEndDay: 6 }, // Mar 6 - Dec 6 (2026)
    popularity: 10,
  },
  pga: {
    id: "pga",
    name: "PGA",
    fullName: "PGA Tour",
    color: "pga",
    sport: "golf",
    season: { seasonStart: 1, seasonStartDay: 1, seasonEnd: 8, seasonEndDay: 31 }, // Jan 1 - Aug 31 (FedExCup season)
    popularity: 11,
  },
};

/**
 * Check if a league is currently in season
 * @param league The league configuration to check
 * @param currentDate Optional date to check, defaults to current date
 */
export function isLeagueInSeason(league: LeagueConfig, currentDate?: Date): boolean {
  const now = currentDate ?? new Date();
  const month = now.getMonth() + 1; // getMonth() is 0-indexed
  const day = now.getDate();

  const { seasonStart, seasonStartDay, seasonEnd, seasonEndDay } = league.season;

  // Create comparable date values (MMDD format as numbers for easy comparison)
  const currentValue = month * 100 + day;
  const startValue = seasonStart * 100 + seasonStartDay;
  const endValue = seasonEnd * 100 + seasonEndDay;

  // Season spans calendar year (e.g., October to June)
  if (seasonStart > seasonEnd || (seasonStart === seasonEnd && seasonStartDay > seasonEndDay)) {
    return currentValue >= startValue || currentValue <= endValue;
  }

  // Season within same calendar year (e.g., March to October)
  return currentValue >= startValue && currentValue <= endValue;
}

/**
 * Get all leagues sorted by status (active first) and popularity
 * Returns { active: League[], inactive: League[] }
 */
export function getLeaguesByStatus(currentDate?: Date): {
  active: League[];
  inactive: League[];
} {
  const allLeagues = Object.values(LEAGUES);

  const active: LeagueConfig[] = [];
  const inactive: LeagueConfig[] = [];

  for (const league of allLeagues) {
    if (isLeagueInSeason(league, currentDate)) {
      active.push(league);
    } else {
      inactive.push(league);
    }
  }

  // Sort each group by popularity (lower number = more popular)
  active.sort((a, b) => a.popularity - b.popularity);
  inactive.sort((a, b) => a.popularity - b.popularity);

  return {
    active: active.map((l) => l.id),
    inactive: inactive.map((l) => l.id),
  };
}

/**
 * Get all leagues in a single sorted array (active first by popularity, then inactive by popularity)
 */
export function getSortedLeagues(currentDate?: Date): League[] {
  const { active, inactive } = getLeaguesByStatus(currentDate);
  return [...active, ...inactive];
}

/**
 * Get the formatted season start date for a league (e.g., "February 21")
 */
export function getSeasonStartDate(league: LeagueConfig): string {
  const { seasonStart, seasonStartDay } = league.season;
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[seasonStart - 1]} ${seasonStartDay}`;
}

// Playoff bracket types
export * from "./playoffs";
