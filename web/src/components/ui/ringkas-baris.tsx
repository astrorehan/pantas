import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface RingkasItem {
  /** Angkanya. Ditebalkan; sisanya kalimat biasa. */
  nilai: ReactNode;
  /** Kata setelah angka — "lot tayang", "pesanan jalan". Huruf kecil. */
  label: string;
  href?: string;
  /** Nama aksesibel tautan — wajib bila `href` diisi. */
  hrefLabel?: string;
  /** Menyalakan warna brand; pakai untuk hal yang menunggu petani. */
  sorot?: boolean;
}

/**
 * Ringkasan satu baris, menggantikan tumpukan kartu angka.
 *
 * Layar petani sempat membuka dengan empat kartu metrik bergradien sebelum
 * satu pun barang terlihat. Angkanya benar, tapi tidak satu pun mengubah apa
 * yang petani lakukan berikutnya — dan empat kotak besar berisi angka adalah
 * cara tercepat membuat aplikasi kerja terasa seperti laporan.
 *
 * `Stat` tidak dihapus dan tidak digantikan: di `/petani/dampak` dan `/admin`
 * angka besar dengan sumbernya memang isi halamannya (§5.3 aturan 2). Di layar
 * kerja harian, bentuk yang benar adalah kalimat.
 */
export function RingkasBaris({
  items,
  className,
}: {
  items: RingkasItem[];
  className?: string;
}) {
  const tampil = items.filter(Boolean);
  if (tampil.length === 0) return null;

  return (
    <ul className={cx("flex flex-wrap items-center gap-2", className)}>
      {tampil.map(({ nilai, label, href, hrefLabel, sorot }) => {
        const isi = (
          <>
            <span className="tnum font-bold">{nilai}</span>
            <span className="font-medium">{label}</span>
          </>
        );

        const gaya = cx(
          // Ambang yang sama dengan `Button`: 44px selama masih layar ponsel,
          // 36px yang lebih padat begitu ada tetikus. Sebelumnya 36px di
          // kedua-duanya, dan pil ini tautan yang bisa diketuk.
          "type-body-md inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 sm:min-h-9 sm:px-3",
          sorot
            ? "border-brand/30 bg-brand-tint text-brand-deep"
            : "border-line bg-surface text-muted",
        );

        return (
          <li key={label}>
            {href ? (
              <Link
                href={href}
                aria-label={hrefLabel ?? `${nilai} ${label}`}
                className={cx(
                  gaya,
                  "tap tap-press focus-ring hover:border-line-strong hover:text-ink",
                )}
              >
                {isi}
              </Link>
            ) : (
              <span className={gaya}>{isi}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
