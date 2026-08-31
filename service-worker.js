// App-shell caching only: static assets are cached so the app opens (and the
// Timer tab works from localStorage) offline. Microsoft Graph / MSAL requests
// always go to the network untouched.
const CACHE_NAME = 'rmc-time-tracker-v9';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './js/app.js',
  './js/config.js',
  './js/graph.js',
  './js/state.js',
  './js/modal.js',
  './js/timer.js',
  './js/logs.js',
  './js/reports.js',
  './js/settings.js',
  './js/filters.js',
  './js/charts.js',
  './js/colors.js',
  './js/pull-to-refresh.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') {
    return; // let cross-origin (Graph, MSAL, CDN) and non-GET requests pass through untouched
  }

  // Network-first: always serve the latest deployed file when online, so a
  // fresh push shows up on next load without the user needing to clear
  // anything. Cache is only a fallback for when there's no network at all.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
