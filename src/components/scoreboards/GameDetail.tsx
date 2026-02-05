"use client";

import type {
  GameSummary,
  GoalieStats,
  PlayerStats,
  ScoringPlay,
  Team,
  TeamBoxscore,
} from "@/lib/types";
import { getStatusClass, getStatusText } from "@/lib/utils/format";
import { AsciiStatBar } from "@/components/ascii/AsciiDecorations";

interface GameDetailDisplayProps {
  summary: GameSummary;
}

/**
 * Main game detail display component
 */
export function GameDetailDisplay({ summary }: GameDetailDisplayProps) {
  const { game, scoringPlays, homeBoxscore, awayBoxscore, leaders, attendance } = summary;
  const isScheduled = game.status === "scheduled";
  const hasPeriodScores = !!game.periodScores;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <GameScoreHeader summary={summary} />

      {/* Team matchup details for scheduled games */}
      {isScheduled && (
        <TeamMatchupSection
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          league={game.league}
        />
      )}

      {/* Period scores and Team stats - two column on desktop */}
      <div className={`grid gap-6 ${hasPeriodScores ? "lg:grid-cols-2" : ""}`}>
        {/* Period scores - full width on mobile */}
        {game.periodScores && (
          <div className="min-w-0">
            <PeriodScoresTable
              periodScores={game.periodScores}
              homeTeam={game.homeTeam.abbreviation}
              awayTeam={game.awayTeam.abbreviation}
              homeScore={game.homeScore}
              awayScore={game.awayScore}
              league={game.league}
            />
          </div>
        )}

        {/* Team stats comparison */}
        <div className="min-w-0">
          <TeamStatsComparison
            homeBoxscore={homeBoxscore}
            awayBoxscore={awayBoxscore}
            league={game.league}
            isScheduled={isScheduled}
          />
        </div>
      </div>

      {/* Scoring timeline */}
      {scoringPlays.length > 0 && (
        <ScoringTimeline
          plays={scoringPlays}
          homeTeamId={game.homeTeam.id}
          league={game.league}
        />
      )}

      {/* Game leaders */}
      {leaders.length > 0 && <GameLeadersDisplay leaders={leaders} />}

      {/* Player stats */}
      <PlayerStatsSection
        homeBoxscore={homeBoxscore}
        awayBoxscore={awayBoxscore}
        league={game.league}
      />

      {/* Game info */}
      <GameInfoSection
        venue={game.venue}
        venueLocation={game.venueLocation}
        gameType={game.gameType}
        attendance={attendance}
        broadcasts={game.broadcasts}
      />
    </div>
  );
}

// ============================================================================
// Score Header
// ============================================================================

/**
 * Get the appropriate border style based on game status
 * All statuses use double-line borders with color differentiation
 */
function getBorderStyle(status: GameSummary["game"]["status"]) {
  const doubleBorder = {
    corners: { tl: "╔", tr: "╗", bl: "╚", br: "╝", ml: "╠", mr: "╣" },
    horizontal: "═",
    vertical: "║",
  };

  switch (status) {
    case "live":
      return {
        ...doubleBorder,
        textClass: "text-terminal-green",
      };
    case "final":
      return {
        ...doubleBorder,
        textClass: "text-terminal-border",
      };
    case "scheduled":
    default:
      return {
        ...doubleBorder,
        textClass: "text-terminal-yellow",
      };
  }
}

/**
 * Content section with ASCII vertical borders on sides
 * Uses absolute positioning so borders stretch to match content height
 */
function BorderedSection({
  children,
  vertical,
  className
}: {
  children: React.ReactNode;
  vertical: string;
  className: string;
}) {
  return (
    <div className="relative">
      {/* Left border - absolute positioned, full height */}
      <div className={`absolute left-0 top-0 bottom-0 ${className} leading-none overflow-hidden`} aria-hidden="true">
        <span className="whitespace-pre">{(vertical + "\n").repeat(100)}</span>
      </div>
      {/* Content with padding for borders */}
      <div className="px-3">
        {children}
      </div>
      {/* Right border - absolute positioned, full height */}
      <div className={`absolute right-0 top-0 bottom-0 ${className} leading-none overflow-hidden`} aria-hidden="true">
        <span className="whitespace-pre">{(vertical + "\n").repeat(100)}</span>
      </div>
    </div>
  );
}

/**
 * Check if this is a college sports league
 */
function isCollegeLeague(league: string): boolean {
  return league === "ncaam" || league === "ncaaw";
}

/**
 * Flexible border line component that fills available width
 */
function BorderLine({
  left,
  right,
  fill,
  className,
}: {
  left: string;
  right: string;
  fill: string;
  className: string;
}) {
  return (
    <div className={`flex ${className} leading-none`} aria-hidden="true">
      <span>{left}</span>
      <span className="flex-1 overflow-hidden whitespace-nowrap tracking-[0]">{fill.repeat(200)}</span>
      <span>{right}</span>
    </div>
  );
}

function GameScoreHeader({ summary }: { summary: GameSummary }) {
  const { game } = summary;
  const statusClass = getStatusClass(game.status);
  const statusText = getStatusText(game.status, game.detail);
  const isLive = game.status === "live";

  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;
  const isFinal = game.status === "final";

  const border = getBorderStyle(game.status);
  const isCollege = isCollegeLeague(game.league);

  return (
    <div className="font-mono">
      {/* Top border */}
      <BorderLine left={border.corners.tl} right={border.corners.tr} fill={border.horizontal} className={border.textClass} />

      {/* Upper section with ASCII side borders */}
      <BorderedSection vertical={border.vertical} className={border.textClass}>
        {/* Status line */}
        <div className={`text-center py-2 ${statusClass}`}>
          {isLive && <span className="text-terminal-green mr-2">●</span>}
          {statusText}
        </div>

        {/* TV broadcast for live and scheduled games */}
        {(isLive || game.status === "scheduled") && game.broadcasts && game.broadcasts.length > 0 && (
          <div className="text-center py-1 text-xs text-terminal-muted">
            <span className="sr-only">Broadcast on </span>
            <span className="text-terminal-cyan">TV:</span> {game.broadcasts.slice(0, 4).join(", ")}
          </div>
        )}
      </BorderedSection>

      {/* Divider */}
      <BorderLine left={border.corners.ml} right={border.corners.mr} fill={border.horizontal} className={border.textClass} />

      {/* Lower section with ASCII side borders */}
      <BorderedSection vertical={border.vertical} className={border.textClass}>
        {/* Team scores */}
        <div className="py-4">
          <div className="flex justify-center items-center gap-3 sm:gap-8">
            {/* Away team */}
            <div className="text-center min-w-[60px] sm:min-w-[120px]">
              <div className={`text-xl sm:text-3xl font-bold ${awayWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}`}>
                {isCollege && game.awayTeam.rank && (
                  <span className="text-terminal-yellow text-sm sm:text-lg mr-1">#{game.awayTeam.rank}</span>
                )}
                {game.awayTeam.abbreviation}
              </div>
              <div className="text-terminal-muted text-xs sm:text-sm">{game.awayTeam.record}</div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-2 sm:gap-4 text-2xl sm:text-4xl font-bold">
                <span className={awayWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}>
                  {game.awayScore}
                </span>
                <span className="text-terminal-muted text-lg sm:text-2xl">-</span>
                <span className={homeWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}>
                  {game.homeScore}
                </span>
              </div>
            </div>

            {/* Home team */}
            <div className="text-center min-w-[60px] sm:min-w-[120px]">
              <div className={`text-xl sm:text-3xl font-bold ${homeWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}`}>
                {isCollege && game.homeTeam.rank && (
                  <span className="text-terminal-yellow text-sm sm:text-lg mr-1">#{game.homeTeam.rank}</span>
                )}
                {game.homeTeam.abbreviation}
              </div>
              <div className="text-terminal-muted text-xs sm:text-sm">{game.homeTeam.record}</div>
            </div>
          </div>
        </div>
      </BorderedSection>

      {/* Bottom border */}
      <BorderLine left={border.corners.bl} right={border.corners.br} fill={border.horizontal} className={border.textClass} />
    </div>
  );
}

// ============================================================================
// Team Matchup Section (for scheduled games)
// ============================================================================

interface TeamMatchupSectionProps {
  homeTeam: Team;
  awayTeam: Team;
  league: string;
}

/**
 * Display team matchup details for scheduled games
 * Shows full team names, rankings, and team colors
 */
function TeamMatchupSection({ homeTeam, awayTeam, league }: TeamMatchupSectionProps) {
  const isCollege = isCollegeLeague(league);

  return (
    <div className="font-mono">
      <SectionHeader title="MATCHUP" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Away team */}
        <TeamMatchupCard team={awayTeam} label="AWAY" isCollege={isCollege} />

        {/* Home team */}
        <TeamMatchupCard team={homeTeam} label="HOME" isCollege={isCollege} />
      </div>
    </div>
  );
}

interface TeamMatchupCardProps {
  team: Team;
  label: string;
  isCollege: boolean;
}

function TeamMatchupCard({ team, label, isCollege }: TeamMatchupCardProps) {
  // Generate CSS custom property for team color accent
  const teamColorStyle = team.color
    ? { borderColor: `#${team.color}` }
    : {};

  // Always show rank for college teams that have one
  const showRank = isCollege && team.rank;

  return (
    <div
      className="border-l-4 border-terminal-border pl-3 py-2"
      style={teamColorStyle}
    >
      <div className="text-terminal-muted text-xs mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        {showRank && (
          <span className="text-terminal-yellow text-sm">#{team.rank}</span>
        )}
        <span className="text-terminal-fg font-bold">{team.displayName}</span>
      </div>
      {team.record && (
        <div className="text-terminal-muted text-sm mt-1">
          Record: {team.record}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Period Scores Table
// ============================================================================

interface PeriodScoresTableProps {
  periodScores: NonNullable<GameSummary["game"]["periodScores"]>;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  league: string;
}

function getPeriodLabel(period: number, league: string): string {
  if (league === "nhl") {
    if (period <= 3) return `P${period}`;
    if (period === 4) return "OT";
    return `${period - 3}OT`;
  }
  if (league === "nfl" || league === "nba" || league === "ncaam" || league === "ncaaw") {
    if (period <= 4) return `Q${period}`;
    if (period === 5) return "OT";
    return `${period - 4}OT`;
  }
  if (league === "mlb") {
    return String(period);
  }
  if (league === "mls" || league === "epl") {
    if (period === 1) return "1H";
    if (period === 2) return "2H";
    return "ET";
  }
  return String(period);
}

function PeriodScoresTable({
  periodScores,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  league,
}: PeriodScoresTableProps) {
  const periodCount = Math.max(periodScores.home.length, periodScores.away.length);
  const periods = Array.from({ length: periodCount }, (_, i) => i + 1);

  return (
    <div className="font-mono text-sm">
      {/* Top border */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╔</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap">{"═".repeat(200)}</span>
        <span>╗</span>
      </div>

      {/* Header row */}
      <div className="flex text-terminal-muted py-1">
        <span className="text-terminal-border">║</span>
        <span className="w-12 sm:w-16 shrink-0 px-2">Team</span>
        {periods.map((p) => (
          <span key={p} className="w-8 sm:w-10 shrink-0 text-center">
            {getPeriodLabel(p, league)}
          </span>
        ))}
        <span className="w-10 sm:w-12 shrink-0 text-center font-bold">T</span>
        <span className="flex-1" />
        <span className="text-terminal-border">║</span>
      </div>

      {/* Divider */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╠</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap">{"═".repeat(200)}</span>
        <span>╣</span>
      </div>

      {/* Away team row */}
      <div className="flex text-terminal-fg py-1">
        <span className="text-terminal-border">║</span>
        <span className="w-12 sm:w-16 shrink-0 px-2">{awayTeam}</span>
        {periods.map((p) => {
          const score = periodScores.away.find((ps) => ps.period === p)?.score ?? "-";
          return (
            <span key={p} className="w-8 sm:w-10 shrink-0 text-center">
              {score}
            </span>
          );
        })}
        <span className="w-10 sm:w-12 shrink-0 text-center font-bold">{awayScore}</span>
        <span className="flex-1" />
        <span className="text-terminal-border">║</span>
      </div>

      {/* Home team row */}
      <div className="flex text-terminal-fg py-1">
        <span className="text-terminal-border">║</span>
        <span className="w-12 sm:w-16 shrink-0 px-2">{homeTeam}</span>
        {periods.map((p) => {
          const score = periodScores.home.find((ps) => ps.period === p)?.score ?? "-";
          return (
            <span key={p} className="w-8 sm:w-10 shrink-0 text-center">
              {score}
            </span>
          );
        })}
        <span className="w-10 sm:w-12 shrink-0 text-center font-bold">{homeScore}</span>
        <span className="flex-1" />
        <span className="text-terminal-border">║</span>
      </div>

      {/* Bottom border */}
      <div className="flex text-terminal-border" aria-hidden="true">
        <span>╚</span>
        <span className="flex-1 overflow-hidden whitespace-nowrap">{"═".repeat(200)}</span>
        <span>╝</span>
      </div>
    </div>
  );
}

// ============================================================================
// Team Stats Comparison
// ============================================================================

interface TeamStatsComparisonProps {
  homeBoxscore: TeamBoxscore;
  awayBoxscore: TeamBoxscore;
  league: string;
  isScheduled?: boolean;
}

const STAT_DISPLAY_NAMES: Record<string, string> = {
  // Hockey
  shotsOnGoal: "Shots on Goal",
  powerPlayGoals: "Power Play Goals",
  powerPlayOpportunities: "Power Play Opportunities",
  faceOffWinPercentage: "Faceoff %",
  faceoffsWon: "Faceoffs Won",
  faceoffsLost: "Faceoffs Lost",
  hits: "Hits",
  blockedShots: "Blocked Shots",
  takeaways: "Takeaways",
  giveaways: "Giveaways",
  penaltyMinutes: "Penalty Minutes",
  // Football
  totalYards: "Total Yards",
  passingYards: "Passing Yards",
  rushingYards: "Rushing Yards",
  turnovers: "Turnovers",
  possessionTime: "Time of Possession",
  firstDowns: "First Downs",
  thirdDownEff: "3rd Down Efficiency",
  fourthDownEff: "4th Down Efficiency",
  // Basketball
  fieldGoalPct: "Field Goal %",
  threePointPct: "3-Point %",
  freeThrowPct: "Free Throw %",
  rebounds: "Rebounds",
  assists: "Assists",
  steals: "Steals",
  blocks: "Blocks",
  // Soccer
  possessionPct: "Possession %",
  shotsOnTarget: "Shots on Target",
  totalShots: "Total Shots",
  corners: "Corners",
  offsides: "Offsides",
  fouls: "Fouls",
  yellowCards: "Yellow Cards",
  redCards: "Red Cards",
  saves: "Saves",
};

function TeamStatsComparison({ homeBoxscore, awayBoxscore, league: _league, isScheduled }: TeamStatsComparisonProps) {
  // Get all unique stat keys from both teams
  const allKeys = new Set([
    ...Object.keys(homeBoxscore.stats),
    ...Object.keys(awayBoxscore.stats),
  ]);

  // Filter to only show stats we have display names for
  const displayStats = Array.from(allKeys).filter((key) => STAT_DISPLAY_NAMES[key]);

  if (displayStats.length === 0) return null;

  // Use "SEASON STATS" for scheduled games since these are season-to-date statistics
  const sectionTitle = isScheduled ? "SEASON STATS" : "TEAM STATISTICS";

  // Helper to parse numeric value from stat (handles "53%", "42", etc.)
  const parseNumericValue = (value: string | number): number => {
    if (typeof value === "number") return value;
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="font-mono">
      <SectionHeader title={sectionTitle} />

      <div className="space-y-2 text-xs sm:text-sm">
        {displayStats.map((statKey) => {
          const homeValue = homeBoxscore.stats[statKey] ?? "-";
          const awayValue = awayBoxscore.stats[statKey] ?? "-";
          const displayName = STAT_DISPLAY_NAMES[statKey];

          // Parse numeric values for the comparison bar
          const homeNumeric = parseNumericValue(homeValue);
          const awayNumeric = parseNumericValue(awayValue);

          return (
            <div key={statKey}>
              <div className="text-center text-terminal-muted truncate">{displayName}</div>
              <div className="flex items-center gap-2">
                <span className="w-8 sm:w-12 text-right text-terminal-fg shrink-0">{awayValue}</span>
                <AsciiStatBar
                  awayValue={awayNumeric}
                  homeValue={homeNumeric}
                  className="flex-1"
                />
                <span className="w-8 sm:w-12 text-left text-terminal-fg shrink-0">{homeValue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Scoring Timeline
// ============================================================================

interface ScoringTimelineProps {
  plays: ScoringPlay[];
  homeTeamId: string;
  league: string;
}

function ScoringTimeline({ plays, homeTeamId: _homeTeamId, league }: ScoringTimelineProps) {
  // Group plays by period
  const playsByPeriod = plays.reduce((acc, play) => {
    const period = play.period;
    if (!acc[period]) acc[period] = [];
    acc[period].push(play);
    return acc;
  }, {} as Record<number, ScoringPlay[]>);

  const periods = Object.keys(playsByPeriod)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="font-mono">
      <SectionHeader title="SCORING SUMMARY" />

      <div className="space-y-4">
        {periods.map((period) => (
          <div key={period}>
            <div className="text-terminal-yellow text-sm mb-2">
              ● {getPeriodLabel(period, league).toUpperCase()}
              {league === "nhl" && period <= 3 ? " PERIOD" : ""}
            </div>
            <div className="space-y-1 pl-4">
              {playsByPeriod[period].map((play) => (
                <ScoringPlayRow key={`${period}-${play.time}-${play.team.abbreviation}`} play={play} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoringPlayRow({ play }: { play: ScoringPlay }) {
  const strengthLabel = play.strength ? getStrengthLabel(play.strength) : null;

  return (
    <div className="flex items-start text-sm">
      <span className="text-terminal-muted mr-2">├─</span>
      <span className="text-terminal-muted w-14">{play.time}</span>
      <span className="text-terminal-fg w-10">{play.team.abbreviation}</span>
      <span className="flex-1">
        <span className="text-terminal-fg">
          {play.scorer.name}
          {play.scorer.seasonTotal && (
            <span className="text-terminal-muted"> ({play.scorer.seasonTotal})</span>
          )}
        </span>
        {strengthLabel && (
          <span className="text-terminal-yellow ml-2">{strengthLabel}</span>
        )}
        {play.assists && play.assists.length > 0 && (
          <span className="text-terminal-muted ml-2">
            {play.assists.map((a) => a.name).join(", ")}
          </span>
        )}
      </span>
    </div>
  );
}

function getStrengthLabel(strength: ScoringPlay["strength"]): string | null {
  switch (strength) {
    case "ppg":
      return "PP";
    case "shg":
      return "SH";
    case "en":
      return "EN";
    case "ps":
      return "PS";
    case "og":
      return "OG";
    default:
      return null;
  }
}

// ============================================================================
// Game Leaders
// ============================================================================

interface GameLeadersDisplayProps {
  leaders: GameSummary["leaders"];
}

function GameLeadersDisplay({ leaders }: GameLeadersDisplayProps) {
  // Show up to 3 categories
  const displayLeaders = leaders.slice(0, 3);

  return (
    <div className="font-mono">
      <SectionHeader title="GAME LEADERS" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayLeaders.map((category) => (
          <div key={category.category}>
            <div className="text-terminal-muted text-sm mb-2 uppercase">
              {category.category}
            </div>
            <div className="space-y-1">
              {category.leaders.slice(0, 3).map((leader, index) => (
                <div key={leader.player.id} className="flex items-center text-sm">
                  <span className="text-terminal-muted mr-2">{index + 1}.</span>
                  <span className="text-terminal-fg">{leader.player.shortName}</span>
                  <span className="text-terminal-muted mx-1">({leader.team.abbreviation})</span>
                  <span className="ml-auto text-terminal-green font-bold">{leader.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Player Stats Section
// ============================================================================

interface PlayerStatsSectionProps {
  homeBoxscore: TeamBoxscore;
  awayBoxscore: TeamBoxscore;
  league: string;
}

function PlayerStatsSection({ homeBoxscore, awayBoxscore, league }: PlayerStatsSectionProps) {
  // Check if we have any player stats to show
  const hasAwayPlayers = awayBoxscore.players.length > 0;
  const hasHomePlayers = homeBoxscore.players.length > 0;
  const hasAwayGoalies = awayBoxscore.goalies && awayBoxscore.goalies.length > 0;
  const hasHomeGoalies = homeBoxscore.goalies && homeBoxscore.goalies.length > 0;

  // Don't render section if no player stats available (common for soccer/EPL)
  if (!hasAwayPlayers && !hasHomePlayers && !hasAwayGoalies && !hasHomeGoalies) {
    return null;
  }

  return (
    <div className="font-mono min-w-0">
      <SectionHeader title="PLAYER STATISTICS" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Away team */}
        <div className="min-w-0">
          <div className="text-terminal-fg font-bold mb-2">
            {awayBoxscore.team.displayName}
          </div>
          <PlayerStatsTable players={awayBoxscore.players} league={league} />
          {hasAwayGoalies && (
            <div className="mt-4">
              <div className="text-terminal-muted text-sm mb-2">Goalies</div>
              <GoalieStatsTable goalies={awayBoxscore.goalies!} />
            </div>
          )}
        </div>

        {/* Home team */}
        <div className="min-w-0">
          <div className="text-terminal-fg font-bold mb-2">
            {homeBoxscore.team.displayName}
          </div>
          <PlayerStatsTable players={homeBoxscore.players} league={league} />
          {hasHomeGoalies && (
            <div className="mt-4">
              <div className="text-terminal-muted text-sm mb-2">Goalies</div>
              <GoalieStatsTable goalies={homeBoxscore.goalies!} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Sport-specific stat columns
type StatColumn = { key: string; label: string; width: string };

const NHL_PLAYER_COLUMNS: StatColumn[] = [
  { key: "goals", label: "G", width: "w-8" },
  { key: "assists", label: "A", width: "w-8" },
  { key: "points", label: "P", width: "w-8" },
  { key: "plusMinus", label: "+/-", width: "w-10" },
  { key: "shots", label: "SOG", width: "w-10" },
  { key: "hits", label: "HIT", width: "w-10" },
  { key: "blockedShots", label: "BLK", width: "w-10" },
  { key: "timeOnIce", label: "TOI", width: "w-14" },
];

const NBA_PLAYER_COLUMNS: StatColumn[] = [
  { key: "MIN", label: "MIN", width: "w-10" },
  { key: "PTS", label: "PTS", width: "w-10" },
  { key: "REB", label: "REB", width: "w-10" },
  { key: "AST", label: "AST", width: "w-10" },
  { key: "STL", label: "STL", width: "w-10" },
  { key: "BLK", label: "BLK", width: "w-10" },
  { key: "FG", label: "FG", width: "w-14" },
  { key: "3PT", label: "3PT", width: "w-14" },
  { key: "FT", label: "FT", width: "w-14" },
  { key: "TO", label: "TO", width: "w-10" },
];

const NFL_PLAYER_COLUMNS: StatColumn[] = [
  { key: "C/ATT", label: "C/ATT", width: "w-14" },
  { key: "YDS", label: "YDS", width: "w-12" },
  { key: "TD", label: "TD", width: "w-10" },
  { key: "INT", label: "INT", width: "w-10" },
  { key: "CAR", label: "CAR", width: "w-10" },
  { key: "REC", label: "REC", width: "w-10" },
  { key: "TGTS", label: "TGTS", width: "w-10" },
  { key: "RECYDS", label: "RYDS", width: "w-12" },
];

const MLB_PLAYER_COLUMNS: StatColumn[] = [
  { key: "AB", label: "AB", width: "w-10" },
  { key: "R", label: "R", width: "w-8" },
  { key: "H", label: "H", width: "w-8" },
  { key: "RBI", label: "RBI", width: "w-10" },
  { key: "HR", label: "HR", width: "w-10" },
  { key: "BB", label: "BB", width: "w-10" },
  { key: "SO", label: "SO", width: "w-10" },
  { key: "AVG", label: "AVG", width: "w-12" },
];

const MLS_PLAYER_COLUMNS: StatColumn[] = [
  { key: "G", label: "G", width: "w-8" },
  { key: "A", label: "A", width: "w-8" },
  { key: "SH", label: "SH", width: "w-10" },
  { key: "ST", label: "ST", width: "w-10" },
  { key: "FC", label: "FC", width: "w-10" },
  { key: "FS", label: "FS", width: "w-10" },
  { key: "SV", label: "SV", width: "w-10" },
  { key: "OF", label: "OF", width: "w-10" },
];

function getPlayerColumnsForLeague(league: string): StatColumn[] {
  switch (league) {
    case "nhl":
      return NHL_PLAYER_COLUMNS;
    case "nba":
    case "ncaam":
    case "ncaaw":
      return NBA_PLAYER_COLUMNS;
    case "nfl":
      return NFL_PLAYER_COLUMNS;
    case "mlb":
      return MLB_PLAYER_COLUMNS;
    case "mls":
    case "epl":
      return MLS_PLAYER_COLUMNS;
    default:
      return NHL_PLAYER_COLUMNS;
  }
}

// Category display names for better readability
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  passing: "Passing",
  rushing: "Rushing",
  receiving: "Receiving",
  fumbles: "Fumbles",
  defensive: "Defense",
  interceptions: "Interceptions",
  kickReturns: "Kick Returns",
  puntReturns: "Punt Returns",
  kicking: "Kicking",
  punting: "Punting",
  batting: "Batting",
  pitching: "Pitching",
};

// Sport-specific stat key to abbreviation mappings
const STAT_ABBREVIATIONS: Record<string, Record<string, string>> = {
  nhl: {
    goals: "G",
    assists: "A",
    points: "P",
    plusMinus: "+/-",
    penaltyMinutes: "PIM",
    shots: "SOG",
    hits: "HIT",
    blockedShots: "BLK",
    faceoffWins: "FOW",
    faceoffLosses: "FOL",
    timeOnIce: "TOI",
    powerPlayGoals: "PPG",
    powerPlayAssists: "PPA",
    shortHandedGoals: "SHG",
    shortHandedAssists: "SHA",
    gameWinningGoals: "GWG",
    overtimeGoals: "OTG",
    shotPct: "S%",
    faceoffPct: "FO%",
    avgTimeOnIce: "ATOI",
    saves: "SV",
    shotsAgainst: "SA",
    savePercentage: "SV%",
    goalsAgainst: "GA",
  },
  nba: {
    minutes: "MIN",
    points: "PTS",
    rebounds: "REB",
    offensiveRebounds: "OREB",
    defensiveRebounds: "DREB",
    assists: "AST",
    steals: "STL",
    blocks: "BLK",
    turnovers: "TO",
    fouls: "PF",
    plusMinus: "+/-",
    fieldGoalsMade: "FGM",
    fieldGoalsAttempted: "FGA",
    "fieldGoalsMade-fieldGoalsAttempted": "FG",
    fieldGoalPct: "FG%",
    threePointFieldGoalsMade: "3PM",
    threePointFieldGoalsAttempted: "3PA",
    "threePointFieldGoalsMade-threePointFieldGoalsAttempted": "3PT",
    threePointFieldGoalPct: "3P%",
    freeThrowsMade: "FTM",
    freeThrowsAttempted: "FTA",
    "freeThrowsMade-freeThrowsAttempted": "FT",
    freeThrowPct: "FT%",
  },
  nfl: {
    // Passing
    "completions/passingAttempts": "C/ATT",
    passingYards: "YDS",
    yardsPerPassAttempt: "AVG",
    passingTouchdowns: "TD",
    interceptions: "INT",
    sacks: "SCK",
    "sacks-sackYardsLost": "SCK-YDS",
    QBRating: "RTG",
    adjQBR: "QBR",
    // Rushing
    rushingAttempts: "CAR",
    rushingYards: "YDS",
    yardsPerRushAttempt: "AVG",
    rushingTouchdowns: "TD",
    longRushing: "LNG",
    // Receiving
    receptions: "REC",
    receivingYards: "YDS",
    yardsPerReception: "AVG",
    receivingTouchdowns: "TD",
    longReception: "LNG",
    targets: "TGTS",
    receivingTargets: "TGTS",
    // Defense
    totalTackles: "TOT",
    soloTackles: "SOLO",
    tacklesForLoss: "TFL",
    passesDefended: "PD",
    QBHits: "QBH",
    defensiveTouchdowns: "TD",
    // Fumbles
    fumbles: "FUM",
    fumblesLost: "LST",
    fumblesRecovered: "REC",
    // Kicking
    "fieldGoalsMade/fieldGoalAttempts": "FG",
    fieldGoalPct: "FG%",
    longFieldGoalMade: "LNG",
    "extraPointsMade/extraPointAttempts": "XP",
    totalKickingPoints: "PTS",
    // Punting
    punts: "PUNTS",
    puntYards: "YDS",
    grossAvgPuntYards: "AVG",
    touchbacks: "TB",
    puntsInside20: "IN20",
    longPunt: "LNG",
    // Returns
    kickReturns: "RET",
    kickReturnYards: "YDS",
    yardsPerKickReturn: "AVG",
    longKickReturn: "LNG",
    kickReturnTouchdowns: "TD",
    puntReturns: "RET",
    puntReturnYards: "YDS",
    yardsPerPuntReturn: "AVG",
    longPuntReturn: "LNG",
    puntReturnTouchdowns: "TD",
  },
  mlb: {
    // Batting
    atBats: "AB",
    runs: "R",
    hits: "H",
    doubles: "2B",
    triples: "3B",
    homeRuns: "HR",
    RBIs: "RBI",
    walks: "BB",
    strikeouts: "SO",
    stolenBases: "SB",
    avg: "AVG",
    OBP: "OBP",
    SLG: "SLG",
    OPS: "OPS",
    // Pitching
    inningsPitched: "IP",
    hitsAllowed: "H",
    runsAllowed: "R",
    earnedRuns: "ER",
    walksAllowed: "BB",
    pitcherStrikeouts: "SO",
    homeRunsAllowed: "HR",
    pitchesThrown: "PC",
    strikes: "ST",
    ERA: "ERA",
  },
  mls: {
    goals: "G",
    assists: "A",
    shots: "SH",
    shotsOnTarget: "SOT",
    foulsCommitted: "FC",
    foulsSuffered: "FS",
    yellowCards: "YC",
    redCards: "RC",
    offsides: "OFF",
    saves: "SV",
    minutes: "MIN",
  },
};

// Alias college basketball to NBA mappings
STAT_ABBREVIATIONS.ncaam = STAT_ABBREVIATIONS.nba;
STAT_ABBREVIATIONS.ncaaw = STAT_ABBREVIATIONS.nba;
// Alias EPL to MLS mappings
STAT_ABBREVIATIONS.epl = STAT_ABBREVIATIONS.mls;

// Get abbreviation for a stat key based on league
function getStatAbbreviation(key: string, league: string): string {
  const leagueAbbreviations = STAT_ABBREVIATIONS[league];
  if (leagueAbbreviations && leagueAbbreviations[key]) {
    return leagueAbbreviations[key];
  }
  return key;
}

// Check if league uses category-based stats (different stats per position)
function leagueUsesCategoryStats(league: string): boolean {
  return league === "nfl" || league === "mlb";
}

function PlayerStatsTable({ players, league }: { players: PlayerStats[]; league: string }) {
  if (players.length === 0) {
    return (
      <div className="text-terminal-muted text-sm">No player stats available</div>
    );
  }

  // For sports with category-based stats (NFL, MLB), group by category
  if (leagueUsesCategoryStats(league)) {
    // Group players by category
    const playersByCategory = new Map<string, PlayerStats[]>();
    for (const player of players) {
      const category = player.category || "other";
      if (!playersByCategory.has(category)) {
        playersByCategory.set(category, []);
      }
      playersByCategory.get(category)!.push(player);
    }

    // If no categories found, fall back to default display
    if (playersByCategory.size === 0 || (playersByCategory.size === 1 && playersByCategory.has("other"))) {
      return <PlayerStatsCategoryTable players={players} statKeys={null} league={league} />;
    }

    return (
      <div className="space-y-4">
        {Array.from(playersByCategory.entries()).map(([category, categoryPlayers]) => {
          // Skip empty categories
          if (categoryPlayers.length === 0) return null;

          // Get stat keys from first player in category (they all share the same keys)
          const statKeys = categoryPlayers[0].statKeys || null;

          return (
            <div key={category}>
              <div className="text-terminal-muted text-xs uppercase mb-1">
                {CATEGORY_DISPLAY_NAMES[category] || category}
              </div>
              <PlayerStatsCategoryTable
                players={categoryPlayers}
                statKeys={statKeys}
                league={league}
              />
            </div>
          );
        })}
      </div>
    );
  }

  // For sports without categories (NBA, NHL, MLS), show all players in one table
  // Use statKeys from first player if available, otherwise fall back to league defaults
  const statKeys = players[0]?.statKeys || null;
  return <PlayerStatsCategoryTable players={players} statKeys={statKeys} league={league} />;
}

function PlayerStatsCategoryTable({
  players,
  statKeys,
  league
}: {
  players: PlayerStats[];
  statKeys: string[] | null;
  league: string;
}) {
  // Use dynamic statKeys from ESPN if available, otherwise fall back to hardcoded columns
  // Apply sport-specific abbreviation mapping to convert long ESPN keys to short labels
  const columns: StatColumn[] = statKeys
    ? statKeys.map(key => ({ key, label: getStatAbbreviation(key, league), width: "w-12" }))
    : getPlayerColumnsForLeague(league);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-terminal-muted border-b border-terminal-border">
            <th className="text-left py-1 pr-2 sm:pr-4 whitespace-nowrap sticky left-0 bg-terminal-bg z-10">
              Player
            </th>
            {columns.map((col) => (
              <th key={col.key} className="text-center py-1 px-1 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            // Use shortName if available, fall back to displayName or name
            const playerName = player.player.shortName || player.player.displayName || player.player.name;
            return (
              <tr key={player.player.id} className="border-b border-terminal-border/30">
                <td className="py-1 pr-2 sm:pr-4 whitespace-nowrap sticky left-0 bg-terminal-bg z-10">
                  <span className="text-terminal-fg">{playerName}</span>
                  {player.player.position && (
                    <span className="text-terminal-muted ml-1 text-xs">
                      {player.player.position}
                    </span>
                  )}
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="text-center py-1 px-1 text-terminal-fg whitespace-nowrap">
                    {player.stats[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const GOALIE_COLUMNS = [
  { key: "saves", label: "SV", width: "w-10" },
  { key: "shotsAgainst", label: "SA", width: "w-10" },
  { key: "savePercentage", label: "SV%", width: "w-14" },
  { key: "goalsAgainst", label: "GA", width: "w-10" },
  { key: "timeOnIce", label: "TOI", width: "w-14" },
];

function GoalieStatsTable({ goalies }: { goalies: GoalieStats[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-terminal-muted border-b border-terminal-border">
            <th className="text-left py-1 pr-2 sm:pr-4 whitespace-nowrap sticky left-0 bg-terminal-bg z-10">
              Goalie
            </th>
            <th className="text-center py-1 px-1 whitespace-nowrap">Dec</th>
            {GOALIE_COLUMNS.map((col) => (
              <th key={col.key} className="text-center py-1 px-1 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {goalies.map((goalie) => {
            const goalieName = goalie.player.shortName || goalie.player.displayName || goalie.player.name;
            return (
              <tr key={goalie.player.id} className="border-b border-terminal-border/30">
                <td className="py-1 pr-2 sm:pr-4 text-terminal-fg whitespace-nowrap sticky left-0 bg-terminal-bg z-10">
                  {goalieName}
                </td>
                <td className="text-center py-1 px-1">
                  {goalie.decision && (
                    <span className={goalie.decision === "W" ? "text-terminal-green" : "text-terminal-red"}>
                      {goalie.decision}
                    </span>
                  )}
                </td>
                {GOALIE_COLUMNS.map((col) => (
                  <td key={col.key} className="text-center py-1 px-1 text-terminal-fg whitespace-nowrap">
                    {goalie.stats[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// Game Info Section
// ============================================================================

interface GameInfoSectionProps {
  venue?: string;
  venueLocation?: string;
  gameType?: "preseason" | "regular" | "postseason" | "allstar";
  attendance?: number;
  broadcasts?: string[];
}

function GameInfoSection({ venue, venueLocation, gameType, attendance, broadcasts }: GameInfoSectionProps) {
  const hasBroadcasts = broadcasts && broadcasts.length > 0;
  const hasGameType = gameType && gameType !== "regular"; // Only show non-regular game types
  if (!venue && !attendance && !hasBroadcasts && !hasGameType) return null;

  const gameTypeLabels: Record<string, { label: string; className: string }> = {
    preseason: { label: "PRESEASON", className: "text-terminal-yellow" },
    postseason: { label: "POSTSEASON", className: "text-terminal-green" },
    allstar: { label: "ALL-STAR", className: "text-terminal-cyan" },
  };

  return (
    <div className="font-mono">
      <SectionHeader title="GAME INFO" />

      <div className="space-y-1 text-sm">
        {hasGameType && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Type:</span>
            <span className={gameTypeLabels[gameType]?.className ?? "text-terminal-fg"}>
              {gameTypeLabels[gameType]?.label ?? gameType.toUpperCase()}
            </span>
          </div>
        )}
        {venue && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Venue:</span>
            <span className="text-terminal-fg">
              {venue}
              {venueLocation && `, ${venueLocation}`}
            </span>
          </div>
        )}
        {attendance && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Attendance:</span>
            <span className="text-terminal-fg">{attendance.toLocaleString()}</span>
          </div>
        )}
        {hasBroadcasts && (
          <div className="flex">
            <span className="text-terminal-muted w-24">TV:</span>
            <span className="text-terminal-fg">{broadcasts.slice(0, 4).join(", ")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Shared Components
// ============================================================================

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex text-terminal-border mb-4" style={{ lineHeight: 0.85, height: '1em', margin: 0, padding: 0, marginBottom: '1rem' }} aria-hidden="true">
      <span className="text-terminal-fg whitespace-nowrap" style={{ lineHeight: 'normal' }}>{title}</span>
      <span className="ml-2 flex-1 overflow-hidden whitespace-nowrap tracking-[0]" style={{ lineHeight: 0.85, margin: 0, padding: 0, marginLeft: '0.5rem' }}>{"─".repeat(200)}</span>
    </div>
  );
}
