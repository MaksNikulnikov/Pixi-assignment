self.addEventListener("install", (e) => {
  console.log("[SW] Install");
  e.waitUntil(
    caches.open("pixi-cache").then((cache) =>
      cache.addAll([
        "./",
        "./index.html",
        "./manifest.json",
        "./assets/",
      ])
    )
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});
