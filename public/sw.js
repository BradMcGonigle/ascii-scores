/// <reference lib="webworker" />

// Service Worker for ASCII Scores push notifications

const CACHE_NAME = "ascii-scores-v1";

// Handle push notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.warn("Push event received but no data");
    return;
  }

  try {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-badge.png",
      tag: data.gameId, // Prevents duplicate notifications for same game
      renotify: true, // Vibrate even if replacing existing notification
      requireInteraction: data.type === "gameEnd", // Keep final score on screen
      data: {
        url: data.url || `/${data.league}`,
        gameId: data.gameId,
        league: data.league,
        type: data.type,
      },
      actions: [
        {
          action: "view",
          title: "View Game",
        },
        {
          action: "dismiss",
          title: "Dismiss",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  } catch (error) {
    console.error("Error parsing push notification data:", error);
  }
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Default action or "view" action - open the game page
  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open with the app
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker installing");
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});

// Handle push subscription change (if user clears browser data)
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed, resubscribing...");
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: self.VAPID_PUBLIC_KEY,
      })
      .then((subscription) => {
        // Notify the server about the new subscription
        return fetch("/api/notifications/resubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription?.endpoint,
            newSubscription: subscription.toJSON(),
          }),
        });
      })
  );
});
