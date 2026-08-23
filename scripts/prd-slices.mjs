// Peta potongan docs/PRD.md.
// Rentang WAJIB bersambung tanpa celah & tanpa tumpang tindih —
// dijamin oleh assertContiguous() di bawah. Itulah alasan konten tidak mungkin hilang.
//
// Kalau PRD.md diedit sampai nomor barisnya bergeser, jalankan:
//   node scripts/split-prd.mjs --remap
// untuk mencetak ulang rentang berdasarkan heading, lalu perbarui berkas ini.

export const SOURCE = 'docs/PRD.md';
export const OUT_DIR = 'docs/prd';

/**
 * @typedef {Object} Slice
 * @property {string} file   relatif terhadap OUT_DIR
 * @property {number} from   baris awal (1-indexed, inklusif)
 * @property {number} to     baris akhir (1-indexed, inklusif)
 * @property {string} title  judul manusia
 * @property {string} anchor heading pembuka — dipakai --remap untuk mencari ulang baris
 * @property {?{code:string,name:string}} epic  epic pemilik F-ID di potongan ini
 */

/** @type {Slice[]} */
export const SLICES = [
  {
    file: '01-konteks.md',
    from: 1,
    to: 251,
    title: 'Konteks — cara baca, ringkasan, lomba, masalah, persona, cakupan',
    anchor: '# PRD — PANTAS v1.0 "Competition Build"',
    epic: null,
  },
  {
    file: '02-arsitektur.md',
    from: 252,
    to: 347,
    title: 'Arsitektur sistem (as-built & target)',
    anchor: '## 6. Arsitektur Sistem',
    epic: null,
  },
  {
    file: '03-design-system.md',
    from: 348,
    to: 595,
    title: 'Design System v2 "Panen" & strategi responsif',
    anchor: '## 7. Design System v2 — "Panen"',
    epic: { code: 'EP-M', name: 'Design System v2 & Responsif' },
  },
  {
    file: '04-navigasi.md',
    from: 596,
    to: 664,
    title: 'Information architecture & navigasi',
    anchor: '## 9. Information Architecture & Navigasi',
    epic: { code: 'EP-N', name: 'Navigasi & Desktop' },
  },
  {
    file: 'epics/README.md',
    from: 665,
    to: 670,
    title: 'Spesifikasi fitur — pengantar & format',
    anchor: '## 10. Spesifikasi Fitur',
    epic: null,
  },
  {
    file: 'epics/EP-A-onboarding.md',
    from: 671,
    to: 729,
    title: 'EP-A — Onboarding & Autentikasi',
    anchor: '### EP-A — Onboarding & Autentikasi',
    epic: { code: 'EP-A', name: 'Onboarding & Autentikasi' },
  },
  {
    file: 'epics/EP-B-grading.md',
    from: 730,
    to: 784,
    title: 'EP-B — Grading AI',
    anchor: '### EP-B — Grading AI',
    epic: { code: 'EP-B', name: 'Grading AI' },
  },
  {
    file: 'epics/EP-C-harga.md',
    from: 785,
    to: 811,
    title: 'EP-C — Rekomendasi Harga',
    anchor: '### EP-C — Rekomendasi Harga',
    epic: { code: 'EP-C', name: 'Rekomendasi Harga' },
  },
  {
    file: 'epics/EP-D-marketplace.md',
    from: 812,
    to: 860,
    title: 'EP-D — Marketplace',
    anchor: '### EP-D — Marketplace',
    epic: { code: 'EP-D', name: 'Marketplace' },
  },
  {
    file: 'epics/EP-E-pesanan.md',
    from: 861,
    to: 883,
    title: 'EP-E — Pesanan & Serah Terima',
    anchor: '### EP-E — Pesanan & Serah Terima',
    epic: { code: 'EP-E', name: 'Pesanan & Serah Terima' },
  },
  {
    file: 'epics/EP-F-logistik.md',
    from: 884,
    to: 918,
    title: 'EP-F — Logistik & Rantai Pasok (pilar tema)',
    anchor: '### EP-F — Logistik & Rantai Pasok',
    epic: { code: 'EP-F', name: 'Logistik & Rantai Pasok' },
  },
  {
    file: 'epics/EP-G-traceability.md',
    from: 919,
    to: 950,
    title: 'EP-G — Ketelusuran (Traceability)',
    anchor: '### EP-G — Ketelusuran (Traceability)',
    epic: { code: 'EP-G', name: 'Ketelusuran' },
  },
  {
    file: 'epics/EP-H-dampak.md',
    from: 951,
    to: 969,
    title: 'EP-H — Dampak & Keberlanjutan',
    anchor: '### EP-H — Dampak & Keberlanjutan',
    epic: { code: 'EP-H', name: 'Dampak & Keberlanjutan' },
  },
  {
    file: 'epics/EP-I-akun.md',
    from: 970,
    to: 986,
    title: 'EP-I — Akun & Preferensi',
    anchor: '### EP-I — Akun & Preferensi',
    epic: { code: 'EP-I', name: 'Akun & Preferensi' },
  },
  {
    file: 'epics/EP-J-publik.md',
    from: 987,
    to: 998,
    title: 'EP-J — Publik & Konten',
    anchor: '### EP-J — Publik & Konten',
    epic: { code: 'EP-J', name: 'Publik & Konten' },
  },
  {
    file: 'epics/EP-K-admin.md',
    from: 999,
    to: 1020,
    title: 'EP-K — Admin & Operasi',
    anchor: '### EP-K — Admin & Operasi',
    epic: { code: 'EP-K', name: 'Admin & Operasi' },
  },
  {
    file: 'epics/EP-L-platform.md',
    from: 1021,
    to: 1062,
    title: 'EP-L — Platform (PWA, a11y, i18n, performa)',
    anchor: '### EP-L — Platform',
    epic: { code: 'EP-L', name: 'Platform' },
  },
  {
    file: '05-model-data.md',
    from: 1063,
    to: 1261,
    title: 'Model data — tabel, view, aturan RLS',
    anchor: '## 11. Model Data',
    epic: null,
  },
  {
    file: '06-kontrak-api.md',
    from: 1262,
    to: 1319,
    title: 'Kontrak API — FastAPI, route handler, aturan seam',
    anchor: '## 12. Kontrak API',
    epic: null,
  },
  {
    file: '07-ai-engine.md',
    from: 1320,
    to: 1426,
    title: 'Spesifikasi AI Engine — pipeline, cakupan model, pekerjaan v1.0',
    anchor: '## 13. Spesifikasi AI Engine',
    epic: { code: 'EP-B', name: 'Grading AI' },
  },
  {
    file: '08-algoritma-harga.md',
    from: 1427,
    to: 1506,
    title: 'Algoritma harga & faktor emisi CO₂e',
    anchor: '## 14. Algoritma Harga',
    epic: { code: 'EP-C', name: 'Rekomendasi Harga' },
  },
  {
    file: '09-nfr.md',
    from: 1507,
    to: 1601,
    title: 'Non-functional requirements (NFR-*)',
    anchor: '## 15. Non-Functional Requirements',
    epic: null,
  },
  {
    file: '10-deployment.md',
    from: 1602,
    to: 1661,
    title: 'Deployment & operasi — topologi, env, CI/CD, runbook',
    anchor: '## 16. Deployment & Operasi',
    epic: null,
  },
  {
    file: '11-qa.md',
    from: 1662,
    to: 1709,
    title: 'QA & rencana uji — 5 alur emas, matriks perangkat',
    anchor: '## 17. QA & Rencana Uji',
    epic: null,
  },
  {
    file: '12-judge-demo.md',
    from: 1710,
    to: 1768,
    title: 'Judge experience & demo kit',
    anchor: '## 18. Judge Experience & Demo Kit',
    epic: { code: 'EP-O', name: 'Demo Kit & Judge Experience' },
  },
  {
    file: '13-deliverable.md',
    from: 1769,
    to: 1816,
    title: 'Deliverable lomba — checklist, peta proposal, pitch deck',
    anchor: '## 19. Deliverable Lomba',
    epic: null,
  },
  {
    file: '14-risk.md',
    from: 1817,
    to: 1838,
    title: 'Risk register (R-*)',
    anchor: '## 20. Risk Register',
    epic: null,
  },
  {
    file: '15-roadmap.md',
    from: 1839,
    to: 1919,
    title: 'Roadmap & milestone per fase',
    anchor: '## 21. Roadmap & Milestone',
    epic: null,
  },
  {
    file: '16-dod-metrik.md',
    from: 1920,
    to: 1959,
    title: 'Definition of Done & metrik',
    anchor: '## 22. Definition of Done & Metrik',
    epic: null,
  },
  {
    file: '17-lampiran.md',
    from: 1960,
    to: null, // null = sampai akhir berkas
    title: 'Lampiran — glosarium, keputusan, pertanyaan terbuka, referensi',
    anchor: '## 23. Lampiran',
    epic: null,
  },
];

export const SENTINEL = '<!-- PRD-SLICE-BEGIN -->';

/** Lempar galat bila rentang tidak bersambung sempurna. */
export function assertContiguous(totalLines) {
  let expected = 1;
  for (const s of SLICES) {
    if (s.from !== expected) {
      throw new Error(
        `Celah/tumpang tindih rentang di ${s.file}: mulai ${s.from}, seharusnya ${expected}.`
      );
    }
    expected = (s.to ?? totalLines) + 1;
  }
  if (expected !== totalLines + 1) {
    throw new Error(
      `Rentang berakhir di baris ${expected - 1}, sumber punya ${totalLines} baris.`
    );
  }
}
