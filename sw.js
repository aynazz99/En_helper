const cacheName = 'wordquiz-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(filesToCache)));
});

self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
