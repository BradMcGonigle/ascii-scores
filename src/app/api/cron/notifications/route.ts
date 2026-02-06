import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Game, ScoringPlay } from "@/lib/types";
import { getESPNScoreboard } from "@/lib/api/espn";
import { getGameSummary } from "@/lib/api/espn-summary";
import {
  getActiveGames,
  getLeaguesNeedingPolling,
  getGameState,
  saveGameState,
  getGameSubscribers,
  getSubscription,
  cleanupFinishedGame,
  detectEvents,
  createInitialGameState,
  formatNotificationPayload,
  sendPushNotification,
  type NotificationEvent,
  type EventPreferences,
} from "@/lib/notifications";

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await processNotifications();
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error processing notifications:", error);
    return NextResponse.json({ error: "Failed to process notifications" }, { status: 500 });
  }
}

async function processNotifications() {
  const activeGameIds = await getActiveGames();

  if (activeGameIds.length === 0) {
    return { processed: 0, events: 0, notifications: 0, leaguesPolled: [] };
  }

  // Determine which leagues need polling based on game schedules
  const leaguesToPoll = await getLeaguesNeedingPolling();

  if (leaguesToPoll.length === 0) {
    // No leagues have games in their polling window
    return {
      processed: 0,
      events: 0,
      notifications: 0,
      leaguesPolled: [],
      skippedReason: "No games in polling window",
    };
  }

  let totalEvents = 0;
  let totalNotifications = 0;

  // Only fetch scoreboards for leagues that need polling
  const scoreboardPromises: Promise<{ league: "nhl" | "nfl" | "ncaam"; scoreboard: Awaited<ReturnType<typeof getESPNScoreboard>> | null }>[] = [];

  for (const league of leaguesToPoll) {
    scoreboardPromises.push(
      getESPNScoreboard(league)
        .then((scoreboard) => ({ league, scoreboard }))
        .catch(() => ({ league, scoreboard: null }))
    );
  }

  const scoreboardResults = await Promise.all(scoreboardPromises);

  // Create a map of all current games from the fetched scoreboards
  const currentGames = new Map<string, { game: Game; league: "nhl" | "nfl" | "ncaam" }>();

  for (const { league, scoreboard } of scoreboardResults) {
    if (scoreboard) {
      for (const game of scoreboard.games) {
        currentGames.set(game.id, { game, league });
      }
    }
  }

  // Process each active game
  for (const gameId of activeGameIds) {
    const gameData = currentGames.get(gameId);
    if (!gameData) {
      // Game not in current scoreboard, might have ended or been cancelled
      continue;
    }

    const { game, league } = gameData;

    // Get previous state
    const prevState = await getGameState(gameId);

    // Fetch detailed game summary for scoring plays
    let scoringPlays: ScoringPlay[] = [];
    try {
      const summary = await getGameSummary(league, gameId);
      if (summary) {
        scoringPlays = summary.scoringPlays;
      }
    } catch (error) {
      console.error(`Failed to fetch game summary for ${gameId}:`, error);
    }

    // Detect events
    let events: NotificationEvent[] = [];
    if (prevState) {
      events = detectEvents(prevState, game, scoringPlays);
    }

    // Save current state
    const currentState = createInitialGameState(game, scoringPlays.length);
    await saveGameState(currentState);

    // Send notifications for each event
    if (events.length > 0) {
      totalEvents += events.length;

      const subscribers = await getGameSubscribers(gameId);

      for (const event of events) {
        const payload = formatNotificationPayload(event);

        for (const subscriberId of subscribers) {
          const subscription = await getSubscription(subscriberId);
          if (!subscription) continue;

          // Find the game subscription to check event preferences
          const gameSub = subscription.subscribedGames.find((g) => g.gameId === gameId);
          if (!gameSub) continue;

          // Check if user wants this type of notification
          if (!shouldSendNotification(event.type, gameSub.events)) continue;

          // Send notification
          const result = await sendPushNotification(subscription.pushSubscription, payload);
          if (result.success) {
            totalNotifications++;
          }
        }
      }
    }

    // Clean up finished games
    if (game.status === "final") {
      await cleanupFinishedGame(gameId);
    }
  }

  return {
    processed: activeGameIds.length,
    events: totalEvents,
    notifications: totalNotifications,
    leaguesPolled: leaguesToPoll,
  };
}

function shouldSendNotification(
  eventType: NotificationEvent["type"],
  preferences: EventPreferences
): boolean {
  switch (eventType) {
    case "gameStart":
      return preferences.gameStart;
    case "gameEnd":
      return preferences.gameEnd;
    case "scoring":
      return preferences.scoring;
    case "periodEnd":
      return preferences.periodEnd;
    default:
      return false;
  }
}
