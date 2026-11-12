/*
 * Flagwright's service worker: it keeps a copy of the site on the device, so the maker opens
 * and works without signal after the first visit. The build (tools/postbuild.mjs) fills in
 * VERSION, from the files' contents, and APP, the pages and files to keep.
 */
const VERSION = '__VERSION__';
const APP = __APP__;
const CACHE = `flagwright-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP))
      .then(() => self.skipWaiting()),
  );
});

// A new version clears out the old copies.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('flagwright-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Pages: fresh from the network when there's signal; the kept copy of that page (or of the
  // maker) when there isn't.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(url.pathname, { ignoreSearch: true })) || (await caches.match('/', { ignoreSearch: true })) || Response.error()),
    );
    return;
  }

  // Everything else: the kept copy first (file names carry a hash of their contents).
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((kept) => kept || fetch(request)));
});
