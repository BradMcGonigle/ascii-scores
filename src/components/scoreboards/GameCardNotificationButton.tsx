"use client";

import { useCallback, useState, type MouseEvent } from "react";
import { useNotifications } from "@/components/notifications";
import type { GameStatus } from "@/lib/types";

interface GameCardNotificationButtonProps {
  gameId: string;
  league: "nhl" | "nfl";
  homeTeam: string;
  awayTeam: string;
  gameStatus: GameStatus;
}

/**
 * Notification button for GameCard that handles click events
 * to prevent navigation when card is wrapped in a Link
 */
export function GameCardNotificationButton({
  gameId,
  league,
  homeTeam,
  awayTeam,
  gameStatus,
}: GameCardNotificationButtonProps) {
  const {
    isSupported,
    permission,
    isSubscribedToGame,
    subscribeToGame,
    unsubscribeFromGame,
  } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const isSubscribed = isSubscribedToGame(gameId);

  // Only show for scheduled or live games
  const isAvailable = gameStatus === "scheduled" || gameStatus === "live";

  const handleClick = useCallback(
    async (e: MouseEvent) => {
      // Prevent navigation when card is wrapped in Link
      e.preventDefault();
      e.stopPropagation();

      if (isLoading) return;

      setIsLoading(true);
      try {
        if (isSubscribed) {
          await unsubscribeFromGame(gameId);
        } else {
          await subscribeToGame(gameId, league, homeTeam, awayTeam);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      isSubscribed,
      gameId,
      league,
      homeTeam,
      awayTeam,
      subscribeToGame,
      unsubscribeFromGame,
    ]
  );

  // Don't render if notifications aren't supported or game has ended
  if (!isSupported || !isAvailable) {
    return null;
  }

  // Don't render if permission was denied
  if (permission === "denied") {
    return null;
  }

  const title = isSubscribed
    ? "Unsubscribe from game notifications"
    : "Subscribe to game notifications";

  const icon = isSubscribed ? "🔔" : "🔕";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={title}
      className={`font-mono text-xs transition-colors ${
        isSubscribed
          ? "text-terminal-green hover:text-terminal-green/80"
          : "text-terminal-muted hover:text-terminal-fg"
      } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      aria-label={title}
      aria-pressed={isSubscribed}
    >
      {isLoading ? "..." : icon}
    </button>
  );
}
