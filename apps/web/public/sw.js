// Service worker mínimo do ELIAS PWA: cache-on-fetch do app shell,
// necessário para instalabilidade. Nunca cacheia /api/* (dados sempre
// frescos do servidor local). Nomes de assets são hasheados pelo Vite, então
// não há uma lista fixa para pré-cachear — cada asset entra no cache na
// primeira vez que é buscado.
const CACHE_NAME = "elias-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add("/")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => cached);
    }),
  );
});
