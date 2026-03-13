/* eslint-env browser, serviceworker */

/**
 * Uni-Manager Service Worker
 * Handles caching, offline functionality, background sync, and push notifications
 *
 * Debug logging: set DEBUG = true locally when diagnosing SW issues.
 * Never commit with DEBUG = true — use browser DevTools > Application > Service Workers instead.
 */

const DEBUG = false;
const dbg = (...args) => {
  if (DEBUG) console.log(...args);
};

const CACHE_NAME = "uni-manager-v1";
const DYNAMIC_CACHE_NAME = "uni-manager-dynamic-v1";
const BACKGROUND_SYNC_TAG = "background-sync";

// Static assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/offline.html",
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/user\/profile/,
  /\/api\/church\/services/,
  /\/api\/home\/family/,
  /\/api\/admin\/analytics/,
];

// Background sync queue
let syncQueue = [];

/**
 * Service Worker Installation
 */
self.addEventListener("install", (event) => {
  dbg("Service Worker installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        dbg("Caching static assets...");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        dbg("Service Worker installed successfully");
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((installError) => {
        if (DEBUG)
          console.error("Service Worker installation failed:", installError);
      }),
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener("activate", (event) => {
  dbg("Service Worker activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              dbg("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Take control of all pages
      self.clients.claim(),
    ]).then(() => {
      dbg("Service Worker activated successfully");
    }),
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === "GET") {
    if (url.pathname.startsWith("/api/")) {
      // API requests - network first, then cache
      event.respondWith(handleApiRequest(request));
    } else if (request.destination === "document") {
      // HTML documents - cache first, then network
      event.respondWith(handleDocumentRequest(request));
    } else {
      // Static assets - cache first
      event.respondWith(handleStaticRequest(request));
    }
  } else {
    // POST/PUT/DELETE requests - handle offline queue
    event.respondWith(handleMutationRequest(request));
  }
});

/**
 * Background Sync Event Handler
 */
self.addEventListener("sync", (event) => {
  dbg("Background sync triggered:", event.tag);

  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(processSyncQueue());
  }
});

/**
 * Push Message Event Handler
 */
self.addEventListener("push", (event) => {
  dbg("Push message received:", event);

  const options = {
    body: "You have a new notification",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {},
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = payload.data || {};

      if (payload.title) {
        event.waitUntil(
          self.registration.showNotification(payload.title, options),
        );
      }
    } catch (pushParseError) {
      if (DEBUG) console.error("Failed to parse push payload:", pushParseError);
      event.waitUntil(
        self.registration.showNotification("Uni-Manager", options),
      );
    }
  } else {
    event.waitUntil(self.registration.showNotification("Uni-Manager", options));
  }
});

/**
 * Notification Click Event Handler
 */
self.addEventListener("notificationclick", (event) => {
  dbg("Notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === "view" || !action) {
    // Open or focus the app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }

        // Open new window if none exists
        if (clients.openWindow) {
          const targetUrl = data.url || "/";
          return clients.openWindow(targetUrl);
        }
      }),
    );
  }
  // dismiss action: notification already closed above — no further action needed.

  // Send action to main app
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "NOTIFICATION_ACTION",
        action: action,
        data: data,
      });
    });
  });
});

/**
 * Message Event Handler
 */
self.addEventListener("message", (event) => {
  dbg("Service Worker received message:", event.data);

  const { type, payload } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "ADD_TO_SYNC_QUEUE":
      addToSyncQueue(payload);
      break;

    case "CACHE_RESOURCE":
      cacheResource(payload.url, payload.cacheName);
      break;

    case "CLEAR_CACHE":
      clearCache(payload.cacheName);
      break;

    default:
      dbg("Unknown message type:", type);
  }
});

/**
 * Handle API requests (network first, cache fallback)
 */
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok && shouldCacheApiResponse(request)) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Intentionally silent — network unavailable; serve from cache or return offline response
    dbg("Network request failed, trying cache:", request.url);

    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: "Network unavailable",
        message: "This request will be retried when connection is restored",
        offline: true,
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

/**
 * Handle document requests (cache first, network fallback)
 */
async function handleDocumentRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fall back to network
    const networkResponse = await fetch(request);

    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Intentionally silent — serve offline page when both cache and network unavailable
    dbg("Document request failed, serving offline page");
    const offlineResponse = await caches.match("/offline.html");
    return offlineResponse || new Response("Offline", { status: 503 });
  }
}

/**
 * Handle static asset requests (cache first)
 */
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fall back to network and cache
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    // Intentionally silent — return offline placeholder when static asset unavailable
    dbg("Static request failed:", request.url);
    return new Response("Resource unavailable offline", { status: 503 });
  }
}

/**
 * Handle mutation requests (POST/PUT/DELETE)
 */
async function handleMutationRequest(request) {
  try {
    // Try network first for mutations
    return await fetch(request);
  } catch {
    // Intentionally silent — queue for background sync when network unavailable
    dbg("Mutation request failed, adding to sync queue:", request.url);

    // Add to sync queue for later processing
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== "GET" ? await request.text() : null,
      timestamp: Date.now(),
    };

    await addToSyncQueue(requestData);

    // Register for background sync
    await self.registration.sync.register(BACKGROUND_SYNC_TAG);

    // Return acknowledgment response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Request queued for background sync",
        queued: true,
      }),
      {
        status: 202,
        statusText: "Accepted",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

/**
 * Check if API response should be cached
 */
function shouldCacheApiResponse(request) {
  const url = new URL(request.url);

  // Cache specific API patterns
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
}

/**
 * Add request to sync queue
 */
async function addToSyncQueue(requestData) {
  try {
    syncQueue.push(requestData);

    // Store in IndexedDB for persistence
    await storeInIndexedDB("syncQueue", syncQueue);

    dbg("Added to sync queue:", requestData.url);
  } catch (queueError) {
    if (DEBUG) console.error("Failed to add to sync queue:", queueError);
  }
}

/**
 * Process sync queue
 */
async function processSyncQueue() {
  try {
    dbg("Processing sync queue...");

    // Load queue from IndexedDB
    syncQueue = (await loadFromIndexedDB("syncQueue")) || [];

    if (syncQueue.length === 0) {
      dbg("Sync queue is empty");
      return;
    }

    const results = [];
    const failedItems = [];

    for (const item of syncQueue) {
      try {
        dbg("Processing sync item:", item.url);

        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (response.ok) {
          results.push({ item, success: true });
          dbg("Sync item processed successfully:", item.url);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (syncItemError) {
        if (DEBUG) console.error("Failed to process sync item:", syncItemError);

        // Retry logic - keep items that are less than 24 hours old
        if (Date.now() - item.timestamp < 24 * 60 * 60 * 1000) {
          failedItems.push(item);
        }

        results.push({
          item,
          success: false,
          error:
            syncItemError instanceof Error
              ? syncItemError.message
              : String(syncItemError),
        });
      }
    }

    // Update sync queue with failed items
    syncQueue = failedItems;
    await storeInIndexedDB("syncQueue", syncQueue);

    dbg(
      `Sync complete: ${results.length} processed, ${failedItems.length} remain`,
    );

    // Notify main app
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        payload: {
          processed: results.length,
          remaining: failedItems.length,
          results: results,
        },
      });
    });
  } catch (syncQueueError) {
    if (DEBUG) console.error("Failed to process sync queue:", syncQueueError);
  }
}

/**
 * Cache a specific resource
 */
async function cacheResource(url, cacheName = DYNAMIC_CACHE_NAME) {
  try {
    const cache = await caches.open(cacheName);
    await cache.add(url);
    dbg("Cached resource:", url);
  } catch (cacheError) {
    if (DEBUG) console.error("Failed to cache resource:", cacheError);
  }
}

/**
 * Clear cache
 */
async function clearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      dbg("Cache cleared:", cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      dbg("All caches cleared");
    }
  } catch (clearError) {
    if (DEBUG) console.error("Failed to clear cache:", clearError);
  }
}

/**
 * Store data in IndexedDB
 */
async function storeInIndexedDB(key, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UniManagerDB", 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["syncData"], "readwrite");
      const store = transaction.objectStore("syncData");

      const putRequest = store.put(data, key);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("syncData")) {
        db.createObjectStore("syncData");
      }
    };
  });
}

/**
 * Load data from IndexedDB
 */
async function loadFromIndexedDB(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("UniManagerDB", 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(["syncData"], "readonly");
      const store = transaction.objectStore("syncData");

      const getRequest = store.get(key);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("syncData")) {
        db.createObjectStore("syncData");
      }
    };
  });
}
