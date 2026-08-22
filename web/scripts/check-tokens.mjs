/**
 * Menolak utility sistem desain yang tidak pernah didefinisikan.
 *
 * Kelas Tailwind yang tidak dikenali tidak gagal — ia hilang tanpa suara. Itu
 * membuat cacatnya nyaris tak terlihat: `bg-surface-raised` merender kartu
 * *transparan*, `type-body-xs` jatuh ke 16px bawaan peramban, `bg-surface-hover`
 * tidak menghasilkan apa pun. Layarnya tetap tampil, hanya salah, dan tidak ada
 * satu pun perkakas yang mengeluh. Dua gelombang sudah ditemukan dengan cara
 * membaca berkas satu per satu; ini supaya tidak ada gelombang ketiga.
 *
 * ESLint tidak bisa mengerjakan ini: aturannya butuh daftar token yang sah, dan
 * daftar itu hidup di `globals.css`, bukan di berkas TypeScript. Jadi skrip ini
 * membaca `globals.css` sebagai sumber kebenaran lalu memindai `src/`.
 *
 * Yang diperiksa hanya token di dalam literal string dan berawalan milik sistem
 * desain. Prosa di komentar dan nama variabel tidak ikut — itu yang membuat
 * versi pertama skrip ini melaporkan 1.341 temuan palsu.
 *
 * Dipakai: `npm run check:tokens`
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8");

/** Alias semantik dari `@theme inline` + skala primitif dari `@theme`. */
const warna = new Set([...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
/** Utility yang ditulis tangan: `@utility type-body-md { … }`. */
const utility = new Set([...css.matchAll(/@utility\s+([a-z0-9-]+)/g)].map((m) => m[1]));

/** Properti yang boleh membawa warna. */
const PROP =
  "bg|text|border|ring|fill|stroke|divide|outline|shadow|from|to|via|placeholder|caret|accent|decoration";
/** Akar milik sistem desain. `bg-black/40`, `text-white` dsb. tidak ikut. */
const AKAR_WARNA =
  /^(canvas|surface|sunken|overlay|ink|muted|label|placeholder|line|brand|danger|grade|field|on)(-|$)/;
/** Keluarga utility non-warna yang seluruhnya milik kita. */
const AKAR_UTILITY = /^(type|glass|surface|fill)-/;

function* berkas(dir) {
  for (const nama of readdirSync(dir)) {
    const p = join(dir, nama);
    if (statSync(p).isDirectory()) yield* berkas(p);
    else if (/\.tsx?$/.test(p)) yield p;
  }
}

/** Buang varian (`hover:`, `md:`, `dark:`, `group-hover:`) dan opasitas. */
function inti(tok) {
  const tanpaVarian = tok.slice(tok.lastIndexOf(":") + 1);
  return tanpaVarian.split("/")[0];
}

const temuan = [];
for (const p of berkas(SRC)) {
  readFileSync(p, "utf8").split("\n").forEach((line, i) => {
    // Setiap literal string diperlakukan sebagai daftar kelas calon.
    for (const lit of line.matchAll(/"([^"\n]*)"|'([^'\n]*)'|`([^`\n]*)`/g)) {
      const isi = lit[1] ?? lit[2] ?? lit[3] ?? "";
      for (const mentah of isi.split(/\s+/)) {
        // Nilai arbitrer (`w-[68px]`, `bg-[--x]`) di luar jangkauan.
        if (!mentah || mentah.includes("[")) continue;
        const tok = inti(mentah);

        const warnaMatch = tok.match(new RegExp(`^(?:${PROP})-(.+)$`));
        if (warnaMatch) {
          const c = warnaMatch[1];
          // Warna sah: alias semantik (`brand-tint`) atau skala (`clay-500`).
          if (warna.has(c)) continue;
          if (AKAR_WARNA.test(c)) {
            temuan.push([`${relative(ROOT, p)}:${i + 1}`, tok, `warna "${c}" tak ada`]);
            continue;
          }
        }

        if (AKAR_UTILITY.test(tok) && !utility.has(tok) && !warna.has(tok)) {
          temuan.push([`${relative(ROOT, p)}:${i + 1}`, tok, "utility tak ada"]);
        }
      }
    }
  });
}

if (temuan.length) {
  console.error(`\n${temuan.length} utility tidak terdefinisi:\n`);
  for (const [loc, tok, why] of temuan) {
    console.error(`  ${loc.padEnd(52)} ${tok.padEnd(26)} ${why}`);
  }
  console.error(
    "\nKelas ini tidak menghasilkan CSS apa pun — ia hilang diam-diam, bukan gagal.",
  );
  console.error("Pakai token yang ada di src/app/globals.css, atau definisikan di sana.\n");
  process.exit(1);
}

console.log(
  `Token aman: ${warna.size} alias warna + ${utility.size} utility, nol pemakaian tak terdefinisi.`,
);
