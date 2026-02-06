"use client";

import { useCallback, useState, useEffect, type MouseEvent } from "react";
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
  const [mounted, setMounted] = useState(false);
  const isSubscribed = isSubscribedToGame(gameId);

  // Only show for scheduled or live games
  const isAvailable = gameStatus === "scheduled" || gameStatus === "live";

  // Wait for client-side mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = useCallback(
    async (e: MouseEvent) => {
      // Prevent navigation when card is wrapped in Link
      e.preventDefault();
      e.stopPropagation();

      if (isLoading) return;

      // Check if notifications are supported
      if (!isSupported) {
        // Show a helpful message for unsupported browsers
        alert(
          "Push notifications require this site to be installed as an app. " +
            "On iOS: tap Share → Add to Home Screen. " +
            "On Android: tap the menu → Install app."
        );
        return;
      }

      setIsLoading(true);
      try {
        if (isSubscribed) {
          await unsubscribeFromGame(gameId);
          alert("Unsubscribed from game notifications");
        } else {
          await subscribeToGame(gameId, league, homeTeam, awayTeam);
          alert("Subscribed to game notifications!");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        alert(`Notification error: ${message}`);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      isSupported,
      isSubscribed,
      gameId,
      league,
      homeTeam,
      awayTeam,
      subscribeToGame,
      unsubscribeFromGame,
    ]
  );

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null;
  }

  // Don't render if game has ended
  if (!isAvailable) {
    return null;
  }

  // Don't render if permission was explicitly denied
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
