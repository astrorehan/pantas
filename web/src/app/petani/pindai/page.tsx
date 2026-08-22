"use client";

/* eslint-disable @next/next/no-img-element -- antrean sudut adalah data URL kamera */

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ImageIcon,
  Layers,
  Upload,
  X,
} from "lucide-react";
import { cx } from "@/components/ui/cx";
import { KOMODITAS, labelKomoditas } from "@/lib/data";
import type { FotoAntrean } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useTranslations } from "@/lib/i18n";

type Mode = "loading" | "camera" | "demo";

type Capture = { dataUrl: string; scale: number };

/** Komoditas dikelompokkan sekali di modul: datanya statis, bukan state. */
const KELOMPOK = KOMODITAS.reduce<
  { nama: string; items: typeof KOMODITAS }[]
>((acc, k) => {
  const terakhir = acc[acc.length - 1];
  if (terakhir && terakhir.nama === k.kelompok) terakhir.items.push(k);
  else acc.push({ nama: k.kelompok, items: [k] });
  return acc;
}, []);

/**
 * Foto contoh mode demo, satu per keluarga komoditas.
 *
 * Sebelumnya layar ini memakai satu foto stok rumah kaca dan — yang lebih
 * merusak — mode demo memanggil `finish(null)`, sehingga tidak ada gambar sama
 * sekali yang dikirim ke `/predict`: mesin tidak pernah menilai apa pun dan
 * layar hasil selalu melaporkan nol objek. Foto di sini datang dari bahan yang
 * melatih dan menguji model (lihat ai_engine/make_demo_samples.py), dan
 * `probe_demo_samples.py` menjaga keduanya tetap menghasilkan deteksi.
 *
 * `carrot` dan `cucumber` tidak ada di sini: dataset keduanya hanya berisi
 * potongan klasifikasi 224x224 satu objek, bukan foto panen. Untuk komoditas
 * itu mode demo meminta foto diunggah, bukan memindai bahan yang salah.
 */
const CONTOH: Record<string, { src: string; alt: string }> = {
  chili: {
    src: "/img/contoh/chili.jpg",
    alt: "Foto contoh: panen cabai di atas piring",
  },
  tomato: {
    src: "/img/contoh/tomato.jpg",
    alt: "Foto contoh: dua tomat merah di atas bidang polos",
  },
};

/** "chili_hijau_besar" -> "chili"; sama dengan pembagian di ai_engine/api.py. */
const keluarga = (komoditas: string) => komoditas.split("_")[0];

/** Sama dengan MAX_FOTO_BATCH di ai_engine/api.py — engine menolak lebih. */
const MAX_FOTO = 5;

/**
 * Panel kalibrasi gerbang blur hanya dirakit di build development.
 *
 * Konstanta, bukan pengecekan di dalam render: `process.env.NODE_ENV` diganti
 * literal saat build, jadi seluruh cabangnya lenyap dari bundel produksi
 * lewat dead-code elimination — bukan sekadar disembunyikan dengan CSS. Itu
 * penting di sini karena anggaran NFR-05 untuk rute ini hanya menyisakan
 * beberapa KB.
 */
const GERBANG_BLUR_DAPAT_DIATUR = process.env.NODE_ENV !== "production";

/* ------------------------------------------------------- Gerbang ketajaman */

/**
 * Tiga zona F-102, diukur di peramban sebelum rana ditekan.
 *
 * Angkanya varians Laplacian: citra diubah ke abu-abu, dijalankan kernel
 * pendeteksi tepi 3×3, lalu diambil variansi hasilnya. Foto tajam punya banyak
 * tepi berkontras jadi variansinya tinggi; foto goyang melembekkan tepi itu
 * dan variansinya jatuh. Definisi yang sama persis dipakai mesin di
 * ai_engine/model.py:62 lewat `cv2.Laplacian(gray).var()`.
 *
 * Kenapa diukur ulang di sini padahal mesin sudah punya gerbangnya: gerbang
 * mesin baru berbicara *sesudah* foto dikirim dan muncul di layar hasil.
 * Petani sudah menekan rana dan menunggu sebelum tahu fotonya tidak terpakai.
 * Yang dibutuhkan adalah peringatan sebelum ia menekan, dan itu hanya bisa
 * datang dari frame yang sedang ia lihat.
 */
const AMBANG_TOLAK = 12;
const AMBANG_NORMAL = 35;

/** Sisi petak yang diukur, dalam piksel foto yang nanti dikirim. */
const SISI_UKUR = 320;

type Zona = "normal" | "warn" | "reject";

const zonaDari = (skor: number): Zona =>
  skor < AMBANG_TOLAK ? "reject" : skor <= AMBANG_NORMAL ? "warn" : "normal";

/**
 * Varians dari kernel Laplacian 3×3 pada citra abu-abu.
 *
 * Varians populasi (E[x²] − E[x]²), sama dengan yang dihitung `.var()` NumPy.
 *
 * `Uint8Array` dan aritmetika bulat, bukan `Float32Array`: buffernya empat kali
 * lebih kecil sehingga muat jauh lebih lama di cache, dan itu yang menentukan
 * di sini — diukur di layar ini, versi float memakan 17ms untuk petak yang sama
 * yang dihabiskan versi ini dalam 10ms, dengan skor yang sama.
 */
function variansLaplacian(data: Uint8ClampedArray, w: number, h: number): number {
  const abu = new Uint8Array(w * h);
  for (let i = 0, p = 0; p < abu.length; i += 4, p++) {
    // Bobot luma BT.601 (0,299 / 0,587 / 0,114) dalam pecahan 1/256.
    abu[p] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  const n = (w - 2) * (h - 2);
  if (n <= 0) return 0;
  let jumlah = 0;
  let kuadrat = 0;
  for (let y = 1; y < h - 1; y++) {
    const baris = y * w;
    for (let x = 1; x < w - 1; x++) {
      const i = baris + x;
      const v = abu[i - w] + abu[i + w] + abu[i - 1] + abu[i + 1] - 4 * abu[i];
      jumlah += v;
      kuadrat += v * v;
    }
  }
  const rata = jumlah / n;
  return kuadrat / n - rata * rata;
}

/**
 * Skor ketajaman petak tengah sumber yang sedang aktif.
 *
 * Petak, bukan seluruh bingkai, dan itu keputusan yang menentukan. Varians
 * Laplacian ikut skala — gambar yang sama memberi 7 di 900px, 31 di 400px, dan
 * 86 di 256px — jadi memperkecil seluruh bingkai demi kecepatan akan membuat
 * ambang 12 dan 35 kehilangan arti. Yang diambil di sini adalah potongan
 * `SISI_UKUR` piksel dari tengah, **pada skala piksel yang sama** dengan foto
 * yang nanti dikirim (`frameToDataUrl` memangkas sisi terpanjang ke 900px):
 * satu piksel terukur = satu piksel terkirim, tanpa penyampelan ulang. Biaya
 * turun dari ~69ms ke ~10ms tanpa menyentuh arti angkanya.
 *
 * Dua selisih terhadap gerbang mesin, keduanya disengaja dan keduanya membuat
 * angka di sini cenderung *lebih tinggi*:
 *
 * 1. Mesin mengukur seluruh foto, termasuk latar rata yang menurunkan varians;
 *    di sini hanya bagian tengah, tempat panennya berada.
 * 2. Mesin mengukur setelah kompresi JPEG 0,72, yang ikut memakan detail
 *    frekuensi tinggi.
 *
 * Karena itu ini peringatan dini pada bagian gambar yang memang menentukan
 * grading, bukan tiruan persis vonis mesin — dan ambang tolaknya (12) sengaja
 * lebih ketat dari milik mesin (10).
 */
function skorKetajaman(
  source: HTMLVideoElement | HTMLImageElement,
  canvas: HTMLCanvasElement,
): number | null {
  const w0 = "videoWidth" in source ? source.videoWidth : source.naturalWidth;
  const h0 = "videoHeight" in source ? source.videoHeight : source.naturalHeight;
  if (!w0 || !h0) return null;

  // Skala tangkap yang sama dengan frameToDataUrl, lalu petak sebesar
  // SISI_UKUR piksel *terkirim* dikonversi balik ke piksel sumber.
  const skala = Math.min(1, 900 / Math.max(w0, h0));
  const sisiSumber = Math.min(w0, h0, Math.round(SISI_UKUR / skala));
  const sx = (w0 - sisiSumber) / 2;
  const sy = (h0 - sisiSumber) / 2;

  if (canvas.width !== SISI_UKUR) {
    canvas.width = SISI_UKUR;
    canvas.height = SISI_UKUR;
  }
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, sx, sy, sisiSumber, sisiSumber, 0, 0, SISI_UKUR, SISI_UKUR);
  return variansLaplacian(
    ctx.getImageData(0, 0, SISI_UKUR, SISI_UKUR).data,
    SISI_UKUR,
    SISI_UKUR,
  );
}

/**
 * Cicipi frame video tiap 700ms selama kamera hidup.
 *
 * Bukan tiap frame: satu pengukuran memakan beberapa milidetik pada ponsel
 * kelas bawah, dan tangan yang memegang ponsel tidak berubah tajam-buram
 * enam puluh kali sedetik. 700ms cukup cepat untuk terasa mengikuti gerakan
 * dan cukup jarang untuk tidak terasa di baterai.
 */
function useKetajamanKamera(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  aktif: boolean,
): number | null {
  const [skor, setSkor] = useState<number | null>(null);

  useEffect(() => {
    if (!aktif) return;
    const canvas = document.createElement("canvas");
    const ukur = () => {
      const video = videoRef.current;
      if (video) setSkor(skorKetajaman(video, canvas));
    };
    const awal = window.setTimeout(ukur, 150);
    const ulang = window.setInterval(ukur, 700);
    return () => {
      window.clearTimeout(awal);
      window.clearInterval(ulang);
    };
  }, [videoRef, aktif]);

  return skor;
}

/* ------------------------------------------------------------- Tata letak */

/**
 * Layar ini bukan halaman berisi kotak kamera; ia jendela bidik.
 *
 * Bentuk lamanya adalah kartu `aspect-[3/4]` dengan panel formulir di
 * bawahnya, dan di ponsel 375×812 jumlahnya 1.154px di dalam viewport 812px —
 * layar kamera yang bisa digulir, dengan tombol jepret kadang di bawah
 * lipatan persis saat petani sedang membidik. Sekarang tingginya dipaku ke
 * `100dvh`, isinya dipotong, dan seluruh kontrol melayang di atas gambar.
 * `data-layar="penuh"` melepas `pb-28` milik AppShell (lihat app-shell.tsx):
 * ruang itu disediakan untuk pil navigasi bawah, yang alur terfokus ini
 * memang tidak punya.
 */
const LUAR =
  "relative h-dvh w-full shrink-0 overflow-hidden lg:p-6";

/**
 * `on-viewfinder` (globals.css) memindahkan token dasar wadah ini ke nilai
 * gelapnya sekali, di akar. Itulah sebabnya seluruh markup di bawah sini masih
 * bisa menulis `text-ink`, `bg-canvas`, `bg-brand`, `bg-danger` apa adanya
 * meski latarnya video — tanpa satu pun literal warna, dan tanpa peduli tema
 * mana yang sedang dipilih petani.
 */
const BINGKAI =
  "on-viewfinder relative h-full w-full overflow-hidden bg-stone-950 " +
  "lg:mx-auto lg:max-w-[1280px] lg:rounded-xl lg:shadow-e4";

/**
 * Kontrol melayang di atas gambar, jadi ia tidak bisa memakai `Button`: bahan
 * sistem itu disetel untuk permukaan oat, dan di sini latarnya foto panen yang
 * kecerahannya tidak bisa diketahui sebelumnya. Kacanya gelap dan buram supaya
 * kontrasnya tetap sama di atas tanah, langit, maupun tomat merah.
 */
const KACA =
  "focus-ring rounded-full border border-ink/15 bg-canvas/55 text-ink backdrop-blur-md";
const KACA_TOMBOL = cx(
  KACA,
  "tap flex items-center justify-center hover:bg-canvas/75",
  "disabled:pointer-events-none disabled:opacity-40",
);

/* ------------------------------------------------------------- Pengambilan */

/** Downscale to keep data URLs inside the localStorage budget. */
function frameToDataUrl(source: HTMLVideoElement | HTMLImageElement): Capture {
  const w = "videoWidth" in source ? source.videoWidth : source.naturalWidth;
  const h = "videoHeight" in source ? source.videoHeight : source.naturalHeight;
  const scale = Math.min(1, 900 / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext("2d")!.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL("image/jpeg", 0.72), scale };
}

/**
 * Terjemahkan lingkaran panduan koin di layar menjadi kotak [x, y, w, h] pada
 * foto yang benar-benar terkirim, supaya calibration.py mencari koin di situ
 * dan bukan salah menaksir tomat bulat sebagai referensi 27 mm.
 *
 * Dua transformasi berlapis: `object-cover` memangkas video ke kotak preview
 * (jadi yang terlihat petani hanyalah potongan tengah bingkai kamera), lalu
 * frameToDataUrl menyusutkannya lagi ke maksimum 900 px.
 */
function coinRoi(
  video: HTMLVideoElement,
  stage: HTMLElement,
  coin: HTMLElement,
  scale: number,
): [number, number, number, number] | null {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const box = stage.getBoundingClientRect();
  const ring = coin.getBoundingClientRect();
  if (!vw || !vh || !box.width || !box.height) return null;

  // object-cover: video diperbesar dengan rasio terbesar lalu dipusatkan.
  const cover = Math.max(box.width / vw, box.height / vh);
  const visX = (vw - box.width / cover) / 2;
  const visY = (vh - box.height / cover) / 2;

  // Lingkaran -> koordinat bingkai kamera, dilebarkan 50% tiap sisi supaya
  // koin cukup "kira-kira di sini" dan tidak perlu pas mengisi lingkaran.
  const pad = 0.5;
  const w = (ring.width / cover) * (1 + pad * 2);
  const h = (ring.height / cover) * (1 + pad * 2);
  const x = visX + (ring.left - box.left) / cover - (ring.width / cover) * pad;
  const y = visY + (ring.top - box.top) / cover - (ring.height / cover) * pad;

  const x0 = Math.max(0, Math.round(x * scale));
  const y0 = Math.max(0, Math.round(y * scale));
  const x1 = Math.min(Math.round(vw * scale), Math.round((x + w) * scale));
  const y1 = Math.min(Math.round(vh * scale), Math.round((y + h) * scale));
  if (x1 - x0 < 24 || y1 - y0 < 24) return null;
  return [x0, y0, x1 - x0, y1 - y0];
}

/** Kerangka saat `useSearchParams` menunda render di batas Suspense. */
function MemuatPindai() {
  return (
    <main data-layar="penuh" className={LUAR}>
      <div className={BINGKAI}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[min(72vw,46dvh,340px)] animate-pulse rounded-lg border-2 border-ink/20" />
        </div>
      </div>
    </main>
  );
}

export default function PindaiPage() {
  return (
    <Suspense fallback={<MemuatPindai />}>
      <Pindai />
    </Suspense>
  );
}

function Pindai() {
  const t = useTranslations("pindai");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useSearchParams();
  const store = useStore();
  const [mode, setMode] = useState<Mode>("loading");
  const [scanning, setScanning] = useState(false);
  const [dragging, setDragging] = useState(false);
  /** Timpaan dev atas hasil ukur. Selalu null di produksi — kenopnya tidak ada. */
  const [paksaZona, setPaksaZona] = useState<Zona | null>(null);
  /**
   * Skor foto contoh mode demo, disimpan bersama sumbernya.
   *
   * Berpasangan dan bukan angka telanjang supaya skor contoh lama tidak
   * terbaca sebagai skor komoditas yang baru dipilih — dan supaya keadaan
   * "belum terukur" cukup diturunkan dari perbandingan kunci, tanpa satu pun
   * `setState` sinkron di dalam efek.
   */
  const [ukurContoh, setUkurContoh] = useState<{
    src: string;
    skor: number | null;
  } | null>(null);
  const [vetoAlert, setVetoAlert] = useState<string | null>(null);
  /**
   * Antrean sudut untuk pindai multi-foto (F-12). Kosong = pindai biasa satu
   * foto; alur itu sengaja tidak berubah supaya tetap ≤ 4 ketukan (F-10).
   */
  const [antrean, setAntrean] = useState<FotoAntrean[]>([]);
  // Komoditas menentukan config ambang batas yang dipakai engine, jadi petani
  // memilihnya sebelum memotret — bukan ditebak dari foto. `?komoditas=` datang
  // dari palet perintah (F-84); nilainya divalidasi karena URL bisa diketik
  // tangan, dan id yang tidak dikenal engine akan membuat /predict menolak.
  const [komoditas, setKomoditas] = useState(() => {
    const dariUrl = params.get("komoditas");
    return dariUrl && KOMODITAS.some((k) => k.id === dariUrl)
      ? dariUrl
      : store.lastKomoditas;
  });
  const contoh = CONTOH[keluarga(komoditas)] ?? null;
  /** Mode demo untuk komoditas yang tidak punya foto contoh: hanya unggahan. */
  const tanpaContoh = mode !== "camera" && mode !== "loading" && !contoh;
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const coinRef = useRef<HTMLDivElement>(null);

  const skorKamera = useKetajamanKamera(videoRef, mode === "camera" && !scanning);
  const skorContoh =
    ukurContoh && contoh && ukurContoh.src === contoh.src ? ukurContoh.skor : null;
  const skor = mode === "camera" ? skorKamera : skorContoh;
  /**
   * `null` berarti belum terukur, dan pil menyebutnya begitu apa adanya.
   * Sebelumnya keadaan ini diam-diam berbunyi "Tajam": klaim ketajaman yang
   * diucapkan sebelum ada satu pengukuran pun.
   */
  const zona: Zona | null = paksaZona ?? (skor === null ? null : zonaDari(skor));

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setMode("camera");
      } catch {
        // No camera / permission denied — demo mode with a sample photo.
        if (!cancelled) setMode("demo");
      }
    }

    boot();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /**
   * Ukur foto diam — contoh mode demo, atau berkas unggahan — lewat pipa yang
   * sama dengan frame kamera, supaya pilnya juga jujur di luar mode kamera.
   */
  useEffect(() => {
    if (mode !== "demo" || !contoh) return;
    const src = contoh.src;
    let batal = false;
    const img = new window.Image();
    img.onload = () => {
      if (batal) return;
      setUkurContoh({ src, skor: skorKetajaman(img, document.createElement("canvas")) });
    };
    img.src = src;
    return () => {
      batal = true;
    };
  }, [mode, contoh]);

  /** Kirim antrean ke layar hasil. Satu foto maupun lima lewat jalur ini. */
  function nilai(fotos: FotoAntrean[]) {
    if (fotos.length === 0) return;
    if (zona === "reject") {
      // Kalimat, bukan kode galat. Yang perlu diketahui petani adalah apa yang
      // harus ia lakukan berbeda — bukan bahwa varians Laplacian fotonya
      // bernilai di bawah 12.
      setVetoAlert(t("veto_blur"));
      return;
    }
    setVetoAlert(null);
    store.setLastCaptures(fotos, komoditas);
    setScanning(true);
    setTimeout(() => router.push("/petani/hasil"), 1400);
  }

  /**
   * Satu bidikan dari sumber yang sedang aktif, lengkap dengan ROI koinnya
   * sendiri — tiap sudut punya letak koin yang berbeda (F-12).
   */
  function ambilDariSumber(): Promise<FotoAntrean | null> {
    const video = videoRef.current;
    if (mode === "camera" && video) {
      const shot = frameToDataUrl(video);
      const roi =
        stageRef.current && coinRef.current
          ? coinRoi(video, stageRef.current, coinRef.current, shot.scale)
          : null;
      return Promise.resolve({ dataUrl: shot.dataUrl, roi });
    }

    // Mode demo: foto contoh dibaca ulang dari berkasnya lalu melewati jalur
    // yang sama persis dengan bidikan kamera, jadi yang sampai ke /predict
    // adalah gambar sungguhan. Tanpa koin di dalam bingkai kalibrasi gagal dan
    // ukuran tidak terukur — layar hasil sudah menyatakan itu apa adanya.
    if (!contoh) return Promise.resolve(null);
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ dataUrl: frameToDataUrl(img).dataUrl, roi: null });
      img.onerror = () => resolve(null);
      img.src = contoh.src;
    });
  }

  /**
   * @param langsung true = tangkap lalu langsung nilai (jalur pindai biasa,
   * tetap ≤ 4 ketukan dari dashboard); false = masukkan ke antrean sudut.
   */
  async function tangkap(langsung: boolean) {
    if (scanning) return;
    if (!langsung && antrean.length >= MAX_FOTO) return;
    const foto = await ambilDariSumber();
    if (!foto) return;
    if (langsung) nilai([...antrean, foto]);
    else setAntrean((a) => [...a, foto]);
  }

  function pakaiFile(file: File | undefined) {
    if (!file || scanning) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      // Berkas unggahan lewat gerbang yang sama dengan frame kamera, tapi
      // skornya tidak dipasang ke pil: pil menerangkan apa yang sedang
      // *terlihat* di jendela bidik, dan yang terlihat masih kamera atau foto
      // contoh, bukan berkas ini. Cukup jadi keputusan lokal — menyerahkan
      // foto buram ke mesin hanya untuk ditolak di layar berikutnya adalah
      // perjalanan sia-sia yang dibayar petani dengan kuotanya.
      const skorBerkas = skorKetajaman(img, document.createElement("canvas"));
      if (skorBerkas !== null && zonaDari(skorBerkas) === "reject") {
        URL.revokeObjectURL(url);
        setVetoAlert(t("veto_blur"));
        return;
      }
      // Foto galeri tidak punya lingkaran panduan; engine cari koin se-foto.
      const foto: FotoAntrean = { dataUrl: frameToDataUrl(img).dataUrl, roi: null };
      URL.revokeObjectURL(url);
      // Antrean kosong berarti petani memang hanya mengunggah satu foto;
      // menahannya di antrean cuma menambah satu ketukan tanpa alasan.
      if (antrean.length === 0) nilai([foto]);
      else if (antrean.length < MAX_FOTO) setAntrean((a) => [...a, foto]);
    };
    img.src = url;
  }

  /**
   * Rana memegang satu aksi utama, dan aksi itu berpindah mengikuti keadaan
   * alih-alih memunculkan tombol kedua: komoditas tanpa foto contoh mengubahnya
   * jadi pemilih berkas, antrean berisi mengubahnya jadi "nilai semuanya".
   * Slot tengah tidak pernah kosong dan tidak pernah berisi dua hal.
   */
  function tekanRana() {
    if (tanpaContoh) {
      fileRef.current?.click();
      return;
    }
    if (antrean.length > 0) nilai(antrean);
    else void tangkap(true);
  }

  const labelRana = scanning
    ? t("btn_scanning")
    : tanpaContoh
      ? t("upload_photo")
      : antrean.length > 0
      ? t("btn_grade_batch", { count: antrean.length })
      : mode === "camera"
        ? t("btn_capture")
        : t("btn_scan_sample");

  // Satu baris petunjuk untuk seluruh layar. Dulu kalimat panduan tersebar di
  // tiga tempat sekaligus — pil jarak di atas, toast status tepat di tengah
  // retikel (menutupi hal yang harus dilihat petani), dan hint di panel — jadi
  // tidak ada satu tempat pun yang bisa dipercaya sebagai sumber keadaan.
  const petunjuk = scanning
    ? t("status_scanning")
    : dragging
      ? t("status_drop")
      : tanpaContoh
        ? t("status_no_sample", { komoditas: labelKomoditas(komoditas) })
        : antrean.length > 0
          ? t("hint_grade_queue", { count: antrean.length })
          : `${t("status_aim")} · ${t("keep_distance")}`;

  return (
    <main data-layar="penuh" className={LUAR}>
      <div
        ref={stageRef}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pakaiFile(e.dataTransfer.files?.[0]);
        }}
        className={cx(
          BINGKAI,
          dragging && "outline-2 -outline-offset-4 outline-dashed outline-brand",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          className={cx(
            "absolute inset-0 size-full object-cover",
            mode !== "camera" && "hidden",
          )}
        />
        {mode !== "camera" && contoh && (
          <Image
            src={contoh.src}
            alt={contoh.alt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        )}

        {/* Kerudung tipis. Kaca gelap saja tidak cukup: kontrol harus tetap
            terbaca di atas langit siang maupun terpal biru. */}
        <span aria-hidden className="absolute inset-0 bg-canvas/20" />

        <div className="absolute inset-0 flex flex-col">
          {/* --------------------------------------------------- Bilah atas */}
          <div className="flex shrink-0 items-start gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            {/* Alur terfokus tanpa tab bar, jadi tombol inilah satu-satunya
                jalan keluar (F-82). Bulat dan melayang, bukan bilah penuh:
                bilah selebar layar memakan 57px dari tinggi yang seluruhnya
                milik gambar. */}
            <Link
              href="/petani"
              aria-label={tc("back_label")}
              className={cx(KACA_TOMBOL, "size-11 shrink-0")}
            >
              <ArrowLeft aria-hidden className="size-5" />
            </Link>

            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              {/*
                `<select>` bawaan, bukan `Select` sistem desain: yang dibutuhkan
                di sini adalah keping selebar dua kata di atas kaca, sementara
                `Select` adalah `Field` bertinggi 48px dengan label dan hint —
                bentuk formulir, hal yang justru dibuang dari layar ini. Roda
                pemilih milik sistem operasi juga target sentuh terbaik yang
                bisa didapat tangan berlumpur, dan gratis.
              */}
              <div className="relative w-full max-w-[13rem]">
                <select
                  aria-label={t("select_label")}
                  value={komoditas}
                  onChange={(e) => setKomoditas(e.target.value)}
                  disabled={scanning}
                  className={cx(
                    KACA,
                    "tap type-body-md h-11 w-full appearance-none truncate pe-9 ps-4 font-bold",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  {KELOMPOK.map(({ nama, items }) => (
                    <optgroup key={nama} label={nama}>
                      {items.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink/70"
                />
              </div>

              {mode === "demo" && (
                <span className="type-body-sm rounded-full bg-canvas/60 px-2.5 py-1 text-center font-medium text-muted backdrop-blur-md">
                  {t("mode_demo_badge")}
                </span>
              )}
            </div>

            {/* Titik status ketajaman. Warnanya memakai token grade — hijau,
                kuning, merah adalah kosakata yang sama yang dipakai layar ini
                untuk mutu panen, jadi tidak ada palet kedua yang harus
                dipelajari mata.

                Angkanya nyata: `zona` datang dari varians Laplacian frame yang
                sedang terlihat, diukur tiap 700ms. Pil ini sempat hanya
                membaca state lokal yang cuma bisa digerakkan sakelar dev, jadi
                di produksi ia permanen berbunyi "Tajam" — klaim ketajaman yang
                diucapkan sebelum ada satu pengukuran pun. */}
            <span
              aria-live="polite"
              className={cx(
                KACA,
                "type-body-md flex h-11 shrink-0 items-center gap-2 px-3.5 font-bold",
              )}
            >
              <span
                className={cx(
                  "size-2.5 shrink-0 rounded-full transition-colors duration-300",
                  zona === "normal"
                    ? "bg-grade-a"
                    : zona === "warn"
                      ? "bg-grade-b"
                      : zona === "reject"
                        ? "bg-danger"
                        : "bg-muted",
                )}
              />
              {zona === "normal"
                ? t("blur_normal")
                : zona === "warn"
                  ? t("blur_warn")
                  : zona === "reject"
                    ? t("blur_reject")
                    : t("blur_measuring")}
              {GERBANG_BLUR_DAPAT_DIATUR && skor !== null && (
                <span className="type-body-sm font-normal text-muted">
                  {Math.round(skor)}
                </span>
              )}
            </span>
          </div>

          {vetoAlert && (
            <div
              role="alert"
              className="type-body-md absolute inset-x-3 top-20 z-30 mx-auto max-w-md rounded-md bg-danger px-4 py-2.5 text-center font-bold text-canvas shadow-e4"
            >
              {vetoAlert}
            </div>
          )}

          {/* Penimpa zona — bangku uji, bukan kontrol produk.

              Bukan lagi satu-satunya sumber kebenaran seperti dulu: zona
              sekarang datang dari pengukuran, dan tombol-tombol ini hanya
              memaksanya ke satu nilai supaya jalur veto bisa diuji tanpa
              harus menggoyangkan kamera. "Auto" mengembalikannya ke hasil ukur.
              Seluruh cabang ini lenyap dari bundel produksi lewat dead-code
              elimination, bukan disembunyikan CSS. */}
          {GERBANG_BLUR_DAPAT_DIATUR && (
            <div className="absolute start-3 top-36 z-20 flex flex-col gap-1.5 rounded-md border border-dashed border-ink/25 bg-canvas/75 p-2 backdrop-blur-md">
              <span className="type-body-sm font-bold text-muted">
                {t("blur_gate_title")} · dev
              </span>
              <div className="flex gap-1">
                {(
                  [
                    [null, "Auto"],
                    ["normal", t("blur_btn_normal")],
                    ["warn", t("blur_btn_warn")],
                    ["reject", t("blur_btn_reject")],
                  ] as const
                ).map(([nilaiZona, label]) => (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={paksaZona === nilaiZona}
                    onClick={() => setPaksaZona(nilaiZona)}
                    className={cx(
                      "tap focus-ring type-body-sm min-h-8 rounded-sm border px-2 font-bold",
                      paksaZona === nilaiZona
                        ? "border-brand bg-brand text-canvas"
                        : "border-ink/20 text-muted hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------- Retikel + dek bawah

              Dipusatkan oleh flex, bukan oleh `top-1/2`: retikel harus berada
              di tengah ruang yang *tersisa* setelah bilah atas dan dek, bukan
              di tengah layar — kalau tidak ia melorot ke balik dek pada layar
              pendek. Di lanskap sumbu yang sama membalik dan dek pindah ke
              tepi kanan (F-80), tanpa tata letak kedua. */}
          <div className="flex min-h-0 flex-1 flex-col ponsel-lanskap:flex-row">
            <div className="flex min-h-0 flex-1 items-center justify-center p-4">
              <div className="relative aspect-square w-[min(72vw,46dvh,340px)] rounded-lg ponsel-lanskap:w-[min(46vw,60dvh,300px)]">
                {(
                  [
                    "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                    "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                    "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                    "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                  ] as const
                ).map((pos) => (
                  <span
                    key={pos}
                    aria-hidden
                    /* Bayangan jatuh, bukan sekadar warna: sudut hijau pucat di
                       atas tomat matang praktis lenyap, dan retikel yang tidak
                       terlihat sama saja dengan tidak ada. */
                    className={cx(
                      "absolute size-11 border-brand drop-shadow-[0_1px_3px_rgb(0_0_0/0.55)]",
                      pos,
                    )}
                  />
                ))}

                {/* Koin duduk di luar retikel — di posisi kiri bawah di luar bingkai,
                    sehingga area bingkai hijau bersih untuk tumpukan panen. */}
                <div className="absolute -bottom-16 start-0 flex items-center gap-2">
                  <div
                    ref={coinRef}
                    className="size-14 rounded-full border-2 border-dashed border-ink/70 bg-canvas/25"
                  />
                  <span className="type-body-sm rounded-full bg-canvas/70 px-2 py-0.5 font-bold whitespace-nowrap text-ink backdrop-blur-sm">
                    {t("coin_badge")}
                  </span>
                </div>

                {scanning && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-transparent via-brand/45 to-transparent"
                      style={{ animation: "pantas-sweep 1.1s ease-in-out infinite" }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 bg-linear-to-t from-canvas via-canvas/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-10 ponsel-lanskap:w-[184px] ponsel-lanskap:bg-linear-to-l ponsel-lanskap:px-3 ponsel-lanskap:py-3 ponsel-lanskap:ps-10">
              {/* Strip antrean hanya lahir kalau ada antrean: kotak "0/5" yang
                  selalu tampak adalah ruang yang dibayar terus untuk keadaan
                  yang jarang. */}
              {antrean.length > 0 && (
                <ul className="scroll-x mb-3 flex justify-center gap-2 ponsel-lanskap:justify-start">
                  {antrean.map((f, i) => (
                    <li
                      key={`${i}-${f.dataUrl.slice(-16)}`}
                      className="relative shrink-0"
                    >
                      <img
                        src={f.dataUrl}
                        alt={t("queue_angle_alt", { index: i + 1 })}
                        className="size-14 rounded-md border border-ink/20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAntrean((a) => a.filter((_, j) => j !== i))
                        }
                        disabled={scanning}
                        aria-label={t("queue_remove", { index: i + 1 })}
                        className="tap focus-ring absolute -end-2 -top-2 flex size-6 items-center justify-center rounded-full bg-danger text-canvas"
                      >
                        <X aria-hidden className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p
                role="status"
                className="type-body-md mx-auto max-w-md pb-3 text-center font-medium text-balance text-ink"
              >
                {petunjuk}
              </p>

              <div className="flex items-center justify-center gap-6 ponsel-lanskap:flex-col ponsel-lanskap:gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => pakaiFile(e.target.files?.[0])}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={scanning}
                  aria-label={t("upload_photo")}
                  title={t("upload_photo")}
                  className={cx(KACA_TOMBOL, "size-13 shrink-0")}
                >
                  <ImageIcon aria-hidden className="size-5" />
                </button>

                <button
                  type="button"
                  onClick={tekanRana}
                  disabled={scanning || mode === "loading"}
                  aria-label={labelRana}
                  title={labelRana}
                  className="group tap focus-ring flex size-19 shrink-0 items-center justify-center rounded-full border-[3px] border-ink/85 p-1 disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="flex size-full items-center justify-center rounded-full bg-brand text-canvas transition-transform duration-150 group-active:scale-90">
                    {scanning ? (
                      <span
                        aria-hidden
                        className="size-6 animate-spin rounded-full border-[3px] border-canvas/30 border-t-canvas"
                      />
                    ) : tanpaContoh ? (
                      <Upload aria-hidden className="size-6" />
                    ) : antrean.length > 0 ? (
                      <span className="type-heading-md">{antrean.length}</span>
                    ) : null}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => void tangkap(false)}
                  disabled={
                    scanning ||
                    mode === "loading" ||
                    tanpaContoh ||
                    antrean.length >= MAX_FOTO
                  }
                  aria-label={
                    antrean.length >= MAX_FOTO
                      ? t("btn_add_angle_full", { max: MAX_FOTO })
                      : antrean.length === 0
                        ? t("btn_add_angle_empty")
                        : t("btn_add_angle", {
                            count: antrean.length,
                            max: MAX_FOTO,
                          })
                  }
                  title={t("btn_add_angle_empty")}
                  className={cx(KACA_TOMBOL, "relative size-13 shrink-0")}
                >
                  <Layers aria-hidden className="size-5" />
                  {antrean.length > 0 && (
                    <span className="type-body-sm absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand font-bold text-canvas">
                      {antrean.length}
                    </span>
                  )}
                </button>
              </div>

              <p className="type-body-sm hidden pt-3 text-center text-muted lg:block">
                {t("upload_hint")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
