import { Redis } from "@upstash/redis";
import type { CachedGameState, GameSubscription, NotificationLeague, NotificationSubscription } from "./types";
import { NOTIFICATION_SUPPORTED_LEAGUES } from "./types";

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
  activeGamesByLeague: (league: string) => `active_games:${league}`,
  gameMetadata: (gameId: string) => `game:${gameId}:meta`,
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
 * Game metadata stored for smart scheduling
 */
interface GameMetadata {
  gameId: string;
  league: NotificationLeague;
  gameStartTime?: string;
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

  // Add game to active games set (global and per-league)
  await redis.sadd(KEYS.activeGames, gameSubscription.gameId);
  await redis.sadd(KEYS.activeGamesByLeague(gameSubscription.league), gameSubscription.gameId);

  // Store game metadata for smart scheduling
  const metadata: GameMetadata = {
    gameId: gameSubscription.gameId,
    league: gameSubscription.league,
    gameStartTime: gameSubscription.gameStartTime,
  };
  await redis.set(KEYS.gameMetadata(gameSubscription.gameId), JSON.stringify(metadata), {
    ex: TTL.gameState,
  });
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
  // Get game metadata to know which league set to clean up
  const metadataRaw = await redis.get<string>(KEYS.gameMetadata(gameId));
  const metadata = metadataRaw
    ? typeof metadataRaw === "string"
      ? JSON.parse(metadataRaw)
      : metadataRaw
    : null;

  // Remove all subscribers from this game
  const subscribers = await getGameSubscribers(gameId);
  for (const subId of subscribers) {
    await removeGameSubscription(subId, gameId);
  }

  // Clean up game-specific keys
  await redis.del(KEYS.gameSubscribers(gameId));
  await redis.del(KEYS.gameState(gameId));
  await redis.del(KEYS.gameMetadata(gameId));
  await redis.srem(KEYS.activeGames, gameId);

  // Remove from league-specific set if we know the league
  if (metadata?.league) {
    await redis.srem(KEYS.activeGamesByLeague(metadata.league), gameId);
  }
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

/**
 * Get active games for a specific league
 */
export async function getActiveGamesByLeague(
  league: NotificationLeague
): Promise<string[]> {
  const games = await redis.smembers(KEYS.activeGamesByLeague(league));
  return games as string[];
}

/**
 * Get game metadata
 */
export async function getGameMetadata(gameId: string): Promise<GameMetadata | null> {
  const data = await redis.get<string>(KEYS.gameMetadata(gameId));
  if (!data) return null;
  return typeof data === "string" ? JSON.parse(data) : data;
}

// Buffer time before game start to begin polling (30 minutes)
const PRE_GAME_BUFFER_MS = 30 * 60 * 1000;
// Buffer time after expected game end to continue polling (4 hours for long games/OT)
const POST_GAME_BUFFER_MS = 4 * 60 * 60 * 1000;

/**
 * Get leagues that have games needing to be polled
 * Returns only leagues with games that are:
 * - Currently in progress (no start time, assume active)
 * - Starting within the pre-game buffer
 * - Potentially still in progress (within post-game buffer)
 */
export async function getLeaguesNeedingPolling(): Promise<NotificationLeague[]> {
  const leagues = NOTIFICATION_SUPPORTED_LEAGUES;
  const leaguesNeedingPolling: NotificationLeague[] = [];
  const now = Date.now();

  for (const league of leagues) {
    const gameIds = await getActiveGamesByLeague(league);

    if (gameIds.length === 0) {
      continue;
    }

    // Check if any game in this league needs polling
    let needsPolling = false;

    for (const gameId of gameIds) {
      const metadata = await getGameMetadata(gameId);

      // If no metadata or no start time, assume we need to poll (legacy subscriptions)
      if (!metadata?.gameStartTime) {
        needsPolling = true;
        break;
      }

      const startTime = new Date(metadata.gameStartTime).getTime();
      const pollingWindowStart = startTime - PRE_GAME_BUFFER_MS;
      const pollingWindowEnd = startTime + POST_GAME_BUFFER_MS;

      // Check if current time is within the polling window
      if (now >= pollingWindowStart && now <= pollingWindowEnd) {
        needsPolling = true;
        break;
      }
    }

    if (needsPolling) {
      leaguesNeedingPolling.push(league);
    }
  }

  return leaguesNeedingPolling;
}

export { redis };
