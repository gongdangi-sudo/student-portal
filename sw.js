const CACHE_NAME = "gongdangi-student-portal-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(
          keys
            .filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
        );
      })
      .then(function() {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function(event) {
  const request = event.request;
  const url = new URL(request.url);

  // Apps Script API/외부 API는 캐시하지 않음
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put("./index.html", clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match("./index.html");
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(function(cached) {
        if (cached) return cached;

        return fetch(request).then(function(response) {
          if (!response || response.status !== 200) {
            return response;
          }

          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, clone);
          });

          return response;
        });
      })
  );
});
