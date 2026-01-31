/**
 * Supported leagues
 */
export type League = "nhl" | "nfl" | "nba" | "mlb" | "mls" | "f1" | "pga";

/**
 * Game status types
 */
export type GameStatus = "scheduled" | "live" | "final" | "postponed" | "delayed";

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
  broadcast?: string;
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
  teamName: string;
  gap?: string;
  interval?: string;
  lastLapTime?: string;
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

/**
 * F1 standings data
 */
export interface F1Standings {
  session: F1Session;
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
  /** Prize purse */
  purse?: string;
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
 * League display configuration
 */
export interface LeagueConfig {
  id: League;
  name: string;
  fullName: string;
  color: string;
  sport: "hockey" | "football" | "basketball" | "baseball" | "soccer" | "racing" | "golf";
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
  },
  nfl: {
    id: "nfl",
    name: "NFL",
    fullName: "National Football League",
    color: "nfl",
    sport: "football",
  },
  nba: {
    id: "nba",
    name: "NBA",
    fullName: "National Basketball Association",
    color: "nba",
    sport: "basketball",
  },
  mlb: {
    id: "mlb",
    name: "MLB",
    fullName: "Major League Baseball",
    color: "mlb",
    sport: "baseball",
  },
  mls: {
    id: "mls",
    name: "MLS",
    fullName: "Major League Soccer",
    color: "mls",
    sport: "soccer",
  },
  f1: {
    id: "f1",
    name: "F1",
    fullName: "Formula 1",
    color: "f1",
    sport: "racing",
  },
  pga: {
    id: "pga",
    name: "PGA",
    fullName: "PGA Tour",
    color: "pga",
    sport: "golf",
  },
};
