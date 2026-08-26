#!/usr/bin/env node
// Bangun docs/BACKLOG.md — satu baris checkbox per F-ID, dikelompokkan per epic.
//
// Idempoten: status centang dibaca ulang dari BACKLOG.md yang sudah ada, jadi
// menjalankan ulang skrip tidak pernah menghapus progres. Yang digenerate ulang
// hanya daftar, urutan, judul, tautan, dan angka statistik.
//
//   node scripts/build-backlog.mjs           # tulis / segarkan docs/BACKLOG.md
//   node scripts/build-backlog.mjs --check   # keluar 1 bila ada F-ID yatim/hantu (untuk CI)

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { SLICES } from './prd-slices.mjs';
import { ROOT, loadFeatures, loadInstructionStatus } from './prd-features.mjs';

const OUT = path.join(ROOT, 'docs/BACKLOG.md');
const check = process.argv.includes('--check');

const TRIAGE = '🔍';
const LINE_RE = /^- \[([ xX])\]\s*(?:(🔍)\s*)?\*\*(F-\d+)\*\*/;

const features = await loadFeatures();
const byId = new Map(features.map((f) => [f.id, f]));

// ── status tersimpan ────────────────────────────────────────────────────────
/** @type {Map<string,{done:boolean,triage:boolean}>} */
const state = new Map();
let ghosts = [];

if (existsSync(OUT)) {
  for (const rawLine of (await readFile(OUT, 'utf8')).split('\n')) {
    const m = rawLine.replace(/\r$/, '').match(LINE_RE);
    if (!m) continue;
    const [, box, triage, id] = m;
    state.set(id, { done: box.toLowerCase() === 'x', triage: Boolean(triage) });
    if (!byId.has(id)) ghosts.push(id);
  }
} else {
  // Benih pertama: satu-satunya catatan progres yang ada adalah docs/instruction.md.
  const seed = await loadInstructionStatus();
  for (const f of features) {
    const known = seed.has(f.id);
    state.set(f.id, { done: known ? seed.get(f.id) : false, triage: !known });
  }
}

// F-ID baru di PRD yang belum pernah masuk backlog: masuk sebagai belum-diaudit.
const orphans = features.filter((f) => !state.has(f.id)).map((f) => f.id);
for (const id of orphans) state.set(id, { done: false, triage: true });

// ── mode --check ────────────────────────────────────────────────────────────
if (check) {
  const problems = [];
  if (!existsSync(OUT)) problems.push('docs/BACKLOG.md belum ada — jalankan node scripts/build-backlog.mjs');
  if (orphans.length) problems.push(`F-ID di PRD tanpa baris backlog: ${orphans.join(', ')}`);
  if (ghosts.length) problems.push(`F-ID di backlog tapi hilang dari PRD: ${ghosts.join(', ')}`);
  if (problems.length) {
    console.error('Backlog tidak sinkron dengan PRD:');
    for (const p of problems) console.error('  ' + p);
    process.exit(1);
  }
  const done = features.filter((f) => state.get(f.id).done).length;
  console.log(`Backlog sinkron — ${done}/${features.length} selesai.`);
  process.exit(0);
}

// ── susun per epic, urut sesuai urutan PRD ──────────────────────────────────
const epicOrder = [];
for (const s of SLICES) {
  if (s.epic && !epicOrder.some((e) => e.code === s.epic.code)) epicOrder.push(s.epic);
}
const groups = epicOrder.map((epic) => ({
  epic,
  items: features.filter((f) => f.epic?.code === epic.code),
}));
const loose = features.filter((f) => !f.epic);
if (loose.length) groups.push({ epic: { code: '—', name: 'Tanpa epic' }, items: loose });

// ── statistik ───────────────────────────────────────────────────────────────
const st = (f) => state.get(f.id);
const count = (list) => ({ done: list.filter((f) => st(f).done).length, total: list.length });
const total = count(features);
const pct = total.total ? Math.round((total.done / total.total) * 100) : 0;
const byPrio = Object.fromEntries(
  ['P0', 'P1', 'P2'].map((p) => [p, count(features.filter((f) => f.prio === p))])
);
const untriaged = features.filter((f) => st(f).triage);
const sisaP0 = features.filter((f) => f.prio === 'P0' && !st(f).done);

const bar = (d, t) => {
  const w = 24;
  const n = t ? Math.round((d / t) * w) : 0;
  return '█'.repeat(n) + '░'.repeat(w - n);
};

const row = (f) => {
  const s = st(f);
  const link = `docs/prd/${f.sliceFile}`;
  return (
    `- [${s.done ? 'x' : ' '}] ${s.triage ? TRIAGE + ' ' : ''}**${f.id}** · \`${f.prio}\` · ` +
    `\`${f.tags}\` · ${f.title} · [spek](${path.posix.relative('docs', link)}) ` +
    `\`PRD.md:${f.prdLine}\``
  );
};

const out = [
  `<!-- Daftar & statistik DIGENERATE oleh scripts/build-backlog.mjs.`,
  `     Yang boleh diedit tangan: kotak centang \`[ ]\` / \`[x]\` dan penanda ${TRIAGE}.`,
  `     Keduanya dibaca ulang saat regenerasi, jadi progres tidak pernah hilang.`,
  `     Judul & tautan berubah hanya lewat docs/PRD.md. -->`,
  ``,
  `# BACKLOG — PANTAS v1.0 "Competition Build"`,
  ``,
  `\`\`\``,
  `${bar(total.done, total.total)}  ${total.done}/${total.total}  (${pct}%)`,
  `\`\`\``,
  ``,
  `| Prioritas | Selesai | Sisa |`,
  `| :--- | ---: | ---: |`,
  ...['P0', 'P1', 'P2'].map(
    (p) => `| **${p}** | ${byPrio[p].done}/${byPrio[p].total} | ${byPrio[p].total - byPrio[p].done} |`
  ),
  ``,
  untriaged.length
    ? `> ${TRIAGE} **${untriaged.length} fitur belum diaudit** — belum pernah muncul di \`docs/instruction.md\`, jadi status sebenarnya belum diketahui. Cek kode, lalu centang atau hapus penanda ${TRIAGE}.`
    : `> Semua fitur sudah teraudit.`,
  ``,
  `---`,
  ``,
  `## Cara pakai (untuk agen AI)`,
  ``,
  `1. **Jangan pernah membaca \`docs/PRD.md\` utuh** (2.015 baris, ±35k token). Berkas itu sumber kebenaran untuk manusia, bukan bahan bacaan tiap sesi.`,
  `2. Ambil item \`[ ]\` dengan prioritas tertinggi dari daftar di bawah. **Aturan gerbang PRD: tidak ada P1 dimulai sebelum seluruh P0 lulus acceptance.**`,
  `3. Buka **satu** berkas spek yang ditautkan item itu (±1–3k token). Acceptance criteria ada di sana.`,
  `4. Kerjakan sampai 100% (DB → RLS → API → \`lib/data.ts\` / \`lib/store.tsx\` → UI → error state → a11y) sesuai [\`AGENTS.md\`](../AGENTS.md).`,
  `5. Verifikasi (\`npm run build\`, \`npx tsc --noEmit\`, lint), lalu centang \`[x]\` item itu di berkas ini.`,
  `6. Kalau isi PRD berubah: edit \`docs/PRD.md\` (pakai nomor baris \`PRD.md:NNN\` di bawah untuk lompat langsung), lalu \`node scripts/split-prd.mjs && node scripts/build-backlog.mjs\`.`,
  ``,
  `Indeks lengkap potongan PRD: [\`docs/prd/00-INDEX.md\`](prd/00-INDEX.md)`,
  ``,
  `---`,
  ``,
  `## Sisa P0 — gerbang rilis`,
  ``,
  sisaP0.length
    ? sisaP0.map((f) => `- \`${f.id}\` ${f.title} — [spek](${path.posix.relative('docs', `docs/prd/${f.sliceFile}`)})`).join('\n')
    : `Tidak ada. Seluruh P0 selesai — gerbang P1 terbuka.`,
  ``,
  `---`,
  ``,
  ...groups.flatMap(({ epic, items }) => {
    const c = count(items);
    return [
      `## ${epic.code} — ${epic.name}  \`${c.done}/${c.total}\``,
      ``,
      ...items.map(row),
      ``,
    ];
  }),
  `---`,
  ``,
  `## Kerja non-fitur`,
  ``,
  `Item runbook, deploy, dan kit demo tidak punya F-ID sehingga tidak muncul di atas.`,
  `Sumbernya tetap [\`docs/instruction.md\`](instruction.md) §Fase 4 dan [\`docs/prd/12-judge-demo.md\`](prd/12-judge-demo.md).`,
  ``,
].join('\n');

await writeFile(OUT, out, 'utf8');

console.log(`Tulis   docs/BACKLOG.md`);
console.log(`  ${total.done}/${total.total} selesai (${pct}%)`);
console.log(`  P0 ${byPrio.P0.done}/${byPrio.P0.total} · P1 ${byPrio.P1.done}/${byPrio.P1.total} · P2 ${byPrio.P2.done}/${byPrio.P2.total}`);
if (untriaged.length) console.log(`  ${untriaged.length} belum diaudit: ${untriaged.map((f) => f.id).join(', ')}`);
