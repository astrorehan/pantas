/*
 * Service worker PANTAS.
 *
 * Tanggung jawabnya sengaja terbagi dua:
 * 1. app shell publik + fallback navigasi saat perangkat luring (F-95);
 * 2. membangunkan halaman untuk menguras antrean pindai IndexedDB (F-14).
 *
 * API, halaman privat, respons Supabase, dan hasil foto tidak pernah dicache.
 * Antrean tetap diproses oleh halaman karena sesi Supabase pengguna tidak
 * tersedia dengan aman di dalam service worker.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `pantas-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `pantas-static-${CACHE_VERSION}`;
const SYNC_TAG = "pantas-antrean-pindai";

const PUBLIC_SHELL = [
  "/",
  "/demo",
  "/masuk",
  "/offline",
  "/manifest.webmanifest",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/Logo%20Pantas_Rounded.png",
  "/apple-icon.png",
  "/favicon.ico",
];

const PUBLIC_NAVIGATIONS = new Set(["/", "/demo", "/masuk", "/offline"]);
const alamat = (path) => new URL(path, self.location.origin).href;

function bolehCacheNavigasi(pathname) {
  return PUBLIC_NAVIGATIONS.has(pathname) || pathname.startsWith("/tentang");
}

function asetBuildPublik(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    (PUBLIC_SHELL.includes(url.pathname) && !PUBLIC_NAVIGATIONS.has(url.pathname))
  );
}

async function simpanAsetDariHtml(response, cache) {
  const tipe = response.headers.get("content-type") || "";
  if (!tipe.includes("text/html")) return;

  const html = await response.clone().text();
  const paths = new Set();
  const pola = /(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/g;
  let cocok;

  while ((cocok = pola.exec(html)) !== null) {
    try {
      const path = cocok[1].replaceAll("&amp;", "&");
      const url = new URL(path, self.location.origin);
      if (url.origin === self.location.origin) paths.add(url.href);
    } catch {
      // Atribut yang bukan URL valid dilewati; shell lain tetap dapat dicache.
    }
  }

  await Promise.allSettled(
    [...paths].map(async (href) => {
      const request = new Request(href, { credentials: "omit", cache: "reload" });
      const asset = await fetch(request);
      if (asset.ok) await cache.put(request, asset);
    }),
  );
}

async function precacheAppShell() {
  const shell = await caches.open(SHELL_CACHE);
  const statis = await caches.open(STATIC_CACHE);

  await Promise.allSettled(
    PUBLIC_SHELL.map(async (path) => {
      const request = new Request(alamat(path), { credentials: "omit", cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) return;

      await shell.put(alamat(path), response.clone());
      await simpanAsetDariHtml(response, statis);
    }),
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("pantas-") && ![SHELL_CACHE, STATIC_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

async function navigasiDenganFallback(request) {
  const url = new URL(request.url);
  try {
    const response = await fetch(request);
    if (response.ok && bolehCacheNavigasi(url.pathname)) {
      const cache = await caches.open(SHELL_CACHE);
      await cache.put(alamat(url.pathname), response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    if (bolehCacheNavigasi(url.pathname)) {
      const tersimpan = await cache.match(alamat(url.pathname));
      if (tersimpan) return tersimpan;
    }
    return (await cache.match(alamat("/offline"))) || Response.error();
  }
}

async function asetCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const tersimpan = await cache.match(request);
  if (tersimpan) return tersimpan;

  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(navigasiDenganFallback(request));
    return;
  }

  if (asetBuildPublik(url)) event.respondWith(asetCacheFirst(request));
});

/** Beri tahu halaman terbuka bahwa antrean pindai layak dicoba lagi. */
async function bangunkanKlien() {
  const clients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clients) {
    client.postMessage({ type: "pantas:proses-antrean" });
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(bangunkanKlien());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "pantas:coba-antrean") {
    event.waitUntil(bangunkanKlien());
  }
});
