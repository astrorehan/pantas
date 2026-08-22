// Build untuk pengukuran performa: mode demo offline, tanpa backend.
//
// Gerbang Lighthouse menanam sesi ke localStorage (scripts/lighthouse-seed-session.cjs),
// dan sesi itu hanya dihormati bila aplikasi berjalan tanpa Supabase — kalau
// tidak, boot store memanggil `auth.getSession()`, tidak menemukan siapa-siapa,
// lalu `RequireRole` melempar semua layar peran ke /masuk. Yang terukur bukan
// dashboard, melainkan redirect.
//
// Di CI tidak ada `.env.local` sehingga `next build` sudah otomatis dalam mode
// itu. Di mesin lokal berkasnya ada, dan menyetel env var ke string kosong tidak
// menolongnya: `@next/env` memperlakukan string kosong sama dengan belum diisi
// lalu tetap menimpanya dari berkas. Jadi berkasnya disingkirkan sementara —
// dan dikembalikan apa pun yang terjadi, termasuk saat build gagal atau Ctrl+C.

import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const ENV_LOCAL = ".env.local";
const SIMPAN = ".env.local.perf-backup";

let disingkirkan = false;

function kembalikan() {
  if (disingkirkan && existsSync(SIMPAN)) {
    renameSync(SIMPAN, ENV_LOCAL);
    disingkirkan = false;
  }
}

// Ctrl+C di tengah build tidak boleh meninggalkan pengembang tanpa .env.local.
for (const sinyal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sinyal, () => {
    kembalikan();
    process.exit(1);
  });
}
process.on("uncaughtException", (e) => {
  kembalikan();
  throw e;
});

try {
  if (existsSync(ENV_LOCAL)) {
    if (existsSync(SIMPAN)) {
      console.error(
        `${SIMPAN} sudah ada — sisa build yang terputus. Periksa isinya, kembalikan ke ${ENV_LOCAL}, lalu ulangi.`,
      );
      process.exit(1);
    }
    renameSync(ENV_LOCAL, SIMPAN);
    disingkirkan = true;
    console.log(`${ENV_LOCAL} disingkirkan sementara — build dalam mode demo offline.`);
  }

  const hasil = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });
  process.exitCode = hasil.status ?? 1;
} finally {
  kembalikan();
}
