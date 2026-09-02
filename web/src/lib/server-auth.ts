/**
 * Pemeriksaan bearer token untuk route server yang memakai service role.
 *
 * Secret kosong selalu gagal tertutup. Perbandingan tetap menyapu seluruh
 * karakter ketika panjangnya sama supaya route tidak memakai perbandingan
 * string biasa untuk nilai yang memberi akses tulis administratif.
 */
export function tokenCocok(token: string | null, secret: string | undefined): boolean {
  if (!secret || token === null) return false;
  if (token.length !== secret.length) return false;

  let beda = 0;
  for (let i = 0; i < token.length; i += 1) {
    beda |= token.charCodeAt(i) ^ secret.charCodeAt(i);
  }
  return beda === 0;
}

export function bearerTokenCocok(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!authorization?.startsWith("Bearer ")) return false;
  return tokenCocok(authorization.slice("Bearer ".length), secret);
}
