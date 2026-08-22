"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatAngka, num } from "@/lib/format";
import { keTitik, titikTengah, type Titik } from "@/lib/jarak";
import type { Listing } from "@/lib/types";

/**
 * Bingkai terakhir bila tidak ada satu pun koordinat: seluruh Pulau Jawa.
 *
 * Ia sengaja terlalu lebar untuk disalahartikan sebagai sebuah posisi. Versi
 * sebelumnya memakai [-6.8118, 107.6175] — yang bukan angka netral sama sekali,
 * melainkan koordinat persis milik salah satu petani seed lama di Lembang.
 * Peta memusat di sana lalu menancapkan pin biru "Lokasi Anda" di atasnya, jadi
 * tiap pembeli yang menolak izin lokasi diberi tahu bahwa ia sedang berdiri di
 * kebun orang lain di Bandung Barat.
 */
const BINGKAI_JAWA: [number, number] = [-7.3, 110.0];
const ZOOM_BINGKAI = 7;

/** Pil harga, sesuai peta di Figma. Warnanya ikut tema lewat variabel CSS. */
function ikonHarga(harga: number, aktif: boolean) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:inline-block;white-space:nowrap;
      background:var(${aktif ? "--color-brand-dark" : "--color-brand-deep"});
      color:var(--color-on-brand);font-weight:700;font-size:11px;
      padding:4px 8px;border-radius:6px;
      box-shadow:0 2px 6px rgb(0 0 0 / .3);
      ${aktif ? "outline:2px solid var(--color-canvas);" : ""}
      transform:translate(-50%,-140%);
    ">Rp ${formatAngka(harga)}</span>`,
    iconSize: [0, 0],
  });
}

/** Gugus: satu lingkaran dengan jumlah lot yang berdempet di bawahnya. */
function ikonGugus(jumlah: number) {
  return L.divIcon({
    className: "",
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:40px;height:40px;border-radius:50%;
      background:var(--color-brand-deep);color:var(--color-on-brand);
      font-weight:800;font-size:13px;
      border:3px solid var(--color-canvas);
      box-shadow:0 2px 8px rgb(0 0 0 / .35);
      transform:translate(-50%,-50%);
    ">${jumlah}</span>`,
    iconSize: [0, 0],
  });
}

const ikonSaya = L.divIcon({
  className: "",
  html: `<span style="
    display:block;width:14px;height:14px;border-radius:50%;
    background:#2563eb;border:2.5px solid #fff;
    box-shadow:0 0 0 4px rgb(37 99 235 / .25);
    transform:translate(-50%,-50%);
  "></span>`,
  iconSize: [0, 0],
});

interface Titikan {
  listing: Listing;
  titik: Titik;
}

/**
 * Jaga agar seluruh penanda terlihat tanpa mengunci zoom.
 *
 * Posisi pembeli hanya ikut membentuk bingkai kalau ia benar-benar diketahui.
 * Dulu ia selalu ikut, dan karena nilai bawaannya Bandung, satu lot Sleman
 * memaksa peta melebar sampai memuat separuh Pulau Jawa.
 */
function AturBingkai({ titikan, saya }: { titikan: Titikan[]; saya: Titik | null }) {
  const map = useMap();
  useEffect(() => {
    const titik = titikan.map((t) => t.titik);
    if (saya) titik.push(saya);
    if (titik.length === 0) {
      map.setView(BINGKAI_JAWA, ZOOM_BINGKAI);
      return;
    }
    if (titik.length === 1) {
      map.setView([titik[0].lat, titik[0].lng], 12);
      return;
    }
    map.fitBounds(
      L.latLngBounds(titik.map((t) => [t.lat, t.lng] as [number, number])),
      { padding: [40, 40], maxZoom: 13 },
    );
  }, [map, titikan, saya]);
  return null;
}

/**
 * Lebar satu sel pengelompokan, dalam piksel layar.
 *
 * Kira-kira selebar satu pil harga. Dua pil yang pusatnya lebih dekat dari ini
 * pasti bertindihan, dan pil yang tertimpa tidak bisa diketuk sama sekali.
 */
const SEL_PX = 80;

/**
 * Penanda lot, dikelompokkan menurut jarak di layar — bukan menurut jarak di
 * bumi.
 *
 * Peta ini menancapkan satu pil harga per lot. Di Sleman dan Bantul kebun-kebun
 * itu berjarak ratusan meter, jadi pada zoom awal belasan pil menumpuk jadi satu
 * gumpalan: yang di bawah tidak terbaca dan tidak bisa disentuh, dan pembeli
 * tidak punya cara mengetahui bahwa di balik satu pil ada tujuh lot lain.
 *
 * Pengelompokan dihitung ulang setiap kali peta di-zoom atau digeser, karena
 * yang menentukan tumpang tindih adalah proyeksi layar saat itu — dua titik yang
 * menyatu pada zoom 11 terpisah sendiri begitu pembeli memperbesar.
 */
function PenandaLot({
  titikan,
  selectedId,
  onSelect,
  labelTanpaJarak,
  labelGugusAria,
  labelGugusTooltip,
}: {
  titikan: Titikan[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  labelTanpaJarak: string;
  labelGugusAria: (jumlah: number) => string;
  labelGugusTooltip: (jumlah: number, harga: number) => string;
}) {
  const map = useMap();

  /**
   * Posisi tiap lot dalam piksel, dihitung ulang setiap kali zoom berubah.
   *
   * Hanya `zoomend`, bukan `moveend`: menggeser peta memindahkan semua titik
   * sejauh yang sama, jadi jarak antar-titik — satu-satunya hal yang dipakai
   * pengelompokan — tidak berubah. Memperbesar mengubahnya.
   */
  const [titikLayar, setTitikLayar] = useState<Record<string, { x: number; y: number }>>({});

  useEffect(() => {
    const hitung = () => {
      const peta: Record<string, { x: number; y: number }> = {};
      for (const t of titikan) {
        const p = map.latLngToLayerPoint([t.titik.lat, t.titik.lng]);
        peta[t.listing.id] = { x: p.x, y: p.y };
      }
      setTitikLayar(peta);
    };
    hitung();
    map.on("zoomend", hitung);
    return () => {
      map.off("zoomend", hitung);
    };
  }, [map, titikan]);

  const gugus = useMemo(() => {
    // Pengelompokan menurut jarak ke pusat gugus, bukan menurut kotak grid.
    // Grid lebih murah, tapi dua titik yang hanya terpisah beberapa piksel bisa
    // jatuh di dua kotak bersebelahan — dan dua lingkaran gugus yang lahir dari
    // kotak bersebelahan itu justru saling menimpa, persis masalah yang mau
    // diberesi. Di sini titik masuk ke gugus pertama yang pusatnya masih dalam
    // jangkauan, dan pusat itu ikut bergeser setiap ada anggota baru.
    const kumpulan: { x: number; y: number; anggota: Titikan[] }[] = [];

    for (const t of titikan) {
      const p = titikLayar[t.listing.id];
      // Sebelum pengukuran pertama selesai, lot itu berdiri sendiri — lebih
      // baik satu bingkai berisi pil terpisah daripada satu bingkai kosong.
      if (!p) {
        kumpulan.push({ x: NaN, y: NaN, anggota: [t] });
        continue;
      }

      // Lot yang sedang disorot selalu berdiri sendiri: ia yang baru saja
      // di-`flyTo` dan disorot di daftar, jadi menyembunyikannya di dalam
      // gumpalan akan membuat peta tampak tidak menanggapi ketukan tadi.
      if (t.listing.id === selectedId) {
        kumpulan.push({ x: p.x, y: p.y, anggota: [t] });
        continue;
      }

      const dekat = kumpulan.find(
        (g) =>
          g.anggota[0].listing.id !== selectedId &&
          Math.hypot(g.x - p.x, g.y - p.y) < SEL_PX,
      );
      if (dekat) {
        const n = dekat.anggota.length;
        dekat.x = (dekat.x * n + p.x) / (n + 1);
        dekat.y = (dekat.y * n + p.y) / (n + 1);
        dekat.anggota.push(t);
      } else {
        kumpulan.push({ x: p.x, y: p.y, anggota: [t] });
      }
    }

    return kumpulan.map((g) => g.anggota);
  }, [titikan, titikLayar, selectedId]);

  return (
    <>
      {gugus.map((anggota) => {
        if (anggota.length === 1) {
          const { listing, titik } = anggota[0];
          return (
            <Marker
              key={listing.id}
              position={[titik.lat, titik.lng]}
              icon={ikonHarga(listing.harga_per_kg, listing.id === selectedId)}
              eventHandlers={{ click: () => onSelect?.(listing.id) }}
            >
              <Tooltip direction="top">
                {listing.nama} •{" "}
                {listing.jarak_km === null
                  ? labelTanpaJarak
                  : `${num(listing.jarak_km)} km`}
              </Tooltip>
            </Marker>
          );
        }

        const tengah = titikTengah(anggota.map((a) => a.titik));
        const termurah = Math.min(...anggota.map((a) => a.listing.harga_per_kg));
        return (
          <Marker
            key={anggota.map((a) => a.listing.id).join("|")}
            position={tengah ? [tengah.lat, tengah.lng] : [0, 0]}
            icon={ikonGugus(anggota.length)}
            alt={labelGugusAria(anggota.length)}
            eventHandlers={{
              click: () =>
                map.fitBounds(
                  L.latLngBounds(
                    anggota.map((a) => [a.titik.lat, a.titik.lng] as [number, number]),
                  ),
                  // `padding` besar dan zoom dinaikkan satu tingkat di atas
                  // bingkai pas, supaya sekali ketuk gugusnya benar-benar
                  // pecah alih-alih terbingkai ulang sebagai gugus yang sama.
                  { padding: [64, 64], maxZoom: map.getZoom() + 3 },
                ),
            }}
          >
            <Tooltip direction="top">
              {labelGugusTooltip(anggota.length, termurah)}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

function TerbangKe({ selectedId, titikan }: { selectedId?: string; titikan: Titikan[] }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const tujuan = titikan.find((t) => t.listing.id === selectedId);
    if (tujuan) map.flyTo([tujuan.titik.lat, tujuan.titik.lng], 14, { duration: 1.2 });
  }, [selectedId, titikan, map]);
  return null;
}

export default function PetaMap({
  listings,
  selectedId,
  onSelect,
  userLoc = null,
  labelSaya = "Lokasi Anda",
  labelTanpaJarak = "Jarak belum diketahui",
  labelGugusAria,
  labelGugusTooltip,
}: {
  listings: Listing[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /**
   * Posisi pembeli, atau null bila izin lokasi belum ada / ditolak.
   *
   * Datang dari induk, bukan dari `navigator.geolocation` di sini. Komponen ini
   * dulu meminta izin lokasinya sendiri di samping layar yang memuatnya:
   * dua permintaan izin untuk satu halaman, dua jawaban yang bisa berbeda, dan
   * daftar di kiri bisa memakai posisi yang berlainan dari peta di kanan.
   */
  userLoc?: Titik | null;
  labelSaya?: string;
  labelTanpaJarak?: string;
  /** Nama gugus untuk pembaca layar — "{count} lot berdempet di sini". */
  labelGugusAria: (jumlah: number) => string;
  /** Isi tooltipnya — jumlah lot dan harga termurah di dalamnya. */
  labelGugusTooltip: (jumlah: number, harga: number) => string;
}) {
  /**
   * Hanya lot yang benar-benar punya koordinat yang boleh muncul di peta.
   * Lot tanpa koordinat tetap ada di daftar — ia nyata dan bisa dibeli — tapi
   * menaruhnya di suatu tempat berarti mengarang tempat itu.
   */
  const titikan = useMemo<Titikan[]>(
    () =>
      listings.flatMap((listing) => {
        const titik = keTitik(listing.lat, listing.lng);
        return titik ? [{ listing, titik }] : [];
      }),
    [listings],
  );

  const awal = userLoc ?? titikTengah(titikan.map((t) => t.titik));

  return (
    <MapContainer
      center={awal ? [awal.lat, awal.lng] : BINGKAI_JAWA}
      zoom={awal ? 12 : ZOOM_BINGKAI}
      scrollWheelZoom={false}
      className="size-full"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <AturBingkai titikan={titikan} saya={userLoc} />
      <TerbangKe selectedId={selectedId} titikan={titikan} />

      {/* Titik biru hanya ada kalau posisinya sungguh diketahui. */}
      {userLoc && (
        <Marker position={[userLoc.lat, userLoc.lng]} icon={ikonSaya}>
          <Tooltip direction="top">{labelSaya}</Tooltip>
        </Marker>
      )}

      <PenandaLot
        titikan={titikan}
        selectedId={selectedId}
        onSelect={onSelect}
        labelTanpaJarak={labelTanpaJarak}
        labelGugusAria={labelGugusAria}
        labelGugusTooltip={labelGugusTooltip}
      />
    </MapContainer>
  );
}
