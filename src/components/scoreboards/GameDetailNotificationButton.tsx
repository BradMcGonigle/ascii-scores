"use client";

import { useCallback, useState, useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import type { GameStatus } from "@/lib/types";

interface GameDetailNotificationButtonProps {
  gameId: string;
  league: "nhl" | "nfl";
  homeTeam: string;
  awayTeam: string;
  gameStatus: GameStatus;
}

/**
 * Notification button for GameDetail page
 * Styled for the game detail header with more prominent display
 */
export function GameDetailNotificationButton({
  gameId,
  league,
  homeTeam,
  awayTeam,
  gameStatus,
}: GameDetailNotificationButtonProps) {
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

  const handleClick = useCallback(async () => {
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
  }, [
    isLoading,
    isSupported,
    isSubscribed,
    gameId,
    league,
    homeTeam,
    awayTeam,
    subscribeToGame,
    unsubscribeFromGame,
  ]);

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
  const label = isSubscribed ? "Notifications On" : "Get Notified";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={title}
      className={`font-mono text-xs px-2 py-1 border rounded transition-colors ${
        isSubscribed
          ? "border-terminal-green text-terminal-green hover:bg-terminal-green/10"
          : "border-terminal-muted text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
      } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      aria-label={title}
      aria-pressed={isSubscribed}
    >
      {isLoading ? "..." : `${icon} ${label}`}
    </button>
  );
}
