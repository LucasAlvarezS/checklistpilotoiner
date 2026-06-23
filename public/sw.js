// Service worker: instalabilidad PWA + caché del shell + uso offline del checklist.
const CACHE = "iner-checklist-v2";
const PRECACHE = [
  "/",
  "/checklist",
  "/offline",
  "/icon-192.png",
  "/icon-512.png",
  "/logo-iner.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll falla si un recurso no responde; los pedimos de a uno para no
      // romper la instalación si alguno no está disponible momentáneamente.
      .then((cache) =>
        Promise.all(
          PRECACHE.map((url) =>
            cache.add(url).catch(() => {
              /* ignora recursos que no se pudieron precachear */
            }),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // no interferir con envíos (POST)

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // las APIs siempre van a la red

  // Navegaciones: red primero, cacheando la respuesta para que la página quede
  // disponible offline; fallback a caché y luego a la página /offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("/offline")),
        ),
    );
    return;
  }

  // Recursos estáticos (chunks, CSS, fuentes, imágenes): caché primero, luego red
  // (y se cachea la respuesta para la próxima vez, también offline).
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
