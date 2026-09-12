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

/* NDREX V24 — locate only the top-left brand */
document.addEventListener("DOMContentLoaded", function(){
  const candidates = Array.from(document.querySelectorAll("header .logo, header .brand, nav .logo, nav .brand, .logo, .brand"));
  const el = candidates.find(x => /NDREX\s*PROJECT/i.test(x.textContent || ""));
  if (el && !el.querySelector(".ndrex-logo-text")) {
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
    let n;
    while(n=walker.nextNode()){
      if(/NDREX\s*PROJECT/i.test(n.nodeValue||"")){
        const span=document.createElement("span");
        span.className="ndrex-logo-text";
        span.textContent=n.nodeValue;
        n.parentNode.replaceChild(span,n);
        break;
      }
    }
  }
});
