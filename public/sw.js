// Service worker de Bluey World: la app abre y funciona sin internet.
const VERSION = "v5";
// Carpeta donde vive la app (vacía en local; "/bluey-world" en GitHub Pages). Sale del alcance del service worker.
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const STATIC = `bw-static-${VERSION}`;
const PAGES = `bw-pages-${VERSION}`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("bw-") && k !== STATIC && k !== PAGES).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

// Guarda un archivo estático y, si es CSS, también las fuentes que menciona.
async function cacheAsset(cache, url) {
  if (await cache.match(url)) return;
  try {
    const res = await fetch(url);
    if (!res.ok) return;
    await cache.put(url, res.clone());
    if (url.split("?")[0].endsWith(".css")) {
      const css = await res.text();
      for (const m of css.matchAll(/url\((?:"|')?((?:\/[\w-]+)?\/_next\/static\/[^)"']+)/g)) await cacheAsset(cache, m[1].startsWith(BASE + "/_next/") ? m[1] : BASE + m[1].replace(/^\/[\w-]+(?=\/_next\/)/, ""));
    }
  } catch {}
}

// Busca en el HTML de una página los archivos que necesita para funcionar offline.
function assetsIn(html) {
  const found = new Set();
  for (const m of html.matchAll(/\/_next\/static\/[\w\/.\-~%]+/g)) found.add(BASE + m[0]);
  for (const m of html.matchAll(/static\/chunks\/[\w.\-~%]+\.js/g)) found.add(BASE + "/_next/" + m[0]);
  return [...found];
}

// La página manda las rutas e imágenes a guardar para uso offline.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "warm") return;
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGES);
      const statics = await caches.open(STATIC);
      for (const url of event.data.urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          if (url.startsWith(BASE + "/personajes")) {
            await statics.put(url, res);
          } else {
            const html = await res.clone().text();
            await pages.put(url, res);
            for (const a of assetsIn(html)) await cacheAsset(statics, a);
          }
        } catch {}
      }
      for (const a of event.data.assets || []) await cacheAsset(statics, a);
    })(),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith(BASE + "/_next/static/") ||
  url.pathname.startsWith(BASE + "/personajes/") ||
  url.pathname.startsWith(BASE + "/icons/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, YouTube, etc. van directo a la red

  if (isStaticAsset(url)) {
    // Archivos con hash o imágenes: primero caché
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Páginas y datos de navegación: red primero, caché si no hay internet
  event.respondWith(
    caches.open(PAGES).then(async (cache) => {
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        const hit = (await cache.match(req)) || (req.mode === "navigate" ? await cache.match(BASE + "/") : undefined);
        if (hit) return hit;
        return new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }),
  );
});

// Al tocar la notificación de un temporizador, vuelve a la app.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of all) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow(BASE + "/temporizadores");
    })(),
  );
});
