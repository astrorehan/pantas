const HASH_SHA256 = /^sha256:[0-9a-f]{64}$/i;
const HASH_DEMO = /^sha256:demo-mode-no-camera(?:-[23])?$/;

/** Normalisasi satu segmen URL dan tolak nilai yang bukan hash audit PANTAS. */
export function normalisasiAuditHash(value: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  return HASH_SHA256.test(decoded) || HASH_DEMO.test(decoded) ? decoded : null;
}
