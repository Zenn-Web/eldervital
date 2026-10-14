/*
 * Service worker ElderVital (versi sederhana untuk prototipe).
 *
 * Yang dilakukan:
 * - Menyimpan halaman /offline saat pemasangan.
 * - File statis hasil build (/_next/static/, /icons/) disimpan setelah dipakai (cache-first),
 *   karena namanya mengandung hash dan tidak berubah isinya.
 * - Halaman yang pernah dibuka disimpan; bila jaringan gagal, halaman itu (atau /offline) ditampilkan.
 *
 * Yang SENGAJA tidak dilakukan:
 * - Tidak menyimpan permintaan non-GET, permintaan ke domain lain (mis. Supabase), maupun
 *   data RSC/API. Data kesehatan tidak pernah disimpan oleh service worker ini.
 *
 * Naikkan VERSION setiap mengubah file ini supaya cache lama dibersihkan.
 */
const VERSION = "ev-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Halaman: jaringan dulu, simpan salinan, jatuh ke cache atau /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  // Aset statis berhash: cache dulu.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
