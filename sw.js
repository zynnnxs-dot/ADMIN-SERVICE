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


/* NDREX V20 — animate only the GANTI TEMA control */
(function () {
  const selectors = [
    '[data-theme]', '[data-theme-toggle]',
    '#themeToggle', '#theme-toggle',
    '.theme-toggle', '.theme-switch', '.toggle-theme'
  ];

  function isThemeControl(el) {
    if (!el || !el.closest) return false;
    if (el.closest(selectors.join(','))) return true;
    const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '')).toLowerCase();
    return t.includes('ganti tema') || t.includes('mode terang') || t.includes('mode gelap');
  }

  function prepare(btn) {
    if (!btn || btn.dataset.ndrexV20Ready) return;
    btn.dataset.ndrexV20Ready = '1';
    btn.classList.add('ndrex-theme-toggle-3d');

    const track = document.createElement('span');
    track.className = 'ndrex-zip-track';
    btn.appendChild(track);

    // Small zipper teeth stay confined to the button.
    for (let i = -4; i <= 4; i++) {
      const tooth = document.createElement('i');
      tooth.className = 'ndrex-zip-tooth';
      tooth.style.setProperty('--zip-x', (i * 13) + 'px');
      tooth.style.animationDelay = (Math.abs(i) * 0.025) + 's';
      btn.appendChild(tooth);
    }
  }

  function findThemeButton(target) {
    const direct = target.closest ? target.closest(selectors.join(',')) : null;
    if (direct) return direct;
    let el = target.closest ? target.closest('button, a, [role="button"]') : null;
    if (el && isThemeControl(el)) return el;
    return null;
  }

  // Prepare existing theme controls after DOM load.
  function scan() {
    document.querySelectorAll(selectors.join(',')).forEach(prepare);
    document.querySelectorAll('button, a, [role="button"]').forEach(el => {
      if (isThemeControl(el)) prepare(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else scan();

  // Also catch dynamically rendered controls.
  new MutationObserver(scan).observe(document.documentElement, { childList:true, subtree:true });

  // Capture only the theme-button click; existing theme logic continues untouched.
  document.addEventListener('click', function (e) {
    const btn = findThemeButton(e.target);
    if (!btn) return;
    prepare(btn);
    btn.classList.remove('is-switching');
    void btn.offsetWidth;
    btn.classList.add('is-switching');
    setTimeout(() => btn.classList.remove('is-switching'), 820);
  }, true);
})();

