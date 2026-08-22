// Gerbang NFR-05: JS first-load tiap route < 260 KB gzip.
//
// Next 16 tidak lagi mencetak kolom "First Load JS" di ringkasan build, tapi
// Turbopack menulis `.next/diagnostics/route-bundle-stats.json` berisi daftar
// chunk first-load per route. Angka di berkas itu tak terkompresi, sedangkan
// anggaran PRD dinyatakan dalam gzip — jadi chunk-nya dikompresi di sini.
//
// Level kompresi sengaja dibiarkan default (6), bukan 9: itu yang dipakai
// mayoritas CDN, jadi angkanya mendekati byte yang benar-benar dikirim ke
// petani. Level 9 akan melaporkan ukuran yang lebih kecil daripada kenyataan.
//
// Ambangnya 260 KB gzip: runtime Next 16 + React 19 + i18n + baseline store.
// Supaya angka totalnya tidak menyembunyikan regresi, laporan memecah
// tiap route jadi baseline bersama (chunk yang muncul di SEMUA route) dan porsi
// kode aplikasi di atasnya — porsi kedua itu yang benar-benar dikendalikan PR.

import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { sep } from "node:path";

const BUDGET_BYTES = 260 * 1024;
const EPSILON_BYTES = 0.5 * 1024;
const STATS = ".next/diagnostics/route-bundle-stats.json";

let stats;
try {
  stats = JSON.parse(readFileSync(STATS, "utf8"));
} catch {
  console.error(`Tidak menemukan ${STATS}. Jalankan "npm run build" lebih dulu.`);
  process.exit(1);
}

// Chunk dipakai bersama banyak route (framework, shared UI). Dikompresi sekali
// saja — tanpa cache, skrip ini menggzip berkas yang sama puluhan kali.
const gzipCache = new Map();
const normalkan = (chunkPath) => chunkPath.split("\\").join(sep);
const gzipBytesOf = (chunkPath) => {
  const file = normalkan(chunkPath);
  if (!gzipCache.has(file)) {
    gzipCache.set(file, gzipSync(readFileSync(file)).length);
  }
  return gzipCache.get(file);
};

const kb = (bytes) => (bytes / 1024).toFixed(1);
const total = (chunks) => chunks.reduce((jumlah, chunk) => jumlah + gzipBytesOf(chunk), 0);

// Baseline = irisan chunk seluruh route. Itulah ongkos yang dibayar pengunjung
// mana pun, apa pun halaman pendaratannya.
const perRoute = stats.map((entry) => ({
  route: entry.route,
  chunks: entry.firstLoadChunkPaths.map(normalkan),
}));

const baselineChunks = perRoute.length
  ? perRoute
      .map((r) => new Set(r.chunks))
      .reduce((irisan, set) => new Set([...irisan].filter((c) => set.has(c))))
  : new Set();
const baselineBytes = total([...baselineChunks]);

const routes = perRoute
  .map(({ route, chunks }) => {
    const gzipBytes = total(chunks);
    return { route, gzipBytes, appBytes: gzipBytes - baselineBytes };
  })
  .sort((a, b) => b.gzipBytes - a.gzipBytes);

const over = routes.filter((r) => r.gzipBytes > BUDGET_BYTES + EPSILON_BYTES);

for (const { route, gzipBytes, appBytes } of routes) {
  const mark = gzipBytes > BUDGET_BYTES + EPSILON_BYTES ? "✗" : "✓";
  console.log(
    `${mark} ${kb(gzipBytes).padStart(7)} KB gz  (+${kb(appBytes).padStart(6)} KB kode route)  ${route}`,
  );
}

console.log(
  `\nBaseline bersama: ${kb(baselineBytes)} KB gzip (${baselineChunks.size} chunk di semua route).`,
);
console.log(
  `Anggaran NFR-05: ${kb(BUDGET_BYTES)} KB gzip per route (${routes.length} route diperiksa).`,
);

if (over.length > 0) {
  console.error(`\n${over.length} route melewati anggaran:`);
  for (const { route, gzipBytes } of over) {
    console.error(`  ${route} — ${kb(gzipBytes)} KB (+${kb(gzipBytes - BUDGET_BYTES)} KB)`);
  }
  process.exit(1);
}

console.log("Seluruh route di dalam anggaran.");
