// Service worker JADA — met en cache la coquille de l'appli pour un lancement
// instantané et un fonctionnement hors-ligne (les données, elles, ont besoin du
// réseau en mode synchro).

const CACHE = "jada-v34";
const SHELL = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/config.js",
  "./js/db.js",
  "./js/data.js",
  "./js/ui.js",
  "./js/icons.js",
  "./js/views/maman.js",
  "./js/views/sante.js",
  "./js/views/album.js",
  "./js/views/journal.js",
  "./js/views/stats.js",
  "./js/views/stock.js",
  "./js/sound.js",
  "./js/notify.js",
  "./js/welcome.js",
  "./sounds/welcome.mp3",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/logo.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // On ne met en cache que nos propres fichiers (même origine). Supabase / CDN passent direct.
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  // Réseau d'abord : on sert toujours la dernière version quand il y a du réseau,
  // et on retombe sur le cache uniquement hors-ligne. Évite les versions figées.
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
