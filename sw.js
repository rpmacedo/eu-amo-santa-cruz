const CACHE_NAME = 'eu-amo-santa-cruz-v6';
const urlsToCache = [
  'index.html',
  'css/style.css',
  'js/api.js',
  'js/radios.js',
  'js/classificados.js',
  'js/profissionais.js',
  'js/app.js',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('googleapis.com') || event.request.url.includes('googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request).then(fetchResp => {
        if (fetchResp.ok && fetchResp.type === 'basic') {
          const respClone = fetchResp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return fetchResp;
      })
    )
  );
});
