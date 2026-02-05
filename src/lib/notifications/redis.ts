import { Redis } from "@upstash/redis";
import type { CachedGameState, GameSubscription, NotificationSubscription } from "./types";

// Initialize Redis client
// Environment variables are auto-populated by Vercel when using the Upstash integration
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Key prefixes for Redis
const KEYS = {
  subscription: (id: string) => `sub:${id}`,
  gameState: (gameId: string) => `game:${gameId}`,
  gameSubscribers: (gameId: string) => `game:${gameId}:subs`,
  activeGames: "active_games",
} as const;

// TTL values (in seconds)
const TTL = {
  subscription: 60 * 60 * 24 * 30, // 30 days
  gameState: 60 * 60 * 6, // 6 hours (games don't last longer)
  activeGames: 60 * 60, // 1 hour
} as const;

/**
 * Save or update a notification subscription
 */
export async function saveSubscription(subscription: NotificationSubscription): Promise<void> {
  const key = KEYS.subscription(subscription.id);
  await redis.set(key, JSON.stringify(subscription), { ex: TTL.subscription });
}

/**
 * Get a subscription by ID
 */
export async function getSubscription(id: string): Promise<NotificationSubscription | null> {
  const key = KEYS.subscription(id);
  const data = await redis.get<string>(key);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(id: string): Promise<void> {
  const key = KEYS.subscription(id);
  await redis.del(key);
}

/**
 * Add a game subscription to a user's subscription
 */
export async function addGameSubscription(
  subscriptionId: string,
  gameSubscription: GameSubscription
): Promise<void> {
  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Check if already subscribed to this game
  const existingIndex = subscription.subscribedGames.findIndex(
    (g) => g.gameId === gameSubscription.gameId
  );

  if (existingIndex >= 0) {
    // Update existing subscription
    subscription.subscribedGames[existingIndex] = gameSubscription;
  } else {
    // Add new game subscription
    subscription.subscribedGames.push(gameSubscription);
  }

  subscription.lastSeen = new Date().toISOString();
  await saveSubscription(subscription);

  // Add subscription ID to the game's subscriber set
  await redis.sadd(KEYS.gameSubscribers(gameSubscription.gameId), subscriptionId);

  // Add game to active games set
  await redis.sadd(KEYS.activeGames, gameSubscription.gameId);
}

/**
 * Remove a game subscription from a user's subscription
 */
export async function removeGameSubscription(
  subscriptionId: string,
  gameId: string
): Promise<void> {
  const subscription = await getSubscription(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  subscription.subscribedGames = subscription.subscribedGames.filter((g) => g.gameId !== gameId);
  subscription.lastSeen = new Date().toISOString();
  await saveSubscription(subscription);

  // Remove subscription ID from the game's subscriber set
  await redis.srem(KEYS.gameSubscribers(gameId), subscriptionId);

  // Check if there are any remaining subscribers for this game
  const remainingSubscribers = await redis.scard(KEYS.gameSubscribers(gameId));
  if (remainingSubscribers === 0) {
    // Remove game from active games set
    await redis.srem(KEYS.activeGames, gameId);
    // Clean up game state cache
    await redis.del(KEYS.gameState(gameId));
  }
}

/**
 * Get all subscription IDs for a game
 */
export async function getGameSubscribers(gameId: string): Promise<string[]> {
  const subscribers = await redis.smembers(KEYS.gameSubscribers(gameId));
  return subscribers as string[];
}

/**
 * Get all active game IDs (games with subscribers)
 */
export async function getActiveGames(): Promise<string[]> {
  const games = await redis.smembers(KEYS.activeGames);
  return games as string[];
}

/**
 * Save cached game state for event detection
 */
export async function saveGameState(state: CachedGameState): Promise<void> {
  const key = KEYS.gameState(state.gameId);
  await redis.set(key, JSON.stringify(state), { ex: TTL.gameState });
}

/**
 * Get cached game state
 */
export async function getGameState(gameId: string): Promise<CachedGameState | null> {
  const key = KEYS.gameState(gameId);
  const data = await redis.get<string>(key);
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

/**
 * Clean up finished games
 * Should be called periodically to remove games that have ended
 */
export async function cleanupFinishedGame(gameId: string): Promise<void> {
  // Remove all subscribers from this game
  const subscribers = await getGameSubscribers(gameId);
  for (const subId of subscribers) {
    await removeGameSubscription(subId, gameId);
  }

  // Clean up game-specific keys
  await redis.del(KEYS.gameSubscribers(gameId));
  await redis.del(KEYS.gameState(gameId));
  await redis.srem(KEYS.activeGames, gameId);
}

/**
 * Update subscription endpoint (for pushsubscriptionchange event)
 */
export async function updateSubscriptionEndpoint(
  _oldEndpoint: string,
  _newPushSubscription: PushSubscriptionJSON
): Promise<void> {
  // This would require searching by endpoint, which is expensive
  // For now, we'll handle this by having the client re-subscribe
  console.log("Subscription endpoint changed, client should re-subscribe");
}

export { redis };
