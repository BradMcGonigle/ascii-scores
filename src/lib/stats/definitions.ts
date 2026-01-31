import type { League } from "@/lib/types";

/**
 * Stat definition with abbreviation and full name
 */
export interface StatDefinition {
  /** Abbreviated label shown in UI */
  abbr: string;
  /** Full name for accessibility and tooltips */
  full: string;
}

/**
 * Game stat definitions by abbreviation
 */
export const STAT_DEFINITIONS: Record<string, StatDefinition> = {
  // NHL stats
  G: { abbr: "G", full: "Goals" },
  A: { abbr: "A", full: "Assists" },
  "SV%": { abbr: "SV%", full: "Save Percentage" },

  // NBA stats
  "FG%": { abbr: "FG%", full: "Field Goal Percentage" },
  "FT%": { abbr: "FT%", full: "Free Throw Percentage" },
  "3P%": { abbr: "3P%", full: "Three-Point Percentage" },

  // NFL stats
  YDS: { abbr: "YDS", full: "Total Yards" },
  TO: { abbr: "TO", full: "Turnovers" },
  TOP: { abbr: "TOP", full: "Time of Possession" },

  // MLB stats
  H: { abbr: "H", full: "Hits" },
  E: { abbr: "E", full: "Errors" },
  R: { abbr: "R", full: "Runs" },

  // MLS stats
  POSS: { abbr: "POSS", full: "Possession" },

  // Period/column headers
  T: { abbr: "T", full: "Total" },
  OT: { abbr: "OT", full: "Overtime" },
  "2OT": { abbr: "2OT", full: "Second Overtime" },
  "3OT": { abbr: "3OT", full: "Third Overtime" },
  "4OT": { abbr: "4OT", full: "Fourth Overtime" },
  "5OT": { abbr: "5OT", full: "Fifth Overtime" },
  "1H": { abbr: "1H", full: "First Half" },
  "2H": { abbr: "2H", full: "Second Half" },
  ET: { abbr: "ET", full: "Extra Time" },
  PK: { abbr: "PK", full: "Penalty Kicks" },
};

/**
 * Period label definitions by league
 * Maps period number to full description
 */
export const PERIOD_DEFINITIONS: Record<League, Record<number, string>> = {
  nhl: {
    1: "1st Period",
    2: "2nd Period",
    3: "3rd Period",
  },
  nfl: {
    1: "1st Quarter",
    2: "2nd Quarter",
    3: "3rd Quarter",
    4: "4th Quarter",
  },
  nba: {
    1: "1st Quarter",
    2: "2nd Quarter",
    3: "3rd Quarter",
    4: "4th Quarter",
  },
  mlb: {
    1: "1st Inning",
    2: "2nd Inning",
    3: "3rd Inning",
    4: "4th Inning",
    5: "5th Inning",
    6: "6th Inning",
    7: "7th Inning",
    8: "8th Inning",
    9: "9th Inning",
    10: "10th Inning",
    11: "11th Inning",
    12: "12th Inning",
  },
  mls: {},
  f1: {},
  pga: {},
};

/**
 * Get the full name for a stat abbreviation
 */
export function getStatFullName(abbr: string): string {
  return STAT_DEFINITIONS[abbr]?.full ?? abbr;
}

/**
 * Get the full period/inning description
 */
export function getPeriodFullName(
  league: League,
  periodNumber: number,
  label: string
): string {
  // Check if it's a special label (OT, 2OT, 1H, etc.)
  if (STAT_DEFINITIONS[label]) {
    return STAT_DEFINITIONS[label].full;
  }

  // Check league-specific period definitions
  const leaguePeriods = PERIOD_DEFINITIONS[league];
  if (leaguePeriods && leaguePeriods[periodNumber]) {
    return leaguePeriods[periodNumber];
  }

  // Fallback for extra innings/periods beyond defined range
  if (league === "mlb") {
    return `${periodNumber}${getOrdinalSuffix(periodNumber)} Inning`;
  }

  return label;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
