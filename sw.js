const CACHE = "ndrex-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./qris.jpg",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});


/* NDREX V19 — 3D theme transition */
(function () {
  function ndrexThemeTransition() {
    if (document.querySelector('.ndrex-theme-portal')) return;
    const portal = document.createElement('div');
    portal.className = 'ndrex-theme-portal active';
    const count = window.innerWidth < 600 ? 28 : 42;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('i');
      p.className = 'ndrex-theme-particle';
      const a = Math.random() * Math.PI * 2;
      const r = 120 + Math.random() * Math.min(window.innerWidth, window.innerHeight) * .42;
      p.style.setProperty('--dx', Math.cos(a) * r + 'px');
      p.style.setProperty('--dy', Math.sin(a) * r + 'px');
      p.style.animationDelay = (Math.random() * .12) + 's';
      portal.appendChild(p);
    }
    document.body.appendChild(portal);
    setTimeout(() => portal.remove(), 850);
  }

  // Capture clicks on any theme-toggle control without replacing existing theme logic.
  document.addEventListener('click', function (e) {
    const el = e.target.closest(
      '[data-theme], [data-theme-toggle], #themeToggle, #theme-toggle, .theme-toggle, .theme-switch, .toggle-theme, button[aria-label*="tema" i], button[title*="tema" i]'
    );
    if (el) ndrexThemeTransition();
  }, true);

  window.ndrexThemeTransition = ndrexThemeTransition;
})();

