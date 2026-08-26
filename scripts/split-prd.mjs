#!/usr/bin/env node
// Pemotong docs/PRD.md menjadi berkas-berkas kecil di docs/prd/.
//
// Potongan bersifat MEKANIS: rentang baris, bukan rangkuman. Tidak ada teks yang
// ditulis ulang, dipendekkan, atau dibuang. Sesudah menulis, skrip merakit ulang
// seluruh potongan dan membandingkannya byte-per-byte dengan PRD.md. Bila beda
// satu byte pun, skrip gagal.
//
//   node scripts/split-prd.mjs            # tulis potongan + docs/prd/00-INDEX.md
//   node scripts/split-prd.mjs --check    # jangan tulis; keluar 1 bila potongan basi (untuk CI)
//   node scripts/split-prd.mjs --remap    # cetak ulang rentang baris dari anchor heading

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE, OUT_DIR, SLICES, SENTINEL, assertContiguous } from './prd-slices.mjs';
import { loadFeatures } from './prd-features.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv.includes('--check')
  ? 'check'
  : process.argv.includes('--remap')
    ? 'remap'
    : 'write';

const srcPath = path.join(ROOT, SOURCE);
const raw = await readFile(srcPath, 'utf8');
const lines = raw.split('\n');

// Isi potongan disalin apa adanya dari PRD.md, jadi EOL-nya ikut sumber. Header
// yang digenerate harus memakai EOL yang sama — berkas ber-EOL campuran akan
// digolongkan biner oleh git, lolos dari normalisasi, dan ter-commit dengan CRLF
// meski .gitattributes minta LF. `EOL` dipakai untuk semua baris yang digenerate.
const EOL = raw.includes('\r\n') ? '\r\n' : '\n';
// split('\n') pada berkas berakhiran newline menghasilkan elemen kosong terakhir.
// Elemen itu bagian sah dari data; ikut dihitung supaya perakitan ulang persis.
const totalLines = lines.length;

// ── mode --remap ────────────────────────────────────────────────────────────
if (mode === 'remap') {
  const found = SLICES.map((s) => {
    const idx = lines.findIndex((l) => l.trimEnd().startsWith(s.anchor));
    return { file: s.file, anchor: s.anchor, line: idx === -1 ? null : idx + 1 };
  });
  const missing = found.filter((f) => f.line === null);
  for (const f of found) {
    console.log(`${String(f.line ?? '???').padStart(5)}  ${f.file}`);
  }
  console.log('');
  if (missing.length) {
    console.error('Anchor tidak ketemu:');
    for (const m of missing) console.error(`  ${m.file} <- "${m.anchor}"`);
    process.exit(1);
  }
  console.log('Rentang yang benar (from = baris di atas, to = from berikutnya - 1):');
  for (let i = 0; i < found.length; i++) {
    const from = found[i].line;
    const to = i === found.length - 1 ? null : found[i + 1].line - 1;
    console.log(`  ${found[i].file.padEnd(32)} from: ${from}, to: ${to ?? 'null'}`);
  }
  process.exit(0);
}

// ── validasi rentang ────────────────────────────────────────────────────────
assertContiguous(totalLines);

// Anchor harus cocok dengan baris `from` — deteksi dini kalau PRD.md bergeser.
const drifted = [];
for (const s of SLICES) {
  const actual = (lines[s.from - 1] ?? '').trimEnd();
  if (!actual.startsWith(s.anchor)) {
    drifted.push(`  ${s.file}: baris ${s.from} = "${actual.slice(0, 60)}", harusnya "${s.anchor}"`);
  }
}
if (drifted.length) {
  console.error('Nomor baris di scripts/prd-slices.mjs sudah basi:\n' + drifted.join('\n'));
  console.error('\nJalankan: node scripts/split-prd.mjs --remap');
  process.exit(1);
}

// ── rakit isi tiap potongan ─────────────────────────────────────────────────
const outDir = path.join(ROOT, OUT_DIR);
const rendered = SLICES.map((s, i) => {
  const to = s.to ?? totalLines;
  // Pemisah baris antar-potongan ikut disimpan di potongan sebelumnya, bukan
  // ditambahkan saat perakitan. Tanpa ini berkas berakhir dengan `\r` menggantung
  // pada checkout CRLF: git membuang CRLF saat `add` tapi CR yatim itu lolos,
  // ter-commit, dan tidak pernah cocok dengan hasil regenerasi di runner Linux.
  const body =
    lines.slice(s.from - 1, to).join('\n') + (i === SLICES.length - 1 ? '' : '\n');
  const depth = s.file.split('/').length - 1;
  const up = depth ? '../'.repeat(depth) : './'; // ke docs/prd/
  const upDocs = '../'.repeat(depth + 1); // ke docs/
  const prev = SLICES[i - 1];
  const next = SLICES[i + 1];
  const relTo = (target) => {
    const from = path.posix.dirname(s.file);
    const rel = path.posix.relative(from === '.' ? '' : from, target);
    return rel.startsWith('.') ? rel : './' + rel;
  };

  const nav = [
    prev ? `[← ${prev.title}](${relTo(prev.file)})` : null,
    `[Indeks](${up}00-INDEX.md)`,
    `[Backlog](${upDocs}BACKLOG.md)`,
    next ? `[${next.title} →](${relTo(next.file)})` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const header =
    [
      `<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI.`,
      `     Sumber: ${SOURCE} baris ${s.from}–${s.to ?? 'akhir'}.`,
      `     Untuk mengubah isi: edit ${SOURCE}, lalu jalankan \`node scripts/split-prd.mjs\`. -->`,
      ``,
      `> **Potongan PRD** — ${s.title}  `,
      `> Sumber: \`${SOURCE}\` §baris ${s.from}–${s.to ?? 'akhir'}` +
        (s.epic ? `  ·  Epic: \`${s.epic.code}\` ${s.epic.name}` : ''),
      `>`,
      `> ${nav}`,
      ``,
      SENTINEL,
      ``,
    ].join(EOL);

  return { slice: s, body, content: header + body, absPath: path.join(outDir, s.file) };
});

// ── indeks ──────────────────────────────────────────────────────────────────
const allFeatures = await loadFeatures();

const indexContent = [
  `<!-- DIGENERATE oleh scripts/split-prd.mjs — JANGAN EDIT BERKAS INI. -->`,
  ``,
  `# Indeks PRD PANTAS v1.0`,
  ``,
  `Muat berkas ini lebih dulu, lalu buka **hanya potongan yang relevan**.`,
  `PRD utuh (\`${SOURCE}\`, ${totalLines.toLocaleString('id-ID')} baris) adalah sumber kebenaran dan berkas yang diedit manusia —`,
  `potongan di direktori ini digenerate ulang dari sana, jadi tidak mungkin melenceng.`,
  ``,
  `- **Butuh daftar kerja + status?** → [\`docs/BACKLOG.md\`](../BACKLOG.md)`,
  `- **Butuh detail satu fitur?** → cari F-ID di kolom **Fitur** tabel bawah, buka satu berkas itu saja.`,
  ``,
  `---`,
  ``,
  `## Peta potongan`,
  ``,
  `| Berkas | Isi | Baris di PRD.md | Fitur |`,
  `| :--- | :--- | ---: | :--- |`,
  ...rendered.map((r) => {
    const ids = allFeatures.filter((f) => f.sliceFile === r.slice.file).map((f) => f.id);
    const range = `${r.slice.from}–${r.slice.to ?? totalLines}`;
    const feat = ids.length ? ids.join(', ') : '—';
    return `| [\`${r.slice.file}\`](${r.slice.file}) | ${r.slice.title} | ${range} | ${feat} |`;
  }),
  ``,
  `---`,
  ``,
  `## Mencari satu F-ID`,
  ``,
  `Kolom **Fitur** di tabel atas sudah menunjukkan berkas pemilik tiap F-ID.`,
  `Judul, prioritas, tag rubrik, status kerja, dan nomor baris persis di \`PRD.md\``,
  `ada di [\`docs/BACKLOG.md\`](../BACKLOG.md) — sengaja tidak diduplikat di sini`,
  `supaya tidak ada dua daftar yang bisa berbeda.`,
  ``,
  `Total ${allFeatures.length} F-ID terdefinisi di PRD.`,
  ``,
].join(EOL);

// ── tulis / periksa ─────────────────────────────────────────────────────────
const targets = [
  ...rendered.map((r) => ({ absPath: r.absPath, content: r.content })),
  { absPath: path.join(outDir, '00-INDEX.md'), content: indexContent },
];

if (mode === 'check') {
  const stale = [];
  for (const t of targets) {
    const rel = path.relative(ROOT, t.absPath).replace(/\\/g, '/');
    if (!existsSync(t.absPath)) {
      stale.push(`${rel} (hilang)`);
      continue;
    }
    if ((await readFile(t.absPath, 'utf8')) !== t.content) stale.push(`${rel} (isi beda)`);
  }
  if (stale.length) {
    console.error('Potongan PRD basi:\n' + stale.map((s) => '  ' + s).join('\n'));
    console.error('\nJalankan: node scripts/split-prd.mjs');
    process.exit(1);
  }
  console.log(`Potongan PRD sinkron (${targets.length} berkas).`);
  process.exit(0);
}

// Bersihkan berkas .md lama yang tak lagi ada di peta, supaya tidak menyesatkan.
if (existsSync(outDir)) {
  const expected = new Set(targets.map((t) => path.resolve(t.absPath)));
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith('.md') && !expected.has(path.resolve(p))) {
        await rm(p);
        console.log(`  hapus basi  ${path.relative(ROOT, p).replace(/\\/g, '/')}`);
      }
    }
  };
  await walk(outDir);
}

for (const t of targets) {
  await mkdir(path.dirname(t.absPath), { recursive: true });
  await writeFile(t.absPath, t.content, 'utf8');
}

// ── VERIFIKASI: rakit ulang dari berkas yang BARU DITULIS, banding ke sumber ──
let reassembled = '';
for (const r of rendered) {
  const onDisk = await readFile(r.absPath, 'utf8');
  const at = onDisk.indexOf(SENTINEL);
  if (at === -1) throw new Error(`Sentinel hilang di ${r.slice.file}`);
  reassembled += onDisk.slice(at + SENTINEL.length + EOL.length); // lewati newline sesudah sentinel
}

const srcBytes = Buffer.byteLength(raw, 'utf8');
const outBytes = Buffer.byteLength(reassembled, 'utf8');

if (reassembled !== raw) {
  let at = 0;
  while (at < raw.length && raw[at] === reassembled[at]) at++;
  console.error(`VERIFIKASI GAGAL — hasil rakit ulang beda dari ${SOURCE}.`);
  console.error(`  byte sumber : ${srcBytes}`);
  console.error(`  byte rakitan: ${outBytes}`);
  console.error(`  beda pertama di indeks ${at}`);
  console.error(`  sumber : ${JSON.stringify(raw.slice(at - 60, at + 60))}`);
  console.error(`  rakitan: ${JSON.stringify(reassembled.slice(at - 60, at + 60))}`);
  process.exit(1);
}

const featIds = allFeatures.map((f) => f.id);
console.log(`Potong  ${SOURCE} -> ${OUT_DIR}/`);
console.log(`  ${rendered.length} potongan + 00-INDEX.md`);
console.log(`  ${totalLines} baris, ${srcBytes} byte`);
console.log(`  ${featIds.length} F-ID terindeks`);
console.log(`VERIFIKASI LULUS — rakit ulang identik byte-per-byte dengan sumber.`);
