// Minimal service worker — required for the app to be installable (PWA).
// Pass-through (no offline caching yet); keep it tiny and low-maintenance.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// A fetch handler must exist for installability. We let the browser handle
// requests normally (no respondWith), so this is a no-op pass-through.
self.addEventListener('fetch', () => {});
