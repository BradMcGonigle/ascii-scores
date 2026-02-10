import type { Game, ScoringPlay } from "@/lib/types";
import type { CachedGameState, NotificationEvent, NotificationLeague, PushNotificationPayload } from "./types";

/**
 * Create initial cached state from a game
 */
export function createInitialGameState(
  game: Game,
  scoringPlaysCount: number = 0
): CachedGameState {
  return {
    gameId: game.id,
    league: game.league,
    status: game.status,
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    homeTeam: game.homeTeam.abbreviation,
    awayTeam: game.awayTeam.abbreviation,
    period: parseInt(game.period || "0") || 0,
    scoringPlaysCount,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Detect events by comparing previous and current game state
 */
export function detectEvents(
  prev: CachedGameState,
  curr: Game,
  scoringPlays: ScoringPlay[] = []
): NotificationEvent[] {
  const events: NotificationEvent[] = [];
  const league = curr.league as NotificationLeague;
  const currentPeriod = parseInt(curr.period || "0") || 0;

  // Game started
  if (prev.status === "scheduled" && curr.status === "live") {
    events.push({
      type: "gameStart",
      gameId: curr.id,
      league,
      homeTeam: curr.homeTeam.abbreviation,
      awayTeam: curr.awayTeam.abbreviation,
      homeScore: 0,
      awayScore: 0,
    });
  }

  // Game ended
  if (prev.status === "live" && curr.status === "final") {
    events.push({
      type: "gameEnd",
      gameId: curr.id,
      league,
      homeTeam: curr.homeTeam.abbreviation,
      awayTeam: curr.awayTeam.abbreviation,
      homeScore: curr.homeScore,
      awayScore: curr.awayScore,
    });
  }

  // Period/Quarter/Half/Inning ended
  if (currentPeriod > prev.period && curr.status === "live") {
    events.push({
      type: "periodEnd",
      gameId: curr.id,
      league,
      homeTeam: curr.homeTeam.abbreviation,
      awayTeam: curr.awayTeam.abbreviation,
      homeScore: curr.homeScore,
      awayScore: curr.awayScore,
      period: prev.period,
    });
  }

  // Scoring events
  if (scoringPlays.length > prev.scoringPlaysCount) {
    const newPlays = scoringPlays.slice(prev.scoringPlaysCount);

    for (const play of newPlays) {
      events.push(createScoringEvent(league, curr, play));
    }
  } else if (
    curr.homeScore + curr.awayScore >
    prev.homeScore + prev.awayScore
  ) {
    // Fallback: score changed but no scoring plays data
    const homeScored = curr.homeScore > prev.homeScore;
    events.push({
      type: "scoring",
      gameId: curr.id,
      league,
      homeTeam: curr.homeTeam.abbreviation,
      awayTeam: curr.awayTeam.abbreviation,
      homeScore: curr.homeScore,
      awayScore: curr.awayScore,
      scoreType: homeScored
        ? `${curr.homeTeam.abbreviation} scores`
        : `${curr.awayTeam.abbreviation} scores`,
    });
  }

  return events;
}

/**
 * Create a scoring event with league-specific details
 */
function createScoringEvent(league: NotificationLeague, game: Game, play: ScoringPlay): NotificationEvent {
  const base: NotificationEvent = {
    type: "scoring",
    gameId: game.id,
    league,
    homeTeam: game.homeTeam.abbreviation,
    awayTeam: game.awayTeam.abbreviation,
    homeScore: play.homeScore,
    awayScore: play.awayScore,
    period: play.period,
    description: play.description,
  };

  switch (league) {
    case "nhl":
      return {
        ...base,
        scorer: play.scorer.name,
        strength: play.strength,
        description: formatNHLGoalDescription(play),
      };

    case "nfl": {
      const pointsScored = Math.abs(
        play.homeScore + play.awayScore - game.homeScore - game.awayScore
      );
      return {
        ...base,
        scoreType: getNFLScoreType(pointsScored, play.description),
      };
    }

    default:
      // NBA, MLB, MLS, EPL, NCAAM, NCAAW all use the base format
      return base;
  }
}

/**
 * Format NHL goal description
 */
function formatNHLGoalDescription(play: ScoringPlay): string {
  const parts: string[] = [play.scorer.name];

  if (play.strength && play.strength !== "even") {
    const strengthLabel = getStrengthLabel(play.strength);
    if (strengthLabel) {
      parts.push(`(${strengthLabel})`);
    }
  }

  if (play.assists && play.assists.length > 0) {
    const assistNames = play.assists.map((a) => a.name).join(", ");
    parts.push(`- Assists: ${assistNames}`);
  }

  return parts.join(" ");
}

/**
 * Get human-readable strength label
 */
function getStrengthLabel(strength: string): string | null {
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

/**
 * Determine NFL score type based on points
 */
function getNFLScoreType(points: number, description?: string): string {
  if (description) {
    const desc = description.toLowerCase();
    if (desc.includes("touchdown")) return "TOUCHDOWN";
    if (desc.includes("field goal")) return "FIELD GOAL";
    if (desc.includes("safety")) return "SAFETY";
    if (desc.includes("two-point") || desc.includes("2-point")) return "TWO-POINT CONVERSION";
    if (desc.includes("extra point") || desc.includes("pat")) return "EXTRA POINT";
  }

  switch (points) {
    case 6:
      return "TOUCHDOWN";
    case 7:
      return "TOUCHDOWN + XP";
    case 8:
      return "TOUCHDOWN + 2PT";
    case 3:
      return "FIELD GOAL";
    case 2:
      return "SAFETY";
    case 1:
      return "EXTRA POINT";
    default:
      return "SCORE";
  }
}

/**
 * Get the game start title for a league
 */
function getGameStartTitle(league: NotificationLeague): string {
  switch (league) {
    case "nhl":
      return "Puck Drop!";
    case "nba":
    case "ncaam":
    case "ncaaw":
      return "Tip-Off!";
    case "mlb":
      return "Play Ball!";
    case "mls":
    case "epl":
    case "nfl":
      return "Kickoff!";
  }
}

/**
 * Get the scoring title for a league
 */
function getScoringTitle(league: NotificationLeague, event: NotificationEvent): string {
  switch (league) {
    case "nhl":
    case "mls":
    case "epl":
      return "GOAL!";
    case "mlb":
      return "RUN!";
    case "nfl":
      return event.scoreType || "SCORE";
    default:
      return "SCORE!";
  }
}

/**
 * Get the period label for the period-end notification
 */
function getPeriodEndLabel(league: NotificationLeague, period: number): string {
  switch (league) {
    case "nhl":
      return getNHLPeriodLabel(period);
    case "ncaam":
    case "ncaaw":
    case "mls":
    case "epl":
      return getHalfLabel(period);
    case "mlb":
      return getInningLabel(period);
    case "nba":
    case "nfl":
      return `Q${period}`;
  }
}

/**
 * Format notification payload from event
 */
export function formatNotificationPayload(event: NotificationEvent): PushNotificationPayload {
  const { type, gameId, league, homeTeam, awayTeam, homeScore, awayScore } = event;
  const matchup = `${awayTeam} @ ${homeTeam}`;

  let title: string;
  let body: string;

  switch (type) {
    case "gameStart":
      title = getGameStartTitle(league);
      body = `${matchup} has started`;
      break;

    case "gameEnd":
      title = "FINAL";
      body = `${matchup}: ${awayScore}-${homeScore}`;
      break;

    case "periodEnd":
      title = `End of ${getPeriodEndLabel(league, event.period || 0)}`;
      body = `${matchup}: ${awayScore}-${homeScore}`;
      break;

    case "scoring":
      title = getScoringTitle(league, event);
      body = event.description || `${matchup}: ${awayScore}-${homeScore}`;
      break;

    default:
      title = "Game Update";
      body = `${matchup}: ${awayScore}-${homeScore}`;
  }

  return {
    title,
    body,
    gameId,
    league,
    type,
    url: `/${league}/game/${gameId}`,
  };
}

/**
 * Get period label for NHL
 */
function getNHLPeriodLabel(period: number): string {
  switch (period) {
    case 1:
      return "1st Period";
    case 2:
      return "2nd Period";
    case 3:
      return "3rd Period";
    case 4:
      return "OT";
    case 5:
      return "2OT";
    default:
      return `${period}OT`;
  }
}

/**
 * Get half label for basketball/soccer
 */
function getHalfLabel(half: number): string {
  switch (half) {
    case 1:
      return "1st Half";
    case 2:
      return "2nd Half";
    default:
      return `OT${half - 2 > 1 ? half - 2 : ""}`;
  }
}

/**
 * Get inning label for MLB
 */
function getInningLabel(inning: number): string {
  if (inning <= 0) return "Top 1st";
  const suffixes = ["th", "st", "nd", "rd"];
  const suffix = inning % 100 >= 11 && inning % 100 <= 13
    ? "th"
    : suffixes[inning % 10] || "th";
  return `${inning}${suffix} Inning`;
}
