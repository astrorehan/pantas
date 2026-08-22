import { defineConfig } from "vitest/config";

/**
 * Vitest hanya untuk lapisan murni `src/lib/**` (F-104).
 *
 * Tidak ada environment jsdom dan tidak ada plugin React: yang diuji adalah
 * fungsi angka-masuk-angka-keluar, dan memasang lingkungan DOM hanya akan
 * memperlambat 1.000 jalan fast-check tanpa satu pun tes memakainya.
 */
export default defineConfig({
  test: {
    include: ["src/lib/**/*.test.ts"],
    environment: "node",
  },
});
