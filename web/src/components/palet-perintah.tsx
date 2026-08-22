"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Command, Search } from "lucide-react";
import { Dialog, Portal, cx, useModalBehaviour } from "@/components/ui";
import { useStore } from "@/lib/store";
import { applyTheme, getTheme } from "@/lib/theme";
import {
  LABEL_KELOMPOK,
  RUTE_PESANAN,
  bangunPerintah,
  kelompokkan,
  saringPerintah,
  type Perintah,
} from "@/lib/palet-perintah";
import { BERANDA } from "./nav-config";

import { useTranslations } from "@/lib/i18n";

/** Urutan siklus tombol tema, sama dengan urutan pil pada `ThemeToggle`. */
const SIKLUS_TEMA = ["light", "dark", "system"] as const;

const PINTASAN_KEYS: { tombol: string; key: "sc_palette" | "sc_home" | "sc_orders" | "sc_search" | "sc_help" | "sc_esc" }[] = [
  { tombol: "Ctrl / ⌘ + K", key: "sc_palette" },
  { tombol: "G lalu D", key: "sc_home" },
  { tombol: "G lalu P", key: "sc_orders" },
  { tombol: "/", key: "sc_search" },
  { tombol: "?", key: "sc_help" },
  { tombol: "Esc", key: "sc_esc" },
];

/**
 * Pintasan global tidak boleh merebut ketikan. Tanpa penjaga ini, mengetik
 * "grade" di kotak pencarian katalog akan melompat ke beranda pada huruf "g".
 */
function sedangMengetik(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

/** Kotak pencarian pertama pada halaman aktif, target pintasan `/`. */
function kotakPencarian(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>('input[type="search"]');
}

/* ------------------------------------------------------------------- Dialog */

function DaftarPintasan({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations("command_palette");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("shortcut_title")}
      description={t("shortcut_desc")}
      size="sm"
    >
      <dl className="flex flex-col gap-2">
        {PINTASAN_KEYS.map(({ tombol, key }) => (
          <div key={tombol} className="flex items-center justify-between gap-4">
            <dt className="type-body-md text-ink">{t(key)}</dt>
            <dd>
              <kbd className="type-body-sm rounded-md border border-line bg-sunken px-2 py-1 font-bold text-muted">
                {tombol}
              </kbd>
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}

/* ------------------------------------------------------------------- Palet */

/**
 * Palet perintah (F-84) sekaligus pemasang pintasan keyboard desktop (F-81).
 *
 * Dipasang sekali di `AppShell`, jadi setiap layar peran mendapat keduanya
 * tanpa mendaftarkan listener sendiri — dua listener `keydown` global yang
 * saling menimpa adalah cara termudah membuat Esc berhenti bekerja.
 */
export function PaletPerintah() {
  const router = useRouter();
  const store = useStore();
  const t = useTranslations("command_palette");
  const role = store.sesi?.role ?? null;

  const [open, setOpen] = useState(false);
  const [bantuan, setBantuan] = useState(false);
  const [kueri, setKueri] = useState("");
  const [aktif, setAktif] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();

  const tutup = useCallback(() => setOpen(false), []);
  // Kueri dibersihkan saat dibuka, bukan saat ditutup: palet yang masih memuat
  // ketikan sesi lalu membuka daftar yang sudah tersaring tanpa diminta.
  const buka = useCallback(() => {
    setKueri("");
    setOpen(true);
  }, []);
  useModalBehaviour(open, tutup, panelRef);

  const perintah = useMemo(() => {
    if (!role) return [];
    return bangunPerintah({
      role,
      listings: store.myListings.map((l) => ({
        id: l.id,
        nama: l.nama,
        grade: l.grade,
        harga_per_kg: l.harga_per_kg,
      })),
      pesanan: store.orders.map((o) => ({
        id: o.id,
        kode: o.kode,
        nama: o.nama,
        status: o.status,
      })),
    });
  }, [role, store.myListings, store.orders]);

  const hasil = useMemo(() => saringPerintah(perintah, kueri), [perintah, kueri]);
  const grup = useMemo(() => kelompokkan(hasil), [hasil]);
  // Daftar rata dipakai untuk navigasi panah: nomor barisnya harus mengikuti
  // urutan render setelah pengelompokan, bukan urutan peringkat mentah.
  const rata = useMemo(() => grup.flatMap((g) => g.items), [grup]);

  const jalankan = useCallback(
    (p: Perintah) => {
      setOpen(false);
      if (p.href) {
        router.push(p.href);
        return;
      }
      switch (p.aksi) {
        case "pindai":
          router.push("/petani/pindai");
          break;
        case "tema": {
          const sekarang = getTheme();
          const i = SIKLUS_TEMA.indexOf(sekarang);
          applyTheme(SIKLUS_TEMA[(i + 1) % SIKLUS_TEMA.length]);
          break;
        }
        case "pintasan":
          setBantuan(true);
          break;
        case "keluar":
          store.logout();
          router.push("/");
          break;
      }
    },
    [router, store],
  );

  // Kueri baru berarti daftar baru; tanpa reset, sorotan bisa tertinggal di
  // baris yang sudah tidak ada dan Enter menjalankan perintah yang salah.
  // Disetel saat render, bukan di dalam efek: reset lewat efek merender sekali
  // dengan sorotan yang salah sebelum memperbaikinya.
  const [kueriTersorot, setKueriTersorot] = useState(kueri);
  if (kueriTersorot !== kueri) {
    setKueriTersorot(kueri);
    setAktif(0);
  }

  /* Pintasan global (F-81) */
  useEffect(() => {
    if (!role) return;
    // Disalin ke variabel lokal: penyempitan tipe di atas tidak ikut masuk ke
    // dalam handler, dan `role` di sana kembali bisa null bagi TypeScript.
    const peran = role;

    let menungguG = false;
    let batalG: ReturnType<typeof setTimeout> | undefined;

    function urungkanG() {
      menungguG = false;
      if (batalG) clearTimeout(batalG);
    }

    function onKeyDown(e: KeyboardEvent) {
      const modK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k";
      if (modK) {
        e.preventDefault();
        urungkanG();
        if (open) tutup();
        else buka();
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (sedangMengetik(e.target)) return;
      // Palet punya penanganan tombolnya sendiri; membiarkan pintasan urutan-G
      // ikut hidup di sana membuat mengetik "d" melompat keluar dari palet.
      if (open) return;

      if (menungguG) {
        const tujuan =
          e.key.toLowerCase() === "d"
            ? BERANDA[peran]
            : e.key.toLowerCase() === "p"
              ? RUTE_PESANAN[peran]
              : null;
        urungkanG();
        if (tujuan) {
          e.preventDefault();
          router.push(tujuan);
        }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        menungguG = true;
        // Urutan dua tombol hanya berlaku sebentar: menahannya selamanya
        // membuat "g" yang tidak sengaja ditekan menelan huruf berikutnya.
        batalG = setTimeout(urungkanG, 1200);
        return;
      }

      if (e.key === "/") {
        const kotak = kotakPencarian();
        if (kotak) {
          e.preventDefault();
          kotak.focus();
          kotak.select();
        } else {
          // Layar tanpa pencarian sendiri tetap punya jawaban untuk "/":
          // paletnya adalah pencarian yang berlaku di semua layar.
          e.preventDefault();
          buka();
        }
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setBantuan(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      urungkanG();
    };
    // `open` dibaca di dalam handler (Ctrl+K menutup, urutan-G dimatikan saat
    // palet terbuka), jadi ia harus ada di sini. Tanpa itu handler menyimpan
    // `open` dari render pertama dan Ctrl+K tidak pernah menutup apa pun.
  }, [role, open, router, buka, tutup]);

  // Listener event kustom dari `TombolPalet`
  useEffect(() => {
    function onBukaEvent() {
      buka();
    }
    window.addEventListener("pantas:palet", onBukaEvent);
    return () => window.removeEventListener("pantas:palet", onBukaEvent);
  }, [buka]);

  // Fokuskan input saat palet terbuka
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  // Gulir otomatis item tersorot ke dalam tampilan
  useEffect(() => {
    if (!open || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(
      `[data-indeks="${aktif}"]`,
    );
    item?.scrollIntoView({ block: "nearest" });
  }, [open, aktif]);

  function onKeyDownPalet(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAktif((i) => (i + 1 < rata.length ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAktif((i) => (i - 1 >= 0 ? i - 1 : rata.length - 1));
    } else if (e.key === "Enter" && rata[aktif]) {
      e.preventDefault();
      jalankan(rata[aktif]);
    }
  }

  function getGroupLabel(kelompok: string): string {
    const key = `grp_${kelompok}` as Parameters<typeof t>[0];
    try {
      return t(key);
    } catch {
      return LABEL_KELOMPOK[kelompok as keyof typeof LABEL_KELOMPOK] ?? kelompok;
    }
  }

  if (!role) return null;

  return (
    <>
      <DaftarPintasan open={bantuan} onClose={() => setBantuan(false)} />

      {open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-6 sm:pt-[12vh]">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
              onClick={tutup}
              aria-hidden
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("palette_aria")}
              className="rise relative flex max-h-[85dvh] w-full max-w-xl flex-col overflow-hidden rounded-none glass-overlay backdrop-blur-xl backdrop-saturate-150 sm:rounded-xl"
              onKeyDown={onKeyDownPalet}
            >
              <div className="flex items-center gap-2 border-b border-line px-4">
                <Search aria-hidden className="size-4 shrink-0 text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded
                  aria-controls={`${id}-daftar`}
                  aria-activedescendant={
                    rata[aktif] ? `${id}-opsi-${aktif}` : undefined
                  }
                  aria-label={t("search_aria")}
                  autoComplete="off"
                  value={kueri}
                  onChange={(e) => setKueri(e.target.value)}
                  placeholder={t("search_placeholder")}
                  className="type-body-md min-h-12 flex-1 bg-transparent text-ink outline-none placeholder:text-label"
                />
                <kbd className="type-body-sm hidden rounded border border-line bg-sunken px-1.5 py-0.5 font-bold text-muted sm:block">
                  Esc
                </kbd>
              </div>

              {rata.length === 0 ? (
                <p className="type-body-md px-4 py-8 text-center text-muted">
                  {t("no_results", { query: kueri })}
                </p>
              ) : (
                <ul
                  ref={listRef}
                  id={`${id}-daftar`}
                  role="listbox"
                  aria-label={t("results_label")}
                  className="min-h-0 flex-1 overflow-y-auto py-2"
                >
                  {grup.map((g) => (
                    <li key={g.kelompok}>
                      <p
                        className="type-body-sm px-4 pb-1 pt-2 font-bold uppercase tracking-wide text-label"
                        aria-hidden
                      >
                        {getGroupLabel(g.kelompok)}
                      </p>
                      <ul role="group" aria-label={getGroupLabel(g.kelompok)}>
                        {g.items.map((p) => {
                          const indeks = rata.indexOf(p);
                          const terpilih = indeks === aktif;
                          return (
                            <li key={p.id}>
                              <button
                                type="button"
                                id={`${id}-opsi-${indeks}`}
                                data-indeks={indeks}
                                role="option"
                                aria-selected={terpilih}
                                // Sorotan mengikuti tetikus juga: kalau tidak,
                                // mengeklik baris lain menjalankan baris yang
                                // sedang tersorot papan ketik.
                                onMouseMove={() => setAktif(indeks)}
                                onClick={() => jalankan(p)}
                                className={cx(
                                  "tap flex w-full items-center gap-3 px-4 py-2.5 text-start",
                                  terpilih
                                    ? "bg-brand-tint text-brand-deep"
                                    : "text-ink hover:bg-sunken",
                                )}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="type-body-md block truncate font-bold">
                                    {p.label}
                                  </span>
                                  {p.keterangan && (
                                    <span className="type-body-sm block truncate text-muted">
                                      {p.keterangan}
                                    </span>
                                  )}
                                </span>
                                {terpilih && (
                                  <ArrowRight aria-hidden className="size-4 shrink-0" />
                                )}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}

              <p className="type-body-sm border-t border-line px-4 py-2 text-label">
                {t("footer_help")}
              </p>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
}

/**
 * Tombol pembuka palet untuk pengguna yang tidak tahu Ctrl+K ada.
 *
 * Ia mengirim event alih-alih memakai state bersama: `AppShell` memasang palet
 * satu kali, dan tombol ini bisa ditaruh di sidebar mana pun tanpa menyeret
 * context baru melintasi pohon.
 */
export function TombolPalet({
  tone = "surface",
  className,
}: {
  /**
   * `field` untuk sidebar, yang sekarang ladang hijau. Tanpa ini tombolnya
   * membawa `bg-sunken` oat-nya sendiri — satu keping krem di tengah hijau.
   */
  tone?: "surface" | "field";
  className?: string;
}) {
  const { sesi } = useStore();
  const t = useTranslations("command_palette");
  // Tanpa sesi tidak ada peran, dan tanpa peran palet tidak punya isi —
  // tombol yang membuka kotak kosong lebih buruk daripada tidak ada tombol.
  if (!sesi) return null;

  const diLadang = tone === "field";

  return (
    <button
      type="button"
      data-tour="palet"
      onClick={() => window.dispatchEvent(new Event("pantas:palet"))}
      className={cx(
        "tap focus-ring flex items-center gap-2 rounded-md border px-2 py-2",
        diLadang
          ? "border-field-line bg-field-hover text-field-muted hover:text-field-ink"
          : "border-line bg-sunken text-muted hover:text-ink",
        className,
      )}
    >
      <Search aria-hidden className="size-4 shrink-0" />
      <span
        className={cx(
          "type-body-sm hidden flex-1 text-start",
          !diLadang && "lg:block",
        )}
      >
        {t("btn_label")}
      </span>
      <kbd
        className={cx(
          "type-body-sm hidden items-center gap-0.5 rounded border px-1.5 py-0.5 font-bold",
          !diLadang && "lg:flex",
          diLadang
            ? "border-field-line text-field-muted"
            : "border-line bg-surface",
        )}
      >
        <Command aria-hidden className="size-3" />K
      </kbd>
      <span className="sr-only">{t("sc_palette")} (Ctrl atau Command + K)</span>
    </button>
  );
}
