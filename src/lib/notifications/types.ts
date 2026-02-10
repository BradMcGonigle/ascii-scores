import type { GameStatus, League } from "@/lib/types";

/**
 * Leagues that support game notifications (excludes F1/PGA which don't have head-to-head games)
 */
export type NotificationLeague = "nhl" | "nfl" | "nba" | "mlb" | "mls" | "epl" | "fa-cup" | "ncaam" | "ncaaw";

/**
 * Event types that users can subscribe to
 */
export type NotificationEventType = "gameStart" | "gameEnd" | "scoring" | "periodEnd";

/**
 * User's event preferences for a game subscription
 */
export interface EventPreferences {
  gameStart: boolean;
  gameEnd: boolean;
  scoring: boolean;
  periodEnd: boolean;
}

/**
 * A user's subscription to a specific game
 */
export interface GameSubscription {
  gameId: string;
  league: NotificationLeague;
  homeTeam: string;
  awayTeam: string;
  events: EventPreferences;
  subscribedAt: string; // ISO date string
  gameStartTime?: string; // ISO date string - when the game is scheduled to start
}

/**
 * Full notification subscription stored in Redis
 */
export interface NotificationSubscription {
  id: string;
  pushSubscription: PushSubscriptionJSON;
  subscribedGames: GameSubscription[];
  createdAt: string;
  lastSeen: string;
}

/**
 * Cached game state for event detection (stored in Redis)
 */
export interface CachedGameState {
  gameId: string;
  league: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  period: number;
  scoringPlaysCount: number;
  lastUpdated: string;
}

/**
 * Detected notification event
 */
export interface NotificationEvent {
  type: NotificationEventType;
  gameId: string;
  league: NotificationLeague;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period?: number;
  scorer?: string;
  scoreType?: string;
  strength?: string; // For NHL: "ppg", "shg", "en", etc.
  description?: string;
}

/**
 * Push notification payload sent to the browser
 */
export interface PushNotificationPayload {
  title: string;
  body: string;
  gameId: string;
  league: string;
  type: NotificationEventType;
  url: string;
}

/**
 * Local storage schema for notification state
 */
export interface LocalNotificationState {
  subscriptionId: string | null;
  subscribedGames: Record<
    string,
    {
      league: string;
      events: EventPreferences;
    }
  >;
  permissionGranted: boolean;
  permissionDenied: boolean;
}

/**
 * Leagues that support notifications
 */
export const NOTIFICATION_SUPPORTED_LEAGUES: NotificationLeague[] = [
  "nhl", "nfl", "nba", "mlb", "mls", "epl", "fa-cup", "ncaam", "ncaaw",
];

/**
 * Check if a league supports notifications
 */
export function supportsNotifications(league: League): league is NotificationLeague {
  return (NOTIFICATION_SUPPORTED_LEAGUES as string[]).includes(league);
}

/**
 * Default event preferences (all enabled)
 */
export const DEFAULT_EVENT_PREFERENCES: EventPreferences = {
  gameStart: true,
  gameEnd: true,
  scoring: true,
  periodEnd: true,
};

/**
 * Get human-readable label for notification event type
 */
export function getEventTypeLabel(
  type: NotificationEventType,
  league: NotificationLeague
): string {
  switch (type) {
    case "gameStart":
      return "Game Start";
    case "gameEnd":
      return "Final Score";
    case "scoring":
      if (league === "nhl") return "Goals";
      if (league === "mls" || league === "epl" || league === "fa-cup") return "Goals";
      if (league === "mlb") return "Runs";
      return "Scores";
    case "periodEnd":
      if (league === "nhl") return "End of Period";
      if (league === "ncaam" || league === "ncaaw") return "End of Half";
      if (league === "mls" || league === "epl" || league === "fa-cup") return "End of Half";
      if (league === "mlb") return "End of Inning";
      return "End of Quarter";
  }
}
