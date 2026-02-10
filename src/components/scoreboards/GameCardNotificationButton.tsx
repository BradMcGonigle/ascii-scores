"use client";

import { useCallback, useState, useEffect, type MouseEvent } from "react";
import { useNotifications } from "@/components/notifications";
import { useToast } from "@/components/ui/Toast";
import type { GameStatus } from "@/lib/types";

interface GameCardNotificationButtonProps {
  gameId: string;
  league: "nhl" | "nfl" | "ncaam";
  homeTeam: string;
  awayTeam: string;
  gameStatus: GameStatus;
  gameStartTime?: string; // ISO date string
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
  gameStartTime,
}: GameCardNotificationButtonProps) {
  const {
    isSupported,
    permission,
    isSubscribedToGame,
    subscribeToGame,
    unsubscribeFromGame,
  } = useNotifications();
  const { toast } = useToast();

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
        toast("Install as an app to enable push notifications", "info");
        return;
      }

      setIsLoading(true);
      try {
        if (isSubscribed) {
          await unsubscribeFromGame(gameId);
          toast("Unsubscribed from game notifications", "info");
        } else {
          await subscribeToGame(gameId, league, homeTeam, awayTeam, undefined, gameStartTime);
          toast("Subscribed to game notifications", "success");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        toast(message, "error");
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
      gameStartTime,
      subscribeToGame,
      unsubscribeFromGame,
      toast,
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
      {isLoading ? "..." : <span className={`inline-block size-2 rounded-full ${isSubscribed ? "bg-terminal-green" : "border border-current"}`} />}
    </button>
  );
}
