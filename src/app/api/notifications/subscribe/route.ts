import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  saveSubscription,
  getSubscription,
  addGameSubscription,
  type NotificationSubscription,
  type GameSubscription,
  type EventPreferences,
  DEFAULT_EVENT_PREFERENCES,
} from "@/lib/notifications";

interface SubscribeRequestBody {
  subscriptionId?: string;
  pushSubscription: PushSubscriptionJSON;
  gameId: string;
  league: "nhl" | "nfl";
  homeTeam: string;
  awayTeam: string;
  events?: Partial<EventPreferences>;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeRequestBody;

    // Validate required fields
    if (!body.pushSubscription?.endpoint) {
      return NextResponse.json({ error: "Missing push subscription" }, { status: 400 });
    }

    if (!body.gameId || !body.league || !body.homeTeam || !body.awayTeam) {
      return NextResponse.json({ error: "Missing game information" }, { status: 400 });
    }

    if (!["nhl", "nfl"].includes(body.league)) {
      return NextResponse.json(
        { error: "Notifications only supported for NHL and NFL" },
        { status: 400 }
      );
    }

    let subscription: NotificationSubscription | null = null;

    // Try to find existing subscription
    if (body.subscriptionId) {
      subscription = await getSubscription(body.subscriptionId);
    }

    // Create new subscription if not found, otherwise update it
    const subscriptionId = subscription?.id ?? uuidv4();
    if (!subscription) {
      subscription = {
        id: subscriptionId,
        pushSubscription: body.pushSubscription,
        subscribedGames: [],
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };
      await saveSubscription(subscription);
    } else {
      // Update push subscription in case it changed
      subscription.pushSubscription = body.pushSubscription;
      await saveSubscription(subscription);
    }

    // Create game subscription with merged event preferences
    const gameSubscription: GameSubscription = {
      gameId: body.gameId,
      league: body.league,
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      events: {
        ...DEFAULT_EVENT_PREFERENCES,
        ...body.events,
      },
      subscribedAt: new Date().toISOString(),
    };

    // Add game subscription
    await addGameSubscription(subscriptionId, gameSubscription);

    return NextResponse.json({
      success: true,
      subscriptionId,
      gameSubscription,
    });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
