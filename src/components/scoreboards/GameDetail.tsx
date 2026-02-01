"use client";

import type {
  GameSummary,
  GoalieStats,
  PlayerStats,
  ScoringPlay,
  TeamBoxscore,
} from "@/lib/types";
import { getStatusClass, getStatusText } from "@/lib/utils/format";

interface GameDetailDisplayProps {
  summary: GameSummary;
}

/**
 * Main game detail display component
 */
export function GameDetailDisplay({ summary }: GameDetailDisplayProps) {
  const { game, scoringPlays, homeBoxscore, awayBoxscore, leaders, attendance } = summary;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <GameScoreHeader summary={summary} />

      {/* Period scores */}
      {game.periodScores && (
        <PeriodScoresTable
          periodScores={game.periodScores}
          homeTeam={game.homeTeam.abbreviation}
          awayTeam={game.awayTeam.abbreviation}
          homeScore={game.homeScore}
          awayScore={game.awayScore}
          league={game.league}
        />
      )}

      {/* Team stats comparison */}
      <TeamStatsComparison
        homeBoxscore={homeBoxscore}
        awayBoxscore={awayBoxscore}
        league={game.league}
      />

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
        attendance={attendance}
        broadcast={game.broadcast}
      />
    </div>
  );
}

// ============================================================================
// Score Header
// ============================================================================

function GameScoreHeader({ summary }: { summary: GameSummary }) {
  const { game } = summary;
  const statusClass = getStatusClass(game.status);
  const statusText = getStatusText(game.status, game.detail);
  const isLive = game.status === "live";

  const homeWinning = game.homeScore > game.awayScore;
  const awayWinning = game.awayScore > game.homeScore;
  const isFinal = game.status === "final";

  return (
    <div className="font-mono">
      {/* Top border */}
      <div className="text-terminal-green" aria-hidden="true">
        ╔══════════════════════════════════════════════════════════════════╗
      </div>

      {/* Status line */}
      <div className="flex">
        <span className="text-terminal-green" aria-hidden="true">║</span>
        <div className={`flex-1 text-center py-2 ${statusClass}`}>
          {isLive && <span className="text-terminal-green mr-2">●</span>}
          {statusText}
        </div>
        <span className="text-terminal-green" aria-hidden="true">║</span>
      </div>

      {/* Divider */}
      <div className="text-terminal-green" aria-hidden="true">
        ╠══════════════════════════════════════════════════════════════════╣
      </div>

      {/* Team scores */}
      <div className="flex">
        <span className="text-terminal-green" aria-hidden="true">║</span>
        <div className="flex-1 py-4">
          <div className="flex justify-center items-center gap-8">
            {/* Away team */}
            <div className="text-center min-w-[120px]">
              <div className={`text-3xl font-bold ${awayWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}`}>
                {game.awayTeam.abbreviation}
              </div>
              <div className="text-terminal-muted text-sm">{game.awayTeam.record}</div>
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="flex items-center gap-4 text-4xl font-bold">
                <span className={awayWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}>
                  {game.awayScore}
                </span>
                <span className="text-terminal-muted text-2xl">-</span>
                <span className={homeWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}>
                  {game.homeScore}
                </span>
              </div>
            </div>

            {/* Home team */}
            <div className="text-center min-w-[120px]">
              <div className={`text-3xl font-bold ${homeWinning && isFinal ? "text-terminal-green" : "text-terminal-fg"}`}>
                {game.homeTeam.abbreviation}
              </div>
              <div className="text-terminal-muted text-sm">{game.homeTeam.record}</div>
            </div>
          </div>
        </div>
        <span className="text-terminal-green" aria-hidden="true">║</span>
      </div>

      {/* Bottom border */}
      <div className="text-terminal-green" aria-hidden="true">
        ╚══════════════════════════════════════════════════════════════════╝
      </div>
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
    <div className="font-mono overflow-x-auto">
      <div className="text-terminal-border" aria-hidden="true">
        ┌─────────{"─".repeat(periods.length * 6)}──────┐
      </div>

      {/* Header row */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className="w-16 px-2 text-terminal-muted">Team</span>
        {periods.map((p) => (
          <span key={p} className="w-10 text-center text-terminal-muted">
            {getPeriodLabel(p, league)}
          </span>
        ))}
        <span className="w-12 text-center text-terminal-muted font-bold">T</span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      <div className="text-terminal-border" aria-hidden="true">
        ├─────────{"─".repeat(periods.length * 6)}──────┤
      </div>

      {/* Away team row */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className="w-16 px-2 text-terminal-fg">{awayTeam}</span>
        {periods.map((p) => {
          const score = periodScores.away.find((ps) => ps.period === p)?.score ?? "-";
          return (
            <span key={p} className="w-10 text-center text-terminal-fg">
              {score}
            </span>
          );
        })}
        <span className="w-12 text-center text-terminal-fg font-bold">{awayScore}</span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      {/* Home team row */}
      <div className="flex">
        <span className="text-terminal-border" aria-hidden="true">│</span>
        <span className="w-16 px-2 text-terminal-fg">{homeTeam}</span>
        {periods.map((p) => {
          const score = periodScores.home.find((ps) => ps.period === p)?.score ?? "-";
          return (
            <span key={p} className="w-10 text-center text-terminal-fg">
              {score}
            </span>
          );
        })}
        <span className="w-12 text-center text-terminal-fg font-bold">{homeScore}</span>
        <span className="text-terminal-border" aria-hidden="true">│</span>
      </div>

      <div className="text-terminal-border" aria-hidden="true">
        └─────────{"─".repeat(periods.length * 6)}──────┘
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

function TeamStatsComparison({ homeBoxscore, awayBoxscore, league: _league }: TeamStatsComparisonProps) {
  // Get all unique stat keys from both teams
  const allKeys = new Set([
    ...Object.keys(homeBoxscore.stats),
    ...Object.keys(awayBoxscore.stats),
  ]);

  // Filter to only show stats we have display names for
  const displayStats = Array.from(allKeys).filter((key) => STAT_DISPLAY_NAMES[key]);

  if (displayStats.length === 0) return null;

  return (
    <div className="font-mono">
      <SectionHeader title="TEAM STATISTICS" />

      <div className="space-y-1 mt-4">
        {displayStats.map((statKey) => {
          const homeValue = homeBoxscore.stats[statKey] ?? "-";
          const awayValue = awayBoxscore.stats[statKey] ?? "-";
          const displayName = STAT_DISPLAY_NAMES[statKey];

          return (
            <div key={statKey} className="flex items-center text-sm">
              <span className="w-24 text-right text-terminal-fg pr-4">{awayValue}</span>
              <span className="flex-1 text-center text-terminal-muted">{displayName}</span>
              <span className="w-24 text-left text-terminal-fg pl-4">{homeValue}</span>
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

      <div className="mt-4 space-y-4">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
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
  return (
    <div className="font-mono space-y-6">
      <SectionHeader title="PLAYER STATISTICS" />

      {/* Away team */}
      <div>
        <div className="text-terminal-fg font-bold mb-2">
          {awayBoxscore.team.displayName}
        </div>
        <PlayerStatsTable players={awayBoxscore.players} league={league} />
        {awayBoxscore.goalies && awayBoxscore.goalies.length > 0 && (
          <div className="mt-4">
            <div className="text-terminal-muted text-sm mb-2">Goalies</div>
            <GoalieStatsTable goalies={awayBoxscore.goalies} />
          </div>
        )}
      </div>

      {/* Home team */}
      <div>
        <div className="text-terminal-fg font-bold mb-2">
          {homeBoxscore.team.displayName}
        </div>
        <PlayerStatsTable players={homeBoxscore.players} league={league} />
        {homeBoxscore.goalies && homeBoxscore.goalies.length > 0 && (
          <div className="mt-4">
            <div className="text-terminal-muted text-sm mb-2">Goalies</div>
            <GoalieStatsTable goalies={homeBoxscore.goalies} />
          </div>
        )}
      </div>
    </div>
  );
}

// Hockey stat columns
const NHL_PLAYER_COLUMNS = [
  { key: "goals", label: "G", width: "w-8" },
  { key: "assists", label: "A", width: "w-8" },
  { key: "points", label: "P", width: "w-8" },
  { key: "plusMinus", label: "+/-", width: "w-10" },
  { key: "shots", label: "SOG", width: "w-10" },
  { key: "hits", label: "HIT", width: "w-10" },
  { key: "blockedShots", label: "BLK", width: "w-10" },
  { key: "timeOnIce", label: "TOI", width: "w-14" },
];

function PlayerStatsTable({ players, league: _league }: { players: PlayerStats[]; league: string }) {
  if (players.length === 0) {
    return (
      <div className="text-terminal-muted text-sm">No player stats available</div>
    );
  }

  const columns = NHL_PLAYER_COLUMNS; // For now, default to NHL columns

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-terminal-muted border-b border-terminal-border">
            <th className="text-left py-1 pr-2 min-w-[140px]">Player</th>
            {columns.map((col) => (
              <th key={col.key} className={`text-center py-1 ${col.width}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.player.id} className="border-b border-terminal-border/30">
              <td className="py-1 pr-2">
                <span className="text-terminal-fg">{player.player.shortName}</span>
                {player.player.position && (
                  <span className="text-terminal-muted ml-1 text-xs">
                    {player.player.position}
                  </span>
                )}
              </td>
              {columns.map((col) => (
                <td key={col.key} className={`text-center py-1 text-terminal-fg ${col.width}`}>
                  {player.stats[col.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
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
      <table className="w-full text-sm">
        <thead>
          <tr className="text-terminal-muted border-b border-terminal-border">
            <th className="text-left py-1 pr-2 min-w-[140px]">Goalie</th>
            <th className="text-center py-1 w-10">Dec</th>
            {GOALIE_COLUMNS.map((col) => (
              <th key={col.key} className={`text-center py-1 ${col.width}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {goalies.map((goalie) => (
            <tr key={goalie.player.id} className="border-b border-terminal-border/30">
              <td className="py-1 pr-2 text-terminal-fg">{goalie.player.shortName}</td>
              <td className="text-center py-1 w-10">
                {goalie.decision && (
                  <span className={goalie.decision === "W" ? "text-terminal-green" : "text-terminal-red"}>
                    {goalie.decision}
                  </span>
                )}
              </td>
              {GOALIE_COLUMNS.map((col) => (
                <td key={col.key} className={`text-center py-1 text-terminal-fg ${col.width}`}>
                  {goalie.stats[col.key] ?? "-"}
                </td>
              ))}
            </tr>
          ))}
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
  attendance?: number;
  broadcast?: string;
}

function GameInfoSection({ venue, venueLocation, attendance, broadcast }: GameInfoSectionProps) {
  if (!venue && !attendance && !broadcast) return null;

  return (
    <div className="font-mono">
      <SectionHeader title="GAME INFO" />

      <div className="mt-4 space-y-1 text-sm">
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
        {broadcast && (
          <div className="flex">
            <span className="text-terminal-muted w-24">Broadcast:</span>
            <span className="text-terminal-fg">{broadcast}</span>
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
    <div className="text-terminal-border" aria-hidden="true">
      <span>╔══</span>
      <span className="text-terminal-fg mx-2">{title}</span>
      <span>{"═".repeat(Math.max(0, 60 - title.length))}</span>
      <span>╗</span>
    </div>
  );
}
