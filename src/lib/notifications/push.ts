import webpush from "web-push";
import type { PushNotificationPayload } from "./types";

// Configure web-push with VAPID keys
// These should be set in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:notifications@ascii-scores.com";

// Initialize web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * Send a push notification to a subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("VAPID keys not configured");
    return { success: false, error: "VAPID keys not configured" };
  }

  if (!subscription.endpoint) {
    return { success: false, error: "Invalid subscription: missing endpoint" };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys as { p256dh: string; auth: string },
      },
      JSON.stringify(payload),
      {
        TTL: 60 * 60, // 1 hour TTL
        urgency: "high",
      }
    );
    return { success: true };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };

    // Handle specific error codes
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Subscription is no longer valid
      return { success: false, error: "subscription_expired" };
    }

    console.error("Failed to send push notification:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send notifications to multiple subscriptions
 */
export async function sendPushNotifications(
  subscriptions: PushSubscriptionJSON[],
  payload: PushNotificationPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const results = await Promise.all(
    subscriptions.map(async (sub) => ({
      subscription: sub,
      result: await sendPushNotification(sub, payload),
    }))
  );

  const sent = results.filter((r) => r.result.success).length;
  const failed = results.filter((r) => !r.result.success).length;
  const expired = results
    .filter((r) => r.result.error === "subscription_expired")
    .map((r) => r.subscription.endpoint!)
    .filter(Boolean);

  return { sent, failed, expired };
}

/**
 * Generate VAPID keys (utility for initial setup)
 * Run this once to generate keys, then store them in environment variables
 */
export function generateVAPIDKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}
