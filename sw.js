const CACHE_NAME = 'wordquiz-cache-v2';
const CORE_FILES = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/mountains.jpg',
  '/favicon.ico'
];

// Установка SW и кэширование основных файлов
self.addEventListener('install', event => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_FILES);
    }).then(() => self.skipWaiting())
  );
});

// Активация и очистка старого кэша
self.addEventListener('activate', event => {
  console.log('Service Worker activated');
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// Получение сообщений от сайта (для офлайн списков)
self.addEventListener('message', async event => {
  if (event.data && event.data.type === 'CACHE_LISTS') {
    const listsData = event.data.lists;
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/all-lists.json', new Response(JSON.stringify(listsData), {
      headers: { 'Content-Type': 'application/json' }
    }));
    console.log('Все списки сохранены офлайн');
  }
});
