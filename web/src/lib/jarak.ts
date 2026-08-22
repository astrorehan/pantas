/**
 * Jarak antara pembeli dan kebun — dan, yang lebih penting, kapan jarak itu
 * tidak diketahui.
 *
 * Sebelum berkas ini ada, "tidak tahu di mana kebunnya" ditulis dengan angka:
 * profil tanpa koordinat memakai posisi pembeli sendiri sebagai gantinya, dan
 * listing baru terbit dengan `lat: 0, lng: 0`. Keduanya menghasilkan layar yang
 * berbunyi "0 km" — pembeli membaca kebun yang letaknya tidak diketahui siapa
 * pun sebagai kebun yang paling dekat, lalu mengurutkannya ke puncak daftar.
 *
 * Karena itu di sini "tidak diketahui" bernilai `null`, bukan nol, dan `null`
 * harus ditangani di layar. Nol adalah jarak; ketiadaan bukan.
 */

export interface Titik {
  lat: number;
  lng: number;
}

/**
 * Koordinat nyata atau bukan.
 *
 * (0, 0) ditolak dengan sengaja. Titik itu ada di Teluk Guinea, ribuan
 * kilometer dari petani mana pun, dan ia satu-satunya nilai yang pernah
 * ditulis kode ini sendiri sebagai pengganti "belum diisi" — jadi ia jauh lebih
 * mungkin berarti nol yang tidak sengaja daripada sebuah kebun.
 */
export function titikValid(
  lat: number | null | undefined,
  lng: number | null | undefined,
): boolean {
  if (lat == null || lng == null) return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

/** Titik yang sudah divalidasi, atau `null` bila koordinatnya tidak dipakai. */
export function keTitik(
  lat: number | null | undefined,
  lng: number | null | undefined,
): Titik | null {
  return titikValid(lat, lng) ? { lat: lat as number, lng: lng as number } : null;
}

const R_BUMI_KM = 6371;

/**
 * Haversine, satu angka di belakang koma.
 *
 * Mengembalikan `null` bila salah satu ujungnya tidak diketahui — termasuk saat
 * pembeli menolak izin lokasi, yang merupakan pilihan sah dan bukan alasan
 * untuk menebak.
 */
export function jarakKm(a: Titik | null, b: Titik | null): number | null {
  if (!a || !b) return null;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R_BUMI_KM * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/**
 * Urutan terdekat dulu, dengan yang tidak diketahui selalu di belakang.
 *
 * `undefined`/`null` yang dibandingkan langsung dengan `-` menghasilkan `NaN`,
 * dan `sort` memperlakukan `NaN` sebagai "sama saja" — hasilnya urutan yang
 * tampak acak dan berubah-ubah antar peramban. Jadi ketidaktahuan diurus di
 * sini, sekali, bukan di tiap pemanggil.
 */
export function urutTerdekat<T>(items: T[], jarak: (item: T) => number | null): T[] {
  return [...items].sort((a, b) => {
    const ja = jarak(a);
    const jb = jarak(b);
    if (ja === null && jb === null) return 0;
    if (ja === null) return 1;
    if (jb === null) return -1;
    return ja - jb;
  });
}

/**
 * Titik tengah dari sekumpulan koordinat.
 *
 * Dipakai peta saat izin lokasi belum ada: bingkainya diambil dari data yang
 * benar-benar ada, bukan dari sebuah kota yang ditulis di dalam kode.
 */
export function titikTengah(titik: Titik[]): Titik | null {
  if (titik.length === 0) return null;
  const jumlah = titik.reduce(
    (acc, t) => ({ lat: acc.lat + t.lat, lng: acc.lng + t.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: jumlah.lat / titik.length, lng: jumlah.lng / titik.length };
}
