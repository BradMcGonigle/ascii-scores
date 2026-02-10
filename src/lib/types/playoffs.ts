import type { Game, League } from "./index";

/**
 * Playoff round definition
 */
export interface PlayoffRound {
  /** Round identifier (e.g., "wild-card", "divisional") */
  id: string;
  /** Display name (e.g., "Wild Card", "Divisional Round") */
  name: string;
  /** Short display name for compact views */
  shortName: string;
  /** Round number (1-based, used for ordering) */
  order: number;
  /** ESPN week number for this round */
  espnWeek: number;
}

/**
 * Team representation within a bracket matchup
 */
export interface BracketTeam {
  /** Team abbreviation (e.g., "KC", "BUF") */
  abbreviation: string;
  /** Team display name */
  displayName: string;
  /** Seed number (1-7 for NFL) */
  seed?: number;
  /** Score (if game is in progress or complete) */
  score?: number;
  /** Whether this team won the matchup */
  isWinner?: boolean;
}

/**
 * A single matchup in the playoff bracket
 */
export interface PlayoffMatchup {
  /** Unique matchup ID (e.g., "afc-wc-1", "nfc-div-2", "super-bowl") */
  id: string;
  /** The round this matchup belongs to */
  round: string;
  /** Conference (e.g., "AFC", "NFC") — undefined for the championship (Super Bowl) */
  conference?: string;
  /** Position within the round (used for bracket layout ordering) */
  position: number;
  /** The game data (null if game hasn't been played or is a bye) */
  game: Game | null;
  /** Top team in bracket display (higher seed / home team) */
  topTeam?: BracketTeam;
  /** Bottom team in bracket display (lower seed / away team) */
  bottomTeam?: BracketTeam;
  /** Whether this matchup is a bye (team advances without playing) */
  isBye: boolean;
}

/**
 * Full playoff bracket structure
 */
export interface PlayoffBracket {
  /** League this bracket belongs to */
  league: League;
  /** Season year (e.g., 2025 for the 2025-26 NFL season) */
  seasonYear: number;
  /** Display label (e.g., "2025-26 NFL Playoffs") */
  displayLabel: string;
  /** Conferences in this bracket */
  conferences: string[];
  /** Round definitions in order */
  rounds: PlayoffRound[];
  /** All matchups */
  matchups: PlayoffMatchup[];
  /** When this data was last fetched */
  lastUpdated: Date;
}

/**
 * NFL playoff round definitions
 * ESPN week numbers: 1=Wild Card, 2=Divisional, 3=Conference Championship, 5=Super Bowl
 */
export const NFL_PLAYOFF_ROUNDS: PlayoffRound[] = [
  { id: "wild-card", name: "Wild Card", shortName: "WC", order: 1, espnWeek: 1 },
  { id: "divisional", name: "Divisional Round", shortName: "DIV", order: 2, espnWeek: 2 },
  { id: "conference", name: "Conference Championship", shortName: "CONF", order: 3, espnWeek: 3 },
  { id: "super-bowl", name: "Super Bowl", shortName: "SB", order: 4, espnWeek: 5 },
];

export const NFL_CONFERENCES = ["AFC", "NFC"] as const;
