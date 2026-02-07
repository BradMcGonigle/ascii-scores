import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSubscription, sendPushNotification } from "@/lib/notifications";

/**
 * Test endpoint to send a test notification
 * POST /api/notifications/test
 * Body: { subscriptionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 }
      );
    }

    // Get the subscription from Redis
    const subscription = await getSubscription(subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found in database", subscriptionId },
        { status: 404 }
      );
    }

    if (!subscription.pushSubscription) {
      return NextResponse.json(
        { error: "No push subscription found", subscription },
        { status: 400 }
      );
    }

    // Send a test notification
    const testPayload = {
      title: "🏒 Test Notification",
      body: "If you see this, push notifications are working!",
      gameId: "test",
      league: "nhl" as const,
      type: "scoring" as const,
      url: "/nhl",
    };

    const result = await sendPushNotification(subscription.pushSubscription, testPayload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test notification sent successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        subscriptionEndpoint: subscription.pushSubscription.endpoint,
      });
    }
  } catch (error) {
    console.error("Test notification error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test notification",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
