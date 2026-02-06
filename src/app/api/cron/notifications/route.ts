import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Game, ScoringPlay } from "@/lib/types";
import { getESPNScoreboard } from "@/lib/api/espn";
import { getGameSummary } from "@/lib/api/espn-summary";
import {
  getActiveGames,
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
    return { processed: 0, events: 0, notifications: 0 };
  }

  let totalEvents = 0;
  let totalNotifications = 0;

  // Fetch current scoreboards for NHL, NFL, and NCAAM
  const [nhlScoreboard, nflScoreboard, ncaamScoreboard] = await Promise.all([
    getESPNScoreboard("nhl").catch(() => null),
    getESPNScoreboard("nfl").catch(() => null),
    getESPNScoreboard("ncaam").catch(() => null),
  ]);

  // Create a map of all current games
  const currentGames = new Map<string, { game: Game; league: "nhl" | "nfl" | "ncaam" }>();

  if (nhlScoreboard) {
    for (const game of nhlScoreboard.games) {
      currentGames.set(game.id, { game, league: "nhl" });
    }
  }

  if (nflScoreboard) {
    for (const game of nflScoreboard.games) {
      currentGames.set(game.id, { game, league: "nfl" });
    }
  }

  if (ncaamScoreboard) {
    for (const game of ncaamScoreboard.games) {
      currentGames.set(game.id, { game, league: "ncaam" });
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
