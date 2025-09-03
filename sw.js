self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Для офлайн списков
  if (url.pathname.endsWith('/all-lists.json')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(event.request)
          .then(networkResp => {
            // Обновляем кэш, если сеть есть
            cache.put(event.request, networkResp.clone());
            return networkResp;
          })
          .catch(() =>
            cache.match(event.request) // fallback на кэш
          )
      )
    );
    return;
  }

  // Всё остальное: сеть сначала, потом кэш
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
