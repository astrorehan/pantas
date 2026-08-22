/**
 * Pembuat QR bersama.
 *
 * `qrcode` sekitar 8,6 KB gzip dan hanya dipakai tiga layar — serah terima,
 * struk, dan label peti. Diimpor statis, ukuran itu ikut di first-load setiap
 * route pesanan meski QR-nya baru muncul setelah modal dibuka; sebagai impor
 * dinamis ia diambil saat efek pertama berjalan (NFR-05).
 *
 * Warna dikunci gelap-di-terang, bukan mengikuti tema: kode ini dipindai dari
 * layar ponsel, dan membalikkannya mengalahkan sebagian besar aplikasi pemindai.
 */
const DARK = "#171614";

export async function qrSvg(
  value: string,
  { margin = 0, light = "#ffffff00" }: { margin?: number; light?: string } = {},
): Promise<string> {
  const { default: QRCode } = await import("qrcode");
  return QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin,
    color: { dark: DARK, light },
  });
}
