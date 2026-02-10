import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { removeGameSubscription, getSubscription } from "@/lib/notifications";

interface UnsubscribeRequestBody {
  subscriptionId: string;
  gameId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UnsubscribeRequestBody;

    // Validate required fields
    if (!body.subscriptionId || !body.gameId) {
      return NextResponse.json(
        { error: "Missing subscriptionId or gameId" },
        { status: 400 }
      );
    }

    // Verify subscription exists
    const subscription = await getSubscription(body.subscriptionId);
    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Remove game subscription
    await removeGameSubscription(body.subscriptionId, body.gameId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
