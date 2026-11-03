// Minimal service worker: makes the app installable as a PWA.
// Deliberately no caching — data and auth must always come from the network
// (a cached shell could show a stale or another account's session).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
