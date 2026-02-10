import type { Game, League, PeriodScores as PeriodScoresType } from "@/lib/types";
import { getStatFullName, getPeriodFullName } from "@/lib/stats/definitions";

interface PeriodScoresProps {
  game: Game;
  borderClass: string;
  sideChar?: string;
}

/**
 * Get period labels based on league
 */
function getPeriodLabels(league: League, periodCount: number): string[] {
  switch (league) {
    case "nhl":
      // NHL: P1, P2, P3, OT, 2OT, etc.
      return Array.from({ length: periodCount }, (_, i) => {
        if (i < 3) return String(i + 1);
        if (i === 3) return "OT";
        return `${i - 2}OT`;
      });
    case "nfl":
    case "nba":
      // NFL/NBA: Q1, Q2, Q3, Q4, OT, 2OT, etc.
      return Array.from({ length: periodCount }, (_, i) => {
        if (i < 4) return String(i + 1);
        if (i === 4) return "OT";
        return `${i - 3}OT`;
      });
    case "mlb":
      // MLB: 1-9+
      return Array.from({ length: periodCount }, (_, i) => String(i + 1));
    case "mls":
    case "fa-cup":
      // Soccer: 1H, 2H, ET1, ET2, PK
      return Array.from({ length: periodCount }, (_, i) => {
        if (i === 0) return "1H";
        if (i === 1) return "2H";
        if (i === 2) return "ET";
        if (i === 3) return "ET";
        return "PK";
      });
    default:
      return Array.from({ length: periodCount }, (_, i) => String(i + 1));
  }
}

/**
 * Get column width based on league for proper alignment
 */
function getColumnWidth(league: League): number {
  switch (league) {
    case "mlb":
      return 2; // Single digit innings
    case "nba":
    case "nfl":
      return 3; // Double digit quarters possible
    default:
      return 3;
  }
}

/**
 * Format period score for display
 */
function formatScore(score: number | undefined, width: number): string {
  if (score === undefined) return "-".padStart(width);
  return String(score).padStart(width);
}

/**
 * Render a compact inline period scores display
 */
function CompactPeriodScores({
  periodScores,
  league,
  homeAbbr,
  awayAbbr,
  borderClass,
  sideChar,
}: {
  periodScores: PeriodScoresType;
  league: League;
  homeAbbr: string;
  awayAbbr: string;
  borderClass: string;
  sideChar?: string;
}) {
  const maxPeriods = Math.max(periodScores.home.length, periodScores.away.length);
  const labels = getPeriodLabels(league, maxPeriods);
  const colWidth = getColumnWidth(league);
  const isMLB = league === "mlb";
  const isMLS = league === "mls" || league === "fa-cup";
  // Only show T (total) column for MLB (shows R/H/E) and MLS
  const showTotalColumn = isMLB || isMLS;

  // For MLB, show compact format if too many innings
  const showCompact = isMLB && maxPeriods > 9;

  return (
    <div className="font-mono text-xs">
      {/* Header row */}
      <div className="flex items-center">
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
        <div className="flex-1 flex items-center px-2 py-0.5">
          <span className="w-10 text-terminal-muted" />
          {labels.slice(0, showCompact ? 9 : undefined).map((label, index) => {
            const fullName = getPeriodFullName(league, index + 1, label);
            return (
              <abbr
                key={`header-${label}`}
                title={fullName}
                className="text-terminal-muted text-center no-underline"
                style={{ width: `${colWidth * 0.6}rem` }}
              >
                <span className="sr-only">{fullName}</span>
                {label}
              </abbr>
            );
          })}
          {showCompact && maxPeriods > 9 && (
            <span className="text-terminal-muted text-center px-1">...</span>
          )}
          {showTotalColumn && (
            <abbr title={getStatFullName("T")} className="text-terminal-cyan text-center w-8 no-underline">
              <span className="sr-only">{getStatFullName("T")}</span>
              T
            </abbr>
          )}
          {isMLB && (
            <>
              <abbr title={getStatFullName("H")} className="text-terminal-muted text-center w-6 no-underline">
                <span className="sr-only">{getStatFullName("H")}</span>
                H
              </abbr>
              <abbr title={getStatFullName("E")} className="text-terminal-muted text-center w-6 no-underline">
                <span className="sr-only">{getStatFullName("E")}</span>
                E
              </abbr>
            </>
          )}
        </div>
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
      </div>

      {/* Away team row */}
      <div className="flex items-center">
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
        <div className="flex-1 flex items-center px-2 py-0.5">
          <span className="w-10 text-terminal-fg truncate">{awayAbbr}</span>
          {periodScores.away.slice(0, showCompact ? 9 : undefined).map((ps) => (
            <span
              key={`away-${ps.period}`}
              className="text-terminal-fg text-center"
              style={{ width: `${colWidth * 0.6}rem` }}
            >
              {formatScore(ps.score, 1)}
            </span>
          ))}
          {showCompact && maxPeriods > 9 && (
            <span className="text-terminal-muted text-center px-1">...</span>
          )}
          {showTotalColumn && (
            <span className="text-terminal-fg font-bold text-center w-8">
              {periodScores.away.reduce((sum, ps) => sum + ps.score, 0)}
            </span>
          )}
          {isMLB && (
            <>
              <span className="text-terminal-muted text-center w-6">
                {periodScores.awayHits ?? "-"}
              </span>
              <span className="text-terminal-muted text-center w-6">
                {periodScores.awayErrors ?? "-"}
              </span>
            </>
          )}
        </div>
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
      </div>

      {/* Home team row */}
      <div className="flex items-center">
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
        <div className="flex-1 flex items-center px-2 py-0.5">
          <span className="w-10 text-terminal-fg truncate">{homeAbbr}</span>
          {periodScores.home.slice(0, showCompact ? 9 : undefined).map((ps) => (
            <span
              key={`home-${ps.period}`}
              className="text-terminal-fg text-center"
              style={{ width: `${colWidth * 0.6}rem` }}
            >
              {formatScore(ps.score, 1)}
            </span>
          ))}
          {showCompact && maxPeriods > 9 && (
            <span className="text-terminal-muted text-center px-1">...</span>
          )}
          {showTotalColumn && (
            <span className="text-terminal-fg font-bold text-center w-8">
              {periodScores.home.reduce((sum, ps) => sum + ps.score, 0)}
            </span>
          )}
          {isMLB && (
            <>
              <span className="text-terminal-muted text-center w-6">
                {periodScores.homeHits ?? "-"}
              </span>
              <span className="text-terminal-muted text-center w-6">
                {periodScores.homeErrors ?? "-"}
              </span>
            </>
          )}
        </div>
        {sideChar && <span className={borderClass} aria-hidden="true">{sideChar}</span>}
      </div>
    </div>
  );
}

/**
 * Period scores component for displaying period/quarter/inning breakdown
 */
export function PeriodScores({ game, borderClass, sideChar }: PeriodScoresProps) {
  const { periodScores, league, homeTeam, awayTeam } = game;

  // Don't render if no period scores available
  if (!periodScores || (periodScores.home.length === 0 && periodScores.away.length === 0)) {
    return null;
  }

  return (
    <CompactPeriodScores
      periodScores={periodScores}
      league={league}
      homeAbbr={homeTeam.abbreviation}
      awayAbbr={awayTeam.abbreviation}
      borderClass={borderClass}
      sideChar={sideChar}
    />
  );
}
