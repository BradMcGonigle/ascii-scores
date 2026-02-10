"use client";

import { useCallback, useState, useEffect } from "react";
import { useNotifications } from "@/components/notifications";
import { useToast } from "@/components/ui/Toast";
import type { GameStatus } from "@/lib/types";
import type { NotificationLeague } from "@/lib/notifications/types";

interface GameDetailNotificationButtonProps {
  gameId: string;
  league: NotificationLeague;
  homeTeam: string;
  awayTeam: string;
  gameStatus: GameStatus;
  gameStartTime?: string; // ISO date string
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
  gameStartTime,
}: GameDetailNotificationButtonProps) {
  const {
    isSupported,
    permission,
    isSubscribedToGame,
    subscribeToGame,
    unsubscribeFromGame,
    sendTestNotification,
  } = useNotifications();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [isCronLoading, setIsCronLoading] = useState(false);
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
  }, [
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
  ]);

  const handleTestClick = useCallback(async () => {
    if (isTestLoading) return;

    setIsTestLoading(true);
    try {
      const result = await sendTestNotification();
      if (result.success) {
        toast("Test notification sent", "success");
      } else {
        toast(`Test failed: ${result.error}`, "error");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast(message, "error");
    } finally {
      setIsTestLoading(false);
    }
  }, [isTestLoading, sendTestNotification, toast]);

  const handleCronClick = useCallback(async () => {
    if (isCronLoading) return;

    setIsCronLoading(true);
    try {
      const response = await fetch("/api/cron/notifications?debug=true");
      const data = await response.json();
      toast(`Cron: ${data.processed ?? 0} processed, ${data.events ?? 0} events`, "info");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast(message, "error");
    } finally {
      setIsCronLoading(false);
    }
  }, [isCronLoading, toast]);

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

  const label = isSubscribed ? "Notifications On" : "Get Notified";

  return (
    <div className="flex items-center gap-2 justify-center flex-wrap">
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
        {isLoading ? "..." : <span className="inline-flex items-center gap-1.5"><span className={`inline-block size-2 rounded-full ${isSubscribed ? "bg-terminal-green" : "border border-current"}`} />{label}</span>}
      </button>
      {isSubscribed && process.env.NODE_ENV === "development" && (
        <>
          <button
            onClick={handleTestClick}
            disabled={isTestLoading}
            title="Send a test notification"
            className="font-mono text-xs px-2 py-1 border border-terminal-yellow text-terminal-yellow rounded transition-colors hover:bg-terminal-yellow/10 disabled:opacity-50"
          >
            {isTestLoading ? "..." : "Test"}
          </button>
          <button
            onClick={handleCronClick}
            disabled={isCronLoading}
            title="Trigger cron job to check for events"
            className="font-mono text-xs px-2 py-1 border border-terminal-cyan text-terminal-cyan rounded transition-colors hover:bg-terminal-cyan/10 disabled:opacity-50"
          >
            {isCronLoading ? "..." : "Cron"}
          </button>
        </>
      )}
    </div>
  );
}
