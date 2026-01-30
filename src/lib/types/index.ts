/**
 * Supported leagues
 */
export type League = "nhl" | "nfl" | "nba" | "mlb" | "mls" | "f1";

/**
 * Game status types
 */
export type GameStatus = "scheduled" | "live" | "final" | "postponed" | "delayed";

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
  broadcast?: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  period?: string;
  clock?: string;
  detail?: string;
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
}

/**
 * F1 standings data
 */
export interface F1Standings {
  session: F1Session;
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
  sport: "hockey" | "football" | "basketball" | "baseball" | "soccer" | "racing";
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
};
