"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { EventPreferences, LocalNotificationState } from "@/lib/notifications/types";

interface NotificationContextValue {
  isSupported: boolean;
  permission: NotificationPermission | "default";
  subscriptionId: string | null;
  subscribedGames: LocalNotificationState["subscribedGames"];
  isSubscribedToGame: (gameId: string) => boolean;
  subscribeToGame: (
    gameId: string,
    league: "nhl" | "nfl" | "ncaam",
    homeTeam: string,
    awayTeam: string,
    events?: Partial<EventPreferences>
  ) => Promise<boolean>;
  unsubscribeFromGame: (gameId: string) => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "ascii-scores-notifications";

function getStoredState(): LocalNotificationState {
  if (typeof window === "undefined") {
    return {
      subscriptionId: null,
      subscribedGames: {},
      permissionGranted: false,
      permissionDenied: false,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to parse notification state:", error);
  }

  return {
    subscriptionId: null,
    subscribedGames: {},
    permissionGranted: false,
    permissionDenied: false,
  };
}

function saveState(state: LocalNotificationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save notification state:", error);
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [state, setState] = useState<LocalNotificationState>(getStoredState);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  // Initialize on mount
  useEffect(() => {
    setMounted(true);

    // Check if notifications are supported
    const supported =
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      setState(getStoredState());

      // Register service worker and get push subscription
      const initServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          await navigator.serviceWorker.ready;

          // Get existing push subscription
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            setPushSubscription(existingSubscription);
          }
        } catch (error) {
          console.error("Failed to register service worker:", error);
        }
      };
      initServiceWorker();
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (mounted) {
      saveState(state);
    }
  }, [state, mounted]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        setState((prev) => ({
          ...prev,
          permissionGranted: true,
          permissionDenied: false,
        }));

        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        const vapidKeyResponse = await fetch("/api/notifications/vapid-public-key");
        const { vapidPublicKey } = await vapidKeyResponse.json();

        if (vapidPublicKey) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });
          setPushSubscription(subscription);
        }

        return true;
      } else {
        setState((prev) => ({
          ...prev,
          permissionGranted: false,
          permissionDenied: result === "denied",
        }));
        return false;
      }
    } catch (error) {
      console.error("Failed to request notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const isSubscribedToGame = useCallback(
    (gameId: string): boolean => {
      return gameId in state.subscribedGames;
    },
    [state.subscribedGames]
  );

  const subscribeToGame = useCallback(
    async (
      gameId: string,
      league: "nhl" | "nfl" | "ncaam",
      homeTeam: string,
      awayTeam: string,
      events?: Partial<EventPreferences>
    ): Promise<boolean> => {
      // Ensure we have permission
      if (permission !== "granted") {
        const granted = await requestPermission();
        if (!granted) return false;
      }

      // Ensure we have a push subscription
      let currentPushSubscription = pushSubscription;
      if (!currentPushSubscription) {
        try {
          const registration = await navigator.serviceWorker.ready;
          currentPushSubscription = await registration.pushManager.getSubscription();

          if (!currentPushSubscription) {
            const vapidKeyResponse = await fetch("/api/notifications/vapid-public-key");
            const { vapidPublicKey } = await vapidKeyResponse.json();

            if (vapidPublicKey) {
              currentPushSubscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
              });
              setPushSubscription(currentPushSubscription);
            }
          }
        } catch (error) {
          console.error("Failed to get push subscription:", error);
          return false;
        }
      }

      if (!currentPushSubscription) {
        console.error("No push subscription available");
        return false;
      }

      try {
        const response = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: state.subscriptionId,
            pushSubscription: currentPushSubscription.toJSON(),
            gameId,
            league,
            homeTeam,
            awayTeam,
            events,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to subscribe");
        }

        const data = await response.json();

        setState((prev) => ({
          ...prev,
          subscriptionId: data.subscriptionId,
          subscribedGames: {
            ...prev.subscribedGames,
            [gameId]: {
              league,
              events: data.gameSubscription.events,
            },
          },
        }));

        return true;
      } catch (error) {
        console.error("Failed to subscribe to game:", error);
        return false;
      }
    },
    [permission, pushSubscription, state.subscriptionId, requestPermission]
  );

  const unsubscribeFromGame = useCallback(
    async (gameId: string): Promise<boolean> => {
      if (!state.subscriptionId) return false;

      try {
        const response = await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionId: state.subscriptionId,
            gameId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to unsubscribe");
        }

        setState((prev) => {
          const { [gameId]: _removed, ...remainingGames } = prev.subscribedGames;
          void _removed; // Intentionally unused - removing this game from subscriptions
          return {
            ...prev,
            subscribedGames: remainingGames,
          };
        });

        return true;
      } catch (error) {
        console.error("Failed to unsubscribe from game:", error);
        return false;
      }
    },
    [state.subscriptionId]
  );

  const value: NotificationContextValue = {
    isSupported,
    permission,
    subscriptionId: state.subscriptionId,
    subscribedGames: state.subscribedGames,
    isSubscribedToGame,
    subscribeToGame,
    unsubscribeFromGame,
    requestPermission,
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}

// Helper function to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
