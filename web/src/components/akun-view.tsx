"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, LogOut, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  Button,
  Card,
  HapticToggle,
  LocaleToggle,
  SectionLabel,
  Sheet,
  ThemeToggle,
  cx,
} from "@/components/ui";
import { Container } from "@/components/container";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";
import { getUlasanList } from "@/lib/data";
import { ringkasUlasan } from "@/lib/ulasan";
import type { Ulasan } from "@/lib/types";

/**
 * Layar sekunder yang dijangkau dari Akun.
 *
 * Ada di sini karena nav utama petani dijaga tetap lima tujuan: layar yang
 * dibuka sesekali — Dampak, misalnya — tidak layak memakan satu slot bilah
 * bawah yang dipakai setiap hari, tapi juga tidak boleh hanya bisa dicapai
 * lewat tautan tebak-tebakan.
 */
export interface TautanAkun {
  href: string;
  label: string;
  deskripsi: string;
  icon: LucideIcon;
}

/**
 * Satu angka aktivitas.
 *
 * `href` wajib. Angka di layar ini selalu punya jawaban untuk "lalu di mana
 * saya lihat barangnya?", dan petak yang tampak sama persis dengan tetangganya
 * tapi tidak merespons ketukan adalah kegagalan yang paling membingungkan di
 * layar sentuh — tidak ada hover di sana untuk membedakannya lebih dulu.
 */
export interface AngkaAkun {
  k: string;
  v: string;
  href: string;
}

/**
 * Akun, untuk petani maupun pembeli.
 *
 * Versi sebelumnya sudah mengelompokkan isinya jadi tiga — Profil, Aktivitas,
 * Pengaturan — tapi mengecat ketiganya dengan kuas yang sama: kartu putih
 * berisi baris setinggi 52px. Akibatnya satu kartu "Aktivitas" memuat tiga
 * perilaku berbeda dalam bentuk yang identik. Empat baris pertama mati, baris
 * kelima membuka panel, dua baris terakhir pindah halaman, dan satu-satunya
 * pembeda adalah chevron 16px di ujung kanan.
 *
 * Sekarang bentuk mengikuti perilaku:
 *
 * - **Identitas** lepas dari kartu. Ia subjek layar ini, bukan salah satu
 *   isinya, dan benda yang tidak bisa diketuk tidak perlu meminjam wujud
 *   kartu untuk terlihat penting. Rating ikut naik ke sini: reputasi melekat
 *   pada orangnya, bukan pada daftar statistik.
 * - **Angka** jadi petak, bukan baris. Empat baris selebar layar menghabiskan
 *   ~200px paruh atas untuk angka yang tak satu pun bisa ditindaklanjuti;
 *   sebagai petak 2 kolom ia separuhnya, terbaca sebagai data, dan yang punya
 *   tujuan kini benar-benar bisa diketuk ke sana.
 * - **Tautan** dan **pengaturan** berdiri sebagai kartu masing-masing, jadi
 *   satu kartu hanya pernah berarti satu perilaku.
 */
export default function AkunView({
  peranLabel,
  baris,
  tautan = [],
  sebelumAktivitas,
}: {
  peranLabel: string;
  baris: AngkaAkun[];
  tautan?: TautanAkun[];
  /**
   * Kartu khusus peran, ditaruh tepat di bawah identitas.
   *
   * Dipakai petani untuk titik kebunnya (lihat `LokasiKebunCard`): itu bagian
   * dari profil, bukan angka aktivitas, dan tidak ada padanannya di sisi
   * pembeli.
   */
  sebelumAktivitas?: ReactNode;
}) {
  const store = useStore();
  const t = useTranslations("settings");
  const router = useRouter();
  const sesi = store.sesi;
  const [ulasanList, setUlasanList] = useState<Ulasan[]>([]);
  const [bukaUlasan, setBukaUlasan] = useState(false);
  const ringkasan = ringkasUlasan(ulasanList);

  useEffect(() => {
    const uid = sesi?.userId || "demo-petani-id";
    getUlasanList(uid).then(setUlasanList);
  }, [sesi?.userId]);

  if (!sesi) return null;

  const inisial = sesi.nama
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rataTeks = ringkasan.rata.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <main className="flex-1 pb-24 pt-5 md:pb-8">
      {/*
        Lebar bawaan Container, bukan kolom sempit.

        Versi sebelumnya memakai `className="max-w-2xl"` yang tidak pernah
        bekerja — lebar bawaan Container dinyatakan lewat varian breakpoint
        (`md:max-w-3xl lg:max-w-[1152px]`) yang selalu diurutkan setelah utility
        polos. Kodenya tampak membatasi kolom; layarnya tidak. Sekarang lebar
        penuh itu memang yang diminta, jadi tidak ada yang perlu dilawan.
      */}
      <Container>
        {/*
          Satu aliran ke bawah, bukan konten di kiri dan rak setelan di kanan.

          Pembagian utama/samping membuat Pengaturan jadi kolom permanen selebar
          22rem — ia menuntut sepertiga layar seumur hidup halaman padahal
          disentuh beberapa kali setahun. Yang berpasangan sekarang hanya kartu:
          identitas dan angka tetap membentang penuh, lalu Jelajahi dan
          Pengaturan duduk berdampingan sebagai dua bagian yang setara.
        */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-8">
          {/* --- Identitas ------------------------------------------------ */}
          <header className="flex flex-col gap-3.5 lg:col-span-2">
            <div className="flex items-center gap-4">
              <span
                aria-hidden
                className="type-display-md flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-deep text-on-brand shadow-e2"
              >
                {inisial}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="type-heading-lg truncate text-ink">
                  {sesi.nama}
                </h2>
                <p className="type-body-md truncate text-muted">{peranLabel}</p>
                <p className="type-body-sm truncate text-label">{sesi.email}</p>
              </div>
            </div>

            {/*
              Rating nol tidak ditampilkan sebagai 5,0 — dan tidak dibuat bisa
              diketuk, karena panel yang dibuka hanya akan berisi kalimat yang
              sudah tertulis di pilnya sendiri.
            */}
            {ringkasan.jumlah > 0 ? (
              <button
                type="button"
                onClick={() => setBukaUlasan(true)}
                aria-haspopup="dialog"
                className="tap tap-press focus-ring type-body-md inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface ps-3.5 pe-2.5 text-ink shadow-e1 hover:border-line-strong"
              >
                <Star aria-hidden className="size-4 fill-grade-b text-grade-b" />
                <span className="tnum font-bold">{rataTeks}</span>
                <span className="text-muted">
                  {t("reviews_count", { count: ringkasan.jumlah })}
                </span>
                <ChevronRight aria-hidden className="size-4 text-label" />
              </button>
            ) : (
              <p className="type-body-md inline-flex min-h-9 w-fit items-center gap-2 rounded-full border border-dashed border-line-strong px-3.5 text-muted">
                <Star aria-hidden className="size-4 text-label" />
                {t("reviews_none")}
              </p>
            )}
          </header>

          {sebelumAktivitas && (
            <div className="lg:col-span-2">{sebelumAktivitas}</div>
          )}

          {/* --- Aktivitas ------------------------------------------------ */}
          <Grup judul={t("activity")} className="lg:col-span-2">
            <div
              className={cx("grid grid-cols-2 gap-2.5", KOLOM_UBIN(baris.length))}
            >
              {baris.map((angka) => (
                <UbinAngka key={angka.k} {...angka} />
              ))}
            </div>
          </Grup>

          {/* --- Jelajahi -------------------------------------------------- */}
          {tautan.length > 0 && (
            <Grup judul={t("explore")}>
              <Card className="divide-y divide-line">
                {tautan.map(({ href, label, deskripsi, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    data-tour={href}
                    className="tap focus-ring flex items-center gap-3.5 px-4 py-4 first:rounded-t-md last:rounded-b-md hover:bg-sunken"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-brand">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-body-lg block font-bold text-ink">
                        {label}
                      </span>
                      <span className="type-body-md block text-muted">
                        {deskripsi}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="size-4 shrink-0 text-label"
                    />
                  </Link>
                ))}
              </Card>
            </Grup>
          )}

          {/* --- Pengaturan + keluar --------------------------------------- */}
          {/* Satu sel, bukan dua: tombol keluar milik kartu setelan. Sebagai
              anak grid tersendiri ia akan jatuh ke kolom berikutnya dan berdiri
              di bawah Jelajahi — terlepas dari satu-satunya blok yang menjadi
              alasannya ada di sini. */}
          <div className="flex flex-col gap-6">
            <Grup judul={t("title")}>
              <Card className="divide-y divide-line">
                {/* Tanpa keterangan: "Pilih bahasa tampilan antarmuka PANTAS"
                    di bawah label "Bahasa" tidak menambah satu pun informasi
                    yang tidak sudah dibawa dua chip di sebelahnya. */}
                <BarisKontrol label={t("language")} kontrol={<LocaleToggle />} />
                <BarisKontrol
                  label={t("appearance")}
                  kontrol={<ThemeToggle />}
                />
                <BarisKontrol
                  label={t("haptic")}
                  keterangan={t("haptic_hint")}
                  kontrol={<HapticToggle />}
                />
                <BarisKontrol
                  label={t("tour")}
                  keterangan={t("tour_hint")}
                  kontrol={
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => store.restartTour()}
                    >
                      {t("tour_btn")}
                    </Button>
                  }
                />
              </Card>
            </Grup>

            {/*
              Keluar tidak lagi memakai wujud kartu. Tombol hantu selebar layar
              di bawah tumpukan kartu putih terbaca sebagai kartu kelima,
              padahal ia satu-satunya hal di layar ini yang membuang keadaan
              pengguna.
            */}
            <Button
              variant="danger-ghost"
              size="lg"
              block
              onClick={() => {
                store.logout();
                router.replace("/");
              }}
            >
              <LogOut aria-hidden className="size-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </Container>

      {/* Ulasan diterima (F-42). Daftar penuhnya di balik satu pil: ulasan
          dibaca sesekali, tapi versi lama merendernya utuh di tengah layar
          setelan — sehingga tombol tema terdorong ke bawah lipatan begitu ada
          selusin ulasan masuk. */}
      <Sheet
        open={bukaUlasan}
        onClose={() => setBukaUlasan(false)}
        title={t("reviews_received", { count: ringkasan.jumlah })}
        description={
          ringkasan.jumlah > 0 ? `Rata-rata ${rataTeks} dari 5.` : undefined
        }
      >
        {ulasanList.length === 0 ? (
          <p className="type-body-md text-muted">{t("reviews_empty")}</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {ulasanList.map((u) => (
              <li key={u.id} className="flex flex-col gap-1 py-3 first:pt-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="type-body-md font-bold text-ink">
                    {u.penilai_nama || t("default_user")}
                  </span>
                  <span
                    className="flex items-center gap-0.5"
                    aria-label={`${u.bintang} dari 5 bintang`}
                  >
                    {Array.from({ length: u.bintang }, (_, i) => (
                      <Star
                        key={i}
                        aria-hidden
                        className="size-4 fill-grade-b text-grade-b"
                      />
                    ))}
                  </span>
                </div>
                {u.komentar && (
                  <p className="type-body-md text-muted">&ldquo;{u.komentar}&rdquo;</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </main>
  );
}

/* --------------------------------------------------------------- Potongan */

function Grup({
  judul,
  className,
  children,
}: {
  judul: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("flex flex-col gap-2.5", className)}>
      <SectionLabel>{judul}</SectionLabel>
      {children}
    </section>
  );
}

/**
 * Kolom petak angka dari `sm` ke atas, ditentukan oleh jumlah angkanya.
 *
 * Sempat `auto-fit` supaya satu ekspresi melayani petani (empat angka) dan
 * pembeli (tiga) sekaligus. Lebar trek minimum tidak bisa tahu ada berapa
 * petak yang harus dimuatnya, jadi ia selalu menebak — dan tebakan yang meleset
 * membuang petak terakhir sendirian ke baris berikutnya. Di sini jumlahnya
 * diketahui, jadi sebutkan saja.
 *
 * Kelasnya ditulis utuh: pemindai Tailwind membaca berkas sebagai teks dan
 * tidak pernah mengeksekusi kode, jadi `sm:grid-cols-${n}` tidak akan pernah
 * menghasilkan satu pun aturan.
 */
function KOLOM_UBIN(jumlah: number): string {
  switch (jumlah) {
    case 1:
      return "sm:grid-cols-1";
    case 2:
      return "sm:grid-cols-2";
    case 3:
      return "sm:grid-cols-3";
    default:
      return "sm:grid-cols-4";
  }
}

const UBIN =
  "flex flex-col justify-between gap-1 rounded-md bg-surface p-3.5 shadow-e2";

/**
 * Petak angka, selalu tertaut.
 *
 * Keterketukannya dibawa gerakan, bukan ikon: petak terangkat saat disentuh
 * kursor. Chevron pada petak sekecil ini akan memakan baris label yang sudah
 * cuma 12px.
 */
function UbinAngka({ k, v, href }: AngkaAkun) {
  return (
    <Link
      href={href}
      aria-label={`${v} ${k}`}
      className={cx(
        UBIN,
        "tap tap-press focus-ring hover:-translate-y-0.5 hover:shadow-e4",
      )}
    >
      <span className="type-heading-lg tnum text-ink">{v}</span>
      <span className="type-body-sm text-muted">{k}</span>
    </Link>
  );
}

/**
 * Baris pengaturan: menumpuk di ponsel, berdampingan begitu muat.
 *
 * Versi lama memakai satu baris `flex-wrap` di semua lebar. Di 375px tidak ada
 * yang muat berdampingan, jadi isinya membungkus — dan yang terlihat adalah
 * kontrol yang melompat ke kiri tanpa sejajar dengan apa pun, seperti tata
 * letak yang rusak. Menumpuk secara eksplisit membuat kejadian yang sama
 * terbaca sebagai keputusan.
 *
 * Dari `sm` chip-nya jelas muat di sisa baris — chip tema yang paling lebar
 * memakan 287px dari 576px yang tersedia — jadi tidak ada alasan menghabiskan
 * dua baris untuk sesuatu yang cukup satu.
 */
function BarisKontrol({
  label,
  keterangan,
  kontrol,
}: {
  label: string;
  keterangan?: string;
  kontrol: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
      <div className="min-w-0">
        <span className="type-body-lg block font-bold text-ink">{label}</span>
        {keterangan && (
          <span className="type-body-md block text-muted">{keterangan}</span>
        )}
      </div>
      <div className="shrink-0">{kontrol}</div>
    </div>
  );
}
