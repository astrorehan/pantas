// Parser F-ID tunggal. Dipakai bersama oleh split-prd.mjs dan build-backlog.mjs
// supaya keduanya tidak pernah berbeda pendapat soal daftar fitur.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOURCE, SLICES } from './prd-slices.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Dua bentuk definisi fitur yang dipakai di PRD:
//   #### F-01 · Landing publik · [TEMA][UIUX] · P0 · BARU
//   **F-70 [UIUX] P0** — Ukuran teks tubuh minimum ...
const FEATURE_HEADING =
  /^####\s+(F-\d+)\s+·\s+(.+?)\s+·\s+((?:\[[A-Z]+\])+)\s+·\s+(P\d)\s+·\s+(\S+)/;
const FEATURE_INLINE =
  /^\s*(?:-\s+)?\*\*(F-\d+)\s+((?:\[[A-Z]+\])+)\s+(P\d)\*\*\s*(?:—|-)\s*(.+)$/;

/**
 * PRD.md berakhiran CRLF. Di JavaScript `\r` termasuk line terminator, sehingga
 * `.` tidak mencocokkannya dan anchor `$` tak pernah tercapai. Buang sebelum regex.
 */
const clean = (l) => l.replace(/\r$/, '');

/**
 * @typedef {Object} Feature
 * @property {string} id        F-01
 * @property {string} title
 * @property {string} tags      "[TEMA][UIUX]"
 * @property {'P0'|'P1'|'P2'} prio
 * @property {string} prdStatus ADA | REVAMP | BARU | '—'
 * @property {number} prdLine   nomor baris di docs/PRD.md
 * @property {string} sliceFile relatif terhadap docs/prd/
 * @property {?{code:string,name:string}} epic
 */

/** Baca PRD.md dan kembalikan seluruh definisi F-ID, urut nomor. */
export async function loadFeatures() {
  const lines = (await readFile(path.join(ROOT, SOURCE), 'utf8')).split('\n');
  /** @type {Feature[]} */
  const out = [];
  const seen = new Set();

  for (const slice of SLICES) {
    const to = slice.to ?? lines.length;
    for (let i = slice.from - 1; i < to; i++) {
      const line = clean(lines[i] ?? '');
      const base = { prdLine: i + 1, sliceFile: slice.file, epic: slice.epic };

      let m = line.match(FEATURE_HEADING);
      if (m) {
        const [, id, title, tags, prio, prdStatus] = m;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ id, title: title.trim(), tags, prio, prdStatus, ...base });
        continue;
      }

      m = line.match(FEATURE_INLINE);
      if (m) {
        const [, id, tags, prio, rest] = m;
        if (seen.has(id)) continue;
        seen.add(id);
        out.push({ id, title: shortTitle(rest), tags, prio, prdStatus: '—', ...base });
      }
    }
  }

  return out.sort((a, b) => Number(a.id.slice(2)) - Number(b.id.slice(2)));
}

/**
 * Klausa pertama dari deskripsi inline, dipakai sebagai judul ringkas.
 * Pemotongan mengabaikan `.` / `:` yang berada di dalam code span atau tanda kurung —
 * tanpa itu "`max-width: 100%`" terpotong jadi "Semua gambar `max-width".
 */
function shortTitle(rest) {
  const t = rest.replace(/\*\*/g, '').trim();
  let code = false;
  let depth = 0;
  let cut = -1;

  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '`') code = !code;
    else if (!code && (c === '(' || c === '[')) depth++;
    else if (!code && (c === ')' || c === ']')) depth = Math.max(0, depth - 1);
    else if (!code && depth === 0 && (c === '.' || c === ':')) {
      const next = t[i + 1];
      // Butuh spasi sesudahnya supaya "1.75" atau "Ctrl/⌘+K" tidak ikut terpotong.
      if ((next === undefined || /\s/.test(next)) && i > 0 && /[\p{L}\p{N})»”"`]/u.test(t[i - 1])) {
        cut = i;
        break;
      }
    }
  }

  let out = cut > 0 ? t.slice(0, cut) : t;
  out = out.replace(/\s*[.:,;]\s*$/, '').trim();
  if (out.length > 88) out = out.slice(0, 85).replace(/\s+\S*$/, '') + '…';
  return out;
}

/**
 * Status awal dari docs/instruction.md — satu-satunya catatan progres yang sudah ada.
 * @returns {Promise<Map<string,boolean>>} F-ID -> selesai?
 */
export async function loadInstructionStatus() {
  const src = await readFile(path.join(ROOT, 'docs/instruction.md'), 'utf8');
  /** @type {Map<string,boolean>} */
  const map = new Map();
  for (const rawLine of src.split('\n')) {
    const line = clean(rawLine);
    const box = line.match(/^\s*-\s+\[([ xX])\]/);
    if (!box) continue;
    const done = box[1].toLowerCase() === 'x';
    for (const id of line.match(/F-\d+/g) ?? []) {
      // Sekali tercentang tetap tercentang: satu F-ID bisa muncul di beberapa task.
      map.set(id, (map.get(id) ?? false) || done);
    }
  }
  return map;
}
