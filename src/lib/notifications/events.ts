import type { Game, ScoringPlay } from "@/lib/types";
import type { CachedGameState, NotificationEvent, PushNotificationPayload } from "./types";

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
  const league = curr.league as "nhl" | "nfl" | "ncaam";
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

  // Period/Quarter ended
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
    // Get new scoring plays
    const newPlays = scoringPlays.slice(prev.scoringPlaysCount);

    for (const play of newPlays) {
      if (league === "nhl") {
        events.push(createNHLGoalEvent(curr, play));
      } else if (league === "nfl") {
        events.push(createNFLScoreEvent(curr, play));
      } else if (league === "ncaam") {
        events.push(createNCAAMScoreEvent(curr, play));
      }
    }
  } else if (
    curr.homeScore + curr.awayScore >
    prev.homeScore + prev.awayScore
  ) {
    // Fallback: score changed but no scoring plays data
    // Create a generic scoring event
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
 * Create NHL goal event from scoring play
 */
function createNHLGoalEvent(game: Game, play: ScoringPlay): NotificationEvent {
  return {
    type: "scoring",
    gameId: game.id,
    league: "nhl",
    homeTeam: game.homeTeam.abbreviation,
    awayTeam: game.awayTeam.abbreviation,
    homeScore: play.homeScore,
    awayScore: play.awayScore,
    period: play.period,
    scorer: play.scorer.name,
    strength: play.strength,
    description: formatNHLGoalDescription(play),
  };
}

/**
 * Create NCAAM score event from scoring play
 */
function createNCAAMScoreEvent(game: Game, play: ScoringPlay): NotificationEvent {
  return {
    type: "scoring",
    gameId: game.id,
    league: "ncaam",
    homeTeam: game.homeTeam.abbreviation,
    awayTeam: game.awayTeam.abbreviation,
    homeScore: play.homeScore,
    awayScore: play.awayScore,
    period: play.period,
    description: play.description,
  };
}

/**
 * Create NFL score event from scoring play
 */
function createNFLScoreEvent(game: Game, play: ScoringPlay): NotificationEvent {
  const pointsScored = Math.abs(
    play.homeScore + play.awayScore - game.homeScore - game.awayScore
  );
  const scoreType = getNFLScoreType(pointsScored, play.description);

  return {
    type: "scoring",
    gameId: game.id,
    league: "nfl",
    homeTeam: game.homeTeam.abbreviation,
    awayTeam: game.awayTeam.abbreviation,
    homeScore: play.homeScore,
    awayScore: play.awayScore,
    period: play.period,
    scoreType,
    description: play.description,
  };
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
  // Try to determine from description first
  if (description) {
    const desc = description.toLowerCase();
    if (desc.includes("touchdown")) return "TOUCHDOWN";
    if (desc.includes("field goal")) return "FIELD GOAL";
    if (desc.includes("safety")) return "SAFETY";
    if (desc.includes("two-point") || desc.includes("2-point")) return "TWO-POINT CONVERSION";
    if (desc.includes("extra point") || desc.includes("pat")) return "EXTRA POINT";
  }

  // Fallback to points-based detection
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
 * Format notification payload from event
 */
export function formatNotificationPayload(event: NotificationEvent): PushNotificationPayload {
  const { type, gameId, league, homeTeam, awayTeam, homeScore, awayScore } = event;
  const matchup = `${awayTeam} @ ${homeTeam}`;

  let title: string;
  let body: string;

  switch (type) {
    case "gameStart":
      if (league === "nhl") {
        title = "Puck Drop!";
      } else if (league === "ncaam") {
        title = "Tip-Off!";
      } else {
        title = "Kickoff!";
      }
      body = `${matchup} has started`;
      break;

    case "gameEnd":
      title = "FINAL";
      body = `${matchup}: ${awayScore}-${homeScore}`;
      break;

    case "periodEnd": {
      let periodLabel: string;
      if (league === "nhl") {
        periodLabel = getPeriodLabel(event.period || 0);
      } else if (league === "ncaam") {
        periodLabel = getHalfLabel(event.period || 0);
      } else {
        periodLabel = `Q${event.period}`;
      }
      title = `End of ${periodLabel}`;
      body = `${matchup}: ${awayScore}-${homeScore}`;
      break;
    }

    case "scoring":
      if (league === "nhl") {
        title = "GOAL!";
        body = event.description || `${matchup}: ${awayScore}-${homeScore}`;
      } else if (league === "ncaam") {
        title = "SCORE!";
        body = event.description || `${matchup}: ${awayScore}-${homeScore}`;
      } else {
        title = event.scoreType || "SCORE";
        body = `${matchup}: ${awayScore}-${homeScore}`;
      }
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
function getPeriodLabel(period: number): string {
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
 * Get half label for NCAAM
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
