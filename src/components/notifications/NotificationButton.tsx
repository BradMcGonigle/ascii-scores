"use client";

import { useCallback, useState } from "react";
import { useNotifications } from "./NotificationProvider";

interface NotificationButtonProps {
  gameId: string;
  league: "nhl" | "nfl" | "ncaam";
  homeTeam: string;
  awayTeam: string;
  gameStatus: "scheduled" | "live" | "final" | "postponed" | "delayed";
  compact?: boolean;
}

export function NotificationButton({
  gameId,
  league,
  homeTeam,
  awayTeam,
  gameStatus,
  compact = false,
}: NotificationButtonProps) {
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

  const handleClick = useCallback(async () => {
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
  }, [
    isLoading,
    isSubscribed,
    gameId,
    league,
    homeTeam,
    awayTeam,
    subscribeToGame,
    unsubscribeFromGame,
  ]);

  // Don't render if notifications aren't supported or game has ended
  if (!isSupported || !isAvailable) {
    return null;
  }

  // Don't render if permission was denied
  if (permission === "denied") {
    return null;
  }

  const title = isSubscribed
    ? "Unsubscribe from notifications"
    : "Subscribe to notifications";

  const label = isSubscribed ? "[ALERTS ON]" : "[ALERTS]";
  const icon = isSubscribed ? "🔔" : "🔕";

  if (compact) {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={title}
        className={`font-mono text-xs transition-colors ${
          isSubscribed
            ? "text-live hover:text-live/80"
            : "text-terminal-muted hover:text-terminal-fg"
        } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
        aria-label={title}
        aria-pressed={isSubscribed}
      >
        {isLoading ? "[...]" : icon}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={title}
      className={`font-mono text-xs px-2 py-1 border transition-colors ${
        isSubscribed
          ? "border-live text-live hover:bg-live/10"
          : "border-terminal-muted text-terminal-muted hover:border-terminal-fg hover:text-terminal-fg"
      } ${isLoading ? "opacity-50 cursor-wait" : ""}`}
      aria-label={title}
      aria-pressed={isSubscribed}
    >
      {isLoading ? "[...]" : label}
    </button>
  );
}
