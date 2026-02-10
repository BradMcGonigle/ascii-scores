/// <reference lib="webworker" />

// Service Worker for ASCII Scores push notifications and caching

// Increment this version when deploying updates to bust the cache
const CACHE_VERSION = 3;
const CACHE_NAME = `ascii-scores-v${CACHE_VERSION}`;

// Assets to pre-cache (app shell)
// Note: Add icon files when they exist
const PRECACHE_ASSETS = [];

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
  console.log("[SW] Installing, version:", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      if (PRECACHE_ASSETS.length > 0) {
        console.log("[SW] Pre-caching assets:", PRECACHE_ASSETS);
        return cache.addAll(PRECACHE_ASSETS);
      }
      console.log("[SW] No assets to pre-cache");
      return Promise.resolve();
    }).then(() => {
      console.log("[SW] Installation complete");
    }).catch((error) => {
      console.error("[SW] Installation failed:", error);
      throw error;
    })
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// Handle service worker activation - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating, version:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith("ascii-scores-") && name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log("[SW] Claiming clients");
      return clients.claim();
    }).then(() => {
      console.log("[SW] Activation complete");
    })
  );
});

// Handle fetch requests - network-first for pages, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip API routes - always go to network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // For HTML pages (navigation requests): network-first with cache fallback
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching (can only read once)
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, images): stale-while-revalidate
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          });
          // Return cached immediately, update in background
          return cached || fetchPromise;
        });
      })
    );
    return;
  }
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
